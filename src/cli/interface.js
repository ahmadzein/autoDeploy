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
    .version('1.1.0');

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
            console.log(chalk.green(`\n✓ Project "${answers.name}" added successfully!`));
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
                console.log(chalk.yellow(`\n⚠ Project "${answers.name}" saved with connection issues`));
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
            const typeLabel = project.type === 'monorepo' ? chalk.cyan(' [MONOREPO]') : '';
            console.log(`${index + 1}. ${chalk.bold(project.name)}${typeLabel}`);
            console.log(`   Local: ${project.localPath}`);
            console.log(`   Remote: ${project.ssh.username}@${project.ssh.host}:${project.remotePath}`);
            
            if (project.type === 'monorepo') {
                const subDeployments = configManager.monorepo.getSubDeployments(project.name);
                console.log(`   Sub-deployments: ${subDeployments.length}`);
                if (subDeployments.length > 0) {
                    subDeployments.forEach(sub => {
                        console.log(`     - ${sub.name}: ${sub.remotePath}`);
                    });
                }
            } else {
                console.log(`   Local Steps: ${project.localSteps?.length || 0}`);
                console.log(`   Remote Steps: ${project.deploymentSteps.length}`);
            }
            console.log();
        });
    });

program
    .command('create-monorepo')
    .description('Create a new monorepo project')
    .action(async () => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Monorepo project name:',
                validate: input => input.length > 0 || 'Project name is required'
            },
            {
                type: 'input',
                name: 'localPath',
                message: 'Local monorepo root path:',
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
                name: 'port',
                message: 'SSH port (default: 22):',
                default: '22'
            }
        ]);

        const project = {
            name: answers.name,
            type: 'monorepo',
            localPath: answers.localPath,
            ssh: {
                host: answers.host,
                username: answers.username,
                password: answers.password,
                port: parseInt(answers.port)
            },
            remotePath: '/var/www', // Base path for monorepo
            deploymentSteps: [],
            subDeployments: []
        };

        // Test SSH connection
        console.log(chalk.blue('\nTesting SSH connection...'));
        const testSpinner = ora('Connecting...').start();

        const sshConnection = new SSHConnection(project.ssh);
        try {
            await sshConnection.connect();
            await sshConnection.disconnect();
            testSpinner.succeed('SSH connection successful');
            
            configManager.monorepo.createMonorepoProject(project);
            console.log(chalk.green(`\n✓ Monorepo project "${project.name}" created successfully!`));
            console.log(chalk.gray('Use "autodeploy add-sub <project-name>" to add sub-deployments'));
        } catch (error) {
            testSpinner.fail('SSH connection failed');
            console.error(chalk.red('Error:', error.message));
            
            const { saveAnyway } = await inquirer.prompt([{
                type: 'confirm',
                name: 'saveAnyway',
                message: 'Save project anyway?',
                default: false
            }]);

            if (saveAnyway) {
                configManager.monorepo.createMonorepoProject(project);
                console.log(chalk.yellow(`\n⚠ Monorepo "${project.name}" saved with connection issues`));
            }
        }
    });

program
    .command('add-sub <project-name>')
    .description('Add a sub-deployment to a monorepo')
    .action(async (projectName) => {
        const project = configManager.getProject(projectName);
        if (!project) {
            console.log(chalk.red(`Project "${projectName}" not found`));
            return;
        }

        if (!configManager.monorepo.isMonorepo(projectName)) {
            console.log(chalk.red(`Project "${projectName}" is not a monorepo`));
            console.log(chalk.gray('Use "autodeploy create-monorepo" to create a monorepo project'));
            return;
        }

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Sub-deployment name (e.g., frontend, backend):',
                validate: input => input.length > 0 || 'Name is required'
            },
            {
                type: 'input',
                name: 'relativePath',
                message: 'Relative path from monorepo root (e.g., apps/frontend):',
                validate: input => input.length > 0 || 'Path is required'
            },
            {
                type: 'input',
                name: 'remotePath',
                message: 'Remote deployment path:',
                validate: input => input.length > 0 || 'Remote path is required'
            },
            {
                type: 'confirm',
                name: 'inheritSSH',
                message: 'Use same SSH credentials as parent project?',
                default: true
            }
        ]);

        const subConfig = {
            name: answers.name,
            relativePath: answers.relativePath,
            remotePath: answers.remotePath
        };

        if (!answers.inheritSSH) {
            const sshAnswers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'host',
                    message: 'SSH host:',
                    default: project.ssh.host
                },
                {
                    type: 'input',
                    name: 'username',
                    message: 'SSH username:',
                    default: project.ssh.username
                },
                {
                    type: 'password',
                    name: 'password',
                    message: 'SSH password:',
                    mask: '*'
                },
                {
                    type: 'input',
                    name: 'port',
                    message: 'SSH port:',
                    default: project.ssh.port.toString()
                }
            ]);
            
            subConfig.ssh = {
                host: sshAnswers.host,
                username: sshAnswers.username,
                password: sshAnswers.password,
                port: parseInt(sshAnswers.port)
            };
        }

        // Add deployment steps
        const { addSteps } = await inquirer.prompt([{
            type: 'confirm',
            name: 'addSteps',
            message: 'Add deployment steps now?',
            default: true
        }]);

        if (addSteps) {
            // Local steps
            const localSteps = [];
            const { addLocalSteps } = await inquirer.prompt([{
                type: 'confirm',
                name: 'addLocalSteps',
                message: 'Add local steps?',
                default: true
            }]);

            if (addLocalSteps) {
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
                            message: 'Command to run:',
                            validate: input => input.length > 0 || 'Command is required'
                        },
                        {
                            type: 'input',
                            name: 'workingDir',
                            message: 'Working directory (relative to sub-project):',
                            default: '.'
                        }
                    ]);
                    
                    localSteps.push(step);
                    
                    const { more } = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'more',
                        message: 'Add another local step?',
                        default: false
                    }]);
                    addMore = more;
                }
            }
            subConfig.localSteps = localSteps;

            // Remote steps
            const remoteSteps = [];
            const { addRemoteSteps } = await inquirer.prompt([{
                type: 'confirm',
                name: 'addRemoteSteps',
                message: 'Add remote steps?',
                default: true
            }]);

            if (addRemoteSteps) {
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
                            message: 'Working directory:',
                            default: '.'
                        }
                    ]);
                    
                    remoteSteps.push(step);
                    
                    const { more } = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'more',
                        message: 'Add another remote step?',
                        default: false
                    }]);
                    addMore = more;
                }
            }
            subConfig.deploymentSteps = remoteSteps;
        }

        try {
            configManager.monorepo.addSubDeployment(projectName, subConfig);
            console.log(chalk.green(`\n✓ Sub-deployment "${subConfig.name}" added to "${projectName}"`));
        } catch (error) {
            console.error(chalk.red('Error:', error.message));
        }
    });

