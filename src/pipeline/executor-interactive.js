import { SSHConnection } from '../ssh/connection.js';
import chalk from 'chalk';
import { EventEmitter } from 'events';

/**
 * Interactive Pipeline Executor that can handle prompts and user input
 */
export class InteractivePipelineExecutor extends EventEmitter {
    constructor(sshConfig, projectPath) {
        super();
        this.sshConfig = sshConfig;
        this.projectPath = projectPath;
        this.activeStream = null;
        this.pendingInput = null;
    }

    /**
     * Execute a single step with interactive support
     */
    async executeStep(step, onPrompt) {
        const connection = new SSHConnection(this.sshConfig);
        
        try {
            await connection.connect();
            
            return new Promise((resolve, reject) => {
                let command = step.command;
                
                // Check if this is an SSH command - don't prepend cd for SSH commands
                const isSSHCommand = command.trim().match(/^ssh\s+/);
                
                if (!isSSHCommand) {
                    if (!step.workingDir || step.workingDir === '.') {
                        command = `cd ${this.projectPath} && ${command}`;
                    } else {
                        command = `cd ${this.projectPath}/${step.workingDir} && ${command}`;
                    }
                }
                
                // Add environment variables
                if (step.envVars && step.envVars.length > 0) {
                    const envVars = step.envVars.map(env => `export ${env.name}="${env.value}"`).join('; ');
                    command = `${envVars}; ${command}`;
                }
                
                console.log(chalk.blue(`[INTERACTIVE] Executing: ${command}`));
                
                connection.conn.exec(command, { pty: true }, (err, stream) => {
                    if (err) {
                        connection.disconnect();
                        return reject(err);
                    }
                    
                    let stdout = '';
                    let stderr = '';
                    let lastOutput = '';
                    let promptBuffer = '';
                    let waitingForInput = false;
                    
                    // Store stream for input
                    this.activeStream = stream;
                    
                    // Set a timeout
                    const timeout = setTimeout(() => {
                        stream.close();
                        connection.disconnect();
                        reject(new Error(`Command timed out after 60 seconds`));
                    }, 60000);
                    
                    stream.on('close', (code, signal) => {
                        clearTimeout(timeout);
                        this.activeStream = null;
                        connection.disconnect();
                        
                        resolve({
                            step: step.name,
                            success: code === 0,
                            output: stdout,
                            error: stderr || (code !== 0 ? `Exit code: ${code}` : ''),
                            code
                        });
                    });
                    
                    stream.on('data', (data) => {
                        const chunk = data.toString();
                        stdout += chunk;
                        lastOutput += chunk;
                        promptBuffer += chunk;
                        
                        // Emit output for real-time display
                        this.emit('output', { type: 'stdout', data: chunk });
                        
                        // Check for common prompts
                        if (this.detectPrompt(promptBuffer, lastOutput)) {
                            if (!waitingForInput) {
                                waitingForInput = true;
                                const promptText = this.extractPromptText(promptBuffer);
                                console.log(chalk.yellow(`[INTERACTIVE] Detected prompt: ${promptText}`));
                                
                                // Check if we have a pre-configured answer
                                const preConfigured = this.findPreConfiguredInput(step, promptText);
                                if (preConfigured) {
                                    console.log(chalk.green(`[INTERACTIVE] Using pre-configured response`));
                                    stream.write(preConfigured + '\n');
                                    waitingForInput = false;
                                    promptBuffer = '';
                                } else {
                                    // Emit prompt event for user input
                                    this.emit('prompt', {
                                        step: step.name,
                                        prompt: promptText,
                                        buffer: lastOutput
                                    });
                                    
                                    if (onPrompt) {
                                        onPrompt(promptText, (response) => {
                                            if (this.activeStream) {
                                                this.activeStream.write(response + '\n');
                                                waitingForInput = false;
                                                promptBuffer = '';
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        
                        // Keep only last 1000 chars for prompt detection
                        if (promptBuffer.length > 1000) {
                            promptBuffer = promptBuffer.slice(-1000);
                        }
                        if (lastOutput.length > 500) {
                            lastOutput = lastOutput.slice(-500);
                        }
                    });
                    
                    stream.stderr.on('data', (data) => {
                        const chunk = data.toString();
                        stderr += chunk;
                        this.emit('output', { type: 'stderr', data: chunk });
                    });
                });
            });
            
        } catch (error) {
            connection.disconnect();
            throw error;
        }
    }
    
    /**
     * Send input to the active stream
     */
    sendInput(input) {
        if (this.activeStream) {
            this.activeStream.write(input + '\n');
            return true;
        }
        return false;
    }
    
    /**
     * Detect if we're at a prompt waiting for input
     */
    detectPrompt(buffer, recent) {
        const promptPatterns = [
            // Password prompts
            /password[^:]*:/i,
            /passphrase[^:]*:/i,
            
            // SSH prompts
            /\(yes\/no(?:\/\[fingerprint\])?\)\??/i,
            /Are you sure you want to continue connecting/i,
            /Enter passphrase for/i,
            
            // Git prompts
            /Username for/i,
            /Password for/i,
            
            // Sudo prompts
            /\[sudo\] password/i,
            
            // Generic prompts
            /Enter .*:/i,
            /Please enter/i,
            /Do you want to/i,
            /Would you like/i,
            /Proceed\?/i,
            /Continue\?/i,
            /\(y\/n\)/i,
            /\(Y\/N\)/i,
            
            // Package manager prompts
            /Do you want to install/i,
            /Configuring [^:]+:/i,
            
            // Custom prompts (ending with : or ?)
            /[^\n]+[:\?]\s*$/
        ];
        
        // Check recent output for prompts (last 200 chars)
        const recentBuffer = recent.slice(-200);
        
        return promptPatterns.some(pattern => {
            const match = pattern.test(recentBuffer);
            if (match && process.env.AUTODEPLOY_DEBUG === 'true') {
                console.log(chalk.gray(`[INTERACTIVE] Pattern matched: ${pattern}`));
            }
            return match;
        });
    }
    
    /**
     * Extract the prompt text from the buffer
     */
    extractPromptText(buffer) {
        // Get last line or two
        const lines = buffer.split('\n');
        const lastLines = lines.slice(-2).join('\n').trim();
        
        // Clean up ANSI escape codes
        const cleaned = lastLines.replace(/\x1b\[[0-9;]*m/g, '');
        
        // Return last 200 chars
        return cleaned.slice(-200);
    }
    
    /**
     * Find pre-configured input for a prompt
     */
    findPreConfiguredInput(step, promptText) {
        if (!step.inputs || step.inputs.length === 0) {
            return null;
        }
        
        const promptLower = promptText.toLowerCase();
        
        for (const input of step.inputs) {
            if (input.prompt && promptLower.includes(input.prompt.toLowerCase())) {
                return input.value || input.defaultValue;
            }
        }
        
        // Check for specific patterns
        if (promptLower.includes('yes/no')) {
            const yesInput = step.inputs.find(i => 
                i.prompt && i.prompt.toLowerCase().includes('continue') ||
                i.prompt && i.prompt.toLowerCase().includes('proceed')
            );
            return yesInput ? (yesInput.value || yesInput.defaultValue) : null;
        }
        
        if (promptLower.includes('password')) {
            const passInput = step.inputs.find(i => 
                i.prompt && i.prompt.toLowerCase().includes('password')
            );
            return passInput ? (passInput.value || passInput.defaultValue) : null;
        }
        
        return null;
    }
}