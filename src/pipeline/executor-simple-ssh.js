import { SSHConnection } from '../ssh/connection.js';
import chalk from 'chalk';

/**
 * Simple SSH Executor that runs commands exactly as specified
 * without trying to detect or handle nested SSH
 */
export class SimpleSSHExecutor {
    constructor(sshConfig, projectPath) {
        this.sshConfig = sshConfig;
        this.projectPath = projectPath;
    }

    /**
     * Execute steps without any special handling
     */
    async executeSteps(steps) {
        const results = [];
        const connection = new SSHConnection(this.sshConfig);
        
        try {
            await connection.connect();
            console.log(chalk.green('[SIMPLE-SSH] Connected to server'));
            
            for (const step of steps) {
                console.log(chalk.blue(`[SIMPLE-SSH] Executing: ${step.name}`));
                const result = await this.executeSingleStep(connection, step);
                results.push(result);
                
                // For debugging
                console.log(chalk.gray(`[SIMPLE-SSH] Result: success=${result.success}, hasOutput=${!!result.output}`));
                
                if (!result.success && !step.continueOnError) {
                    throw new Error(`Step failed: ${step.name}`);
                }
            }
            
            connection.disconnect();
            console.log(chalk.green('[SIMPLE-SSH] All steps completed'));
            return results;
            
        } catch (error) {
            console.error(chalk.red('[SIMPLE-SSH] Error:', error.message));
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
            
            // Don't add any cd commands or path manipulation
            // Just run the command as-is
            console.log(chalk.gray(`[SIMPLE-SSH] Command: ${command}`));
            
            // Add timeout to prevent hanging
            const result = await Promise.race([
                connection.exec(command),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Command timed out after 30 seconds')), 30000)
                )
            ]);
            
            // If the command was just "ssh server", it might return with exit code 0
            // but no output, which is normal
            if (command.trim().match(/^ssh\s+[^\s]+\s*$/)) {
                console.log(chalk.yellow('[SIMPLE-SSH] SSH command completed (may have switched to nested session)'));
                return {
                    step: step.name,
                    success: true,
                    output: 'SSH session initiated',
                    duration: Date.now() - startTime
                };
            }
            
            return {
                step: step.name,
                success: result.code === 0,
                output: result.stdout || result.stderr || 'Command completed',
                error: result.code !== 0 ? (result.stderr || `Exit code: ${result.code}`) : undefined,
                duration: Date.now() - startTime
            };
            
        } catch (error) {
            console.error(chalk.red(`[SIMPLE-SSH] Step error: ${error.message}`));
            return {
                step: step.name,
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }
}