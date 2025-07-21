import { SSHConnection } from '../ssh/connection.js';
import chalk from 'chalk';

export class PersistentPipelineExecutor {
    constructor(sshConfig, projectPath) {
        this.sshConfig = sshConfig;
        this.projectPath = projectPath;
    }

    /**
     * Execute all steps in a single SSH session
     * This maintains state between steps, allowing for nested SSH connections
     */
    async executeStepsInSession(steps) {
        const connection = new SSHConnection(this.sshConfig);
        const results = [];
        
        try {
            console.log(chalk.blue('[PERSISTENT] Connecting to SSH...'));
            await connection.connect();
            console.log(chalk.green('[PERSISTENT] SSH connection established'));
            
            // Build a single script that executes all steps
            const script = this.buildSessionScript(steps);
            
            // Log the script in debug mode
            if (process.env.AUTODEPLOY_DEBUG === 'true') {
                console.log(chalk.yellow('[PERSISTENT] Generated script:'));
                console.log(chalk.gray('--- SCRIPT START ---'));
                console.log(chalk.gray(script));
                console.log(chalk.gray('--- SCRIPT END ---'));
            }
            
            console.log(chalk.blue('[PERSISTENT] Executing combined script with', steps.length, 'steps'));
            
            // Execute the entire script in one go
            const startTime = Date.now();
            const result = await connection.exec(script);
            const duration = Date.now() - startTime;
            
            console.log(chalk.blue('[PERSISTENT] Script execution completed in', duration, 'ms'));
            console.log(chalk.blue('[PERSISTENT] Exit code:', result.code));
            
            if (process.env.AUTODEPLOY_DEBUG === 'true') {
                console.log(chalk.yellow('[PERSISTENT] Raw output:'));
                console.log(chalk.gray('--- OUTPUT START ---'));
                console.log(chalk.gray(result.stdout));
                console.log(chalk.gray('--- OUTPUT END ---'));
                if (result.stderr) {
                    console.log(chalk.red('[PERSISTENT] Stderr:'));
                    console.log(chalk.gray(result.stderr));
                }
            }
            
            // Parse the results from the output
            const parsedResults = this.parseScriptOutput(result.stdout, steps);
            
            console.log(chalk.green('[PERSISTENT] Disconnecting SSH'));
            connection.disconnect();
            
            return parsedResults;
            
        } catch (error) {
            console.error(chalk.red('[PERSISTENT] Error:', error.message));
            connection.disconnect();
            throw error;
        }
    }