program
    .command('list-sub <project-name>')
    .description('List sub-deployments of a monorepo')
    .action((projectName) => {
        const project = configManager.getProject(projectName);
        if (!project) {
            console.log(chalk.red(`Project "${projectName}" not found`));
            return;
        }

        if (!configManager.monorepo.isMonorepo(projectName)) {
            console.log(chalk.red(`Project "${projectName}" is not a monorepo`));
            return;
        }

        const subDeployments = configManager.monorepo.getSubDeployments(projectName);
        if (subDeployments.length === 0) {
            console.log(chalk.yellow(`No sub-deployments configured for ${projectName}`));
            console.log(chalk.gray('Use "autodeploy add-sub ' + projectName + '" to add sub-deployments'));
            return;
        }

        console.log(chalk.blue(`\nSub-deployments for ${projectName}:\n`));
        subDeployments.forEach((sub, index) => {
            console.log(`${index + 1}. ${chalk.bold(sub.name)}`);
            console.log(`   Local: ${sub.localPath}`);
            console.log(`   Remote: ${sub.remotePath}`);
            console.log(`   Local Steps: ${sub.localSteps?.length || 0}`);
            console.log(`   Remote Steps: ${sub.deploymentSteps?.length || 0}`);
            if (sub.stats && sub.stats.lastDeployment) {
                console.log(`   Last Deployed: ${new Date(sub.stats.lastDeployment).toLocaleString()}`);
                console.log(`   Status: ${sub.stats.lastDeploymentStatus || 'unknown'}`);
            }
            console.log();
        });
    });

