# Stateful SSH Solution for Multi-Step Deployments

## Overview

AutoDeploy now includes a **Stateful SSH Executor** that maintains session state between commands. This is perfect for:
- Nested SSH scenarios (SSH to jump server, then SSH to another server)
- Commands that depend on previous command state
- Multi-step deployments where context needs to be preserved

## How It Works

The Stateful SSH Executor uses SSH2's `shell()` method to create a persistent shell session that:
1. Maintains a single SSH connection throughout all deployment steps
2. Executes commands sequentially in the same shell context
3. Preserves environment variables, working directory, and nested SSH sessions
4. Automatically detects shell prompts to know when commands complete

## Automatic Activation

The stateful executor is automatically used when:
1. **Persistent Session is enabled** - Check "Use persistent SSH session" in your project settings
2. **Nested SSH is detected** - When a step contains just `ssh server-name`

## Example: Multi-Step Nested SSH Deployment

Your deployment steps can now be:
```json
{
  "deploymentSteps": [
    {
      "name": "SSH to API server",
      "command": "ssh tis-staging-api"
    },
    {
      "name": "Navigate to app directory",
      "command": "cd /var/www/api"
    },
    {
      "name": "Pull latest code",
      "command": "git pull origin main"
    },
    {
      "name": "Install dependencies",
      "command": "npm install"
    },
    {
      "name": "Run deployment script",
      "command": "bash updateStaging.sh"
    },
    {
      "name": "Check service status",
      "command": "pm2 status"
    }
  ]
}
```

## Key Features

### 1. Session State Preservation
- First step: `ssh tis-staging-api` - Opens SSH session to API server
- Subsequent steps run ON the API server, not the jump server
- Working directory changes persist between steps
- Environment variables set in one step are available in later steps

### 2. Smart Prompt Detection
The executor detects various shell prompts:
- Standard prompts: `$`, `#`, `>`
- Ubuntu-style: `ubuntu@ip-10-1-0-181:~$`
- Bracketed prompts: `[user@host]$`
- Custom prompts with paths

### 3. Real-Time Output
- See command output as it happens
- No more waiting until the end to see results
- Helps debug issues immediately

### 4. Timeout Protection
- 30-second timeout per command
- Prevents indefinite hanging
- Clear error messages on timeout

## Comparison with Previous Methods

### Before (Would Fail):
```
Step 1: ssh api-server     # Opens SSH, waits at prompt
Step 2: run-script.sh      # ERROR: Runs on jump server!
```

### Now (Works Correctly):
```
Step 1: ssh api-server     # Opens SSH session
Step 2: run-script.sh      # Runs on api-server ✓
Step 3: check-status.sh    # Also runs on api-server ✓
```

## Configuration

### Enable for a Project:
1. Edit your project/sub-deployment
2. Check "Use persistent SSH session"
3. Save

### Enable Automatically:
Any deployment with a step containing just `ssh server` will automatically use the stateful executor.

## Advanced Usage

### Multiple Nested SSH:
```json
[
  { "name": "SSH to jump", "command": "ssh jump-server" },
  { "name": "SSH to app", "command": "ssh app-server" },
  { "name": "Deploy", "command": "bash deploy.sh" }
]
```

### With Environment Setup:
```json
[
  { "name": "SSH to server", "command": "ssh prod-server" },
  { "name": "Set environment", "command": "export NODE_ENV=production" },
  { "name": "Run deployment", "command": "npm run deploy" }
]
```

## Troubleshooting

### Commands Still Running on Wrong Server
- Ensure "Use persistent SSH session" is checked
- Verify the SSH command is exactly `ssh server-name` (no extra commands)

### Timeout Issues
- Break long-running commands into smaller steps
- Add progress output to long commands
- Consider increasing timeout in executor code if needed

### Debug Mode
Run with `AUTODEPLOY_DEBUG=true` to see:
- Detected shell prompts
- Command execution details
- Real-time SSH output

## Technical Details

- Uses SSH2 library's shell() method for persistent sessions
- Maintains command buffer to detect prompts
- Executes commands sequentially, waiting for prompts
- Handles both stdout and stderr streams
- Cleans up resources properly on completion/error