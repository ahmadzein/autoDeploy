#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ConfigManager } from '../config/manager.js';
import { GitOperations } from '../git/operations.js';
import { SSHConnection } from '../ssh/connection.js';
import { PipelineExecutor } from '../pipeline/executor.js';
import { PersistentPipelineExecutor } from '../pipeline/executor-persistent.js';
import { NestedSSHExecutor } from '../pipeline/executor-nested-ssh.js';
import { InteractiveShellExecutor } from '../pipeline/executor-interactive-shell.js';
import { SmartSSHExecutor } from '../pipeline/executor-smart-ssh.js';
import { SimpleSSHExecutor } from '../pipeline/executor-simple-ssh.js';
import { InteractivePipelineExecutor } from '../pipeline/executor-interactive.js';
import { StatefulSSHExecutor } from '../pipeline/executor-stateful-ssh.js';
import { createSlug, ensureUniqueSlug } from '../utils/slug.js';

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
        res.json({ status: 'ok', version: '1.1.0' });
    });

    // Get all projects
    app.get('/api/projects', (req, res) => {
        const projects = configManager.getAllProjects();
        // Ensure all projects have displayName for backward compatibility
        const projectsWithDisplayNames = projects.map(p => ({
            ...p,
            displayName: p.displayName || p.name
        }));
        res.json(projectsWithDisplayNames);
    });

    // Get single project
    app.get('/api/projects/:name', (req, res) => {
        const projectName = decodeURIComponent(req.params.name);
        const project = configManager.getProject(projectName);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Ensure project has displayName for backward compatibility
        const projectWithDisplayName = {
            ...project,
            displayName: project.displayName || project.name
        };
        res.json(projectWithDisplayName);
    });

    // Add project
    app.post('/api/projects', async (req, res) => {
        try {
            const project = req.body;
            
            // Validate project name
            if (!project.name || project.name.trim() === '') {
                return res.status(400).json({ error: 'Project name is required' });
            }
            
            // Generate slug from project name
            const baseSlug = createSlug(project.name);
            const existingProjects = configManager.getAllProjects();
            const existingSlugs = existingProjects.map(p => p.slug || p.name);
            const slug = ensureUniqueSlug(baseSlug, existingSlugs);
            
            // Store both display name and slug
            project.displayName = project.name;
            project.slug = slug;
            project.name = slug; // Use slug as the internal identifier
            
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
            const projectName = decodeURIComponent(req.params.name);
            configManager.updateProject(projectName, req.body);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete project
    app.delete('/api/projects/:name', (req, res) => {
        try {
            const projectName = decodeURIComponent(req.params.name);
            configManager.removeProject(projectName);
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
        const projectName = decodeURIComponent(req.params.name);
        const project = configManager.getProject(projectName);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Handle monorepo deployments
        let deploymentTargets = [];
        if (project.type === 'monorepo') {
            const monorepoConfig = configManager.getMonorepoConfig();
            const allSubs = monorepoConfig.getSubDeployments(projectName);
            
            if (req.query.all === 'true') {
                // Deploy all sub-deployments
                deploymentTargets = allSubs;
            } else if (req.query.sub) {
                // Deploy specific sub-deployments
                const requestedSubs = Array.isArray(req.query.sub) ? req.query.sub : [req.query.sub];
                deploymentTargets = allSubs.filter(sub => requestedSubs.includes(sub.name));
                
                if (deploymentTargets.length === 0) {
                    return res.status(400).json({ error: 'No valid sub-deployments found' });
                }
            } else {
                return res.status(400).json({ error: 'Monorepo deployment requires sub-deployment selection' });
            }
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
        const deploymentMessage = project.type === 'monorepo' 
            ? `Deploying ${deploymentTargets.length} sub-deployment(s) from ${project.name}...`
            : `Deploying ${project.name}...`;
            
        res.write(`data: ${JSON.stringify({ 
            type: 'start', 
            message: deploymentMessage
        })}\n\n`);

        try {
            // Handle monorepo deployments
            if (project.type === 'monorepo') {
                const monorepoConfig = configManager.getMonorepoConfig();
                
                // Execute git operations at monorepo root first
                const gitOps = new GitOperations(project.localPath);
                const isGitRepo = await gitOps.isGitRepo();
                
                if (isGitRepo) {
                    res.write(`data: ${JSON.stringify({ 
                        type: 'progress', 
                        message: 'Committing and pushing monorepo changes...' 
                    })}\n\n`);
                    
                    const gitResult = await gitOps.commitAndPush(`Auto-deploy: ${new Date().toISOString()}`);
                    
                    res.write(`data: ${JSON.stringify({ 
                        type: gitResult.success ? 'progress' : 'error', 
                        message: gitResult.message 
                    })}\n\n`);
                }
                
                // Deploy each sub-deployment
                for (const subDeployment of deploymentTargets) {
                    res.write(`data: ${JSON.stringify({ 
                        type: 'progress', 
                        message: `\n=== Deploying sub-project: ${subDeployment.name} ===` 
                    })}\n\n`);
                    
                    // Execute local steps for sub-deployment
                    if (subDeployment.localSteps && subDeployment.localSteps.length > 0) {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'progress', 
                            message: `Executing local steps for ${subDeployment.name}...` 
                        })}\n\n`);
                        
                        const { exec } = await import('child_process');
                        const { promisify } = await import('util');
                        const execAsync = promisify(exec);
                        
                        for (const step of subDeployment.localSteps) {
                            const stepStartTime = Date.now();
                            let workingDir = '';
                            
                            res.write(`data: ${JSON.stringify({ 
                                type: 'step', 
                                message: `[${subDeployment.name}/Local] Running: ${step.name}` 
                            })}\n\n`);
                            
                            try {
                                const trimmedLocalPath = subDeployment.localPath.trim();
                                workingDir = step.workingDir === '.' 
                                    ? trimmedLocalPath 
                                    : join(trimmedLocalPath, step.workingDir);
                                
                                const fs = await import('fs');
                                if (!fs.existsSync(workingDir)) {
                                    throw new Error(`Working directory does not exist: ${workingDir}\nSub-deployment localPath: ${subDeployment.localPath}\nStep workingDir: ${step.workingDir}\nCalculated workingDir: ${workingDir}`);
                                }
                                
                                let stdout, stderr;
                                try {
                                    const result = await execAsync(step.command, {
                                        cwd: workingDir,
                                        maxBuffer: 1024 * 1024 * 10,
                                        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
                                        env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' }
                                    });
                                    stdout = result.stdout;
                                    stderr = result.stderr;
                                } catch (execError) {
                                    if (execError.stdout) stdout = execError.stdout;
                                    if (execError.stderr) stderr = execError.stderr;
                                    
                                    const enhancedError = new Error(execError.message || 'Command failed');
                                    enhancedError.code = execError.code;
                                    enhancedError.stderr = stderr;
                                    enhancedError.stdout = stdout;
                                    throw enhancedError;
                                }
                                
                                const output = stdout || stderr || 'Command completed';
                                
                                deploymentSteps.push({
                                    name: `[${subDeployment.name}/Local] ${step.name}`,
                                    success: true,
                                    output: output,
                                    duration: Date.now() - stepStartTime
                                });
                                
                                res.write(`data: ${JSON.stringify({ 
                                    type: 'step-complete', 
                                    message: output,
                                    step: `${subDeployment.name}/${step.name}`
                                })}\n\n`);
                            } catch (error) {
                                const isGitCommand = step.command.toLowerCase().includes('git commit');
                                const isNothingToCommit = error.message && (
                                    error.message.includes('nothing to commit') ||
                                    error.message.includes('working tree clean') ||
                                    (error.code === 1 && isGitCommand)
                                );
                                
                                if (isNothingToCommit) {
                                    const message = 'Nothing to commit, working tree clean';
                                    
                                    deploymentSteps.push({
                                        name: `[${subDeployment.name}/Local] ${step.name}`,
                                        success: true,
                                        output: message,
                                        duration: Date.now() - stepStartTime
                                    });
                                    
                                    res.write(`data: ${JSON.stringify({ 
                                        type: 'step-complete', 
                                        message: message,
                                        step: `${subDeployment.name}/${step.name}`
                                    })}\n\n`);
                                } else {
                                    let errorDetails = error.message;
                                    if (error.stderr) {
                                        errorDetails += `\nStderr: ${error.stderr}`;
                                    }
                                    
                                    deploymentSteps.push({
                                        name: `[${subDeployment.name}/Local] ${step.name}`,
                                        success: false,
                                        output: errorDetails,
                                        duration: Date.now() - stepStartTime
                                    });
                                    
                                    res.write(`data: ${JSON.stringify({ 
                                        type: 'step-error', 
                                        message: errorDetails,
                                        step: `${subDeployment.name}/${step.name}`
                                    })}\n\n`);
                                    
                                    if (!step.continueOnError) {
                                        deploymentSuccess = false;
                                        throw new Error(`Local step failed: ${subDeployment.name}/${step.name}`);
                                    }
                                }
                            }
                        }
                    }
                    
                    // Execute remote steps for sub-deployment
                    if (subDeployment.deploymentSteps && subDeployment.deploymentSteps.length > 0) {
                        const sshConfig = subDeployment.ssh || project.ssh;
                        
                        // Check if we need special handling for nested SSH
                        const hasNestedSSH = subDeployment.deploymentSteps.some(step => 
                            step.command.trim().match(/^ssh\s+[^\s]+\s*$/)
                        );
                        
                        // Check if persistent sessions are enabled
                        const usePersistentSession = subDeployment.persistentSession || project.persistentSession;
                        
                        console.log(`[DEBUG] Sub-deployment ${subDeployment.name} - persistentSession: ${subDeployment.persistentSession}`);
                        console.log(`[DEBUG] Project ${project.name} - persistentSession: ${project.persistentSession}`);
                        console.log(`[DEBUG] Has nested SSH: ${hasNestedSSH}`);
                        console.log(`[DEBUG] Using persistent session: ${usePersistentSession}`);
                        
                        // Prefer persistent session over nested SSH detection when enabled
                        if (usePersistentSession) {
                            // Use stateful SSH executor that maintains session between commands
                            const sessionId = `${project.name}-${subDeployment.name}-${Date.now()}`;
                            const statefulExecutor = new StatefulSSHExecutor(sshConfig, subDeployment.remotePath);
                            statefulExecutor.setSessionId(sessionId);
                            
                            res.write(`data: ${JSON.stringify({ 
                                type: 'info', 
                                message: `[${subDeployment.name}] Using stateful SSH session for ${subDeployment.deploymentSteps.length} steps` 
                            })}\n\n`);
                            
                            // Listen for real-time output
                            statefulExecutor.on('output', (data) => {
                                const lines = data.data.split('\n');
                                lines.forEach(line => {
                                    if (line.trim()) {
                                        res.write(`data: ${JSON.stringify({ 
                                            type: 'output', 
                                            data: line + '\n',
                                            outputType: data.type || 'stdout'
                                        })}\n\n`);
                                    }
                                });
                            });
                            
                            // Listen for prompts
                            statefulExecutor.on('prompt', (promptData) => {
                                res.write(`data: ${JSON.stringify({ 
                                    type: 'prompt', 
                                    sessionId: promptData.sessionId,
                                    step: promptData.step,
                                    prompt: promptData.prompt
                                })}\n\n`);
                                
                                // Store executor in global sessions for input handling
                                if (!global.deploymentSessions) {
                                    global.deploymentSessions = new Map();
                                }
                                
                                global.deploymentSessions.set(sessionId, {
                                    waitingForInput: true,
                                    inputCallback: (input) => {
                                        statefulExecutor.handleUserInput(input);
                                    }
                                });
                                
                                // Clean up after 5 minutes
                                setTimeout(() => {
                                    global.deploymentSessions.delete(sessionId);
                                }, 300000);
                            });
                            
                            try {
                                const startTime = Date.now();
                                const results = await statefulExecutor.executeSteps(subDeployment.deploymentSteps);
                                
                                // Remove event listeners
                                statefulExecutor.removeAllListeners();
                                
                                results.forEach((result, index) => {
                                    const step = subDeployment.deploymentSteps[index];
                                    
                                    // Skip if we don't have a corresponding step (can happen with interactive sessions)
                                    if (!step) {
                                        console.warn(`[API] No step found for result at index ${index}`);
                                        return;
                                    }
                                    
                                    deploymentSteps.push({
                                        name: `[${subDeployment.name}] ${step.name}`,
                                        success: result.success,
                                        output: result.output || result.error,
                                        duration: result.duration || Math.floor((Date.now() - startTime) / results.length)
                                    });
                                    
                                    res.write(`data: ${JSON.stringify({ 
                                        type: result.success ? 'step-complete' : 'step-error', 
                                        message: result.output || result.error,
                                        step: `${subDeployment.name}/${step.name}`
                                    })}\n\n`);
                                    
                                    if (!result.success && !step.continueOnError) {
                                        deploymentSuccess = false;
                                        throw new Error(`Step failed: ${subDeployment.name}/${step.name}`);
                                    }
                                });
                            } catch (error) {
                                deploymentSuccess = false;
                                throw error;
                            }
                        } else {
                            // Use interactive executor for better prompt handling
                            const sessionId = `${project.name}-${subDeployment.name}-${Date.now()}`;
                            const executor = new InteractivePipelineExecutor(sshConfig, subDeployment.remotePath);
                            
                            for (const step of subDeployment.deploymentSteps) {
                                const stepStartTime = Date.now();
                                
                                res.write(`data: ${JSON.stringify({ 
                                    type: 'step', 
                                    message: `[${subDeployment.name}/Remote] Running: ${step.name}` 
                                })}\n\n`);
                                
                                // Set up interactive handling
                                executor.on('output', (data) => {
                                    res.write(`data: ${JSON.stringify({ 
                                        type: 'output', 
                                        data: data.data,
                                        outputType: data.type 
                                    })}\n\n`);
                                });
                                
                                executor.on('prompt', (promptData) => {
                                    res.write(`data: ${JSON.stringify({ 
                                        type: 'prompt', 
                                        sessionId: sessionId,
                                        step: `${subDeployment.name}/${promptData.step}`,
                                        prompt: promptData.prompt
                                    })}\n\n`);
                                });
                                
                                const result = await executor.executeStep(step, (prompt, callback) => {
                                    if (!global.deploymentSessions) {
                                        global.deploymentSessions = new Map();
                                    }
                                    
                                    global.deploymentSessions.set(sessionId, {
                                        waitingForInput: true,
                                        inputCallback: (input) => {
                                            callback(input);
                                            global.deploymentSessions.get(sessionId).waitingForInput = false;
                                        }
                                    });
                                    
                                    setTimeout(() => {
                                        global.deploymentSessions.delete(sessionId);
                                    }, 300000);
                                });
                                
                                executor.removeAllListeners();
                                
                                deploymentSteps.push({
                                    name: `[${subDeployment.name}] ${step.name}`,
                                    success: result.success,
                                    output: result.output || result.error,
                                    duration: Date.now() - stepStartTime
                                });
                                
                                res.write(`data: ${JSON.stringify({ 
                                    type: result.success ? 'step-complete' : 'step-error', 
                                    message: result.output || result.error,
                                    step: `${subDeployment.name}/${step.name}`
                                })}\n\n`);
                                
                                if (!result.success && !step.continueOnError) {
                                    deploymentSuccess = false;
                                    throw new Error(`Step failed: ${subDeployment.name}/${step.name}`);
                                }
                            }
                        }
                    }
                    
                    // Record sub-deployment
                    monorepoConfig.recordSubDeployment(project.name, subDeployment.name, deploymentSuccess, {
                        duration: Date.now() - startTime,
                        steps: deploymentSteps.filter(s => s.name.includes(subDeployment.name))
                    });
                }
                
                // Send completion
                res.write(`data: ${JSON.stringify({ 
                    type: 'complete', 
                    message: `Successfully deployed ${deploymentTargets.length} sub-project(s)!` 
                })}\n\n`);
                
                // Record main monorepo deployment
                const duration = Date.now() - startTime;
                configManager.recordDeployment(project.name, deploymentSuccess, {
                    duration,
                    steps: deploymentSteps,
                    subDeployments: deploymentTargets.map(name => ({ name, success: true }))
                });
                
                // Send a final close event
                res.write(`event: close\ndata: {}\n\n`);
                
            } else {
                // Standard project deployment (original logic)
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
                // Check if persistent sessions are enabled or if we have nested SSH
                const hasNestedSSH = project.deploymentSteps.some(step => 
                    step.command.trim().match(/^ssh\s+[^\s]+\s*$/)
                );
                
                if (project.persistentSession || hasNestedSSH) {
                    // Use stateful SSH executor that maintains session between commands
                    const sessionId = `${project.name}-${Date.now()}`;
                    const statefulExecutor = new StatefulSSHExecutor(project.ssh, project.remotePath);
                    statefulExecutor.setSessionId(sessionId);
                    
                    res.write(`data: ${JSON.stringify({ 
                        type: 'info', 
                        message: 'Using stateful SSH session for all steps' 
                    })}\n\n`);
                    
                    // Listen for real-time output
                    statefulExecutor.on('output', (data) => {
                        const lines = data.data.split('\n');
                        lines.forEach(line => {
                            if (line.trim()) {
                                res.write(`data: ${JSON.stringify({ 
                                    type: 'output', 
                                    data: line + '\n',
                                    outputType: data.type || 'stdout'
                                })}\n\n`);
                            }
                        });
                    });
                    
                    // Listen for prompts
                    statefulExecutor.on('prompt', (promptData) => {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'prompt', 
                            sessionId: promptData.sessionId,
                            step: promptData.step,
                            prompt: promptData.prompt
                        })}\n\n`);
                        
                        // Store executor in global sessions for input handling
                        if (!global.deploymentSessions) {
                            global.deploymentSessions = new Map();
                        }
                        
                        global.deploymentSessions.set(sessionId, {
                            waitingForInput: true,
                            inputCallback: (input) => {
                                statefulExecutor.handleUserInput(input);
                            }
                        });
                        
                        // Clean up after 5 minutes
                        setTimeout(() => {
                            global.deploymentSessions.delete(sessionId);
                        }, 300000);
                    });
                    
                    try {
                        const startTime = Date.now();
                        const results = await statefulExecutor.executeSteps(project.deploymentSteps);
                        
                        // Remove event listeners
                        statefulExecutor.removeAllListeners();
                        
                        results.forEach((result, index) => {
                            const step = project.deploymentSteps[index];
                            
                            // Skip if we don't have a corresponding step
                            if (!step) {
                                console.warn(`[API] No step found for result at index ${index}`);
                                return;
                            }
                            
                            deploymentSteps.push({
                                name: step.name,
                                success: result.success,
                                output: result.output || result.error,
                                duration: result.duration || Math.floor((Date.now() - startTime) / results.length)
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
                        });
                    } catch (error) {
                        deploymentSuccess = false;
                        throw error;
                    }
                } else {
                    // Generate session ID for interactive prompts
                    const sessionId = `${project.name}-${Date.now()}`;
                    
                    // Use interactive executor for better prompt handling
                    const executor = new InteractivePipelineExecutor(project.ssh, project.remotePath);
                    
                    // Execute steps with progress updates
                    for (const step of project.deploymentSteps) {
                        const stepStartTime = Date.now();
                        
                        res.write(`data: ${JSON.stringify({ 
                            type: 'step', 
                            message: `Running: ${step.name}` 
                        })}\n\n`);
                        
                        // Set up interactive handling
                        executor.on('output', (data) => {
                            // Stream output in real-time
                            res.write(`data: ${JSON.stringify({ 
                                type: 'output', 
                                data: data.data,
                                outputType: data.type 
                            })}\n\n`);
                        });
                        
                        executor.on('prompt', (promptData) => {
                            // Send prompt to client
                            res.write(`data: ${JSON.stringify({ 
                                type: 'prompt', 
                                sessionId: sessionId,
                                step: promptData.step,
                                prompt: promptData.prompt
                            })}\n\n`);
                        });
                        
                        // Create promise for handling prompts
                        const result = await executor.executeStep(step, (prompt, callback) => {
                            // Store callback in session
                            if (!global.deploymentSessions) {
                                global.deploymentSessions = new Map();
                            }
                            
                            global.deploymentSessions.set(sessionId, {
                                waitingForInput: true,
                                inputCallback: (input) => {
                                    callback(input);
                                    global.deploymentSessions.get(sessionId).waitingForInput = false;
                                }
                            });
                            
                            // Clean up after 5 minutes
                            setTimeout(() => {
                                global.deploymentSessions.delete(sessionId);
                            }, 300000);
                        });
                        
                        // Remove listeners
                        executor.removeAllListeners();
                        
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
            } // End of standard deployment
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
        const projectName = decodeURIComponent(req.params.name);
        const history = configManager.getDeploymentHistory(projectName);
        res.json(history);
    });

    // Get deployment stats
    app.get('/api/stats', (req, res) => {
        const stats = configManager.getDeploymentStats();
        res.json(stats);
    });

    // Monorepo endpoints
    
    // Get sub-deployments for a monorepo
    app.get('/api/projects/:name/sub-deployments', (req, res) => {
        const projectName = decodeURIComponent(req.params.name);
        const project = configManager.getProject(projectName);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.type !== 'monorepo') {
            return res.status(400).json({ error: 'Project is not a monorepo' });
        }
        
        const monorepoConfig = configManager.getMonorepoConfig();
        const subDeployments = monorepoConfig.getSubDeployments(projectName);
        res.json(subDeployments);
    });
    
    // Add sub-deployment to monorepo
    app.post('/api/projects/:name/sub-deployments', async (req, res) => {
        try {
            const projectName = decodeURIComponent(req.params.name);
            const project = configManager.getProject(projectName);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            if (project.type !== 'monorepo') {
                return res.status(400).json({ error: 'Project is not a monorepo' });
            }
            
            const subData = req.body;
            
            // Test SSH connection if not inheriting
            if (!subData.inheritSSH && subData.ssh) {
                const sshConnection = new SSHConnection(subData.ssh);
                const testResult = await sshConnection.testConnection();
                
                if (!testResult.success) {
                    return res.status(400).json({ 
                        error: 'SSH connection failed', 
                        message: testResult.message 
                    });
                }
            }
            
            const monorepoConfig = configManager.getMonorepoConfig();
            monorepoConfig.addSubDeployment(projectName, subData);
            res.status(201).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Update sub-deployment
    app.put('/api/projects/:name/sub-deployments/:subName', (req, res) => {
        try {
            const projectName = decodeURIComponent(req.params.name);
            const subName = decodeURIComponent(req.params.subName);
            const project = configManager.getProject(projectName);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            if (project.type !== 'monorepo') {
                return res.status(400).json({ error: 'Project is not a monorepo' });
            }
            
            const monorepoConfig = configManager.getMonorepoConfig();
            monorepoConfig.updateSubDeployment(projectName, subName, req.body);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Delete sub-deployment
    app.delete('/api/projects/:name/sub-deployments/:subName', (req, res) => {
        try {
            const projectName = decodeURIComponent(req.params.name);
            const subName = decodeURIComponent(req.params.subName);
            const project = configManager.getProject(projectName);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            if (project.type !== 'monorepo') {
                return res.status(400).json({ error: 'Project is not a monorepo' });
            }
            
            const monorepoConfig = configManager.getMonorepoConfig();
            monorepoConfig.deleteSubDeployment(projectName, subName);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
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

    // Interactive deployment endpoint (with WebSocket-like bidirectional communication)
    app.post('/api/deployments/:name/input', async (req, res) => {
        const projectName = decodeURIComponent(req.params.name);
        const { input, sessionId } = req.body;
        
        // Store input responses in a global map (in production, use Redis or similar)
        if (!global.deploymentSessions) {
            global.deploymentSessions = new Map();
        }
        
        const session = global.deploymentSessions.get(sessionId);
        if (session && session.waitingForInput) {
            session.inputCallback(input);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'No active prompt waiting for input' });
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