import { SSHConnection } from '../ssh/connection.js';
import { InteractiveShellExecutor } from './executor-interactive-shell.js';
import chalk from 'chalk';

/**
 * Smart SSH Executor that automatically detects the best execution strategy
 * for nested SSH scenarios
 */
export class SmartSSHExecutor {
    constructor(sshConfig, projectPath) {
        this.sshConfig = sshConfig;
        this.projectPath = projectPath;
    }

    /**
     * Analyze steps to determine the best execution strategy
     */
    analyzeExecutionStrategy(steps) {
        // Check for nested SSH pattern
        let hasNestedSSH = false;
        let nestedSSHIndex = -1;
        
        for (let i = 0; i < steps.length; i++) {
            const command = steps[i].command.trim();
            // Look for standalone SSH command (no command after it)
            if (command.match(/^ssh\s+[^\s]+\s*$/)) {
                hasNestedSSH = true;
                nestedSSHIndex = i;
                break;
            }
        }
        
        if (!hasNestedSSH) {
            return { strategy: 'standard', reason: 'No nested SSH detected' };
        }
        
        // Check if we can combine the commands
        if (nestedSSHIndex < steps.length - 1) {
            // We have commands after the SSH
            const sshCommand = steps[nestedSSHIndex].command.trim();
            const sshTarget = sshCommand.match(/^ssh\s+([^\s]+)\s*$/)[1];
            
            // Check if all remaining commands should run on the nested target
            const remainingSteps = steps.slice(nestedSSHIndex + 1);
            
            return {
                strategy: 'combined',
                reason: 'Can combine SSH with subsequent commands',
                sshTarget,
                sshStepIndex: nestedSSHIndex,
                commandsToRun: remainingSteps
            };
        }
        
        return { strategy: 'interactive', reason: 'Complex nested SSH scenario' };
    }

    /**
     * Execute steps using the smart strategy
     */
    async executeSteps(steps) {
        const strategy = this.analyzeExecutionStrategy(steps);
        
        console.log(chalk.blue('[SMART-SSH] Strategy:', strategy.strategy));
        console.log(chalk.gray('[SMART-SSH] Reason:', strategy.reason));
        
        if (strategy.strategy === 'combined') {
            return this.executeCombinedSSH(steps, strategy);
        } else if (strategy.strategy === 'interactive') {
            // Fall back to interactive shell
            const shellExecutor = new InteractiveShellExecutor(this.sshConfig, this.projectPath);
            return shellExecutor.executeStepsInShell(steps);
        } else {
            // Standard execution
            return this.executeStandardSteps(steps);
        }
    }

    /**
     * Execute with combined SSH strategy
     */
    async executeCombinedSSH(steps, strategy) {
        const results = [];
        const connection = new SSHConnection(this.sshConfig);
        
        try {
            await connection.connect();
            
            // Execute steps before the SSH command normally
            for (let i = 0; i < strategy.sshStepIndex; i++) {
                const result = await this.executeSingleStep(connection, steps[i]);
                results.push(result);
                if (!result.success && !steps[i].continueOnError) {
                    throw new Error(`Step failed: ${steps[i].name}`);
                }
            }
            
            // Build combined SSH command
            const commands = strategy.commandsToRun.map(step => {
                let cmd = step.command;
                // Add working directory if needed
                if (step.workingDir && step.workingDir !== '.') {
                    cmd = `cd ${step.workingDir} && ${cmd}`;
                }
                return cmd;
            });
            
            const combinedCommand = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no ${strategy.sshTarget} '${commands.join(' && ')}'`;
            
            console.log(chalk.yellow('[SMART-SSH] Combined command:', combinedCommand));
            
            // Execute the combined SSH command
            const startTime = Date.now();
            const result = await connection.exec(combinedCommand);
            
            // Add result for the SSH step
            results.push({
                step: steps[strategy.sshStepIndex].name,
                success: true,
                output: `Connected to ${strategy.sshTarget}`,
                duration: 0
            });
            
            // Add results for the combined commands
            const duration = Date.now() - startTime;
            const avgDuration = Math.floor(duration / strategy.commandsToRun.length);
            
            strategy.commandsToRun.forEach((step, index) => {
                results.push({
                    step: step.name,
                    success: result.code === 0,
                    output: index === strategy.commandsToRun.length - 1 ? result.stdout : `Executed on ${strategy.sshTarget}`,
                    error: result.code !== 0 ? result.stderr : undefined,
                    duration: avgDuration
                });
            });
            
            connection.disconnect();
            return results;
            
        } catch (error) {
            connection.disconnect();
            throw error;
        }
    }

    /**
     * Execute steps using standard approach
     */
    async executeStandardSteps(steps) {
        const results = [];
        const connection = new SSHConnection(this.sshConfig);
        
        try {
            await connection.connect();
            
            for (const step of steps) {
                const result = await this.executeSingleStep(connection, step);
                results.push(result);
                
                if (!result.success && !step.continueOnError) {
                    throw new Error(`Step failed: ${step.name}`);
                }
            }
            
            connection.disconnect();
            return results;
            
        } catch (error) {
            connection.disconnect();
            throw error;
        }
    }

    /**
     * Execute a single step
     */
    async executeSingleStep(connection, step) {
        const startTime = Date.now();
        
        try {
            let command = step.command;
            
            // Add working directory
            if (!step.workingDir || step.workingDir === '.') {
                command = `cd ${this.projectPath} && ${command}`;
            } else {
                command = `cd ${this.projectPath}/${step.workingDir} && ${command}`;
            }
            
            // Add environment variables
            if (step.envVars && step.envVars.length > 0) {
                const envVars = step.envVars.map(env => `export ${env.name}="${env.value}"`).join('; ');
                command = `${envVars}; ${command}`;
            }
            
            const result = await connection.exec(command);
            
            return {
                step: step.name,
                success: result.code === 0,
                output: result.stdout || result.stderr,
                error: result.code !== 0 ? result.stderr : undefined,
                duration: Date.now() - startTime
            };
        } catch (error) {
            return {
                step: step.name,
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }
}