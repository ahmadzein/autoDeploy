#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { createAPIServer } from '../api/server.js';
import { checkPort, findAvailablePort } from '../utils/port-check.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startGUIService(options = {}) {
    const port = parseInt(options.port || 8080);
    const host = options.host || 'localhost';
    let apiPort = parseInt(options.apiPort || 3000);
    const open = options.open !== false;

    console.log(chalk.blue(`Starting AutoDeploy GUI service...`));
    
    // Check if API port is available, find alternative if not
    const apiPortAvailable = await checkPort(apiPort, host);
    if (!apiPortAvailable) {
        console.log(chalk.yellow(`⚠ Port ${apiPort} is in use`));
        try {
            apiPort = await findAvailablePort(apiPort, host);
            console.log(chalk.green(`✓ Using alternative API port: ${apiPort}`));
        } catch (err) {
            console.error(chalk.red(`✗ ${err.message}`));
            console.error(chalk.red(`Please specify a different API port with --api-port`));
            process.exit(1);
        }
    }
    
    // Check if GUI port is available
    const guiPortAvailable = await checkPort(port, host);
    if (!guiPortAvailable) {
        console.error(chalk.red(`✗ GUI port ${port} is already in use`));
        console.error(chalk.red(`Please specify a different port with --port`));
        process.exit(1);
    }
    
    // Start API server first
    const apiServer = createAPIServer(apiPort);
    const apiInstance = apiServer.listen(apiPort, () => {
        console.log(chalk.green(`✓ API server started on port ${apiPort}`));
    });
    
    const guiPath = join(__dirname, '../../gui');
    
    // Set environment variables for the GUI
    // Don't set VITE_API_URL so it uses the default '/api' which will be proxied
    const env = {
        ...process.env,
        VITE_API_PORT: apiPort.toString()
    };

    const spinner = ora('Starting GUI service...').start();

    // Start the Vite dev server
    const viteProcess = spawn('pnpm', ['vite', '--port', port.toString(), '--host', host], {
        cwd: guiPath,
        env,
        stdio: 'pipe'
    });

    let serverStarted = false;

    viteProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        if (!serverStarted && output.includes('Local:')) {
            serverStarted = true;
            spinner.succeed('GUI service started successfully');
            console.log(chalk.green(`\n✓ AutoDeploy GUI is running at http://${host}:${port}`));
            console.log(chalk.yellow('\nPress Ctrl+C to stop the service\n'));
            
            if (open) {
                // Open browser
                const openCommand = process.platform === 'darwin' ? 'open' :
                                  process.platform === 'win32' ? 'start' : 'xdg-open';
                spawn(openCommand, [`http://${host}:${port}`], { detached: true });
            }
        }
        
        // Show Vite output in debug mode
        if (options.debug) {
            console.log(chalk.gray(output));
        }
    });

    viteProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('error')) {
            spinner.fail('Failed to start GUI service');
            console.error(chalk.red(error));
        } else if (options.debug) {
            console.error(chalk.gray(error));
        }
    });

    viteProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(chalk.red(`GUI service exited with code ${code}`));
        } else {
            console.log(chalk.blue('\nGUI service stopped'));
        }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\nStopping GUI service...'));
        viteProcess.kill('SIGTERM');
        apiInstance.close();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        viteProcess.kill('SIGTERM');
        apiInstance.close();
        process.exit(0);
    });

    return viteProcess;
}

// Production mode - serve built files
export function startGUIProduction(options = {}) {
    const port = options.port || 8080;
    const host = options.host || 'localhost';
    
    console.log(chalk.blue(`Starting AutoDeploy GUI in production mode on http://${host}:${port}`));
    
    const guiPath = join(__dirname, '../../gui/dist');
    
    // Use a simple static server for production
    const serveProcess = spawn('npx', ['serve', '-s', guiPath, '-l', port.toString()], {
        stdio: 'inherit'
    });

    serveProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(chalk.red(`Production server exited with code ${code}`));
        }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\nStopping production server...'));
        serveProcess.kill('SIGTERM');
        process.exit(0);
    });

    return serveProcess;
}