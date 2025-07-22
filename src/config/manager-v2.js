import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { encryptObject, decryptObject } from '../utils/encryption.js';
import { MonorepoConfig } from './monorepo-config.js';

const CONFIG_DIR = join(homedir(), '.autodeploy');
const PROJECTS_DIR = join(CONFIG_DIR, 'projects');

export class ConfigManagerV2 {
    constructor() {
        this.ensureConfigDirs();
        this.migrateFromOldFormat();
        this.monorepo = new MonorepoConfig(this);
    }

    ensureConfigDirs() {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
        }
        if (!existsSync(PROJECTS_DIR)) {
            mkdirSync(PROJECTS_DIR, { recursive: true, mode: 0o700 });
        }
    }

    // Migrate from old single-file format to new directory structure
    migrateFromOldFormat() {
        const oldConfigFile = join(CONFIG_DIR, 'projects.json');
        if (existsSync(oldConfigFile)) {
            try {
                const encrypted = readFileSync(oldConfigFile, 'utf8');
                const oldConfig = decryptObject(encrypted);
                
                // Migrate each project
                if (oldConfig.projects && Array.isArray(oldConfig.projects)) {
                    oldConfig.projects.forEach(project => {
                        this.saveProjectToDirectory(project);
                    });
                }
                
                // Rename old file to backup
                writeFileSync(oldConfigFile + '.backup', encrypted);
                rmSync(oldConfigFile);
                console.log('✓ Migrated configuration to new format');
            } catch (error) {
                console.error('Error migrating config:', error.message);
            }
        }
    }

    getProjectDir(projectName) {
        // Sanitize project name for filesystem
        const safeName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
        return join(PROJECTS_DIR, safeName);
    }

    saveProjectToDirectory(project) {
        const projectDir = this.getProjectDir(project.name);
        
        if (!existsSync(projectDir)) {
            mkdirSync(projectDir, { recursive: true, mode: 0o700 });
        }

        // Split project data into separate files
        const config = {
            name: project.name,
            type: project.type,
            localPath: project.localPath,
            remotePath: project.remotePath,
            ssh: project.ssh,
            subDeployments: project.subDeployments,
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const localSteps = project.localSteps || [];
        const remoteSteps = project.deploymentSteps || [];
        const history = project.deploymentHistory || [];
        const stats = {
            lastDeployment: project.lastDeployment,
            deploymentCount: project.deploymentCount || 0,
            lastDeploymentStatus: project.lastDeploymentStatus
        };

        // Save each file encrypted
        this.saveFile(join(projectDir, 'config.json'), config);
        this.saveFile(join(projectDir, 'local-steps.json'), localSteps);
        this.saveFile(join(projectDir, 'remote-steps.json'), remoteSteps);
        this.saveFile(join(projectDir, 'history.json'), history);
        this.saveFile(join(projectDir, 'stats.json'), stats);
    }

    saveFile(filePath, data) {
        const encrypted = encryptObject(data);
        writeFileSync(filePath, encrypted, { mode: 0o600 });
    }

    loadFile(filePath) {
        if (!existsSync(filePath)) {
            return null;
        }
        try {
            const encrypted = readFileSync(filePath, 'utf8');
            return decryptObject(encrypted);
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error.message);
            return null;
        }
    }

    loadProjectFromDirectory(projectName) {
        const projectDir = this.getProjectDir(projectName);
        
        if (!existsSync(projectDir)) {
            return null;
        }

        const config = this.loadFile(join(projectDir, 'config.json'));
        if (!config) return null;

        const localSteps = this.loadFile(join(projectDir, 'local-steps.json')) || [];
        const remoteSteps = this.loadFile(join(projectDir, 'remote-steps.json')) || [];
        const history = this.loadFile(join(projectDir, 'history.json')) || [];
        const stats = this.loadFile(join(projectDir, 'stats.json')) || {};

        // Reconstruct the project object
        return {
            ...config,
            localSteps,
            deploymentSteps: remoteSteps,
            deploymentHistory: history,
            lastDeployment: stats.lastDeployment,
            deploymentCount: stats.deploymentCount || 0,
            lastDeploymentStatus: stats.lastDeploymentStatus
        };
    }

    // Public API methods
    addProject(project) {
        this.saveProjectToDirectory(project);
    }

    getProject(name) {
        return this.loadProjectFromDirectory(name);
    }

    getAllProjects() {
        if (!existsSync(PROJECTS_DIR)) {
            return [];
        }

        const projectDirs = readdirSync(PROJECTS_DIR);
        const projects = [];

        for (const dir of projectDirs) {
            const configFile = join(PROJECTS_DIR, dir, 'config.json');
            if (existsSync(configFile)) {
                const config = this.loadFile(configFile);
                if (config && config.name) {
                    projects.push(this.loadProjectFromDirectory(config.name));
                }
            }
        }

        return projects.filter(p => p !== null);
    }

    updateProject(name, updates) {
        const project = this.loadProjectFromDirectory(name);
        if (!project) return;

        const updatedProject = { ...project, ...updates };
        this.saveProjectToDirectory(updatedProject);
    }

    deleteProject(name) {
        const projectDir = this.getProjectDir(name);
        if (existsSync(projectDir)) {
            rmSync(projectDir, { recursive: true, force: true });
        }
    }
    
    // Alias for compatibility
    removeProject(name) {
        return this.deleteProject(name);
    }

    // Update only specific files
    updateLocalSteps(projectName, steps) {
        const projectDir = this.getProjectDir(projectName);
        if (!existsSync(projectDir)) return;
        
        this.saveFile(join(projectDir, 'local-steps.json'), steps);
    }

    updateRemoteSteps(projectName, steps) {
        const projectDir = this.getProjectDir(projectName);
        if (!existsSync(projectDir)) return;
        
        this.saveFile(join(projectDir, 'remote-steps.json'), steps);
    }

    recordDeployment(projectName, success, details = {}) {
        const projectDir = this.getProjectDir(projectName);
        if (!existsSync(projectDir)) return;

        // Load current history, stats, and logs
        const history = this.loadFile(join(projectDir, 'history.json')) || [];
        const stats = this.loadFile(join(projectDir, 'stats.json')) || {};
        const logs = this.loadFile(join(projectDir, 'logs.json')) || {};

        // Generate deployment ID
        const deploymentId = Date.now().toString();

        // Extract detailed logs from steps if present
        const stepLogs = details.steps || [];
        
        // Store detailed logs separately
        if (stepLogs.length > 0) {
            logs[deploymentId] = {
                timestamp: new Date().toISOString(),
                steps: stepLogs
            };
            
            // Keep only logs for last 50 deployments
            const logIds = Object.keys(logs).sort((a, b) => b - a);
            if (logIds.length > 50) {
                logIds.slice(50).forEach(id => delete logs[id]);
            }
        }

        // Create deployment record without detailed step logs
        const { steps, ...deploymentDetails } = details;
        const deployment = {
            id: deploymentId,
            timestamp: new Date().toISOString(),
            success,
            ...deploymentDetails
        };

        history.unshift(deployment);
        
        // Keep only last 50 deployments
        if (history.length > 50) {
            history.length = 50;
        }

        // Update stats
        stats.lastDeployment = deployment.timestamp;
        stats.deploymentCount = (stats.deploymentCount || 0) + 1;
        stats.lastDeploymentStatus = success ? 'success' : details.stopped ? 'stopped' : 'failed';

        // Save updated files
        this.saveFile(join(projectDir, 'history.json'), history);
        this.saveFile(join(projectDir, 'stats.json'), stats);
        if (stepLogs.length > 0) {
            this.saveFile(join(projectDir, 'logs.json'), logs);
        }
    }

    getDeploymentHistory(projectName, limit = 10) {
        const projectDir = this.getProjectDir(projectName);
        if (!existsSync(projectDir)) return [];

        const history = this.loadFile(join(projectDir, 'history.json')) || [];
        return history.slice(0, limit);
    }

    getDeploymentLogs(projectName, deploymentId) {
        const projectDir = this.getProjectDir(projectName);
        if (!existsSync(projectDir)) return null;

        const logs = this.loadFile(join(projectDir, 'logs.json')) || {};
        return logs[deploymentId] || null;
    }

    getAllDeploymentLogs(projectName) {
        const projectDir = this.getProjectDir(projectName);
        if (!existsSync(projectDir)) return {};

        return this.loadFile(join(projectDir, 'logs.json')) || {};
    }

    getDeploymentStats() {
        const projects = this.getAllProjects();
        let totalDeployments = 0;
        let deploymentsToday = 0;
        let activeProjects = 0;
        let lastDeployment = null;

        const today = new Date().toDateString();

        projects.forEach(project => {
            const projectDir = this.getProjectDir(project.name);
            const stats = this.loadFile(join(projectDir, 'stats.json')) || {};
            const history = this.loadFile(join(projectDir, 'history.json')) || [];
            
            if (stats.deploymentCount > 0) {
                totalDeployments += stats.deploymentCount;
                activeProjects++;
                
                // Count all deployments from today by checking the history
                history.forEach(deployment => {
                    const deployDate = new Date(deployment.timestamp);
                    if (deployDate.toDateString() === today) {
                        deploymentsToday++;
                    }
                });
                
                // Track the most recent deployment across all projects
                if (stats.lastDeployment) {
                    const deployDate = new Date(stats.lastDeployment);
                    if (!lastDeployment || deployDate > new Date(lastDeployment.timestamp)) {
                        lastDeployment = { 
                            timestamp: stats.lastDeployment, 
                            projectName: project.name,
                            success: stats.lastDeploymentStatus === 'success'
                        };
                    }
                }
            }
        });

        return {
            totalDeployments,
            deploymentsToday,
            activeProjects,
            lastDeployment
        };
    }
    
    getMonorepoConfig() {
        return this.monorepo;
    }
}