import { SSHConnection } from '../ssh/connection.js';
import chalk from 'chalk';
import { readFileSync } from 'fs';

/**
 * Interactive Shell Executor that maintains a single SSH session
 * and executes all commands in the same shell context
 */
export class InteractiveShellExecutor {
    constructor(sshConfig, projectPath) {
        this.sshConfig = sshConfig;
        this.projectPath = projectPath;
    }

    /**
     * Execute all steps in a single interactive shell session
     * This maintains state between commands, including nested SSH sessions
     */
    async executeStepsInShell(steps) {
        const connection = new SSHConnection(this.sshConfig);
        const results = [];
        
        return new Promise((resolve, reject) => {
            connection.conn.on('ready', () => {
                console.log(chalk.blue('[SHELL] SSH connection established'));
                
                connection.conn.shell((err, stream) => {
                    if (err) {
                        console.error(chalk.red('[SHELL] Failed to start shell:', err.message));
                        return reject(err);
                    }
                    
                    console.log(chalk.green('[SHELL] Interactive shell started'));
                    
                    let currentStepIndex = 0;
                    let commandBuffer = '';
                    let stepStartTime = Date.now();
                    let waitingForPrompt = false;
                    let commandOutputs = {};
                    let currentOutput = [];
                    let commandTimeout = null;
                    
                    // Function to handle command timeout
                    const handleTimeout = () => {
                        console.error(chalk.red(`[SHELL] Command timed out after 30 seconds`));
                        console.error(chalk.red(`[SHELL] Last command: ${steps[currentStepIndex - 1]?.name || 'Unknown'}`));
                        console.error(chalk.red(`[SHELL] Buffer: "${commandBuffer.slice(-200).replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`));
                        
                        // Force close the stream
                        stream.write('\x03'); // Send Ctrl+C
                        setTimeout(() => stream.end(), 1000);
                    };
                    
                    // Configure stream event handlers
                    stream.on('close', () => {
                        if (commandTimeout) clearTimeout(commandTimeout);
                        console.log(chalk.yellow('[SHELL] Shell session closed'));
                        connection.conn.end();
                        
                        // Prepare final results
                        const finalResults = steps.map((step, index) => ({
                            step: step.name,
                            success: commandOutputs[index]?.success !== false,
                            output: commandOutputs[index]?.output || '',
                            error: commandOutputs[index]?.error || '',
                            duration: commandOutputs[index]?.duration || 0
                        }));
                        
                        resolve(finalResults);
                    });
                    
                    stream.on('data', (data) => {
                        const chunk = data.toString();
                        commandBuffer += chunk;
                        currentOutput.push(chunk);
                        
                        if (process.env.AUTODEPLOY_DEBUG === 'true') {
                            process.stdout.write(chalk.gray(chunk));
                        }
                        
                        // Log buffer state for debugging
                        if (waitingForPrompt) {
                            console.log(chalk.cyan(`[SHELL] Buffer length: ${commandBuffer.length}, Last 50 chars: "${commandBuffer.slice(-50).replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`));
                        }
                        
                        // Check if we're at a command prompt
                        if (this.isAtPrompt(commandBuffer)) {
                            if (waitingForPrompt && currentStepIndex > 0) {
                                // Command completed, save output
                                const stepIndex = currentStepIndex - 1;
                                commandOutputs[stepIndex] = {
                                    output: currentOutput.join(''),
                                    success: true,
                                    duration: Date.now() - stepStartTime
                                };
                                
                                console.log(chalk.green(`[SHELL] Step ${stepIndex + 1} completed`));
                                
                                // Clear timeout on successful completion
                                if (commandTimeout) {
                                    clearTimeout(commandTimeout);
                                    commandTimeout = null;
                                }
                            }
                            
                            // Execute next command if available
                            if (currentStepIndex < steps.length) {
                                const step = steps[currentStepIndex];
                                const command = this.prepareCommand(step, currentStepIndex === 0);
                                
                                console.log(chalk.blue(`[SHELL] Executing step ${currentStepIndex + 1}/${steps.length}: ${step.name}`));
                                console.log(chalk.gray(`[SHELL] Command: ${command}`));
                                
                                currentOutput = [];
                                stepStartTime = Date.now();
                                waitingForPrompt = true;
                                currentStepIndex++;
                                
                                // Set timeout for command execution
                                if (commandTimeout) clearTimeout(commandTimeout);
                                commandTimeout = setTimeout(handleTimeout, 30000); // 30 second timeout
                                
                                stream.write(command + '\n');
                            } else {
                                // All commands completed
                                console.log(chalk.green('[SHELL] All steps completed, closing session'));
                                stream.write('exit\n');
                            }
                            
                            // Reset buffer after processing
                            commandBuffer = '';
                        }
                    });
                    
                    stream.on('error', (err) => {
                        console.error(chalk.red('[SHELL] Stream error:', err.message));
                        if (currentStepIndex > 0) {
                            commandOutputs[currentStepIndex - 1] = {
                                output: currentOutput.join(''),
                                error: err.message,
                                success: false,
                                duration: Date.now() - stepStartTime
                            };
                        }
                    });
                    
                    // Set terminal options for better compatibility
                    stream.setWindow(80, 24);
                });
            });
            
            connection.conn.on('error', (err) => {
                console.error(chalk.red('[SHELL] Connection error:', err.message));
                reject(err);
            });
            
            // Connect to SSH server
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
     * Check if we're at a command prompt
     */
    isAtPrompt(buffer) {
        // Common prompt patterns
        const promptPatterns = [
            /\$\s*$/,          // User prompt ending with $
            /#\s*$/,           // Root prompt ending with #
            />\s*$/,           // Generic prompt ending with >
            /\]\$\s*$/,        // Prompt like [user@host]$
            /\]#\s*$/,         // Prompt like [root@host]#
            /\w+@\w+:.*\$\s*$/,  // Ubuntu-style prompt
            /\w+@\w+:.*#\s*$/,   // Ubuntu-style root prompt
            /\[.*\]\s*\$\s*$/,  // Bracketed prompt
            /\[.*\]\s*#\s*$/,   // Bracketed root prompt
            /-bash-\d+\.\d+\$\s*$/,  // Bash version prompt
            /-bash-\d+\.\d+#\s*$/,   // Bash version root prompt
        ];
        
        // Also check for common SSH password/passphrase prompts (should not trigger command execution)
        const passwordPrompts = [
            /password:\s*$/i,
            /passphrase.*:\s*$/i,
            /\(yes\/no\)\?\s*$/,
            /fingerprint.*\?\s*$/i,
        ];
        
        // Don't treat password prompts as command prompts
        if (passwordPrompts.some(pattern => pattern.test(buffer))) {
            return false;
        }
        
        // Check if buffer ends with any prompt pattern
        return promptPatterns.some(pattern => pattern.test(buffer));
    }

    /**
     * Prepare command with proper working directory
     */
    prepareCommand(step, isFirstCommand) {
        let command = step.command;
        
        // For the first command, change to project directory
        if (isFirstCommand) {
            command = `cd ${this.projectPath} && ${command}`;
        } else if (step.workingDir && step.workingDir !== '.') {
            // For subsequent commands, only change directory if specified
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
     * Execute a single step (for compatibility)
     */
    async executeStep(step) {
        const results = await this.executeStepsInShell([step]);
        return results[0] || {
            success: false,
            error: 'Failed to execute step',
            step: step.name
        };
    }
}