import { join, isAbsolute } from 'path';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';

/**
 * Monorepo Configuration Structure
 * 
 * Project Structure:
 * ~/.autodeploy/projects/
 *   my-monorepo/
 *     config.json         # Main project config with monorepo settings
 *     sub-deployments/    # Directory for sub-deployment configs
 *       frontend/
 *         config.json      # Sub-deployment settings
 *         local-steps.json # Local deployment steps
 *         remote-steps.json # Remote deployment steps
 *         history.json     # Deployment history metadata
 *         logs.json        # Detailed deployment logs
 *         stats.json       # Deployment statistics
 *       backend/
 *         config.json
 *         local-steps.json
 *         remote-steps.json
 *         history.json
 *         logs.json
 *         stats.json
 *       shared-lib/
 *         ...
 */

export class MonorepoConfig {
    constructor(configManager) {
        this.configManager = configManager;
    }

    /**
     * Check if a project is a monorepo
     */
    isMonorepo(projectName) {
        const project = this.configManager.getProject(projectName);
        return project && project.type === 'monorepo';
    }

    /**
     * Create a monorepo project
     */
    createMonorepoProject(projectConfig) {
        // Add monorepo type
        projectConfig.type = 'monorepo';
        projectConfig.subDeployments = projectConfig.subDeployments || [];
        
        // Save main project
        this.configManager.addProject(projectConfig);
        
        // Create sub-deployments directory
        const projectDir = this.configManager.getProjectDir(projectConfig.name);
        const subDeploymentsDir = join(projectDir, 'sub-deployments');
        
        if (!existsSync(subDeploymentsDir)) {
            mkdirSync(subDeploymentsDir, { recursive: true, mode: 0o700 });
        }
        
        return projectConfig;
    }

    /**
     * Add a sub-deployment to a monorepo
     */
    addSubDeployment(projectName, subDeploymentConfig) {
        const project = this.configManager.getProject(projectName);
        if (!project || project.type !== 'monorepo') {
            throw new Error('Project is not a monorepo');
        }

        const projectDir = this.configManager.getProjectDir(projectName);
        const subDeploymentDir = join(projectDir, 'sub-deployments', subDeploymentConfig.name);
        
        if (!existsSync(subDeploymentDir)) {
            mkdirSync(subDeploymentDir, { recursive: true, mode: 0o700 });
        }

        // Add reference to main project
        if (!project.subDeployments) {
            project.subDeployments = [];
        }
        
        if (!project.subDeployments.includes(subDeploymentConfig.name)) {
            project.subDeployments.push(subDeploymentConfig.name);
            this.configManager.updateProject(projectName, project);
        }

        // Ensure parent project localPath has leading slash
        let parentLocalPath = project.localPath;
        if (parentLocalPath && !parentLocalPath.startsWith('/') && !parentLocalPath.match(/^[A-Za-z]:\\/)) {
            parentLocalPath = '/' + parentLocalPath;
        }
        
        // Save sub-deployment configuration
        const subConfig = {
            name: subDeploymentConfig.name,
            localPath: isAbsolute(subDeploymentConfig.relativePath || subDeploymentConfig.name) 
                ? (subDeploymentConfig.relativePath || subDeploymentConfig.name)
                : join(parentLocalPath, subDeploymentConfig.relativePath || subDeploymentConfig.name),
            remotePath: subDeploymentConfig.remotePath,
            ssh: subDeploymentConfig.ssh || project.ssh, // Inherit SSH from parent if not specified
            persistentSession: subDeploymentConfig.persistentSession || false, // Add persistentSession
            parentProject: projectName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save config files
        this.configManager.saveFile(join(subDeploymentDir, 'config.json'), subConfig);
        this.configManager.saveFile(join(subDeploymentDir, 'local-steps.json'), subDeploymentConfig.localSteps || []);
        this.configManager.saveFile(join(subDeploymentDir, 'remote-steps.json'), subDeploymentConfig.deploymentSteps || []);
        this.configManager.saveFile(join(subDeploymentDir, 'history.json'), []);
        this.configManager.saveFile(join(subDeploymentDir, 'stats.json'), {
            deploymentCount: 0
        });

        return subConfig;
    }

    /**
     * Get all sub-deployments for a monorepo
     */
    getSubDeployments(projectName) {
        const project = this.configManager.getProject(projectName);
        if (!project || project.type !== 'monorepo') {
            return [];
        }

        const projectDir = this.configManager.getProjectDir(projectName);
        const subDeploymentsDir = join(projectDir, 'sub-deployments');
        
        if (!existsSync(subDeploymentsDir)) {
            return [];
        }

        const subDeployments = [];
        const subDirs = readdirSync(subDeploymentsDir);

        for (const subDir of subDirs) {
            const configFile = join(subDeploymentsDir, subDir, 'config.json');
            if (existsSync(configFile)) {
                const config = this.configManager.loadFile(configFile);
                if (config) {
                    // Fix localPath if it seems incorrect (migration/repair)
                    let localPath = config.localPath;
                    if (config.relativePath) {
                        // Recalculate localPath based on current project.localPath and relativePath
                        localPath = isAbsolute(config.relativePath) 
                            ? config.relativePath
                            : join(project.localPath, config.relativePath);
                    }
                    
                    // Ensure localPath starts with / (for Unix-like systems)
                    if (localPath && !localPath.startsWith('/') && !localPath.match(/^[A-Za-z]:\\/)) {
                        localPath = '/' + localPath;
                    }
                    
                    // Update config if path was corrected
                    if (localPath !== config.localPath) {
                            config.localPath = localPath;
                            this.configManager.saveFile(configFile, config);
                        }
                    }
                    
                    // Load all sub-deployment files
                    const subDeployment = {
                        ...config,
                        localPath: localPath,
                        localSteps: this.configManager.loadFile(join(subDeploymentsDir, subDir, 'local-steps.json')) || [],
                        deploymentSteps: this.configManager.loadFile(join(subDeploymentsDir, subDir, 'remote-steps.json')) || [],
                        deploymentHistory: this.configManager.loadFile(join(subDeploymentsDir, subDir, 'history.json')) || [],
                        stats: this.configManager.loadFile(join(subDeploymentsDir, subDir, 'stats.json')) || {}
                    };
                    subDeployments.push(subDeployment);
                }
            }
        }

        return subDeployments;
    }

