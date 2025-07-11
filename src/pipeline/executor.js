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
                    let command = step.command;
                    
                    // Escape single quotes in command
                    const escapedCommand = step.command.replace(/'/g, "'\\''");
                    
                    // Source .bashrc and .profile explicitly, then run command
                    const sourceFiles = 'source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true;';
                    
                    if (!step.workingDir || step.workingDir === '.') {
                        command = `bash -c '${sourceFiles} cd ${this.projectPath} && ${escapedCommand}'`;
                    } else {
                        command = `bash -c '${sourceFiles} cd ${this.projectPath}/${step.workingDir} && ${escapedCommand}'`;
                    }
                    
                    const result = await connection.exec(command);
                    
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

    async executeStep(step) {
        const connection = new SSHConnection(this.sshConfig);
        
        try {
            await connection.connect();
            
            let command = step.command;
            
            // Escape single quotes in command
            const escapedCommand = step.command.replace(/'/g, "'\\''");
            
            // Source .bashrc and .profile explicitly, then run command
            const sourceFiles = 'source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true;';
            
            if (!step.workingDir || step.workingDir === '.') {
                command = `bash -c '${sourceFiles} cd ${this.projectPath} && ${escapedCommand}'`;
            } else {
                command = `bash -c '${sourceFiles} cd ${this.projectPath}/${step.workingDir} && ${escapedCommand}'`;
            }
            
            const result = await connection.exec(command);
            connection.disconnect();
            
            return {
                success: result.code === 0,
                output: result.stdout,
                error: result.stderr,
                step: step.name
            };
        } catch (error) {
            connection.disconnect();
            return {
                success: false,
                error: error.message,
                step: step.name
            };
        }
    }
}