program
    .command('deploy [project-name]')
    .description('Deploy a project')
    .option('--sub <sub-name>', 'Deploy only a specific sub-deployment')
    .option('--all', 'Deploy all sub-deployments in a monorepo')
    .action(async (projectName, options) => {
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
                    choices: projects.map(p => ({ 
                        name: p.type === 'monorepo' ? `${p.name} (monorepo)` : p.name, 
                        value: p 
                    }))
                }
            ]);
            project = selectedProject;
        }

        // Handle monorepo deployments
        if (project.type === 'monorepo') {
            const subDeployments = configManager.monorepo.getSubDeployments(project.name);
            
            if (subDeployments.length === 0) {
                console.log(chalk.yellow('No sub-deployments configured for this monorepo'));
                console.log(chalk.gray('Use "autodeploy add-sub ' + project.name + '" to add sub-deployments'));
                return;
            }

            let deploymentsToRun = [];

            if (options.sub) {
                // Deploy specific sub-deployment
                const subDep = subDeployments.find(s => s.name === options.sub);
                if (!subDep) {
                    console.error(chalk.red(`Sub-deployment "${options.sub}" not found`));
                    return;
                }
                deploymentsToRun = [subDep];
            } else if (options.all) {
                // Deploy all sub-deployments
                deploymentsToRun = subDeployments;
            } else {
                // Ask user which sub-deployments to deploy
                const { selectedSubs } = await inquirer.prompt([
                    {
                        type: 'checkbox',
                        name: 'selectedSubs',
                        message: 'Select sub-deployments to deploy:',
                        choices: subDeployments.map(s => ({ name: s.name, value: s })),
                        validate: input => input.length > 0 || 'Select at least one sub-deployment'
                    }
                ]);
                deploymentsToRun = selectedSubs;
            }

            console.log(chalk.blue(`\n🚀 Deploying ${project.name} (${deploymentsToRun.length} sub-deployments)...\n`));

            // Commit changes in monorepo root first
            const git = new GitOperations(project.localPath);
            const hasGit = await git.isGitRepository();
            
            if (hasGit) {
                console.log(chalk.blue('📝 Committing monorepo changes...\n'));
                const commitSpinner = ora('Checking for changes...').start();
                
                try {
                    const hasChanges = await git.hasChanges();
                    if (hasChanges) {
                        commitSpinner.text = 'Committing and pushing changes...';
                        await git.commitAndPush('Deployment commit');
                        commitSpinner.succeed('Changes committed and pushed');
                    } else {
                        commitSpinner.succeed('No changes to commit');
                    }
                } catch (error) {
                    if (error.message.includes('nothing to commit')) {
                        commitSpinner.succeed('No changes to commit');
                    } else {
                        commitSpinner.fail('Failed to commit changes');
                        console.error(chalk.red(error.message));
                        
                        const { continueAnyway } = await inquirer.prompt([{
                            type: 'confirm',
                            name: 'continueAnyway',
                            message: 'Continue deployment anyway?',
                            default: false
                        }]);
                        
                        if (!continueAnyway) {
                            return;
                        }
                    }
                }
            }

            // Deploy each sub-deployment
            for (const subDep of deploymentsToRun) {
                console.log(chalk.blue(`\n📦 Deploying ${subDep.name}...\n`));
                
                // Create a project object for the sub-deployment
                const subProject = {
                    ...subDep,
                    name: `${project.name}/${subDep.name}`,
                    localPath: subDep.localPath
                };

                // Deploy using existing logic
                await deployProject(subProject, configManager);
            }

            console.log(chalk.green(`\n✓ Monorepo deployment completed!`));
            return;
        }

        // Regular project deployment
        console.log(chalk.blue(`\n🚀 Deploying ${project.name}...\n`));
        await deployProject(project, configManager);
    });

// Extract deployment logic into a separate function
async function deployProject(project, configManager) {

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
            console.log(chalk.yellow('⚠ Local directory is not a git repository, skipping git operations'));
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
            
            console.log(chalk.blue('\n📊 Deployment Summary:\n'));
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            console.log(`Total steps: ${results.length}`);
            console.log(`Successful: ${chalk.green(successful)}`);
            console.log(`Failed: ${chalk.red(failed)}`);
            
            if (failed === 0) {
                console.log(chalk.green('\n✓ Deployment completed successfully!'));
            } else {
                deploymentSuccess = false;
                console.log(chalk.red('\n✗ Deployment completed with errors'));
            }
        } else {
            console.log(chalk.yellow('\n⚠ No deployment steps configured'));
        }
        
        // Record deployment
        const duration = Date.now() - startTime;
        
        // Handle monorepo sub-deployment recording
        if (project.parentProject) {
            configManager.monorepo.recordSubDeployment(
                project.parentProject,
                project.name.split('/')[1], // Extract sub-deployment name
                deploymentSuccess,
                {
                    duration,
                    steps: deploymentSteps
                }
            );
        } else {
            configManager.recordDeployment(project.name, deploymentSuccess, {
                duration,
                steps: deploymentSteps
            });
        }
}

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
            console.log(chalk.green(`✓ Project "${projectName}" removed`));
        }
    });

program
    .command('history <project-name>')
    .description('View deployment history for a project')
    .option('-l, --limit <number>', 'Number of deployments to show', '10')
    .option('-v, --verbose', 'Show detailed output for all steps')
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
            console.log(`   Status: ${deployment.success ? chalk.green('✓ Success') : deployment.stopped ? chalk.yellow('⚠ Stopped') : chalk.red('✗ Failed')}`);
            console.log(`   Duration: ${duration}`);
            
            if (deployment.steps && deployment.steps.length > 0) {
                console.log(`   Steps:`);
                deployment.steps.forEach(step => {
                    const stepIcon = step.success ? chalk.green('✓') : chalk.red('✗');
                    const stepDuration = step.duration ? ` (${(step.duration / 1000).toFixed(1)}s)` : '';
                    console.log(`     ${stepIcon} ${step.name}${chalk.gray(stepDuration)}`);
                    
                    // Show step output/error details
                    if (step.output && (!step.success || options.verbose)) {
                        const outputLines = step.output.split('\n').filter(line => line.trim());
                        outputLines.forEach(line => {
                            const prefix = step.success ? chalk.gray('→') : chalk.red('→');
                            console.log(`       ${prefix} ${line.trim()}`);
                        });
                    }
                });
            }
            
            if (deployment.error) {
                console.log(`   ${chalk.red('Error:')} ${chalk.red(deployment.error)}`);
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