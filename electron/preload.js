import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getProjects: () => ipcRenderer.invoke('get-projects'),
    addProject: (project) => ipcRenderer.invoke('add-project', project),
    removeProject: (projectName) => ipcRenderer.invoke('remove-project', projectName),
    updateProject: (projectName, updates) => ipcRenderer.invoke('update-project', projectName, updates),
    testSSH: (sshConfig) => ipcRenderer.invoke('test-ssh', sshConfig),
    deployProject: (projectName) => ipcRenderer.invoke('deploy-project', projectName),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    onDeploymentLog: (callback) => {
        ipcRenderer.on('deployment-log', (event, data) => callback(data));
        return () => ipcRenderer.removeAllListeners('deployment-log');
    }
});