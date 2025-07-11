#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { ConfigManager } from '../config/manager.js';
import { GitOperations } from '../git/operations.js';
import { SSHConnection } from '../ssh/connection.js';
import { PipelineExecutor } from '../pipeline/executor.js';
import { startGUIService, startGUIProduction } from './gui-service.js';
import { handleEditCommand } from './edit-command.js';

const program = new Command();
const configManager = new ConfigManager();

program
    .name('autodeploy')
    .description('Local deployment automation tool')
    .version('1.0.0');

program
    .command('add-project')
    .description('Add a new project configuration')
    .action(async () => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Project name:',
                validate: input => input.length > 0 || 'Project name is required'
            },
            {
                type: 'input',
                name: 'localPath',
                message: 'Local project path:',
                validate: input => input.length > 0 || 'Local path is required'
            },
            {
                type: 'input',
                name: 'host',
                message: 'SSH host:',
                validate: input => input.length > 0 || 'Host is required'
            },
            {
                type: 'input',
                name: 'username',
                message: 'SSH username:',
                validate: input => input.length > 0 || 'Username is required'
            },
            {
                type: 'password',
                name: 'password',
                message: 'SSH password:',
                mask: '*',
                validate: input => input.length > 0 || 'Password is required'
            },
            {
                type: 'input',
                name: 'remotePath',
                message: 'Remote project path (absolute path on server):',
                validate: input => {
                    if (input.length === 0) return 'Remote path is required';
                    if (input.startsWith('~')) return 'Please use absolute path (e.g., /home/username/project)';
                    return true;
                }
            },
            {
                type: 'input',
                name: 'port',
                message: 'SSH port (default: 22):',
                default: '22',
                validate: input => !isNaN(parseInt(input)) || 'Port must be a number'
            }
        ]);

        const pipelineAnswers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'addLocalSteps',
                message: 'Do you want to add local deployment steps?',
                default: false
            },
            {
                type: 'confirm',
                name: 'addRemoteSteps',
                message: 'Do you want to add remote deployment steps?',
                default: true
            }
        ]);

        const localSteps = [];
        if (pipelineAnswers.addLocalSteps) {
            console.log(chalk.blue('\nLocal steps run on your machine before deployment:'));
            let addMore = true;
            while (addMore) {
                const step = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Local step name:',
                        validate: input => input.length > 0 || 'Step name is required'
                    },
                    {
                        type: 'input',
                        name: 'command',
                        message: 'Command to run locally:',
                        validate: input => input.length > 0 || 'Command is required'
                    },
                    {
                        type: 'input',
                        name: 'workingDir',
                        message: 'Working directory (relative to project, default: .):',
                        default: '.'
                    },
                    {
                        type: 'confirm',
                        name: 'continueOnError',
                        message: 'Continue on error?',
                        default: false
                    }
                ]);

                localSteps.push(step);

                const { more } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'more',
                        message: 'Add another local step?',
                        default: false
                    }
                ]);
                addMore = more;
            }
        }

        const steps = [];
        if (pipelineAnswers.addRemoteSteps) {
            console.log(chalk.blue('\nRemote steps run on the server after deployment:'));
            let addMore = true;
            while (addMore) {
                const step = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Remote step name:',
                        validate: input => input.length > 0 || 'Step name is required'
                    },
                    {
                        type: 'input',
                        name: 'command',
                        message: 'Command to run:',
                        validate: input => input.length > 0 || 'Command is required'
                    },
                    {
                        type: 'input',
                        name: 'workingDir',
                        message: 'Working directory (relative to project, default: .):',
                        default: '.'
                    },
                    {
                        type: 'confirm',
                        name: 'continueOnError',
                        message: 'Continue on error?',
                        default: false
                    }
                ]);

                steps.push(step);

                const { more } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'more',
                        message: 'Add another step?',
                        default: false
                    }
                ]);
                addMore = more;
            }
        }

        const project = {
            name: answers.name,
            localPath: answers.localPath,
            ssh: {
                host: answers.host,
                username: answers.username,
                password: answers.password,
                port: parseInt(answers.port)
            },
            remotePath: answers.remotePath,
            localSteps: localSteps,
            deploymentSteps: steps
        };

        const spinner = ora('Testing SSH connection...').start();
        const sshConnection = new SSHConnection(project.ssh);
        const testResult = await sshConnection.testConnection();

        if (testResult.success) {
            spinner.succeed('SSH connection successful');
            configManager.addProject(project);
            console.log(chalk.green(`\n Project "${answers.name}" added successfully!`));
        } else {
            spinner.fail('SSH connection failed');
            console.error(chalk.red(`\nError: ${testResult.message}`));
            const { saveAnyway } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'saveAnyway',
                    message: 'Save configuration anyway?',
                    default: false
                }
            ]);
            if (saveAnyway) {
                configManager.addProject(project);
                console.log(chalk.yellow(`\n� Project "${answers.name}" saved with connection issues`));
            }
        }
    });

