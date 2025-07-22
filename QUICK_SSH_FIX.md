# Quick Fix for SSH Deployment

## The Problem
Your deployment has these steps:
1. `ssh to api` - This opens an SSH session and waits at the prompt
2. `bash updateStaging.sh` - This tries to run on the jump server, not on 'api'

## The Solution

### Option 1: Combine the Commands (Recommended)
Change your deployment steps to:

```json
{
  "deploymentSteps": [
    {
      "name": "Deploy to API Server",
      "command": "ssh tis-staging-api 'bash updateStaging.sh'",
      "workingDir": ".",
      "continueOnError": false
    }
  ]
}
```

This runs the script directly on the target server.

### Option 2: Use a Deployment Script
Create a script on your jump server:

1. On the jump server, create `deploy-api.sh`:
```bash
#!/bin/bash
ssh tis-staging-api << 'EOF'
cd /path/to/your/app
bash updateStaging.sh
EOF
```

2. Update your deployment step:
```json
{
  "deploymentSteps": [
    {
      "name": "Deploy via script",
      "command": "bash deploy-api.sh",
      "workingDir": ".",
      "continueOnError": false
    }
  ]
}
```

### Option 3: Multiple Commands in One SSH
If you need to run multiple commands:

```json
{
  "deploymentSteps": [
    {
      "name": "Deploy to API Server",
      "command": "ssh tis-staging-api 'cd /var/www/api && git pull && bash updateStaging.sh'",
      "workingDir": ".",
      "continueOnError": false
    }
  ]
}
```

## Why This Happens

AutoDeploy executes each step in a fresh SSH session. When you run `ssh to api`, it:
1. Connects to your jump server
2. Runs `ssh to api`
3. Waits at the Ubuntu prompt
4. Times out after 60 seconds

The second step would run in a NEW SSH session on the jump server, not inside the nested SSH.

## Testing Your Fix

Before updating AutoDeploy, test manually:
```bash
# SSH to your jump server
ssh your-jump-server

# Test the combined command
ssh tis-staging-api 'bash updateStaging.sh'
```

If this works, update your AutoDeploy configuration.