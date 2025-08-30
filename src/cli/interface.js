#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { ConfigManager } from '../config/manager.js';
import { GitOperations } from '../git/operations.js';
import { SSHConnection } from '../ssh/connection.js';
import { PipelineExecutor } from '../pipeline/executor.js';
import { StatefulSSHExecutor } from '../pipeline/executor-stateful-ssh.js';
import readline from 'readline';
import { startGUIService, startGUIProduction } from './gui-service.js';
import { handleEditCommand } from './edit-command.js';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
const version = packageJson.version;
import { createSlug, ensureUniqueSlug } from '../utils/slug.js';

const program = new Command();
const configManager = new ConfigManager();

// Helper function to create a step with all features
async function createStep(stepType = 'deployment') {
    const step = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: `${stepType} step name:`,
            validate: input => input.length > 0 || 'Step name is required'
        },
        {
            type: 'input',
            name: 'command',
            message: `Command to run:`,
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
        },
        {
            type: 'confirm',
            name: 'interactive',
            message: 'Is this an interactive command (requires user input)?',
            default: false
        }
    ]);

    // Add environment variables
    const { addEnvVars } = await inquirer.prompt([{
        type: 'confirm',
        name: 'addEnvVars',
        message: 'Add environment variables?',
        default: false
    }]);

    step.envVars = [];
    if (addEnvVars) {
        console.log(chalk.blue('\nEnvironment Variables:'));
        let addMore = true;
        while (addMore) {
            const envVar = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Environment variable name:',
                    validate: input => input.length > 0 || 'Variable name is required'
                },
                {
                    type: 'input',
                    name: 'value',
                    message: 'Environment variable value:',
                    validate: input => input.length > 0 || 'Variable value is required'
                }
            ]);
            step.envVars.push(envVar);

            const { more } = await inquirer.prompt([{
                type: 'confirm',
                name: 'more',
                message: 'Add another environment variable?',
                default: false
            }]);
            addMore = more;
        }
    }

    // Add interactive inputs
    step.inputs = [];
    if (step.interactive) {
        console.log(chalk.blue('\nInteractive Inputs (for auto-filling prompts):'));
        let addMore = true;
        while (addMore) {
            const input = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'prompt',
                    message: 'Expected prompt text (e.g., "Enter your email address"):',
                    validate: input => input.length > 0 || 'Prompt text is required'
                },
                {
                    type: 'input',
                    name: 'defaultValue',
                    message: 'Default value to auto-fill:',
                    default: ''
                },
                {
                    type: 'confirm',
                    name: 'required',
                    message: 'Is this input required?',
                    default: true
                }
            ]);
            step.inputs.push(input);

            const { more } = await inquirer.prompt([{
                type: 'confirm',
                name: 'more',
                message: 'Add another input?',
                default: false
            }]);
            addMore = more;
        }
    }

    return step;
}

program
    .name('autodeploy')
    .description('Local deployment automation tool with SSH key authentication support')
    .version(version)
    .addHelpText('after', `
SSH Authentication:
  AutoDeploy supports both password and SSH key authentication:
  - Password: Traditional username/password authentication
  - SSH Key: Use PEM files or standard SSH keys (id_rsa, id_ed25519, etc.)
  
Examples:
  $ autodeploy add-project              # Interactive setup with auth method selection
  $ autodeploy edit my-project          # Edit project including SSH credentials
  $ autodeploy create-monorepo          # Create monorepo with SSH key support

SSH Key Examples:
  AWS EC2: /Users/you/Documents/ssh/my-server.pem
  Standard: /Users/you/.ssh/id_rsa
  With passphrase: Enter passphrase when prompted

Port Forwarding:
  Configure SSH tunnels during project setup for database connections
  Format: localPort:remoteHost:remotePort (e.g., 7777:database.internal:5432)
`);