    /**
     * Build a bash script that executes all steps with proper error handling
     */
    buildSessionScript(steps) {
        const lines = [
            '#!/bin/bash',
            'set -e', // Exit on error by default
            '',
            '# Source necessary files',
            'source ~/.bashrc 2>/dev/null || true',
            'source ~/.profile 2>/dev/null || true',
            'source ~/.nvm/nvm.sh 2>/dev/null || true',
            '',
            `# Change to project directory`,
            `cd ${this.projectPath}`,
            '',
            '# Define step tracking',
            'STEP_RESULTS=()',
            'STEP_COUNT=0',
            '',
            '# Function to record step result',
            'record_step() {',
            '    local step_name="$1"',
            '    local exit_code="$2"',
            '    echo "STEP_RESULT:${STEP_COUNT}:${step_name}:${exit_code}"',
            '    STEP_RESULTS+=("${step_name}:${exit_code}")',
            '    ((STEP_COUNT++))',
            '}',
            '',
        ];

        // Add each step
        steps.forEach((step, index) => {
            lines.push(`# Step ${index + 1}: ${step.name}`);
            lines.push(`echo "STEP_START:${index}:${step.name}"`);
            lines.push(`echo "[PERSISTENT] Executing: ${step.command}"`);
            
            // Handle environment variables
            if (step.envVars && step.envVars.length > 0) {
                step.envVars.forEach(env => {
                    lines.push(`export ${env.name}="${env.value}"`);
                });
            }
            
            // Handle working directory
            if (step.workingDir && step.workingDir !== '.') {
                lines.push(`cd ${this.projectPath}/${step.workingDir}`);
            }
            
            // Handle continue on error
            if (step.continueOnError) {
                lines.push('set +e  # Allow errors for this step');
            }
            
            // Add the command with echo for debugging
            lines.push(`echo "[PERSISTENT] Current directory: $(pwd)"`);
            lines.push(`echo "[PERSISTENT] Running command: ${step.command}"`);
            
            // Check if this is an SSH command that might need special handling
            if (step.command.trim().startsWith('ssh ')) {
                // SSH commands might hang waiting for input, add timeout and non-interactive flags
                const sshCommand = step.command.replace(/^ssh\s+/, 'ssh -o BatchMode=yes -o ConnectTimeout=10 ');
                lines.push(`echo "[PERSISTENT] Modified SSH command: ${sshCommand}"`);
                lines.push(`${sshCommand}`);
            } else {
                lines.push(`${step.command}`);
            }
            
            lines.push('STEP_EXIT_CODE=$?');
            lines.push(`echo "[PERSISTENT] Command exit code: $STEP_EXIT_CODE"`);
            
            // Record the result
            lines.push(`record_step "${step.name}" $STEP_EXIT_CODE`);
            
            // Reset error handling
            if (step.continueOnError) {
                lines.push('set -e  # Re-enable exit on error');
            } else {
                lines.push('if [ $STEP_EXIT_CODE -ne 0 ]; then');
                lines.push('    echo "STEP_ERROR:${index}:${step.name}"');
                lines.push('    exit $STEP_EXIT_CODE');
                lines.push('fi');
            }
            
            lines.push(`echo "STEP_END:${index}:${step.name}"`);
            lines.push('');
        });
        
        // Add final summary
        lines.push('# Print summary');
        lines.push('echo "EXECUTION_COMPLETE"');
        lines.push('for result in "${STEP_RESULTS[@]}"; do');
        lines.push('    echo "SUMMARY:$result"');
        lines.push('done');
        
        return lines.join('\n');
    }

    /**
     * Parse the script output to extract individual step results
     */
    parseScriptOutput(output, steps) {
        const results = [];
        const lines = output.split('\n');
        
        let currentStep = null;
        let currentOutput = [];
        
        for (const line of lines) {
            if (line.startsWith('STEP_START:')) {
                const [, index, name] = line.split(':');
                currentStep = { index: parseInt(index), name, output: [] };
                currentOutput = [];
            } else if (line.startsWith('STEP_END:')) {
                if (currentStep) {
                    currentStep.output = currentOutput.join('\n');
                    results.push(currentStep);
                    currentStep = null;
                }
            } else if (line.startsWith('STEP_RESULT:')) {
                const [, , name, exitCode] = line.split(':');
                const stepResult = results.find(r => r.name === name);
                if (stepResult) {
                    stepResult.success = exitCode === '0';
                    stepResult.exitCode = parseInt(exitCode);
                }
            } else if (line.startsWith('STEP_ERROR:')) {
                const [, index, name] = line.split(':');
                const stepResult = results.find(r => r.index === parseInt(index));
                if (stepResult) {
                    stepResult.success = false;
                    stepResult.error = 'Step failed';
                }
            } else if (currentStep && !line.startsWith('SUMMARY:') && !line.startsWith('EXECUTION_COMPLETE')) {
                currentOutput.push(line);
            }
        }
        
        return results.map((result, index) => ({
            step: steps[index].name,
            success: result.success || false,
            output: result.output || '',
            error: result.error || (result.success ? '' : 'Step failed')
        }));
    }

    /**
     * Execute a single step (for compatibility)
     */
    async executeStep(step, providedInputs = {}) {
        const results = await this.executeStepsInSession([step]);
        return results[0] || {
            success: false,
            error: 'Failed to execute step',
            step: step.name
        };
    }
}