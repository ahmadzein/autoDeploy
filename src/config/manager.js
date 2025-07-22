// Re-export the new ConfigManagerV2 as ConfigManager for backward compatibility
export { ConfigManagerV2 as ConfigManager } from './manager-v2.js';

// Keep the old implementation below for reference
/*
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { encryptObject, decryptObject } from '../utils/encryption.js';

const CONFIG_DIR = join(homedir(), '.autodeploy');
const CONFIG_FILE = join(CONFIG_DIR, 'projects.json');

export class ConfigManagerOld {
    constructor() {
        this.ensureConfigDir();
        this.config = this.loadConfig();
    }

    ensureConfigDir() {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
        }
    }

    loadConfig() {
        if (!existsSync(CONFIG_FILE)) {
            return { projects: [] };
        }
        try {
            const encrypted = readFileSync(CONFIG_FILE, 'utf8');
            return decryptObject(encrypted);
        } catch (error) {
            console.error('Error loading config, creating new one:', error.message);
            return { projects: [] };
        }
    }

    saveConfig() {
        const encrypted = encryptObject(this.config);
        writeFileSync(CONFIG_FILE, encrypted, { mode: 0o600 });
    }

    addProject(project) {
        const existingIndex = this.config.projects.findIndex(p => p.name === project.name);
        if (existingIndex >= 0) {
            this.config.projects[existingIndex] = project;
        } else {
            this.config.projects.push(project);
        }
        this.saveConfig();
    }

    getProject(name) {
        return this.config.projects.find(p => p.name === name);
    }

    getAllProjects() {
        return this.config.projects;
    }

    removeProject(name) {
        this.config.projects = this.config.projects.filter(p => p.name !== name);
        this.saveConfig();
    }

    updateProject(name, updates) {
        const project = this.getProject(name);
        if (project) {
            Object.assign(project, updates);
            this.saveConfig();
        }
    }

    recordDeployment(projectName, success = true, details = {}) {
        const project = this.getProject(projectName);
        if (!project) {
            throw new Error(`Project "${projectName}" not found`);
        }
        
        // Initialize deployment history if it doesn't exist
        if (!project.deploymentHistory) {
            project.deploymentHistory = [];
        }
        
        // Add new deployment record
        const deployment = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            success,
            duration: details.duration || 0,
            steps: details.steps || [],
            error: details.error || null
        };
        
        project.deploymentHistory.unshift(deployment); // Add to beginning
        
        // Keep only last 50 deployments
        if (project.deploymentHistory.length > 50) {
            project.deploymentHistory = project.deploymentHistory.slice(0, 50);
        }
        
        // Update last deployment time
        project.lastDeployment = deployment.timestamp;
        project.deploymentCount = (project.deploymentCount || 0) + 1;
        project.lastDeploymentStatus = success ? 'success' : 'failed';
        
        this.saveConfig();
        return deployment;
    }

    getDeploymentHistory(projectName, limit = 10) {
        const project = this.getProject(projectName);
        if (!project || !project.deploymentHistory) {
            return [];
        }
        
        return project.deploymentHistory.slice(0, limit);
    }

    getLastDeployment(projectName) {
        const project = this.getProject(projectName);
        if (!project || !project.deploymentHistory || project.deploymentHistory.length === 0) {
            return null;
        }
        
        return project.deploymentHistory[0];
    }

    getDeploymentStats() {
        const stats = {
            totalDeployments: 0,
            deploymentsToday: 0,
            lastDeployment: null,
            activeProjects: 0
        };

        const today = new Date().toDateString();

        this.config.projects.forEach(project => {
            if (project.deploymentHistory && project.deploymentHistory.length > 0) {
                stats.activeProjects++;
                stats.totalDeployments += project.deploymentHistory.length;
                
                // Count today's deployments
                project.deploymentHistory.forEach(deployment => {
                    if (new Date(deployment.timestamp).toDateString() === today) {
                        stats.deploymentsToday++;
                    }
                });
                
                // Track most recent deployment across all projects
                const lastDeploy = project.deploymentHistory[0];
                if (!stats.lastDeployment || new Date(lastDeploy.timestamp) > new Date(stats.lastDeployment.timestamp)) {
                    stats.lastDeployment = { ...lastDeploy, projectName: project.name };
                }
            }
        });

        return stats;
    }
}
*/