# Nested SSH Troubleshooting Guide

## Issue: Deployment Stuck on Nested SSH

When you see:
```
[14:05:07] [api] Detected nested SSH commands, using optimized execution
```
And then nothing happens, here's how to diagnose and fix it.

## Quick Fix

**Change your deployment steps from:**
```
Step 1: ssh tis-staging-api
Step 2: bash updateStaging.sh
```

**To:**
```
Step 1: ssh tis-staging-api 'bash updateStaging.sh'
```

## Enable Debug Mode

Set the environment variable before running:
```bash
export AUTODEPLOY_DEBUG=true
autodeploy gui
```

This will show:
- Exact commands being executed
- SSH connection details
- Buffer contents when waiting for prompts
- Timeout messages if commands hang

## Common Issues and Solutions

### 1. SSH Waiting for Password
**Symptom**: Deployment hangs indefinitely

**Solution**: Configure passwordless SSH:
```bash
# On your jump server (EC2)
ssh-copy-id tis-staging-api
```

### 2. SSH Host Key Verification
**Symptom**: Stuck waiting for "yes/no" confirmation

**Solution**: Add to your deployment command:
```
ssh -o StrictHostKeyChecking=no tis-staging-api 'your-command'
```

### 3. Wrong Path Context
**Symptom**: "cd: /home/ec2-user: No such file or directory"

**Solution**: Use the Smart SSH Executor by enabling "Use persistent SSH session"

### 4. Interactive Commands
**Symptom**: Command requires user input

**Solution**: Make commands non-interactive:
```bash
# Instead of: apt-get install package
# Use: apt-get install -y package

# Instead of: ssh server
# Use: ssh -o BatchMode=yes server
```

## Execution Strategies

AutoDeploy now uses a Smart SSH Executor that automatically chooses the best strategy:

1. **Combined Strategy**: Detects `ssh server` followed by commands and combines them
2. **Interactive Strategy**: Falls back to interactive shell for complex scenarios
3. **Standard Strategy**: Uses separate connections for simple deployments

## Testing Your Setup

Before using AutoDeploy, test manually:

```bash
# SSH to your jump server
ssh your-ec2-instance

# Test the nested SSH
ssh tis-staging-api 'echo "Connection successful" && bash updateStaging.sh'
```

If this works manually, it will work in AutoDeploy.

## Advanced Configuration

### Using SSH Config
Create `~/.ssh/config` on your jump server:
```
Host tis-staging-api
    HostName actual-hostname-or-ip
    User your-username
    IdentityFile ~/.ssh/your-key
    StrictHostKeyChecking no
    BatchMode yes
```

### Using SSH Agent Forwarding
If you need to SSH further from tis-staging-api:
```
Step 1: ssh -A tis-staging-api 'bash deploy.sh'
```

## Still Having Issues?

1. Check the logs with `AUTODEPLOY_DEBUG=true`
2. Look for timeout messages (30-second timeout)
3. Check the last 200 characters of the buffer in timeout errors
4. Verify your SSH keys are properly configured
5. Test each command manually first

## Example Working Configuration

For your specific case:
```json
{
  "name": "api",
  "localPath": ".",
  "remotePath": ".",
  "deploymentSteps": [
    {
      "name": "Deploy to API Server",
      "command": "ssh -o BatchMode=yes -o StrictHostKeyChecking=no tis-staging-api 'cd /path/to/api && bash updateStaging.sh'",
      "workingDir": ".",
      "continueOnError": false
    }
  ],
  "persistentSession": true
}
```

This combines the SSH and script execution into a single command that won't hang.