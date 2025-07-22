import { SSHConnection } from '../ssh/connection.js';
import ora from 'ora';
import chalk from 'chalk';

export class PipelineExecutor {
    constructor(sshConfig, projectPath) {
        this.sshConfig = sshConfig;
        this.projectPath = projectPath;
    }

    async execute(steps) {
        const connection = new SSHConnection(this.sshConfig);
        const results = [];
        
        console.log(chalk.blue('\n=� Starting deployment pipeline...\n'));
        
        try {
            await connection.connect();
            
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const spinner = ora(`Step ${i + 1}/${steps.length}: ${step.name}`).start();
                
                try {
                    // Process the step
                    
                    let command = step.command;
                    let finalCommand;
                    
                    // Handle environment variables
                    let envVarsString = '';
                    if (step.envVars && step.envVars.length > 0) {
                        const envVars = step.envVars.map(env => `export ${env.name}="${env.value}"`).join('; ');
                        envVarsString = `${envVars}; `;
                    }
                    
                    // Check if this is an interactive command
                    if (step.interactive && step.inputs && step.inputs.length > 0) {
                        // Create an expect script for handling interactive inputs
                        const expectInputs = step.inputs.map(input => {
                            const value = input.defaultValue || '';
                            return `expect "${input.prompt}" { send "${value}\\r" }`;
                        }).join('\n');
                        
                        const expectScript = `expect << 'EOF'
spawn bash -c "${envVarsString}cd ${this.projectPath} && ${command}"
${expectInputs}
expect eof
EOF`;
                        
                        finalCommand = expectScript;
                        finalCommand = expectScript;
                    } else {
                        // Non-interactive or interactive without inputs
                        if (step.interactive) {
                            // For Ghost commands without inputs, add --no-prompt (except backup which needs auth)
                            const isGhostCommand = command.toLowerCase().includes('ghost ');
                            const isGhostBackup = command.toLowerCase().includes('ghost backup');
                            
                            if (isGhostCommand && !isGhostBackup) {
                                command = command.replace(/ghost (\w+)/, 'ghost $1 --no-prompt');
                            }
                        }
                        
                        // Escape single quotes in command
                        const escapedCommand = command.replace(/'/g, "'\\''");
                    
                        // Source .bashrc and .profile explicitly, then run command
                        const sourceFiles = 'source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true;';
                        
                        // Check if this is an SSH command - don't prepend cd for SSH commands
                        const isSSHCommand = command.trim().match(/^ssh\s+/);
                        
                        if (isSSHCommand) {
                            // For SSH commands, just run them directly without cd
                            finalCommand = `bash -c '${sourceFiles} ${envVarsString}${escapedCommand}'`;
                        } else if (!step.workingDir || step.workingDir === '.') {
                            finalCommand = `bash -c '${sourceFiles} ${envVarsString}cd ${this.projectPath} && ${escapedCommand}'`;
                        } else {
                            finalCommand = `bash -c '${sourceFiles} ${envVarsString}cd ${this.projectPath}/${step.workingDir} && ${escapedCommand}'`;
                        }
                    }
                    
                    // Execute the command
                    if (process.env.AUTODEPLOY_DEBUG === 'true') {
                        console.log(chalk.gray(`[EXECUTOR] Executing: ${finalCommand}`));
                    }
                    const result = await connection.exec(finalCommand);
                    
                    if (result.code === 0) {
                        spinner.succeed(`${step.name} ${chalk.green('')}`);
                        results.push({
                            step: step.name,
                            success: true,
                            output: result.stdout,
                            error: result.stderr
                        });
                    } else {
                        spinner.fail(`${step.name} ${chalk.red('')}`);
                        console.error(chalk.red(`Error: ${result.stderr || result.stdout}`));
                        results.push({
                            step: step.name,
                            success: false,
                            output: result.stdout,
                            error: result.stderr
                        });
                        
                        if (!step.continueOnError) {
                            break;
                        }
                    }
                } catch (error) {
                    spinner.fail(`${step.name} ${chalk.red('')}`);
                    console.error(chalk.red(`Error: ${error.message}`));
                    results.push({
                        step: step.name,
                        success: false,
                        error: error.message
                    });
                    
                    if (!step.continueOnError) {
                        break;
                    }
                }
            }
            
            connection.disconnect();
            
        } catch (error) {
            console.error(chalk.red(`Connection error: ${error.message}`));
            results.push({
                step: 'Connection',
                success: false,
                error: error.message
            });
        }
        
        return results;
    }

