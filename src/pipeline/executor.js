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
        
        console.log(chalk.blue('\n=€ Starting deployment pipeline...\n'));
        
        try {
            await connection.connect();
            
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const spinner = ora(`Step ${i + 1}/${steps.length}: ${step.name}`).start();
                
                try {
                    let command = step.command;
                    
                    if (!step.workingDir || step.workingDir === '.') {
                        command = `cd ${this.projectPath} && ${command}`;
                    } else {
                        command = `cd ${this.projectPath}/${step.workingDir} && ${command}`;
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
}