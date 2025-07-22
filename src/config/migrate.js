#!/usr/bin/env node
import { ConfigManager } from './manager.js';
import { ConfigManagerV2 } from './manager-v2.js';
import chalk from 'chalk';

console.log(chalk.blue('\n🔄 Migrating AutoDeploy configuration to new format...\n'));

try {
    // Load old configuration
    const oldManager = new ConfigManager();
    const projects = oldManager.getAllProjects();
    
    if (projects.length === 0) {
        console.log(chalk.yellow('No projects found to migrate.'));
        process.exit(0);
    }
    
    console.log(chalk.gray(`Found ${projects.length} project(s) to migrate:`));
    projects.forEach(p => console.log(chalk.gray(`  - ${p.name}`)));
    
    // Initialize new manager (will auto-migrate)
    const newManager = new ConfigManagerV2();
    
    console.log(chalk.green('\n✓ Migration completed successfully!'));
    console.log(chalk.gray('\nNew structure created at ~/.autodeploy/projects/'));
    console.log(chalk.gray('Each project now has its own directory with:'));
    console.log(chalk.gray('  - config.json (credentials & paths)'));
    console.log(chalk.gray('  - local-steps.json'));
    console.log(chalk.gray('  - remote-steps.json'));
    console.log(chalk.gray('  - history.json'));
    console.log(chalk.gray('  - stats.json'));
    console.log(chalk.gray('\nOld configuration backed up to ~/.autodeploy/projects.json.backup'));
    
} catch (error) {
    console.error(chalk.red('Migration failed:'), error.message);
    process.exit(1);
}