program
    .command('list')
    .description('List all projects')
    .action(() => {
        const projects = configManager.getAllProjects();
        if (projects.length === 0) {
            console.log(chalk.yellow('No projects configured'));
            return;
        }

        console.log(chalk.blue('\nConfigured Projects:\n'));
        projects.forEach((project, index) => {
            console.log(`${index + 1}. ${chalk.bold(project.name)}`);
            console.log(`   Local: ${project.localPath}`);
            console.log(`   Remote: ${project.ssh.username}@${project.ssh.host}:${project.remotePath}`);
            console.log(`   Local Steps: ${project.localSteps?.length || 0}`);
            console.log(`   Remote Steps: ${project.deploymentSteps.length}`);
            console.log();
        });
    });

program
    .command('deploy [project-name]')
    .description('Deploy a project')
    .action(async (projectName) => {
        const projects = configManager.getAllProjects();
        
        if (projects.length === 0) {
            console.log(chalk.yellow('No projects configured. Run "autodeploy add-project" first.'));
            return;
        }

        let project;
        if (projectName) {
            project = configManager.getProject(projectName);
            if (!project) {
                console.error(chalk.red(`Project "${projectName}" not found`));
                return;
            }
        } else {
            const { selectedProject } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedProject',
                    message: 'Select project to deploy:',
                    choices: projects.map(p => ({ name: p.name, value: p }))
                }
            ]);
            project = selectedProject;
        }

        console.log(chalk.blue(`\n=� Deploying ${project.name}...\n`));

        // Track deployment start
        const startTime = Date.now();
        const deploymentSteps = [];
        let deploymentSuccess = true;

        // Execute local steps first
        if (project.localSteps && project.localSteps.length > 0) {
            console.log(chalk.blue('\n📦 Executing local steps...\n'));
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            for (const step of project.localSteps) {
                const stepStartTime = Date.now();
                const spinner = ora(`[Local] ${step.name}`).start();
                
                try {
                    const workingDir = step.workingDir === '.' 
                        ? project.localPath 
                        : join(project.localPath, step.workingDir);
                    
                    const { stdout, stderr } = await execAsync(step.command, {
                        cwd: workingDir,
                        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
                    });
                    
                    const output = stdout || stderr || 'Command completed';
                    spinner.succeed(`[Local] ${step.name}`);
                    if (output.trim()) {
                        console.log(chalk.gray(output.trim()));
                    }
                    
                    deploymentSteps.push({
                        name: `[Local] ${step.name}`,
                        success: true,
                        output: output,
                        duration: Date.now() - stepStartTime
                    });
                } catch (error) {
                    spinner.fail(`[Local] ${step.name}: ${error.message}`);
                    deploymentSteps.push({
                        name: `[Local] ${step.name}`,
                        success: false,
                        output: error.message,
                        duration: Date.now() - stepStartTime
                    });
                    
                    if (!step.continueOnError) {
                        deploymentSuccess = false;
                        console.log(chalk.red('\n❌ Local step failed, stopping deployment'));
                        
                        // Record failed deployment
                        const duration = Date.now() - startTime;
                        configManager.recordDeployment(project.name, false, {
                            duration,
                            steps: deploymentSteps,
                            error: `Local step failed: ${step.name}`
                        });
                        return;
                    }
                }
            }
        }

        const gitOps = new GitOperations(project.localPath);
        
        const isGitRepo = await gitOps.isGitRepo();
        if (isGitRepo) {
            const spinner = ora('Committing and pushing local changes...').start();
            const gitResult = await gitOps.commitAndPush(`Auto-deploy: ${new Date().toISOString()}`);
            
            if (gitResult.success) {
                spinner.succeed(gitResult.message);
            } else {
                spinner.fail(`Git operation failed: ${gitResult.message}`);
                const { continueAnyway } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'continueAnyway',
                        message: 'Continue with deployment anyway?',
                        default: false
                    }
                ]);
                if (!continueAnyway) {
                    return;
                }
            }
        } else {
            console.log(chalk.yellow('� Local directory is not a git repository, skipping git operations'));
        }

        if (project.deploymentSteps.length > 0) {
            const executor = new PipelineExecutor(project.ssh, project.remotePath);
            const results = await executor.execute(project.deploymentSteps);
            
            // Record step results
            results.forEach((result, index) => {
                const step = project.deploymentSteps[index];
                deploymentSteps.push({
                    name: step.name,
                    success: result.success,
                    output: result.output || result.error,
                    duration: result.duration || 0
                });
            });
            
            console.log(chalk.blue('\n=� Deployment Summary:\n'));
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            console.log(`Total steps: ${results.length}`);
            console.log(`Successful: ${chalk.green(successful)}`);
            console.log(`Failed: ${chalk.red(failed)}`);
            
            if (failed === 0) {
                console.log(chalk.green('\n Deployment completed successfully!'));
            } else {
                deploymentSuccess = false;
                console.log(chalk.red('\nL Deployment completed with errors'));
            }
        } else {
            console.log(chalk.yellow('\n� No deployment steps configured'));
        }
        
        // Record deployment
        const duration = Date.now() - startTime;
        configManager.recordDeployment(project.name, deploymentSuccess, {
            duration,
            steps: deploymentSteps
        });
    });