    /**
     * Get a specific sub-deployment
     */
    getSubDeployment(projectName, subDeploymentName) {
        const projectDir = this.configManager.getProjectDir(projectName);
        const subDeploymentDir = join(projectDir, 'sub-deployments', subDeploymentName);
        
        if (!existsSync(subDeploymentDir)) {
            return null;
        }

        const config = this.configManager.loadFile(join(subDeploymentDir, 'config.json'));
        if (!config) {
            return null;
        }

        return {
            ...config,
            localSteps: this.configManager.loadFile(join(subDeploymentDir, 'local-steps.json')) || [],
            deploymentSteps: this.configManager.loadFile(join(subDeploymentDir, 'remote-steps.json')) || [],
            deploymentHistory: this.configManager.loadFile(join(subDeploymentDir, 'history.json')) || [],
            stats: this.configManager.loadFile(join(subDeploymentDir, 'stats.json')) || {}
        };
    }

    /**
     * Update a sub-deployment
     */
    updateSubDeployment(projectName, subDeploymentName, updates) {
        const projectDir = this.configManager.getProjectDir(projectName);
        const subDeploymentDir = join(projectDir, 'sub-deployments', subDeploymentName);
        
        if (!existsSync(subDeploymentDir)) {
            throw new Error('Sub-deployment not found');
        }

        const currentConfig = this.configManager.loadFile(join(subDeploymentDir, 'config.json'));
        const updatedConfig = {
            ...currentConfig,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Save updated config
        this.configManager.saveFile(join(subDeploymentDir, 'config.json'), updatedConfig);

        // Update steps if provided
        if (updates.localSteps) {
            this.configManager.saveFile(join(subDeploymentDir, 'local-steps.json'), updates.localSteps);
        }
        if (updates.deploymentSteps) {
            this.configManager.saveFile(join(subDeploymentDir, 'remote-steps.json'), updates.deploymentSteps);
        }
    }

    /**
     * Delete a sub-deployment
     */
    deleteSubDeployment(projectName, subDeploymentName) {
        const project = this.configManager.getProject(projectName);
        if (!project || project.type !== 'monorepo') {
            throw new Error('Project is not a monorepo');
        }

        const projectDir = this.configManager.getProjectDir(projectName);
        const subDeploymentDir = join(projectDir, 'sub-deployments', subDeploymentName);
        
        if (existsSync(subDeploymentDir)) {
            rmSync(subDeploymentDir, { recursive: true, force: true });
        }

        // Remove from parent project's subDeployments list
        if (project.subDeployments) {
            project.subDeployments = project.subDeployments.filter(name => name !== subDeploymentName);
            this.configManager.updateProject(projectName, project);
        }
    }

    /**
     * Record deployment for a sub-deployment
     */
    recordSubDeployment(projectName, subDeploymentName, success, details = {}) {
        const projectDir = this.configManager.getProjectDir(projectName);
        const subDeploymentDir = join(projectDir, 'sub-deployments', subDeploymentName);
        
        if (!existsSync(subDeploymentDir)) {
            return;
        }

        // Load current history, stats, and logs
        const history = this.configManager.loadFile(join(subDeploymentDir, 'history.json')) || [];
        const stats = this.configManager.loadFile(join(subDeploymentDir, 'stats.json')) || {};
        const logs = this.configManager.loadFile(join(subDeploymentDir, 'logs.json')) || {};

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
        this.configManager.saveFile(join(subDeploymentDir, 'history.json'), history);
        this.configManager.saveFile(join(subDeploymentDir, 'stats.json'), stats);
        if (stepLogs.length > 0) {
            this.configManager.saveFile(join(subDeploymentDir, 'logs.json'), logs);
        }
    }
}

export default MonorepoConfig;