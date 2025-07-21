import { SSHConnection } from '../ssh/connection.js';
import chalk from 'chalk';

export class NestedSSHExecutor {
    constructor(sshConfig, projectPath) {
        this.sshConfig = sshConfig;
        this.projectPath = projectPath;
    }

    /**
     * Analyze steps to group commands that should run on the same SSH target
     */
    analyzeSteps(steps) {
        const groups = [];
        let currentGroup = null;
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const command = step.command.trim();
            
            // Check if this is an SSH command
            const sshMatch = command.match(/^ssh\s+([^\s]+)(?:\s+(.*))?$/);
            
            if (sshMatch) {
                const [, sshTarget, sshCommand] = sshMatch;
                
                if (sshCommand) {
                    // Single SSH command: ssh server 'command'
                    groups.push({
                        type: 'single',
                        steps: [step],
                        sshTarget: null
                    });
                } else {
                    // Start of nested SSH session
                    currentGroup = {
                        type: 'nested',
                        sshTarget,
                        steps: [step],
                        startIndex: i
                    };
                }
            } else if (currentGroup && currentGroup.type === 'nested') {
                // This command should run on the nested SSH target
                currentGroup.steps.push(step);
            } else {
                // Regular command
                if (currentGroup) {
                    groups.push(currentGroup);
                    currentGroup = null;
                }
                groups.push({
                    type: 'single',
                    steps: [step],
                    sshTarget: null
                });
            }
        }
        
        // Don't forget the last group
        if (currentGroup) {
            groups.push(currentGroup);
        }
        
        return groups;
    }

    /**
     * Execute steps with proper handling of nested SSH
     */
    async executeSteps(steps) {
        const groups = this.analyzeSteps(steps);
        const results = [];
        
        console.log(chalk.blue('[NESTED-SSH] Analyzed', steps.length, 'steps into', groups.length, 'groups'));
        
        for (const group of groups) {
            if (group.type === 'nested' && group.steps.length > 1) {
                // Execute nested SSH commands
                console.log(chalk.yellow('[NESTED-SSH] Executing', group.steps.length - 1, 'commands on', group.sshTarget));
                
                // Skip the first step (the SSH command itself)
                const nestedSteps = group.steps.slice(1);
                const combinedCommand = this.buildNestedCommand(group.sshTarget, nestedSteps);
                
                // Execute the combined command
                const result = await this.executeSingleStep({
                    ...group.steps[0],
                    command: combinedCommand,
                    name: `Nested SSH to ${group.sshTarget}`
                });
                
                results.push(result);
                
                // Add placeholder results for the nested steps
                for (const step of nestedSteps) {
                    results.push({
                        step: step.name,
                        success: result.success,
                        output: `Executed on ${group.sshTarget}`,
                        error: result.error
                    });
                }
            } else {
                // Execute single steps normally
                for (const step of group.steps) {
                    const result = await this.executeSingleStep(step);
                    results.push(result);
                }
            }
        }
        
        return results;
    }

    /**
     * Build a command that runs multiple commands on a nested SSH target
     */
    buildNestedCommand(sshTarget, steps) {
        const commands = [];
        
        // Add working directory changes
        commands.push(`cd ${this.projectPath}`);
        
        // Add each step's command
        for (const step of steps) {
            if (step.workingDir && step.workingDir !== '.') {
                commands.push(`cd ${this.projectPath}/${step.workingDir}`);
            }
            
            // Add environment variables
            if (step.envVars && step.envVars.length > 0) {
                const envVars = step.envVars.map(env => `export ${env.name}="${env.value}"`).join('; ');
                commands.push(envVars);
            }
            
            commands.push(step.command);
        }
        
        // Build the SSH command with all nested commands
        const scriptContent = commands.join(' && ');
        return `ssh ${sshTarget} 'bash -c "${scriptContent.replace(/"/g, '\\"')}"'`;
    }

    /**
     * Execute a single step
     */
    async executeSingleStep(step) {
        const connection = new SSHConnection(this.sshConfig);
        
        try {
            await connection.connect();
            
            let command = step.command;
            
            // Add working directory
            if (!step.workingDir || step.workingDir === '.') {
                command = `cd ${this.projectPath} && ${command}`;
            } else {
                command = `cd ${this.projectPath}/${step.workingDir} && ${command}`;
            }
            
            console.log(chalk.gray('[NESTED-SSH] Executing:', command));
            const result = await connection.exec(command);
            
            connection.disconnect();
            
            return {
                step: step.name,
                success: result.code === 0,
                output: result.stdout,
                error: result.stderr
            };
        } catch (error) {
            connection.disconnect();
            return {
                step: step.name,
                success: false,
                error: error.message
            };
        }
    }
}