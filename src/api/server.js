#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ConfigManager } from '../config/manager.js';
import { GitOperations } from '../git/operations.js';
import { SSHConnection } from '../ssh/connection.js';
import { PipelineExecutor } from '../pipeline/executor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createAPIServer(port = 3000) {
    const app = express();
    const configManager = new ConfigManager();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', version: '1.0.0' });
    });

    // Get all projects
    app.get('/api/projects', (req, res) => {
        const projects = configManager.getAllProjects();
        res.json(projects);
    });

    // Get single project
    app.get('/api/projects/:name', (req, res) => {
        const project = configManager.getProject(req.params.name);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    });

    // Add project
    app.post('/api/projects', async (req, res) => {
        try {
            const project = req.body;
            
            // Test SSH connection
            const sshConnection = new SSHConnection(project.ssh);
            const testResult = await sshConnection.testConnection();
            
            if (!testResult.success) {
                return res.status(400).json({ 
                    error: 'SSH connection failed', 
                    message: testResult.message 
                });
            }
            
            configManager.addProject(project);
            res.status(201).json({ success: true, project });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update project
    app.put('/api/projects/:name', (req, res) => {
        try {
            configManager.updateProject(req.params.name, req.body);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete project
    app.delete('/api/projects/:name', (req, res) => {
        try {
            configManager.removeProject(req.params.name);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Test SSH connection
    app.post('/api/test-connection', async (req, res) => {
        try {
            const sshConnection = new SSHConnection(req.body);
            const result = await sshConnection.testConnection();
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Deploy project (SSE endpoint for EventSource)
    app.get('/api/deployments/:name', async (req, res) => {
        const project = configManager.getProject(req.params.name);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Set headers for SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Track deployment start time
        const startTime = Date.now();
        const deploymentSteps = [];
        let deploymentSuccess = true;
        let deploymentStopped = false;

        // Handle client disconnect (user stopped deployment)
        req.on('close', () => {
            if (!res.finished && deploymentSteps.length > 0) {
                deploymentStopped = true;
                const duration = Date.now() - startTime;
                configManager.recordDeployment(project.name, false, {
                    duration,
                    steps: deploymentSteps,
                    error: 'Deployment stopped by user',
                    stopped: true
                });
            }
        });

        // Send deployment started event
        res.write(`data: ${JSON.stringify({ 
            type: 'start', 
            message: `Deploying ${project.name}...` 
        })}\n\n`);

        try {
            // Execute local steps first
            if (project.localSteps && project.localSteps.length > 0) {
                res.write(`data: ${JSON.stringify({ 
                    type: 'progress', 
                    message: 'Executing local steps...' 
                })}\n\n`);
                
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);
                
                for (const step of project.localSteps) {
                    const stepStartTime = Date.now();
                    let workingDir = '';
                    
                    res.write(`data: ${JSON.stringify({ 
                        type: 'step', 
                        message: `[Local] Running: ${step.name}` 
                    })}\n\n`);
                    
                    try {
                        // Trim whitespace from paths
                        const trimmedLocalPath = project.localPath.trim();
                        workingDir = step.workingDir === '.' 
                            ? trimmedLocalPath 
                            : join(trimmedLocalPath, step.workingDir);
                        
                        // Check if working directory exists
                        const fs = await import('fs');
                        if (!fs.existsSync(workingDir)) {
                            throw new Error(`Working directory does not exist: ${workingDir}`);
                        }
                        
                        let stdout, stderr;
                        try {
                            const result = await execAsync(step.command, {
                                cwd: workingDir,
                                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                                shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
                                env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' }
                            });
                            stdout = result.stdout;
                            stderr = result.stderr;
                        } catch (execError) {
                            // If exec fails, capture the error details
                            if (execError.stdout) stdout = execError.stdout;
                            if (execError.stderr) stderr = execError.stderr;
                            
                            // Re-throw with enhanced error info
                            const enhancedError = new Error(execError.message || 'Command failed');
                            enhancedError.code = execError.code;
                            enhancedError.stderr = stderr;
                            enhancedError.stdout = stdout;
                            throw enhancedError;
                        }
                        
                        const output = stdout || stderr || 'Command completed';
                        
                        deploymentSteps.push({
                            name: `[Local] ${step.name}`,
                            success: true,
                            output: output,
                            duration: Date.now() - stepStartTime
                        });
                        
                        res.write(`data: ${JSON.stringify({ 
                            type: 'step-complete', 
                            message: output,
                            step: step.name
                        })}\n\n`);
                    } catch (error) {
                        // Check if this is a Git "nothing to commit" scenario
                        const isGitCommand = step.command.toLowerCase().includes('git commit');
                        const isNothingToCommit = error.message && (
                            error.message.includes('nothing to commit') ||
                            error.message.includes('working tree clean') ||
                            (error.code === 1 && isGitCommand)
                        );
                        
                        if (isNothingToCommit) {
                            // Treat "nothing to commit" as success
                            const message = 'Nothing to commit, working tree clean';
                            
                            deploymentSteps.push({
                                name: `[Local] ${step.name}`,
                                success: true,
                                output: message,
                                duration: Date.now() - stepStartTime
                            });
                            
                            res.write(`data: ${JSON.stringify({ 
                                type: 'step-complete', 
                                message: message,
                                step: step.name
                            })}\n\n`);
                        } else {
                            // Build detailed error message for actual errors
                            let errorDetails = error.message;
                            
                            // Add additional error information if available
                            if (error.code) {
                                errorDetails += `\nError code: ${error.code}`;
                            }
                            if (error.syscall) {
                                errorDetails += `\nSystem call: ${error.syscall}`;
                            }
                            if (error.path) {
                                errorDetails += `\nPath: ${error.path}`;
                            }
                            if (error.stderr) {
                                errorDetails += `\nStderr: ${error.stderr}`;
                            }
                            
                            // Add context about the execution environment
                            errorDetails += `\nCommand: ${step.command}`;
                            errorDetails += `\nWorking directory: ${workingDir}`;
                            errorDetails += `\nLocal project path: ${project.localPath}`;
                            
                            deploymentSteps.push({
                                name: `[Local] ${step.name}`,
                                success: false,
                                output: errorDetails,
                                duration: Date.now() - stepStartTime
                            });
                            
                            res.write(`data: ${JSON.stringify({ 
                                type: 'step-error', 
                                message: errorDetails,
                                step: step.name
                            })}\n\n`);
                            
                            if (!step.continueOnError) {
                                deploymentSuccess = false;
                                throw new Error(`Local step failed: ${step.name}`);
                            }
                        }
                    }
                }
            }

            // Git operations
            const gitOps = new GitOperations(project.localPath);
            const isGitRepo = await gitOps.isGitRepo();
            
            if (isGitRepo) {
                res.write(`data: ${JSON.stringify({ 
                    type: 'progress', 
                    message: 'Committing and pushing local changes...' 
                })}\n\n`);
                
                const gitResult = await gitOps.commitAndPush(`Auto-deploy: ${new Date().toISOString()}`);
                
                res.write(`data: ${JSON.stringify({ 
                    type: gitResult.success ? 'progress' : 'error', 
                    message: gitResult.message 
                })}\n\n`);
            }

            // Run deployment steps
            if (project.deploymentSteps.length > 0) {
                const executor = new PipelineExecutor(project.ssh, project.remotePath);
                
                // Execute steps with progress updates
                for (const step of project.deploymentSteps) {
                    const stepStartTime = Date.now();
                    
                    res.write(`data: ${JSON.stringify({ 
                        type: 'step', 
                        message: `Running: ${step.name}` 
                    })}\n\n`);
                    
                    const result = await executor.executeStep(step);
                    
                    deploymentSteps.push({
                        name: step.name,
                        success: result.success,
                        output: result.output || result.error,
                        duration: Date.now() - stepStartTime
                    });
                    
                    res.write(`data: ${JSON.stringify({ 
                        type: result.success ? 'step-complete' : 'step-error', 
                        message: result.output || result.error,
                        step: step.name
                    })}\n\n`);
                    
                    if (!result.success && !step.continueOnError) {
                        deploymentSuccess = false;
                        throw new Error(`Step failed: ${step.name}`);
                    }
                }
            }

            // Send completion event
            res.write(`data: ${JSON.stringify({ 
                type: 'complete', 
                message: 'Deployment completed successfully!' 
            })}\n\n`);
            
            // Record successful deployment
            const duration = Date.now() - startTime;
            configManager.recordDeployment(project.name, true, {
                duration,
                steps: deploymentSteps
            });
            
            // Send a final close event
            res.write(`event: close\ndata: {}\n\n`);
        } catch (error) {
            deploymentSuccess = false;
            
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                message: error.message 
            })}\n\n`);
            
            // Record failed deployment
            const duration = Date.now() - startTime;
            configManager.recordDeployment(project.name, false, {
                duration,
                steps: deploymentSteps,
                error: error.message
            });
            
            // Send a final close event
            res.write(`event: close\ndata: {}\n\n`);
        } finally {
            // Close the connection
            setTimeout(() => {
                res.end();
            }, 100);
        }
    });

    // Get deployment history for a project
    app.get('/api/projects/:name/deployments', (req, res) => {
        const history = configManager.getDeploymentHistory(req.params.name);
        res.json(history);
    });

    // Get deployment stats
    app.get('/api/stats', (req, res) => {
        const stats = configManager.getDeploymentStats();
        res.json(stats);
    });

    // Get documentation structure
    app.get('/api/docs/structure', (req, res) => {
        try {
            const structurePath = join(__dirname, '../../docs/structure.json');
            res.sendFile(structurePath);
        } catch (error) {
            res.status(500).json({ error: 'Failed to load documentation structure' });
        }
    });

    // Get documentation content
    app.get('/api/docs/content/*', (req, res) => {
        try {
            const docPath = req.params[0];
            const fullPath = join(__dirname, '../../docs', docPath);
            res.sendFile(fullPath);
        } catch (error) {
            res.status(404).json({ error: 'Documentation not found' });
        }
    });

    return app;
}

// If run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
    const port = process.env.PORT || 3000;
    const app = createAPIServer(port);
    app.listen(port, () => {
        console.log(`AutoDeploy API server running on http://localhost:${port}`);
    });
}