import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { ConfigManager } from '../src/config/manager.js';
import { GitOperations } from '../src/git/operations.js';
import { SSHConnection } from '../src/ssh/connection.js';
import { PipelineExecutor } from '../src/pipeline/executor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
const configManager = new ConfigManager();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hiddenInset',
        icon: join(__dirname, '../gui/public/icon.png')
    });

    // Load the React app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(join(__dirname, '../gui/dist/index.html'));
    }

    // Create menu
    const template = [
        {
            label: 'AutoDeploy',
            submenu: [
                { label: 'About AutoDeploy', role: 'about' },
                { type: 'separator' },
                { label: 'Quit', accelerator: 'Cmd+Q', role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
                { label: 'Redo', accelerator: 'Shift+Cmd+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'Cmd+X', role: 'cut' },
                { label: 'Copy', accelerator: 'Cmd+C', role: 'copy' },
                { label: 'Paste', accelerator: 'Cmd+V', role: 'paste' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.handle('get-projects', async () => {
    return configManager.getAllProjects();
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const absolutePath = join(__dirname, '..', filePath);
        const content = await fs.promises.readFile(absolutePath, 'utf-8');
        return content;
    } catch (error) {
        throw new Error(`Failed to read file: ${error.message}`);
    }
});

ipcMain.handle('add-project', async (event, project) => {
    configManager.addProject(project);
    return { success: true };
});

ipcMain.handle('remove-project', async (event, projectName) => {
    configManager.removeProject(projectName);
    return { success: true };
});

ipcMain.handle('update-project', async (event, projectName, updates) => {
    configManager.updateProject(projectName, updates);
    return { success: true };
});

ipcMain.handle('test-ssh', async (event, sshConfig) => {
    const connection = new SSHConnection(sshConfig);
    return await connection.testConnection();
});

ipcMain.handle('deploy-project', async (event, projectName) => {
    const project = configManager.getProject(projectName);
    if (!project) {
        return { success: false, message: 'Project not found' };
    }

    const results = [];
    
    // Git operations
    const gitOps = new GitOperations(project.localPath);
    const isGitRepo = await gitOps.isGitRepo();
    
    if (isGitRepo) {
        mainWindow.webContents.send('deployment-log', {
            type: 'info',
            message: 'Committing and pushing local changes...'
        });
        
        const gitResult = await gitOps.commitAndPush(`Auto-deploy: ${new Date().toISOString()}`);
        
        if (gitResult.success) {
            mainWindow.webContents.send('deployment-log', {
                type: 'success',
                message: gitResult.message
            });
        } else {
            mainWindow.webContents.send('deployment-log', {
                type: 'error',
                message: `Git operation failed: ${gitResult.message}`
            });
            return { success: false, message: gitResult.message };
        }
    }

    // SSH deployment
    if (project.deploymentSteps.length > 0) {
        const executor = new PipelineExecutor(project.ssh, project.remotePath);
        
        // Custom execute with real-time logs
        const connection = new SSHConnection(project.ssh);
        
        try {
            await connection.connect();
            
            for (let i = 0; i < project.deploymentSteps.length; i++) {
                const step = project.deploymentSteps[i];
                
                mainWindow.webContents.send('deployment-log', {
                    type: 'info',
                    message: `Step ${i + 1}/${project.deploymentSteps.length}: ${step.name}`
                });
                
                let command = step.command;
                if (!step.workingDir || step.workingDir === '.') {
                    command = `cd ${project.remotePath} && ${command}`;
                } else {
                    command = `cd ${project.remotePath}/${step.workingDir} && ${command}`;
                }
                
                const result = await connection.exec(command);
                
                if (result.code === 0) {
                    mainWindow.webContents.send('deployment-log', {
                        type: 'success',
                        message: `${step.name} ✓`,
                        output: result.stdout
                    });
                    results.push({ success: true, step: step.name });
                } else {
                    mainWindow.webContents.send('deployment-log', {
                        type: 'error',
                        message: `${step.name} ✗`,
                        output: result.stderr || result.stdout
                    });
                    results.push({ success: false, step: step.name });
                    
                    if (!step.continueOnError) {
                        break;
                    }
                }
            }
            
            connection.disconnect();
        } catch (error) {
            mainWindow.webContents.send('deployment-log', {
                type: 'error',
                message: `Connection error: ${error.message}`
            });
            return { success: false, message: error.message };
        }
    }

    return { success: true, results };
});