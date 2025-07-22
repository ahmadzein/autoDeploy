#!/usr/bin/env node
import { ConfigManagerV2 } from './manager-v2.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

console.log(chalk.blue('\n🔧 Fixing JSON formatting for all projects...\n'));

const manager = new ConfigManagerV2();
const projects = manager.getAllProjects();

projects.forEach(project => {
    console.log(chalk.gray(`Processing: ${project.name}`));
    
    const projectDir = manager.getProjectDir(project.name);
    
    // List of JSON files to format
    const files = [
        'config.json',
        'local-steps.json', 
        'remote-steps.json',
        'history.json',
        'stats.json'
    ];
    
    files.forEach(file => {
        const filePath = join(projectDir, file);
        try {
            // Load the encrypted data
            const data = manager.loadFile(filePath);
            if (data) {
                // Save it back with proper formatting
                manager.saveFile(filePath, data);
                console.log(chalk.green(`  ✓ ${file}`));
            }
        } catch (error) {
            console.log(chalk.red(`  ✗ ${file}: ${error.message}`));
        }
    });
    
    // Fix specific issues
    
    // Fix trailing space in Amber's local path
    if (project.name === 'Amber' && project.localPath.endsWith(' ')) {
        console.log(chalk.yellow('  Fixing trailing space in local path'));
        const config = manager.loadFile(join(projectDir, 'config.json'));
        config.localPath = config.localPath.trim();
        manager.saveFile(join(projectDir, 'config.json'), config);
    }
    
    // Ensure all arrays are properly initialized
    if (!Array.isArray(project.localSteps)) {
        console.log(chalk.yellow('  Initializing local steps array'));
        manager.saveFile(join(projectDir, 'local-steps.json'), []);
    }
    
    if (!Array.isArray(project.deploymentSteps)) {
        console.log(chalk.yellow('  Initializing remote steps array'));
        manager.saveFile(join(projectDir, 'remote-steps.json'), []);
    }
    
    // Limit history to 50 entries
    if (project.deploymentHistory && project.deploymentHistory.length > 50) {
        console.log(chalk.yellow(`  Trimming history from ${project.deploymentHistory.length} to 50 entries`));
        const history = project.deploymentHistory.slice(0, 50);
        manager.saveFile(join(projectDir, 'history.json'), history);
    }
    
    console.log('');
});

console.log(chalk.green('✓ JSON formatting fixed for all projects!\n'));