program
    .command('remove <project-name>')
    .description('Remove a project')
    .action(async (projectName) => {
        const project = configManager.getProject(projectName);
        if (!project) {
            console.error(chalk.red(`Project "${projectName}" not found`));
            return;
        }

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to remove "${projectName}"?`,
                default: false
            }
        ]);

        if (confirm) {
            configManager.removeProject(projectName);
            console.log(chalk.green(` Project "${projectName}" removed`));
        }
    });

program
    .command('history <project-name>')
    .description('View deployment history for a project')
    .option('-l, --limit <number>', 'Number of deployments to show', '10')
    .action((projectName, options) => {
        const project = configManager.getProject(projectName);
        if (!project) {
            console.error(chalk.red(`Project "${projectName}" not found`));
            return;
        }

        const history = configManager.getDeploymentHistory(projectName, parseInt(options.limit));
        
        if (history.length === 0) {
            console.log(chalk.yellow(`No deployment history for "${projectName}"`));
            return;
        }

        console.log(chalk.blue(`\nDeployment History for ${projectName}:\n`));
        
        history.forEach((deployment, index) => {
            const date = new Date(deployment.timestamp);
            const duration = deployment.duration ? `${(deployment.duration / 1000).toFixed(1)}s` : 'N/A';
            
            console.log(`${index + 1}. ${chalk.bold(date.toLocaleString())}`);
            console.log(`   Status: ${deployment.success ? chalk.green('✓ Success') : chalk.red('✗ Failed')}`);
            console.log(`   Duration: ${duration}`);
            
            if (deployment.steps && deployment.steps.length > 0) {
                console.log(`   Steps:`);
                deployment.steps.forEach(step => {
                    const stepIcon = step.success ? chalk.green('✓') : chalk.red('✗');
                    console.log(`     ${stepIcon} ${step.name}`);
                });
            }
            
            if (deployment.error) {
                console.log(`   Error: ${chalk.red(deployment.error)}`);
            }
            
            console.log();
        });
    });

program
    .command('stats')
    .description('View deployment statistics across all projects')
    .action(() => {
        const stats = configManager.getDeploymentStats();
        const projects = configManager.getAllProjects();
        
        console.log(chalk.blue('\n📊 Deployment Statistics\n'));
        
        console.log(`Total Projects: ${chalk.bold(projects.length)}`);
        console.log(`Active Projects: ${chalk.bold(stats.activeProjects)}`);
        console.log(`Total Deployments: ${chalk.bold(stats.totalDeployments)}`);
        console.log(`Deployments Today: ${chalk.bold(stats.deploymentsToday)}`);
        
        if (stats.lastDeployment) {
            const date = new Date(stats.lastDeployment.timestamp);
            const timeDiff = Date.now() - date.getTime();
            const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
            const minsAgo = Math.floor(timeDiff / (1000 * 60));
            
            let timeAgoStr;
            if (minsAgo < 60) {
                timeAgoStr = `${minsAgo} minute${minsAgo !== 1 ? 's' : ''} ago`;
            } else if (hoursAgo < 24) {
                timeAgoStr = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
            } else {
                const daysAgo = Math.floor(hoursAgo / 24);
                timeAgoStr = `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
            }
            
            console.log(`\nLast Deployment:`);
            console.log(`  Project: ${chalk.bold(stats.lastDeployment.projectName)}`);
            console.log(`  Time: ${date.toLocaleString()} (${timeAgoStr})`);
            console.log(`  Status: ${stats.lastDeployment.success ? chalk.green('✓ Success') : chalk.red('✗ Failed')}`);
        } else {
            console.log(`\nLast Deployment: ${chalk.gray('No deployments yet')}`);
        }
        
        console.log('\n' + chalk.gray('─'.repeat(50)));
        console.log(chalk.gray('Run "autodeploy history <project>" to see detailed history'));
    });