    validateSteps(steps) {
        if (!Array.isArray(steps) || steps.length === 0) {
            throw new Error('Steps must be a non-empty array');
        }
        
        for (const step of steps) {
            if (!step.name || !step.command) {
                throw new Error('Each step must have a name and command');
            }
        }
        
        return true;
    }

    async executeStep(step, providedInputs = {}) {
        const connection = new SSHConnection(this.sshConfig);
        
        try {
            await connection.connect();
            
            let command = step.command;
            
            // Process the step
            
            // Handle environment variables
            let envVarsString = '';
            if (step.envVars && step.envVars.length > 0) {
                const envVars = step.envVars.map(env => `export ${env.name}="${env.value}"`).join('; ');
                envVarsString = `${envVars}; `;
                console.log(chalk.gray(`[DEBUG] Environment vars: ${envVarsString}`));
            }
            
            // Handle interactive commands
            if (step.interactive) {
                console.log(chalk.gray(`[DEBUG] Step is marked as interactive`));
                // Check if we have inputs configured for auto-fill
                if (step.inputs && step.inputs.length > 0) {
                    console.log(chalk.gray(`[DEBUG] Step has ${step.inputs.length} configured inputs`));
                    // Create an expect script for handling interactive inputs on remote server
                    const expectInputs = step.inputs.map(input => {
                        const value = providedInputs[input.prompt] || input.defaultValue || '';
                        return `expect "${input.prompt}" { send "${value}\\r" }`;
                    }).join('\n');
                    
                    // Create expect script that will run on the remote server
                    const expectScript = `expect << 'EOF'
spawn bash -c "${envVarsString}cd ${this.projectPath} && ${command}"
${expectInputs}
expect eof
EOF`;
                    
                    command = expectScript;
                    console.log(chalk.gray(`[DEBUG] Created expect script for interactive inputs`));
                } else {
                    // Interactive command without inputs - for Ghost commands, add --no-prompt
                    const isGhostCommand = command.toLowerCase().includes('ghost ');
                    console.log(chalk.gray(`[DEBUG] Is Ghost command: ${isGhostCommand}`));
                    if (isGhostCommand) {
                        const oldCommand = command;
                        command = command.replace(/ghost (\w+)/, 'ghost $1 --no-prompt');
                        console.log(chalk.gray(`[DEBUG] Modified Ghost command from: ${oldCommand}`));
                        console.log(chalk.gray(`[DEBUG] Modified Ghost command to: ${command}`));
                    }
                    // Continue with normal execution
                }
            } else {
                console.log(chalk.gray(`[DEBUG] Step is NOT marked as interactive`));
            }
            
            // Process non-interactive commands or interactive commands after modification
            if (!command.includes('expect << \'EOF\'')) {
                // Escape single quotes in command
                const escapedCommand = command.replace(/'/g, "'\\''");
                
                // Source .bashrc and .profile explicitly, then run command
                const sourceFiles = 'source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true;';
                
                // The Ghost command handling is now done above in the interactive section
                
                if (!step.workingDir || step.workingDir === '.') {
                    command = `bash -c '${sourceFiles} ${envVarsString}cd ${this.projectPath} && ${escapedCommand}'`;
                } else {
                    command = `bash -c '${sourceFiles} ${envVarsString}cd ${this.projectPath}/${step.workingDir} && ${escapedCommand}'`;
                }
            }
            
            console.log(chalk.gray(`[DEBUG] Final command to execute: ${command}`));
            const result = await connection.exec(command);
            connection.disconnect();
            
            return {
                success: result.code === 0,
                output: result.stdout,
                error: result.stderr,
                step: step.name,
                interactive: step.interactive || false
            };
        } catch (error) {
            connection.disconnect();
            return {
                success: false,
                error: error.message,
                step: step.name,
                interactive: step.interactive || false
            };
        }
    }
}