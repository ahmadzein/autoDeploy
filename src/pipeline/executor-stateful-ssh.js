import { SSHConnection } from '../ssh/connection.js';
import chalk from 'chalk';
import { EventEmitter } from 'events';
import { readFileSync } from 'fs';

/**
 * Stateful SSH Executor that maintains session state between commands
 * Perfect for nested SSH scenarios where subsequent commands need to run
 * in the context established by previous commands
 */
export class StatefulSSHExecutor extends EventEmitter {
    constructor(sshConfig, projectPath) {
        super();
        this.sshConfig = sshConfig;
        this.projectPath = projectPath;
        this.currentStream = null;
        this.commandQueue = [];
        this.currentCommandIndex = 0;
        this.sessionOutput = '';
        this.commandOutputs = {};
        this.waitingForUserInput = false;
        this.userInputCallback = null;
        this.sessionId = null;
    }

    /**
     * Set session ID for input handling
     */
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    
    /**
     * Handle user input for prompts
     */
    handleUserInput(input) {
        if (this.waitingForUserInput && this.currentStream) {
            console.log(chalk.cyan(`[STATEFUL-SSH] Sending user input: ${input}`));
            this.currentStream.write(input + '\n');
            this.waitingForUserInput = false;
            return true;
        }
        return false;
    }
    
