# SSH Execution Methods in AutoDeploy

AutoDeploy provides multiple methods for executing SSH commands, each suited for different use cases.

## 1. Standard Execution (Default)

Each step runs in a separate SSH connection. This is the default behavior.

**Use when:**
- Commands are independent
- You don't need to maintain state between commands
- Simple deployments with no nested SSH

**Example:**
```bash
Step 1: npm install
Step 2: npm run build
Step 3: pm2 restart app
```

## 2. Interactive Shell Session (Persistent Session Enabled)

All steps run in a single interactive shell session, maintaining state between commands.

**Use when:**
- You need to maintain environment variables between steps
- You need to stay in nested SSH sessions
- Commands depend on the state from previous commands
- You need to run interactive programs

**Enable by:** Checking "Use persistent SSH session" in your project/sub-deployment settings

**Example:**
```bash
Step 1: ssh tis-staging-api      # SSH to another server
Step 2: cd /var/www/api          # Changes directory on tis-staging-api
Step 3: git pull                 # Runs on tis-staging-api in /var/www/api
Step 4: npm install              # Still on tis-staging-api
Step 5: pm2 restart api          # Still on tis-staging-api
```

## 3. Nested SSH Detection (Automatic)

AutoDeploy automatically detects when you're trying to SSH to another server and combines subsequent commands.

**Automatically triggered when:**
- A step contains only `ssh server-name` (without a command)
- Subsequent steps are meant to run on that server

**Example:**
```bash
Step 1: ssh tis-staging-api
Step 2: bash updateStaging.sh
```

Gets automatically converted to:
```bash
ssh tis-staging-api 'bash updateStaging.sh'
```

## 4. Combined Commands (Recommended for Nested SSH)

Instead of relying on session persistence, combine your commands into a single SSH command.

**Best practice for nested SSH:**
```bash
# Instead of:
Step 1: ssh remote-server
Step 2: cd /path/to/app
Step 3: ./deploy.sh

# Use:
Step 1: ssh remote-server 'cd /path/to/app && ./deploy.sh'
```

## How the Interactive Shell Works

When persistent session is enabled:

1. **Single SSH Connection**: Opens one SSH connection and keeps it alive
2. **Interactive Shell**: Starts an interactive shell (like when you SSH manually)
3. **Sequential Execution**: Runs each command and waits for the prompt
4. **State Preservation**: Environment variables, directory changes, and nested SSH sessions persist
5. **Smart Prompt Detection**: Detects when a command completes by looking for shell prompts
6. **Error Handling**: Captures output and errors for each command separately

### Technical Details

The interactive shell executor:
- Uses SSH2's `shell()` method instead of `exec()`
- Maintains a persistent stream to the remote shell
- Detects common shell prompts ($ # > etc.)
- Handles command buffering and output parsing
- Supports debug mode with `AUTODEPLOY_DEBUG=true`

## Troubleshooting

### Commands Hang

If commands hang in persistent session mode:
- The shell might be waiting for input
- Try adding `-n` flag to commands that might read from stdin
- For SSH commands, use `-o BatchMode=yes`

### State Not Maintained

If state isn't maintained between steps:
- Ensure "Use persistent SSH session" is checked
- Check that all steps are in the same deployment (not split across sub-deployments)
- Verify in logs that "Using interactive shell session" appears

### Nested SSH Issues

For complex nested SSH scenarios:
1. Use SSH agent forwarding: `ssh -A server`
2. Configure SSH ControlMaster in your ~/.ssh/config
3. Use jump hosts: `ssh -J jump-server target-server`

## Performance Considerations

- **Interactive Shell**: Slightly slower startup but faster for multiple commands
- **Standard Execution**: Faster for single commands but overhead for each connection
- **Nested SSH Detection**: Adds parsing overhead but prevents hanging

## Best Practices

1. **Use Combined Commands** for simple nested SSH
2. **Enable Persistent Session** for complex stateful deployments
3. **Test Locally** - SSH to your server and run the commands manually first
4. **Use Debug Mode** - Set `AUTODEPLOY_DEBUG=true` to see exactly what's happening
5. **Keep It Simple** - If possible, avoid nested SSH by deploying directly to the target server