# Using Persistent Session for Nested SSH

## Enable Persistent Session

In your sub-deployment settings, make sure "Use persistent SSH session" is checked. This will:
1. Keep the SSH connection alive between steps
2. Maintain state (like being inside a nested SSH session)
3. Run all commands in sequence

## Current Issue

Your deployment is failing because:
- Step 1: `ssh to api` - Opens SSH and waits at prompt
- Step 2: `bash updateStaging.sh` - Tries to run on jump server (wrong!)

## Solutions

### Solution 1: Combined Command (Recommended)
```json
{
  "deploymentSteps": [
    {
      "name": "Deploy to API",
      "command": "ssh tis-staging-api 'bash updateStaging.sh'"
    }
  ]
}
```

### Solution 2: Use SSH with Here Document
```json
{
  "deploymentSteps": [
    {
      "name": "Deploy to API",
      "command": "ssh tis-staging-api << 'DEPLOY'\ncd /your/app/path\nbash updateStaging.sh\nDEPLOY"
    }
  ]
}
```

### Solution 3: Pre-configured Script
Add this to your jump server as `deploy-api.sh`:
```bash
#!/bin/bash
ssh tis-staging-api 'bash updateStaging.sh'
```

Then use:
```json
{
  "deploymentSteps": [
    {
      "name": "Run deployment script",
      "command": "bash deploy-api.sh"
    }
  ]
}
```

## Why Persistent Session Alone Doesn't Fix This

Even with persistent session enabled, the SSH command opens an interactive shell and waits. The system can't distinguish between:
- A prompt that needs user input (like password)
- A shell prompt where it should run the next command

The SSH protocol doesn't provide a clean way to "queue" commands for a nested SSH session.

## Best Practice

Always combine SSH with the command you want to run:
```bash
# Instead of:
ssh server
command1
command2

# Use:
ssh server 'command1 && command2'
```

This ensures commands run on the correct server and complete properly.