    /**
     * Execute all steps in a single stateful SSH session
     */
    async executeSteps(steps) {
        const connection = new SSHConnection(this.sshConfig);
        this.commandQueue = steps;
        this.currentCommandIndex = 0;
        
        return new Promise((resolve, reject) => {
            const results = [];
            let sessionActive = true;
            
            connection.conn.on('ready', () => {
                console.log(chalk.blue('[STATEFUL-SSH] Connection established'));
                
                connection.conn.shell({ pty: true }, (err, stream) => {
                    if (err) {
                        console.error(chalk.red('[STATEFUL-SSH] Failed to start shell:', err.message));
                        return reject(err);
                    }
                    
                    this.currentStream = stream;
                    console.log(chalk.green('[STATEFUL-SSH] Shell session started'));
                    
                    let currentOutput = '';
                    let commandBuffer = '';
                    let stepStartTime = Date.now();
                    let waitingForPrompt = false;
                    let executingCommand = false;
                    let lastActivity = Date.now();
                    
                    // Timeout handler
                    const timeoutCheck = setInterval(() => {
                        if (executingCommand && Date.now() - lastActivity > 30000) {
                            console.error(chalk.red('[STATEFUL-SSH] Command timeout after 30 seconds'));
                            clearInterval(timeoutCheck);
                            stream.close();
                            sessionActive = false;
                            
                            // Mark current step as failed
                            if (this.currentCommandIndex > 0) {
                                results[this.currentCommandIndex - 1] = {
                                    step: steps[this.currentCommandIndex - 1].name,
                                    success: false,
                                    error: 'Command timed out after 30 seconds',
                                    output: currentOutput
                                };
                            }
                            
                            reject(new Error('Command timed out'));
                        }
                    }, 1000);
                    
                    stream.on('close', () => {
                        clearInterval(timeoutCheck);
                        console.log(chalk.yellow('[STATEFUL-SSH] Shell session closed'));
                        connection.disconnect();
                        
                        // Add any remaining results
                        while (results.length < steps.length) {
                            results.push({
                                step: steps[results.length].name,
                                success: false,
                                error: 'Session closed before command execution'
                            });
                        }
                        
                        resolve(results);
                    });
                    
                    stream.on('data', (data) => {
                        lastActivity = Date.now();
                        const chunk = data.toString();
                        commandBuffer += chunk;
                        currentOutput += chunk;
                        this.sessionOutput += chunk;
                        
                        // Emit output for real-time display
                        this.emit('output', { data: chunk });
                        
                        // Debug output
                        if (process.env.AUTODEPLOY_DEBUG === 'true') {
                            process.stdout.write(chalk.gray(chunk));
                        }
                        
                        // Check if the script/session has ended naturally
                        if (this.detectScriptCompletion(commandBuffer, currentOutput)) {
                            console.log(chalk.green('[STATEFUL-SSH] Script completed naturally'));
                            
                            // Mark current step as complete if we have one running
                            if (executingCommand && this.currentCommandIndex > 0) {
                                const stepIndex = this.currentCommandIndex - 1;
                                const step = steps[stepIndex];
                                
                                // Check if the output contains error indicators
                                const hasError = this.detectCommandError(currentOutput);
                                
                                results.push({
                                    step: step.name,
                                    success: !hasError,
                                    output: currentOutput,
                                    error: hasError ? 'Command completed with errors' : undefined,
                                    duration: Date.now() - stepStartTime
                                });
                                
                                if (hasError) {
                                    console.log(chalk.red(`[STATEFUL-SSH] Step ${stepIndex + 1} completed with errors`));
                                } else {
                                    console.log(chalk.green(`[STATEFUL-SSH] Step ${stepIndex + 1} completed (natural end)`));
                                }
                            }
                            
                            // Close the session gracefully
                            setTimeout(() => {
                                if (sessionActive) {
                                    stream.end();
                                }
                            }, 100);
                            
                            return;
                        }
                        
                        // Check for interactive prompts (questions from scripts)
                        if (this.detectInteractivePrompt(commandBuffer, currentOutput)) {
                            if (!this.waitingForUserInput) {
                                this.waitingForUserInput = true;
                                const promptText = this.extractPromptText(commandBuffer);
                                console.log(chalk.yellow(`[STATEFUL-SSH] Detected interactive prompt: ${promptText}`));
                                
                                // Emit prompt event for GUI
                                this.emit('prompt', {
                                    sessionId: this.sessionId,
                                    prompt: promptText,
                                    step: steps[Math.max(0, this.currentCommandIndex - 1)]?.name || 'Unknown'
                                });
                            }
                        }
                        // Check if we're at a shell prompt
                        else if (this.isAtShellPrompt(commandBuffer)) {
                            if (executingCommand && this.currentCommandIndex > 0) {
                                // Command completed
                                const stepIndex = this.currentCommandIndex - 1;
                                const step = steps[stepIndex];
                                
                                // Check if this was just an SSH command that succeeded
                                const isSSHCommand = step.command.trim().match(/^ssh\s+[^\s]+\s*$/);
                                
                                // Check if the output contains error indicators
                                const hasError = this.detectCommandError(currentOutput);
                                
                                results.push({
                                    step: step.name,
                                    success: !hasError,
                                    output: currentOutput,
                                    error: hasError ? 'Command completed with errors' : undefined,
                                    duration: Date.now() - stepStartTime
                                });
                                
                                if (hasError) {
                                    console.log(chalk.red(`[STATEFUL-SSH] Step ${stepIndex + 1} completed with errors`));
                                } else {
                                    console.log(chalk.green(`[STATEFUL-SSH] Step ${stepIndex + 1} completed`));
                                }
                                
                                // For SSH commands, we're now in a nested session
                                if (isSSHCommand) {
                                    console.log(chalk.yellow('[STATEFUL-SSH] Entered nested SSH session'));
                                }
                            }
                            
                            // Execute next command if available
                            if (this.currentCommandIndex < steps.length) {
                                const nextStep = steps[this.currentCommandIndex];
                                const command = this.prepareCommand(nextStep);
                                
                                console.log(chalk.blue(`[STATEFUL-SSH] Executing step ${this.currentCommandIndex + 1}/${steps.length}: ${nextStep.name}`));
                                console.log(chalk.gray(`[STATEFUL-SSH] Command: ${command}`));
                                
                                // Reset for next command
                                currentOutput = '';
                                stepStartTime = Date.now();
                                executingCommand = true;
                                this.currentCommandIndex++;
                                
                                // Send command
                                stream.write(command + '\n');
                                
                                // Clear buffer after sending command
                                commandBuffer = '';
                            } else {
                                // All commands completed
                                console.log(chalk.green('[STATEFUL-SSH] All steps completed'));
                                
                                // If we're in an interactive session that might have ended naturally,
                                // check if we have all results
                                if (results.length === steps.length) {
                                    // We have all results, close gracefully
                                    setTimeout(() => {
                                        if (sessionActive) {
                                            stream.end();
                                        }
                                    }, 100);
                                } else {
                                    // Try to exit cleanly
                                    stream.write('exit\n');
                                    setTimeout(() => {
                                        if (sessionActive) {
                                            stream.end();
                                        }
                                    }, 500);
                                }
                            }
                        }
                        
                        // Keep only recent buffer to prevent memory issues
                        if (commandBuffer.length > 5000) {
                            commandBuffer = commandBuffer.slice(-2500);
                        }
                    });
                    
                    stream.stderr.on('data', (data) => {
                        lastActivity = Date.now();
                        const chunk = data.toString();
                        currentOutput += chunk;
                        this.emit('output', { data: chunk, type: 'stderr' });
                    });
                });
            });
            
            connection.conn.on('error', (err) => {
                console.error(chalk.red('[STATEFUL-SSH] Connection error:', err.message));
                reject(err);
            });
            
            // Connect with proper config
            const connectionConfig = {
                host: this.sshConfig.host,
                port: this.sshConfig.port || 22,
                username: this.sshConfig.username,
                readyTimeout: 30000,
                keepaliveInterval: 10000,
                keepaliveCountMax: 3
            };
            
            if (this.sshConfig.password) {
                connectionConfig.password = this.sshConfig.password;
            } else if (this.sshConfig.privateKeyPath) {
                connectionConfig.privateKey = readFileSync(this.sshConfig.privateKeyPath);
                if (this.sshConfig.passphrase) {
                    connectionConfig.passphrase = this.sshConfig.passphrase;
                }
            }
            
            connection.conn.connect(connectionConfig);
        });
    }
    
