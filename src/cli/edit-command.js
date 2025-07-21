// Edit command implementation for CLI
import { join } from 'path';

export async function handleEditCommand(projectName, options, { chalk, inquirer, configManager, program }) {
    const project = configManager.getProject(projectName);
    if (!project) {
        console.error(chalk.red(`Project "${projectName}" not found`));
        return;
    }

    // JSON edit mode - choose which file to edit
    if (options.json) {
        const { fileToEdit } = await inquirer.prompt([
            {
                type: 'list',
                name: 'fileToEdit',
                message: 'Which configuration file would you like to edit?',
                choices: [
                    { name: 'Project Settings (config.json)', value: 'config' },
                    { name: 'Local Steps (local-steps.json)', value: 'local-steps' },
                    { name: 'Remote Steps (remote-steps.json)', value: 'remote-steps' },
                    { name: 'View History (history.json) - Read Only', value: 'history' },
                    { name: 'View Stats (stats.json) - Read Only', value: 'stats' },
                    { name: 'Cancel', value: 'cancel' }
                ]
            }
        ]);

        if (fileToEdit === 'cancel') {
            return;
        }

        const projectDir = configManager.getProjectDir(projectName);
        let fileContent, fileName;

        switch (fileToEdit) {
            case 'config':
                fileName = 'config.json';
                fileContent = configManager.loadFile(join(projectDir, fileName)) || {};
                break;
            case 'local-steps':
                fileName = 'local-steps.json';
                fileContent = configManager.loadFile(join(projectDir, fileName)) || [];
                break;
            case 'remote-steps':
                fileName = 'remote-steps.json';
                fileContent = configManager.loadFile(join(projectDir, fileName)) || [];
                break;
            case 'history':
                fileName = 'history.json';
                fileContent = configManager.loadFile(join(projectDir, fileName)) || [];
                console.log(chalk.yellow('\n⚠️  History is read-only. Viewing last 10 entries:'));
                console.log(JSON.stringify(fileContent.slice(0, 10), null, 2));
                return;
            case 'stats':
                fileName = 'stats.json';
                fileContent = configManager.loadFile(join(projectDir, fileName)) || {};
                console.log(chalk.yellow('\n⚠️  Stats are read-only:'));
                console.log(JSON.stringify(fileContent, null, 2));
                return;
        }

        console.log(chalk.blue(`\nEditing ${fileName} for ${projectName}:`));
        console.log(chalk.gray(`Location: ~/.autodeploy/projects/${projectName}/${fileName}`));
        
        const { editJson } = await inquirer.prompt([
            {
                type: 'editor',
                name: 'editJson',
                message: `Edit the ${fileName} content (save and close when done):`,
                default: JSON.stringify(fileContent, null, 2)
            }
        ]);
        
        try {
            const updatedContent = JSON.parse(editJson);
            
            // Save the specific file
            configManager.saveFile(join(projectDir, fileName), updatedContent);
            
            console.log(chalk.green(`✓ ${fileName} updated successfully`));
            
            // If config.json was edited, update the name if changed
            if (fileToEdit === 'config' && updatedContent.name !== projectName) {
                console.log(chalk.yellow('Note: Project name changes require moving the directory. This must be done manually.'));
            }
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
                { name: 'Edit SSH credentials', value: 'ssh' },
                { name: 'Edit as JSON', value: 'json' },
                { name: 'Cancel', value: 'cancel' }
            ]
        }
    ]);

    if (action === 'cancel') {
        return;
    }
    
    if (action === 'json') {
        // Redirect to JSON edit mode
        await handleEditCommand(projectName, { json: true }, { chalk, inquirer, configManager, program });
        return;
    }

    if (action === 'ssh') {
        // Edit SSH credentials
        console.log(chalk.blue('\nCurrent SSH configuration:'));
        console.log(`  Host: ${project.ssh.host}`);
        console.log(`  Username: ${project.ssh.username}`);
        console.log(`  Port: ${project.ssh.port || 22}`);
        console.log(`  Auth Method: ${project.ssh.privateKeyPath ? 'Private Key' : 'Password'}`);
        if (project.ssh.privateKeyPath) {
            console.log(`  Private Key: ${project.ssh.privateKeyPath}`);
        }

        const { updateSSH } = await inquirer.prompt([{
            type: 'confirm',
            name: 'updateSSH',
            message: 'Update SSH credentials?',
            default: true
        }]);

        if (!updateSSH) {
            return;
        }

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
                type: 'input',
                name: 'port',
                message: 'SSH port:',
                default: (project.ssh.port || 22).toString()
            },
            {
                type: 'list',
                name: 'authMethod',
                message: 'SSH authentication method:',
                default: project.ssh.privateKeyPath ? 'key' : 'password',
                choices: [
                    { name: 'Password', value: 'password' },
                    { name: 'Private Key (PEM file)', value: 'key' }
                ]
            }
        ]);

        const updatedSSH = {
            host: sshAnswers.host,
            username: sshAnswers.username,
            port: parseInt(sshAnswers.port)
        };

        // Auth-specific prompts
        if (sshAnswers.authMethod === 'password') {
            const { password } = await inquirer.prompt([{
                type: 'password',
                name: 'password',
                message: 'SSH password:',
                mask: '*',
                validate: input => input.length > 0 || 'Password is required'
            }]);
            updatedSSH.password = password;
        } else {
            const keyAnswers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'privateKeyPath',
                    message: 'Path to private key file:',
                    default: project.ssh.privateKeyPath || '',
                    validate: input => input.length > 0 || 'Private key path is required'
                },
                {
                    type: 'password',
                    name: 'passphrase',
                    message: 'Private key passphrase (press enter if none):',
                    mask: '*'
                }
            ]);
            updatedSSH.privateKeyPath = keyAnswers.privateKeyPath;
            if (keyAnswers.passphrase) {
                updatedSSH.passphrase = keyAnswers.passphrase;
            }
        }

        // Preserve existing SSH options if any
        if (project.ssh.sshOptions) {
            updatedSSH.sshOptions = project.ssh.sshOptions;
        }

        configManager.updateProject(projectName, { ssh: updatedSSH });
        console.log(chalk.green('✓ SSH credentials updated successfully'));
        return;
    }

    // Edit local or remote steps
    const isLocal = action === 'local';
    const stepType = isLocal ? 'local' : 'remote';
    const currentSteps = isLocal ? (project.localSteps || []) : project.deploymentSteps;
    
    const { stepAction } = await inquirer.prompt([
        {
            type: 'list',
            name: 'stepAction',
            message: `What would you like to do with ${stepType} steps?`,
            choices: [
                { name: 'Add new steps', value: 'add' },
                { name: 'Modify existing steps', value: 'modify' },
                { name: 'Clear all steps', value: 'clear' },
                { name: 'Cancel', value: 'cancel' }
            ]
        }
    ]);
    
    if (stepAction === 'cancel') {
        return;
    }
    
    if (stepAction === 'clear') {
        if (isLocal) {
            configManager.updateProject(projectName, { localSteps: [] });
        } else {
            configManager.updateProject(projectName, { deploymentSteps: [] });
        }
        console.log(chalk.green(`✓ ${stepType} steps cleared`));
        return;
    }

    if (stepAction === 'modify') {
        // Modify existing steps
        if (currentSteps.length === 0) {
            console.log(chalk.yellow(`No ${stepType} steps to modify`));
            return;
        }

        const { stepToModify } = await inquirer.prompt([
            {
                type: 'list',
                name: 'stepToModify',
                message: `Select a ${stepType} step to modify:`,
                choices: currentSteps.map((step, index) => ({
                    name: `${index + 1}. ${step.name}: ${step.command}`,
                    value: index
                }))
            }
        ]);

        const stepIndex = stepToModify;
        const currentStep = currentSteps[stepIndex];

        const modifiedStep = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: `${stepType} step name:`,
                default: currentStep.name,
                validate: input => input.length > 0 || 'Step name is required'
            },
            {
                type: 'input',
                name: 'command',
                message: `Command to run ${isLocal ? 'locally' : 'on server'}:`,
                default: currentStep.command,
                validate: input => input.length > 0 || 'Command is required'
            },
            {
                type: 'input',
                name: 'workingDir',
                message: 'Working directory (relative to project):',
                default: currentStep.workingDir || '.'
            },
            {
                type: 'confirm',
                name: 'continueOnError',
                message: 'Continue on error?',
                default: currentStep.continueOnError || false
            }
        ]);

        const steps = [...currentSteps];
        steps[stepIndex] = modifiedStep;

        if (isLocal) {
            configManager.updateProject(projectName, { localSteps: steps });
        } else {
            configManager.updateProject(projectName, { deploymentSteps: steps });
        }
        console.log(chalk.green(`✓ ${stepType} step modified successfully`));
        return;
    }

    // Add new steps
    const steps = [...currentSteps];
    let addMore = true;
    
    console.log(chalk.blue(`\nAdding ${stepType} steps:`));
    
    while (addMore) {
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
                message: `Command to run ${isLocal ? 'locally' : 'on server'}:`,
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
                message: `Add another ${stepType} step?`,
                default: false
            }
        ]);
        addMore = more;
    }

    if (isLocal) {
        configManager.updateProject(projectName, { localSteps: steps });
    } else {
        configManager.updateProject(projectName, { deploymentSteps: steps });
    }
    console.log(chalk.green(`✓ ${stepType} steps updated for "${projectName}"`));
}