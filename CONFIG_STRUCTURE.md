# AutoDeploy Configuration Structure

## Overview

AutoDeploy uses a directory-based configuration structure where each project has its own encrypted directory containing separate files for different aspects of the project configuration.

## Directory Layout

```
~/.autodeploy/
├── projects/
│   ├── project-name-1/
│   │   ├── config.json       # Core project configuration
│   │   ├── local-steps.json  # Local deployment steps
│   │   ├── remote-steps.json # Remote deployment steps
│   │   ├── history.json      # Deployment history
│   │   └── stats.json        # Deployment statistics
│   └── project-name-2/
│       └── ... (same structure)
└── projects.json.backup      # Backup of old format (if migrated)
```

## File Descriptions

### config.json
Contains the core project configuration including:
- Project name
- Local path (path on your machine)
- Remote path (path on deployment server)
- SSH connection details (encrypted)
- Creation and update timestamps

Example structure:
```json
{
  "name": "my-project",
  "localPath": "/path/to/local/project",
  "remotePath": "/path/on/remote/server",
  "ssh": {
    "host": "example.com",
    "username": "deploy-user",
    "password": "encrypted-password",
    "port": 22
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### local-steps.json
Array of steps to execute on the local machine before deployment:
```json
[
  {
    "name": "Install Dependencies",
    "command": "npm install",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Build Project",
    "command": "npm run build",
    "workingDir": ".",
    "continueOnError": false
  }
]
```

### remote-steps.json
Array of steps to execute on the remote server:
```json
[
  {
    "name": "Pull Latest Code",
    "command": "git pull origin main",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Restart Service",
    "command": "pm2 restart app",
    "workingDir": ".",
    "continueOnError": false
  }
]
```

### history.json
Array of deployment records (maximum 50, oldest are removed):
```json
[
  {
    "id": "1234567890",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "success": true,
    "duration": 45000,
    "steps": [
      {
        "name": "[Local] Build",
        "success": true,
        "output": "Build successful",
        "duration": 10000
      }
    ]
  }
]
```

### stats.json
Deployment statistics and counters:
```json
{
  "lastDeployment": "2024-01-01T00:00:00.000Z",
  "deploymentCount": 42,
  "lastDeploymentStatus": "success"
}
```

## Security

- All files are encrypted using AES-256-GCM
- Encryption keys are derived from machine hardware identifiers
- File permissions are set to 0600 (owner read/write only)
- SSH passwords are always stored encrypted

## Migration

When upgrading from the old single-file format:

1. **Automatic Migration**: Happens on first run after update
2. **Manual Migration**: Run `node src/config/migrate.js`
3. **Backup**: Old configuration saved to `~/.autodeploy/projects.json.backup`

## Benefits

1. **Better Organization**: Each project is self-contained
2. **Smaller Files**: Easier to manage and less memory usage
3. **Selective Loading**: Only load what you need
4. **Easier Debugging**: Can inspect individual aspects
5. **Cleaner History**: History doesn't bloat the main config
6. **Better Performance**: Faster operations on large projects

## API Usage

The ConfigManager API remains the same:

```javascript
const configManager = new ConfigManager();

// Get a project
const project = configManager.getProject('my-project');

// Update local steps only
configManager.updateLocalSteps('my-project', newSteps);

// Record a deployment
configManager.recordDeployment('my-project', true, {
  duration: 45000,
  steps: [...]
});
```