    /**
     * Check if the command output contains error indicators
     */
    detectCommandError(output) {
        // First check for explicit success indicators that override error detection
        const successPatterns = [
            /successfully\s+(deployed|completed|finished|built|installed)/i,
            /deployment\s+complete[d]?/i,
            /build\s+succeeded/i,
            /all\s+tests\s+pass/i,
            /0\s+error\(s\)/i
        ];
        
        // If we have explicit success indicators, don't check for errors
        if (successPatterns.some(pattern => pattern.test(output))) {
            return false;
        }
        
        // Common error patterns that indicate command failure
        const errorPatterns = [
            // PHP/MySQL errors (more specific)
            /ERROR\s+-->\s+\w+_sql_exception:/i,
            /Fatal\s+error:/i,
            /Parse\s+error:/i,
            /Uncaught\s+exception:/i,
            /mysqli_sql_exception:/i,
            
            // General command errors (more specific to avoid false positives)
            /command\s+not\s+found$/m,
            /No\s+such\s+file\s+or\s+directory$/m,
            /Permission\s+denied$/m,
            /cannot\s+access/i,
            /^fatal:/mi,  // Git fatal errors at start of line
            
            // Database errors
            /Table\s+.*\s+already\s+exists/i,
            /Duplicate\s+entry/i,
            /Access\s+denied\s+for\s+user/i,
            /Unknown\s+database/i,
            /ERROR\s+\d+\s+\(/i,  // MySQL error codes like ERROR 1050 (
            
            // Git errors
            /fatal:\s+Not\s+a\s+git\s+repository/i,
            /error:\s+failed\s+to\s+push/i,
            /rejected.*\(non-fast-forward\)/i,
            
            // Build/compilation errors
            /npm\s+ERR!/,
            /ERROR\s+in\s+/,
            /Build\s+failed/i,
            /Compilation\s+failed/i,
            /Error:\s+Cannot\s+find\s+module/i,
            
            // Script/execution errors
            /bash:\s+.*:\s+command\s+not\s+found/,
            /sh:\s+.*:\s+not\s+found/,
            /returned\s+non-zero\s+exit\s+status/i,
            /exited\s+with\s+code\s+[1-9]/i
        ];
        
        // Check if output contains any error patterns
        const hasError = errorPatterns.some(pattern => pattern.test(output));
        
        // Additional check: if output contains "error" but not in common false positive contexts
        if (!hasError && /error/i.test(output)) {
            // Check for false positives
            const falsePositives = [
                /0\s+errors?/i,
                /no\s+errors?/i,
                /without\s+errors?/i,
                /error\s*:\s*0/i,
                /error\s+count\s*:\s*0/i,
                /warnings?\s+and\s+\d+\s+errors?/i,  // npm/webpack style where 0 errors is ok
                /error\s+log/i,  // Just referring to error log file
                /error\s+handling/i,  // Discussing error handling
                /on\s+error/i  // Event handlers
            ];
            
            if (!falsePositives.some(pattern => pattern.test(output))) {
                return true;
            }
        }
        
        return hasError;
    }
    
    /**
     * Check if we're at a shell prompt
     */
    isAtShellPrompt(buffer) {
        // Look for common shell prompt patterns
        const promptPatterns = [
            /\$\s*$/m,              // User prompt ending with $
            /#\s*$/m,               // Root prompt ending with #
            />\s*$/m,               // Generic prompt ending with >
            /\]\$\s*$/m,            // Prompt like [user@host]$
            /\]#\s*$/m,             // Prompt like [root@host]#
            /\w+@[\w\-\.]+:[~\/\w\-\.]*\$\s*$/m,  // Ubuntu-style prompt like ubuntu@ip-10-1-0-181:~$
            /\w+@[\w\-\.]+:[~\/\w\-\.]*#\s*$/m,   // Ubuntu-style root prompt
            /-bash-\d+\.\d+\$\s*$/m,              // Bash version prompt
            /\[.*\]\s*[#$]\s*$/m,                 // Generic bracketed prompt
        ];
        
        // Check last 500 characters for prompt
        const recentBuffer = buffer.slice(-500);
        
        for (const pattern of promptPatterns) {
            if (pattern.test(recentBuffer)) {
                if (process.env.AUTODEPLOY_DEBUG === 'true') {
                    console.log(chalk.cyan(`[STATEFUL-SSH] Detected prompt: ${pattern}`));
                }
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Prepare command - but don't add cd for SSH commands
     */
    prepareCommand(step) {
        let command = step.command;
        
        // Check if this is an SSH command
        const isSSHCommand = command.trim().match(/^ssh\s+/);
        
        // For the first non-SSH command, change to project directory
        if (!isSSHCommand && this.currentCommandIndex === 0) {
            command = `cd ${this.projectPath} && ${command}`;
        } else if (!isSSHCommand && step.workingDir && step.workingDir !== '.') {
            // For other commands with specific working directory
            command = `cd ${step.workingDir} && ${command}`;
        }
        
        // Add environment variables if specified
        if (step.envVars && step.envVars.length > 0) {
            const envVars = step.envVars.map(env => `export ${env.name}="${env.value}"`).join('; ');
            command = `${envVars}; ${command}`;
        }
        
        return command;
    }
    
    /**
     * Detect interactive prompts (questions from scripts)
     */
    detectInteractivePrompt(buffer, recentOutput) {
        // Don't detect prompts if we just sent a command
        if (recentOutput.length < 10) return false;
        
        // Interactive prompt patterns
        const promptPatterns = [
            // Questions ending with ?
            /[^\n]+\?\s*$/,
            
            // Common interactive patterns
            /Enter .*:\s*$/i,
            /Please enter/i,
            /Please provide/i,
            /Please specify/i,
            /Type .*:\s*$/i,
            /Choose .*:\s*$/i,
            /Select .*:\s*$/i,
            /\(y\/n\)\s*:?\s*$/i,
            /\(yes\/no\)\s*:?\s*$/i,
            /Press .* to continue/i,
            
            // Specific patterns like your deployment script
            /What .* do you want .*\?\s*$/i,
            /Which .* would you like/i,
            
            // Password/auth prompts
            /password[^:]*:\s*$/i,
            /passphrase[^:]*:\s*$/i,
            
            // Generic patterns with colons
            /[^\n]+:\s*$/
        ];
        
        // Check recent output (last 200 chars)
        const recent = recentOutput.slice(-200).trim();
        
        // Don't treat shell prompts as interactive prompts
        if (this.isAtShellPrompt(buffer)) {
            return false;
        }
        
        // Check each pattern
        for (const pattern of promptPatterns) {
            if (pattern.test(recent)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Extract prompt text for display
     */
    extractPromptText(buffer) {
        // Get last few lines
        const lines = buffer.split('\n');
        // Filter out empty lines and get last meaningful lines
        const meaningfulLines = lines.filter(line => line.trim()).slice(-3);
        const lastLines = meaningfulLines.join('\n').trim();
        
        // Clean ANSI codes
        const cleaned = lastLines.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        
        // Clean up the text - remove duplicate content
        const finalText = cleaned
            .split('\n')
            .map(line => line.trim())
            .filter((line, index, arr) => {
                // Remove duplicate consecutive lines
                return index === 0 || line !== arr[index - 1];
            })
            .join('\n');
        
        // Return last 200 chars
        return finalText.slice(-200).trim();
    }
    
    /**
     * Detect if a script has completed naturally (common completion patterns)
     */
    detectScriptCompletion(buffer, recentOutput) {
        // Common patterns that indicate script completion
        const completionPatterns = [
            // Script ended and returned to shell on the jump server
            /Done\s*\n.*\$\s*$/im,
            /Completed\s*\n.*\$\s*$/im,
            /Finished\s*\n.*\$\s*$/im,
            
            // Common deployment completion messages
            /deployment.*complete[d]?\s*$/i,
            /successfully deployed\s*$/i,
            /build.*success/i,
            
            // PM2 or service restart confirmations
            /\[PM2\].*✓\s*$/m,
            /service.*restarted\s*$/i,
            
            // Your specific pattern - Done followed by shell prompt
            /Done\s*\n[^$]*\$\s*$/m,
            /okDone\s*\n.*\$\s*$/m
        ];
        
        // Check recent output (last 500 chars)
        const recent = recentOutput.slice(-500);
        
        // Don't consider it complete if we just SSHed into a server
        // Check if the recent output contains SSH welcome messages
        const sshWelcomePatterns = [
            /Welcome to Ubuntu/i,
            /Last login:/i,
            /System information as of/i,
            /Amazon Linux \d+/i
        ];
        
        const hasSSHWelcome = sshWelcomePatterns.some(pattern => pattern.test(recent));
        if (hasSSHWelcome) {
            return false; // Not a script completion, just SSH connection
        }
        
        for (const pattern of completionPatterns) {
            if (pattern.test(recent)) {
                return true;
            }
        }
        
        return false;
    }
}