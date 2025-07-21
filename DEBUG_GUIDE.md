# AutoDeploy Debug Guide

## Enable Debug Mode

To see detailed logs for debugging deployment issues, especially with persistent SSH sessions:

### Method 1: Environment Variable

```bash
# Start GUI with debug mode
AUTODEPLOY_DEBUG=true node src/cli/interface.js gui

# Or with the API already running
AUTODEPLOY_DEBUG=true curl http://localhost:7779/api/deployments/your-project-name
```

### Method 2: Check API Logs

When the GUI is running, check the terminal where you started it for debug logs:

```
[DEBUG] Sub-deployment api - persistentSession: true
[DEBUG] Project this-is-language-staging - persistentSession: false
[DEBUG] Using persistent session: true
[PERSISTENT] Connecting to SSH...
[PERSISTENT] SSH connection established
[PERSISTENT] Executing combined script with 2 steps
```

### Method 3: Enable Persistent Session Logs

The persistent executor logs detailed information about:
- SSH connection status
- Generated bash script (in debug mode)
- Command execution and exit codes
- Script output and errors

## Common Issues

### 1. SSH Command Hangs

If your deployment hangs on an SSH command:
- The nested SSH might be waiting for password/key
- The command might need a TTY
- Check if the command needs `-t` flag: `ssh -t server`

### 2. Commands Not Found

If commands aren't found in nested SSH:
- The PATH might be different
- Try using full paths: `/usr/bin/command`
- Or source profile: `ssh server 'source ~/.bashrc && command'`

### 3. State Not Maintained

If state isn't maintained between steps:
- Ensure "Use persistent SSH session" is checked
- Verify in logs: "Using persistent SSH session"
- Check that all steps are in the same sub-deployment

## Debug Output Example

With `AUTODEPLOY_DEBUG=true`, you'll see:

```
[PERSISTENT] Generated script:
--- SCRIPT START ---
#!/bin/bash
set -e

# Source necessary files
source ~/.bashrc 2>/dev/null || true
source ~/.profile 2>/dev/null || true
source ~/.nvm/nvm.sh 2>/dev/null || true

# Change to project directory
cd /var/www/api

# Step 1: ssh to api
echo "STEP_START:0:ssh to api"
echo "[PERSISTENT] Executing: ssh tis-staging-api"
echo "[PERSISTENT] Current directory: $(pwd)"
echo "[PERSISTENT] Running command: ssh tis-staging-api"
ssh tis-staging-api
STEP_EXIT_CODE=$?
echo "[PERSISTENT] Command exit code: $STEP_EXIT_CODE"
...
--- SCRIPT END ---
```

This helps identify:
- What commands are actually being run
- Where the script might be hanging
- Exit codes and error messages