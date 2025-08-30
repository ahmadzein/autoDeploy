/**
 * Deployment Manager - Keeps track of active deployments
 * Allows deployments to continue running when user navigates away
 */
export class DeploymentManager {
    constructor() {
        // Map of projectName -> deployment info
        this.activeDeployments = new Map();
    }

    /**
     * Register a new deployment
     */
    registerDeployment(projectName, deploymentId, res) {
        const deployment = {
            id: deploymentId,
            projectName,
            startTime: Date.now(),
            status: 'running',
            clients: new Set([res]),
            logs: [],
            currentStep: null,
            steps: [],
            executor: null
        };
        
        this.activeDeployments.set(projectName, deployment);
        return deployment;
    }

    /**
     * Get active deployment for a project
     */
    getDeployment(projectName) {
        return this.activeDeployments.get(projectName);
    }

    /**
     * Add a client to an existing deployment
     */
    addClient(projectName, res) {
        const deployment = this.activeDeployments.get(projectName);
        if (deployment) {
            deployment.clients.add(res);
            
            // Send catch-up logs to new client
            deployment.logs.forEach(log => {
                res.write(`data: ${JSON.stringify(log)}\n\n`);
            });
            
            return true;
        }
        return false;
    }

    /**
     * Remove a client from deployment
     */
    removeClient(projectName, res) {
        const deployment = this.activeDeployments.get(projectName);
        if (deployment) {
            deployment.clients.delete(res);
            
            // If no more clients, deployment continues running in background
            // It will be cleaned up when finished or stopped
        }
    }

    /**
     * Broadcast message to all clients
     */
    broadcast(projectName, message) {
        const deployment = this.activeDeployments.get(projectName);
        if (deployment) {
            // Store log
            deployment.logs.push(message);
            
            // Keep only last 1000 logs to prevent memory issues
            if (deployment.logs.length > 1000) {
                deployment.logs = deployment.logs.slice(-1000);
            }
            
            // Send to all connected clients
            const disconnectedClients = [];
            deployment.clients.forEach(client => {
                try {
                    client.write(`data: ${JSON.stringify(message)}\n\n`);
                } catch (err) {
                    // Client disconnected
                    disconnectedClients.push(client);
                }
            });
            
            // Clean up disconnected clients
            disconnectedClients.forEach(client => {
                deployment.clients.delete(client);
            });
        }
    }

    /**
     * Mark deployment as completed
     */
    completeDeployment(projectName, success = true) {
        const deployment = this.activeDeployments.get(projectName);
        if (deployment) {
            deployment.status = success ? 'completed' : 'failed';
            deployment.endTime = Date.now();
            
            // Send completion to all clients
            this.broadcast(projectName, {
                type: 'complete',
                message: success ? 'Deployment completed successfully!' : 'Deployment failed',
                duration: deployment.endTime - deployment.startTime
            });
            
            // Close all client connections
            deployment.clients.forEach(client => {
                try {
                    client.write('event: close\ndata: \n\n');
                    client.end();
                } catch (err) {
                    // Ignore errors
                }
            });
            
            // Remove deployment after a delay to allow reconnections
            setTimeout(() => {
                this.activeDeployments.delete(projectName);
            }, 5000);
        }
    }

    /**
     * Stop a deployment
     */
    stopDeployment(projectName) {
        const deployment = this.activeDeployments.get(projectName);
        if (deployment) {
            deployment.status = 'stopped';
            
            // Clean up executor if exists
            if (deployment.executor && deployment.executor.cleanup) {
                deployment.executor.cleanup();
            }
            
            // Mark as stopped
            this.completeDeployment(projectName, false);
            
            return true;
        }
        return false;
    }

    /**
     * Check if deployment is active
     */
    isDeploymentActive(projectName) {
        const deployment = this.activeDeployments.get(projectName);
        return deployment && deployment.status === 'running';
    }

    /**
     * Update deployment executor
     */
    setExecutor(projectName, executor) {
        const deployment = this.activeDeployments.get(projectName);
        if (deployment) {
            deployment.executor = executor;
        }
    }

    /**
     * Update current step
     */
    updateCurrentStep(projectName, step) {
        const deployment = this.activeDeployments.get(projectName);
        if (deployment) {
            deployment.currentStep = step;
        }
    }
}

// Singleton instance
export const deploymentManager = new DeploymentManager();