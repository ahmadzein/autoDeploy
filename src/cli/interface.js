#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../config/manager.js';
import { GitOperations } from '../git/operations.js';
import { SSHConnection } from '../ssh/connection.js';
import { PipelineExecutor } from '../pipeline/executor.js';

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
                name: 'addSteps',
                message: 'Do you want to add deployment steps?',
                default: true
            }
        ]);

        const steps = [];
        if (pipelineAnswers.addSteps) {
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
            console.log(`   Steps: ${project.deploymentSteps.length}`);
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
            
            console.log(chalk.blue('\n=� Deployment Summary:\n'));
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            console.log(`Total steps: ${results.length}`);
            console.log(`Successful: ${chalk.green(successful)}`);
            console.log(`Failed: ${chalk.red(failed)}`);
            
            if (failed === 0) {
                console.log(chalk.green('\n Deployment completed successfully!'));
            } else {
                console.log(chalk.red('\nL Deployment completed with errors'));
            }
        } else {
            console.log(chalk.yellow('\n� No deployment steps configured'));
        }
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
    .command('edit <project-name>')
    .description('Edit deployment steps for a project')
    .action(async (projectName) => {
        const project = configManager.getProject(projectName);
        if (!project) {
            console.error(chalk.red(`Project "${projectName}" not found`));
            return;
        }

        console.log(chalk.blue(`\nCurrent steps for ${projectName}:`));
        if (project.deploymentSteps.length === 0) {
            console.log(chalk.yellow('No steps configured'));
        } else {
            project.deploymentSteps.forEach((step, index) => {
                console.log(`${index + 1}. ${step.name}: ${step.command}`);
            });
        }

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: 'Add new steps', value: 'add' },
                    { name: 'Clear all steps', value: 'clear' },
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

program.parse(process.argv);