program
    .command('add-project')
    .description('Add a new project configuration with SSH authentication')
    .addHelpText('after', `
This command will guide you through:
  1. Project name and local path setup
  2. SSH connection configuration:
     - Host, username, and port
     - Authentication method (password or private key)
     - Optional port forwarding for database tunnels
  3. Remote deployment path
  4. Optional deployment steps configuration

SSH Key Authentication:
  When selecting "Private Key (PEM file)", you'll need:
  - Full path to your private key file
  - Optional passphrase if the key is encrypted
  
  Supported key types:
  - PEM files (commonly used with AWS EC2)
  - Standard SSH keys (id_rsa, id_ed25519, etc.)
  - Any OpenSSH-compatible private key

Example key paths:
  - AWS: /Users/you/Documents/ssh/my-ec2-key.pem
  - Standard: /Users/you/.ssh/id_rsa
  - Custom: /path/to/your/private-key
`)
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
                type: 'list',
                name: 'authMethod',
                message: 'SSH authentication method:',
                choices: [
                    { name: 'Password', value: 'password' },
                    { name: 'Private Key (PEM file)', value: 'key' }
                ]
            }
        ]);

        // Auth-specific prompts
        let authAnswers = {};
        if (answers.authMethod === 'password') {
            authAnswers = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'password',
                    message: 'SSH password:',
                    mask: '*',
                    validate: input => input.length > 0 || 'Password is required'
                }
            ]);
        } else {
            authAnswers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'privateKeyPath',
                    message: 'Path to private key file (e.g., /Users/you/.ssh/id_rsa or .pem file):',
                    validate: input => {
                        if (input.length === 0) return 'Private key path is required';
                        if (input.includes('~')) return 'Please use absolute path (expand ~ to full path)';
                        return true;
                    }
                },
                {
                    type: 'password',
                    name: 'passphrase',
                    message: 'Private key passphrase (press enter if none):',
                    mask: '*'
                }
            ]);
            console.log(chalk.gray('\n💡 Tip: Common key locations:'));
            console.log(chalk.gray('   AWS EC2: /Users/[username]/Downloads/*.pem'));
            console.log(chalk.gray('   Standard SSH: /Users/[username]/.ssh/id_rsa'));
            console.log(chalk.gray('   Make sure the key file has proper permissions (chmod 600)\n'));
        }

        const remainingAnswers = await inquirer.prompt([
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
            },
            {
                type: 'confirm',
                name: 'hasForwarding',
                message: 'Do you need port forwarding or additional SSH options?',
                default: false
            }
        ]);

        // Merge all answers
        Object.assign(answers, authAnswers, remainingAnswers);

        // Handle port forwarding and additional options
        let sshOptions = {};
        if (answers.hasForwarding) {
            const forwardingAnswers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'portForwarding',
                    message: 'Port forwarding rules (e.g., "7777:database.host.com:5432", leave empty for none):'
                },
                {
                    type: 'input',
                    name: 'additionalOptions',
                    message: 'Additional SSH options (JSON format, e.g., {"keepaliveInterval": 30000}):'
                }
            ]);

            if (forwardingAnswers.portForwarding) {
                // Parse port forwarding (format: localPort:remoteHost:remotePort)
                const parts = forwardingAnswers.portForwarding.split(':');
                if (parts.length === 3) {
                    sshOptions.localPortForwarding = [{
                        localPort: parseInt(parts[0]),
                        remoteHost: parts[1],
                        remotePort: parseInt(parts[2])
                    }];
                }
            }

            if (forwardingAnswers.additionalOptions) {
                try {
                    const additionalOpts = JSON.parse(forwardingAnswers.additionalOptions);
                    Object.assign(sshOptions, additionalOpts);
                } catch (e) {
                    console.log(chalk.yellow('Warning: Invalid JSON for additional options, ignoring.'));
                }
            }
        }

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
                const step = await createStep('local');
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
                const step = await createStep('remote');
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

        // Generate slug from project name
        const existingProjects = configManager.getAllProjects();
        const existingSlugs = existingProjects.map(p => p.slug || p.name);
        const baseSlug = createSlug(answers.name);
        const slug = ensureUniqueSlug(baseSlug, existingSlugs);
        
        const project = {
            name: slug,
            displayName: answers.name,
            slug: slug,
            localPath: answers.localPath,
            ssh: {
                host: answers.host,
                username: answers.username,
                port: parseInt(answers.port)
            },
            remotePath: answers.remotePath,
            localSteps: localSteps,
            deploymentSteps: steps
        };

        // Add authentication details
        if (answers.authMethod === 'password') {
            project.ssh.password = answers.password;
        } else {
            project.ssh.privateKeyPath = answers.privateKeyPath;
            if (answers.passphrase) {
                project.ssh.passphrase = answers.passphrase;
            }
        }

        // Add SSH options if provided
        if (Object.keys(sshOptions).length > 0) {
            project.ssh.sshOptions = sshOptions;
        }

        const spinner = ora('Testing SSH connection...').start();
        const sshConnection = new SSHConnection(project.ssh);
        const testResult = await sshConnection.testConnection();

        if (testResult.success) {
            spinner.succeed('SSH connection successful');
            configManager.addProject(project);
            console.log(chalk.green(`\n✓ Project "${project.displayName}" added successfully!`));
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
                console.log(chalk.yellow(`\n⚠ Project "${project.displayName}" saved with connection issues`));
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
            const displayName = project.displayName || project.name;
            console.log(`${index + 1}. ${chalk.bold(displayName)}${typeLabel}`);
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
    .addHelpText('after', `
Monorepo projects allow you to manage multiple sub-deployments from a single repository.

SSH Configuration:
  The SSH credentials you set here will be the default for all sub-deployments.
  Sub-deployments can override these settings if needed.
  
  Supports both:
  - Password authentication
  - Private key authentication (PEM files, id_rsa, etc.)

After creating a monorepo:
  $ autodeploy add-sub <monorepo-name>     # Add sub-deployments
  $ autodeploy list-sub <monorepo-name>    # List all sub-deployments
  $ autodeploy deploy <monorepo-name>      # Deploy sub-projects

Example workflow:
  1. Create monorepo: autodeploy create-monorepo
  2. Add frontend: autodeploy add-sub my-app (path: apps/frontend)
  3. Add backend: autodeploy add-sub my-app (path: apps/backend)
  4. Deploy all: autodeploy deploy my-app --all
`)
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
                type: 'list',
                name: 'authMethod',
                message: 'SSH authentication method:',
                choices: [
                    { name: 'Password', value: 'password' },
                    { name: 'Private Key (PEM file)', value: 'key' }
                ]
            }
        ]);

        // Auth-specific prompts
        let authAnswers = {};
        if (answers.authMethod === 'password') {
            authAnswers = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'password',
                    message: 'SSH password:',
                    mask: '*',
                    validate: input => input.length > 0 || 'Password is required'
                }
            ]);
        } else {
            authAnswers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'privateKeyPath',
                    message: 'Path to private key file (e.g., /Users/you/.ssh/id_rsa or .pem file):',
                    validate: input => {
                        if (input.length === 0) return 'Private key path is required';
                        if (input.includes('~')) return 'Please use absolute path (expand ~ to full path)';
                        return true;
                    }
                },
                {
                    type: 'password',
                    name: 'passphrase',
                    message: 'Private key passphrase (press enter if none):',
                    mask: '*'
                }
            ]);
            console.log(chalk.gray('\n💡 Tip: Common key locations:'));
            console.log(chalk.gray('   AWS EC2: /Users/[username]/Downloads/*.pem'));
            console.log(chalk.gray('   Standard SSH: /Users/[username]/.ssh/id_rsa'));
            console.log(chalk.gray('   Make sure the key file has proper permissions (chmod 600)\n'));
        }

        const remainingAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'port',
                message: 'SSH port (default: 22):',
                default: '22'
            }
        ]);

        // Merge all answers
        Object.assign(answers, authAnswers, remainingAnswers);

        // Generate slug from project name
        const existingProjects = configManager.getAllProjects();
        const existingSlugs = existingProjects.map(p => p.slug || p.name);
        const baseSlug = createSlug(answers.name);
        const slug = ensureUniqueSlug(baseSlug, existingSlugs);
        
        const project = {
            name: slug,
            displayName: answers.name,
            slug: slug,
            type: 'monorepo',
            localPath: answers.localPath,
            ssh: {
                host: answers.host,
                username: answers.username,
                port: parseInt(answers.port)
            },
            remotePath: '/var/www', // Base path for monorepo
            deploymentSteps: [],
            subDeployments: []
        };

        // Add authentication details
        if (answers.authMethod === 'password') {
            project.ssh.password = answers.password;
        } else {
            project.ssh.privateKeyPath = answers.privateKeyPath;
            if (answers.passphrase) {
                project.ssh.passphrase = answers.passphrase;
            }
        }

        // Test SSH connection
        console.log(chalk.blue('\nTesting SSH connection...'));
        const testSpinner = ora('Connecting...').start();

        const sshConnection = new SSHConnection(project.ssh);
        try {
            await sshConnection.connect();
            await sshConnection.disconnect();
            testSpinner.succeed('SSH connection successful');
            
            configManager.monorepo.createMonorepoProject(project);
            console.log(chalk.green(`\n✓ Monorepo project "${project.displayName}" created successfully!`));
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
                console.log(chalk.yellow(`\n⚠ Monorepo "${project.displayName}" saved with connection issues`));
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
                console.log(chalk.blue('\nLocal steps run on your machine before deployment:'));
                let addMore = true;
                while (addMore) {
                    const step = await createStep('local');
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
                console.log(chalk.blue('\nRemote steps run on the server after deployment:'));
                let addMore = true;
                while (addMore) {
                    const step = await createStep('remote');
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
            const hasGit = await git.isGitRepo();
            
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

            // Track monorepo deployment
            const monorepoStartTime = Date.now();
            const monorepoDeploymentSteps = [];
            let monorepoSuccess = true;

            // Deploy each sub-deployment
            for (const subDep of deploymentsToRun) {
                console.log(chalk.blue(`\n📦 Deploying ${subDep.name}...\n`));
                
                // Check if any steps need configuration
                const interactiveStepsWithoutInputs = subDep.deploymentSteps?.filter(s => s.interactive && (!s.inputs || s.inputs.length === 0)) || [];
                if (interactiveStepsWithoutInputs.length > 0) {
                    console.log(chalk.yellow(`⚠️  Warning: The following steps are marked as interactive but have no inputs configured:`));
                    interactiveStepsWithoutInputs.forEach(s => {
                        console.log(chalk.yellow(`   - ${s.name}: ${s.command}`));
                    });
                    console.log(chalk.gray(`   Configure inputs in the GUI or mark these steps as non-interactive`));
                }
                
                // Create a project object for the sub-deployment
                const subProject = {
                    ...subDep,
                    name: `${project.name}/${subDep.name}`,
                    localPath: subDep.localPath,
                    ssh: subDep.ssh || project.ssh, // Inherit SSH from parent if not specified
                    parentProject: project.name
                };

                // Deploy using existing logic
                try {
                    await deployProject(subProject, configManager);
                    monorepoDeploymentSteps.push({
                        name: `Deploy ${subDep.name}`,
                        success: true,
                        output: `Successfully deployed ${subDep.name}`
                    });
                } catch (error) {
                    monorepoSuccess = false;
                    monorepoDeploymentSteps.push({
                        name: `Deploy ${subDep.name}`,
                        success: false,
                        output: error.message
                    });
                }
            }

            // Record main monorepo deployment
            const monorepoDeploymentDuration = Date.now() - monorepoStartTime;
            configManager.recordDeployment(project.name, monorepoSuccess, {
                duration: monorepoDeploymentDuration,
                steps: monorepoDeploymentSteps,
                subDeployments: deploymentsToRun.map(sub => ({ name: sub.name }))
            });

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
            // Check if we need stateful SSH (persistent session or nested SSH)
            const hasNestedSSH = project.deploymentSteps.some(step => 
                step.command.trim().match(/^ssh\s+[^\s]+\s*$/)
            );
            
            let results;
            
            if (project.persistentSession || hasNestedSSH) {
                console.log(chalk.yellow('\n🔄 Using stateful SSH session...\n'));
                
                const statefulExecutor = new StatefulSSHExecutor(project.ssh, project.remotePath);
                
                // Set up readline interface for interactive prompts
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                // Handle prompts
                statefulExecutor.on('prompt', async (promptData) => {
                    console.log(chalk.yellow(`\n[PROMPT] ${promptData.prompt}`));
                    
                    const answer = await new Promise((resolve) => {
                        rl.question(chalk.cyan('> '), (input) => {
                            resolve(input);
                        });
                    });
                    
                    statefulExecutor.handleUserInput(answer);
                });
                
                // Handle real-time output
                statefulExecutor.on('output', (data) => {
                    process.stdout.write(data.data);
                });
                
                try {
                    results = await statefulExecutor.executeSteps(project.deploymentSteps);
                } finally {
                    rl.close();
                    statefulExecutor.removeAllListeners();
                }
            } else {
                // Use regular executor
                const executor = new PipelineExecutor(project.ssh, project.remotePath);
                results = await executor.execute(project.deploymentSteps);
            }
            
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
            
            // Try to get detailed logs from logs.json
            const logs = configManager.getDeploymentLogs(projectName, deployment.id);
            const steps = logs?.steps || deployment.steps || [];
            
            if (steps.length > 0) {
                console.log(`   Steps:`);
                steps.forEach(step => {
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
    .addHelpText('after', `
Edit options:
  - Local deployment steps
  - Remote deployment steps
  - SSH credentials (including auth method switch)
  - JSON mode for direct configuration editing

SSH Credentials Edit:
  You can switch between password and private key authentication
  When editing SSH credentials, you can:
  - Change host, username, or port
  - Switch authentication methods
  - Update private key path or password
  - Add/remove passphrase for encrypted keys

Examples:
  $ autodeploy edit my-project              # Interactive edit mode
  $ autodeploy edit my-project --json       # Direct JSON editing
`)
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

// Duplicate project command
program
    .command('duplicate-project <project-name>')
    .description('Duplicate an existing project with a new name')
    .action(async (projectName) => {
        const project = configManager.getProject(projectName);
        if (!project) {
            console.log(chalk.red(`Project "${projectName}" not found`));
            return;
        }

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'newName',
                message: 'New project name:',
                validate: input => {
                    if (input.length === 0) return 'Project name is required';
                    if (configManager.getProject(input)) return 'Project with this name already exists';
                    return true;
                }
            },
            {
                type: 'confirm',
                name: 'confirm',
                message: `Duplicate "${projectName}" as "${answers?.newName || '<new-name>'}"?`,
                default: true
            }
        ]);

        if (!answers.confirm) {
            console.log(chalk.yellow('Duplication cancelled'));
            return;
        }

        const duplicatedProject = {
            ...project,
            name: answers.newName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Remove deployment history and stats for the copy
        delete duplicatedProject.deploymentHistory;
        delete duplicatedProject.lastDeployment;
        delete duplicatedProject.deploymentCount;
        delete duplicatedProject.lastDeploymentStatus;

        try {
            if (project.type === 'monorepo') {
                configManager.monorepo.createMonorepoProject(duplicatedProject);
            } else {
                configManager.addProject(duplicatedProject);
            }
            console.log(chalk.green(`✓ Project "${projectName}" duplicated as "${answers.newName}"`));
        } catch (error) {
            console.error(chalk.red('Error:', error.message));
        }
    });

// Duplicate sub-deployment command
program
    .command('duplicate-sub <project-name> <sub-name>')
    .description('Duplicate a sub-deployment within a monorepo')
    .action(async (projectName, subName) => {
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
        const subDeployment = subDeployments.find(sub => sub.name === subName);
        
        if (!subDeployment) {
            console.log(chalk.red(`Sub-deployment "${subName}" not found in "${projectName}"`));
            return;
        }

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'newName',
                message: 'New sub-deployment name:',
                validate: input => {
                    if (input.length === 0) return 'Sub-deployment name is required';
                    if (subDeployments.some(sub => sub.name.toLowerCase() === input.toLowerCase())) {
                        return 'Sub-deployment with this name already exists';
                    }
                    return true;
                }
            },
            {
                type: 'confirm',
                name: 'confirm',
                message: `Duplicate "${subName}" as "${answers?.newName || '<new-name>'}"?`,
                default: true
            }
        ]);

        if (!answers.confirm) {
            console.log(chalk.yellow('Duplication cancelled'));
            return;
        }

        const duplicatedSub = {
            ...subDeployment,
            name: answers.newName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Remove deployment history and stats for the copy
        delete duplicatedSub.deploymentHistory;
        delete duplicatedSub.stats;

        try {
            configManager.monorepo.addSubDeployment(projectName, duplicatedSub);
            console.log(chalk.green(`✓ Sub-deployment "${subName}" duplicated as "${answers.newName}" in "${projectName}"`));
        } catch (error) {
            console.error(chalk.red('Error:', error.message));
        }
    });

// Step reordering command
program
    .command('reorder-steps <project-name>')
    .description('Reorder deployment steps for a project')
    .option('-s, --sub <sub-name>', 'Reorder steps for a specific sub-deployment')
    .action(async (projectName, options) => {
        const project = configManager.getProject(projectName);
        if (!project) {
            console.log(chalk.red(`Project "${projectName}" not found`));
            return;
        }

        let steps, isMonorepo = false, subDeployment = null;
        
        if (options.sub) {
            if (!configManager.monorepo.isMonorepo(projectName)) {
                console.log(chalk.red(`Project "${projectName}" is not a monorepo`));
                return;
            }
            
            const subDeployments = configManager.monorepo.getSubDeployments(projectName);
            subDeployment = subDeployments.find(sub => sub.name === options.sub);
            
            if (!subDeployment) {
                console.log(chalk.red(`Sub-deployment "${options.sub}" not found`));
                return;
            }
            
            isMonorepo = true;
        }

        const { stepType } = await inquirer.prompt([{
            type: 'list',
            name: 'stepType',
            message: 'Which steps do you want to reorder?',
            choices: [
                { name: 'Local Steps', value: 'local' },
                { name: 'Remote Steps', value: 'remote' }
            ]
        }]);

        const stepsKey = stepType === 'local' ? 'localSteps' : 'deploymentSteps';
        const targetObject = isMonorepo ? subDeployment : project;
        steps = targetObject[stepsKey] || [];

        if (steps.length === 0) {
            console.log(chalk.yellow(`No ${stepType} steps found`));
            return;
        }

        let modified = false;
        while (true) {
            console.log(chalk.blue(`\nCurrent ${stepType} steps:`));
            steps.forEach((step, index) => {
                console.log(`${index + 1}. ${step.name} - ${chalk.gray(step.command)}`);
            });

            const { action } = await inquirer.prompt([{
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: 'Move step up', value: 'up' },
                    { name: 'Move step down', value: 'down' },
                    { name: 'Save changes', value: 'save' },
                    { name: 'Cancel without saving', value: 'cancel' }
                ]
            }]);

            if (action === 'save') {
                if (modified) {
                    try {
                        if (isMonorepo) {
                            configManager.monorepo.updateSubDeployment(projectName, options.sub, subDeployment);
                        } else {
                            configManager.updateProject(project);
                        }
                        console.log(chalk.green('✓ Steps reordered successfully'));
                    } catch (error) {
                        console.error(chalk.red('Error saving changes:', error.message));
                    }
                } else {
                    console.log(chalk.yellow('No changes made'));
                }
                break;
            } else if (action === 'cancel') {
                console.log(chalk.yellow('Changes discarded'));
                break;
            }

            const { stepIndex } = await inquirer.prompt([{
                type: 'list',
                name: 'stepIndex',
                message: `Which step do you want to move ${action}?`,
                choices: steps.map((step, index) => ({
                    name: `${index + 1}. ${step.name}`,
                    value: index
                }))
            }]);

            const newIndex = action === 'up' ? stepIndex - 1 : stepIndex + 1;
            
            if (newIndex >= 0 && newIndex < steps.length) {
                [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]];
                modified = true;
                console.log(chalk.green(`✓ Moved "${steps[newIndex].name}" ${action}`));
            } else {
                console.log(chalk.red(`Cannot move step ${action} - already at ${action === 'up' ? 'top' : 'bottom'}`));
            }
        }
    });

program.parse(process.argv);