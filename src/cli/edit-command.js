// Edit command implementation for CLI
export async function handleEditCommand(projectName, options, { chalk, inquirer, configManager, program }) {
    const project = configManager.getProject(projectName);
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
    
    if (action === 'json') {
        // Redirect to JSON edit mode
        await handleEditCommand(projectName, { json: true }, { chalk, inquirer, configManager, program });
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