program
    .command('edit <project-name>')
    .description('Edit deployment steps for a project')
    .option('-j, --json', 'Edit raw JSON configuration')
    .action(async (projectName, options) => {
        await handleEditCommand(projectName, options, { chalk, inquirer, configManager, program });
        if (!project) {
            console.error(chalk.red(`Project "${projectName}" not found`));
            return;
        }

        // JSON edit mode
        if (options.json) {
            console.log(chalk.blue('\nCurrent project configuration:'));
            console.log(JSON.stringify(project, null, 2));
            
            const { editJson } = await inquirer.prompt([
                {
                    type: 'editor',
                    name: 'editJson',
                    message: 'Edit the JSON configuration (save and close when done):',
                    default: JSON.stringify(project, null, 2)
                }
            ]);
            
            try {
                const updatedProject = JSON.parse(editJson);
                configManager.updateProject(projectName, updatedProject);
                console.log(chalk.green('✓ Project configuration updated successfully'));
            } catch (error) {
                console.error(chalk.red('Invalid JSON:', error.message));
            }
            return;
        }

        // Regular edit mode
        console.log(chalk.blue(`\nCurrent configuration for ${projectName}:`));
        console.log(chalk.gray('\nLocal Steps:'));
        if (!project.localSteps || project.localSteps.length === 0) {
            console.log(chalk.yellow('  No local steps configured'));
        } else {
            project.localSteps.forEach((step, index) => {
                console.log(`  ${index + 1}. ${step.name}: ${step.command}`);
            });
        }
        
        console.log(chalk.gray('\nRemote Steps:'));
        if (project.deploymentSteps.length === 0) {
            console.log(chalk.yellow('  No remote steps configured'));
        } else {
            project.deploymentSteps.forEach((step, index) => {
                console.log(`  ${index + 1}. ${step.name}: ${step.command}`);
            });
        }

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: 'Edit local steps', value: 'local' },
                    { name: 'Edit remote steps', value: 'remote' },
                    { name: 'Edit as JSON', value: 'json' },
                    { name: 'Cancel', value: 'cancel' }
                ]
            }
        ]);

        if (action === 'cancel') {
            return;
        }

        if (action === 'clear') {
            project.deploymentSteps = [];
            configManager.updateProject(projectName, { deploymentSteps: [] });
            console.log(chalk.green(' Steps cleared'));
            return;
        }

        const steps = [...project.deploymentSteps];
        let addMore = true;
        
        while (addMore) {
            const step = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Step name:',
                    validate: input => input.length > 0 || 'Step name is required'
                },
                {
                    type: 'input',
                    name: 'command',
                    message: 'Command to run:',
                    validate: input => input.length > 0 || 'Command is required'
                },
                {
                    type: 'input',
                    name: 'workingDir',
                    message: 'Working directory (relative to project, default: .):',
                    default: '.'
                },
                {
                    type: 'confirm',
                    name: 'continueOnError',
                    message: 'Continue on error?',
                    default: false
                }
            ]);

            steps.push(step);

            const { more } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'more',
                    message: 'Add another step?',
                    default: false
                }
            ]);
            addMore = more;
        }

        configManager.updateProject(projectName, { deploymentSteps: steps });
        console.log(chalk.green(` Steps updated for "${projectName}"`));
    });

program
    .command('gui')
    .description('Start the AutoDeploy GUI service')
    .option('-p, --port <port>', 'Port to run the GUI on', process.env.AUTODEPLOY_GUI_PORT || '8080')
    .option('-h, --host <host>', 'Host to bind to', process.env.AUTODEPLOY_GUI_HOST || 'localhost')
    .option('--api-port <port>', 'Port to run the API server on', process.env.AUTODEPLOY_API_PORT || '3000')
    .option('--no-open', 'Do not open browser automatically')
    .option('-d, --debug', 'Show debug output')
    .option('--production', 'Run in production mode (requires built files)')
    .action(async (options) => {
        try {
            if (options.production) {
                startGUIProduction(options);
            } else {
                startGUIService(options);
            }
        } catch (error) {
            console.error(chalk.red('Failed to start GUI service:'), error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);