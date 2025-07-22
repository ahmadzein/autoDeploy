# Stateful SSH Sessions and Interactive Prompts

## Overview

AutoDeploy now supports stateful SSH sessions that maintain context between commands, enabling complex deployment scenarios including nested SSH connections and interactive script prompts.

## When to Use Stateful SSH

Stateful SSH is automatically enabled when:
1. Your project has `persistentSession: true` in its configuration
2. Any deployment step contains an SSH command (e.g., `ssh target-server`)
3. Your deployment scripts require user input during execution

## Key Features

### 1. Persistent Shell Sessions
Unlike traditional SSH exec commands that run in isolation, stateful SSH maintains a single shell session throughout the deployment, preserving:
- Environment variables
- Current working directory
- SSH connections to other servers
- Shell history and context

### 2. Interactive Prompt Support
Deployment scripts can now prompt for user input:
- Branch/tag selection
- Version numbers
- Confirmation prompts
- Custom deployment parameters

### 3. Nested SSH Support
Execute commands that SSH to other servers:
```bash
# Step 1: SSH to jump server
ssh jump-server

# Step 2: From jump server, run deployment script
bash updateProduction.sh
```

## Configuration

### Enable Persistent Sessions
Add to your project configuration:
```json
{
  "name": "my-project",
  "persistentSession": true,
  "deploymentSteps": [
    {
      "name": "Connect to Jump Server",
      "command": "ssh jump-server"
    },
    {
      "name": "Deploy Application",
      "command": "bash deploy.sh"
    }
  ]
}
```

### For Monorepos
Enable for specific sub-deployments:
```json
{
  "subDeployments": [
    {
      "name": "api",
      "persistentSession": true,
      "deploymentSteps": [...]
    }
  ]
}
```

## Interactive Prompts

### GUI Experience
1. When a prompt is detected, a yellow input field appears
2. Enter your response and click "Send" or press Enter
3. The deployment continues with your input

### CLI Experience
```bash
autodeploy deploy my-project

[PROMPT] What branch/tag do you want to deploy?
> main

Deploying branch: main...
```

## Supported Prompt Patterns

The system automatically detects:
- Questions ending with `?`
- `Enter something:` patterns
- `Please provide/specify/enter`
- `Choose/Select from options`
- `(y/n)` or `(yes/no)` confirmations
- Password/passphrase prompts
- Custom patterns in your scripts

## Script Completion Detection

Deployments complete automatically when detecting:
- Return to original shell prompt
- Common completion messages ("Done", "Completed", "Finished")
- Service restart confirmations
- Build success messages

## Best Practices

### 1. Use Clear Prompts
Make your scripts user-friendly:
```bash
echo "What branch/tag do you want to deploy?"
read -r BRANCH
```

### 2. Add Completion Messages
Help AutoDeploy detect when your script is done:
```bash
echo "Deployment completed successfully!"
echo "Done"
```

### 3. Handle Errors Gracefully
Ensure your scripts exit properly on errors:
```bash
if [ $? -ne 0 ]; then
  echo "Deployment failed!"
  exit 1
fi
```

### 4. Test Locally First
Before using with AutoDeploy:
```bash
# Test your script interactively
ssh your-server
bash your-script.sh
```

## Troubleshooting

### Deployment Seems Stuck
1. Check if a prompt is waiting for input
2. Look for the yellow prompt indicator in GUI
3. Review the deployment logs for undetected prompts

### Commands Not Found
Stateful SSH uses a login shell, but if commands are still missing:
```bash
# Add to your deployment step
source ~/.bashrc && your-command
```

### Timeout Issues
- Default timeout is 30 seconds of inactivity
- Long-running commands should produce output
- Use `echo "Still working..."` in loops

### Session Not Maintaining State
Ensure you're not using commands that create new shells:
```bash
# Bad - creates new shell
ssh server 'cd /app && npm install'

# Good - maintains session
ssh server
cd /app
npm install
```

## Examples

### Nested SSH Deployment
```json
{
  "deploymentSteps": [
    {
      "name": "Connect to Bastion",
      "command": "ssh bastion"
    },
    {
      "name": "Connect to App Server",
      "command": "ssh app-server-internal"
    },
    {
      "name": "Deploy Application",
      "command": "cd /var/app && ./deploy.sh"
    }
  ]
}
```

### Interactive Branch Selection
```bash
#!/bin/bash
# deploy.sh

echo "Available branches:"
git branch -r

echo "What branch do you want to deploy?"
read -r BRANCH

git checkout "$BRANCH"
npm install
npm run build
pm2 restart app
```

### Multi-Stage Deployment
```json
{
  "persistentSession": true,
  "deploymentSteps": [
    {
      "name": "Setup Environment",
      "command": "export NODE_ENV=production"
    },
    {
      "name": "Connect to Deploy Server",
      "command": "ssh deploy@staging"
    },
    {
      "name": "Run Interactive Deployment",
      "command": "./scripts/interactive-deploy.sh"
    }
  ]
}
```

## Security Considerations

1. **Input Validation**: Always validate user input in your scripts
2. **Sensitive Data**: Avoid echoing passwords or secrets
3. **Audit Trail**: All inputs are logged in deployment history
4. **Timeout Protection**: Sessions timeout after 30 seconds of inactivity

## API Reference

### Enable for Project
```javascript
POST /api/projects
{
  "name": "project-name",
  "persistentSession": true,
  ...
}
```

### Send Input During Deployment
```javascript
POST /api/deployments/:projectName/input
{
  "sessionId": "session-123",
  "input": "user-response"
}
```

### Event Stream Messages
```javascript
// Prompt detected
{
  "type": "prompt",
  "sessionId": "session-123",
  "prompt": "What branch to deploy?",
  "step": "Deploy Application"
}

// Output streaming
{
  "type": "output",
  "data": "Deployment output..."
}
```