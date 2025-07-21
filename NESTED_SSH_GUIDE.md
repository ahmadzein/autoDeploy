# Nested SSH Deployment Guide

AutoDeploy executes each deployment step in a separate SSH session. This means that if you need to SSH to another server and run commands there, you need to structure your commands appropriately.

## Problem

When you have steps like:
1. `ssh tis-staging-api` 
2. `bash updateStaging.sh`

The second command runs on the original server, not on `tis-staging-api`, because the SSH session from step 1 is closed after execution.

## Solutions

### Option 1: Single Command with SSH (Recommended)

Combine the SSH and the command into a single step:

```bash
ssh tis-staging-api 'cd /path/to/project && bash updateStaging.sh'
```

Or if you need to pass environment variables:

```bash
ssh tis-staging-api 'cd /path/to/project && export VAR=value && bash updateStaging.sh'
```

### Option 2: Create a Deployment Script

Create a script on your jump server that handles the nested deployment:

**On your jump server, create `deploy-api.sh`:**
```bash
#!/bin/bash
ssh tis-staging-api << 'EOF'
cd /path/to/project
bash updateStaging.sh
EOF
```

Then in AutoDeploy, just run:
```bash
bash deploy-api.sh
```

### Option 3: Use SSH Config with ProxyJump

Configure your SSH to automatically jump through the first server.

**In your local `~/.ssh/config`:**
```
Host staging-jump
    HostName your-jump-server.com
    User your-username
    IdentityFile /path/to/key.pem

Host tis-staging-api
    HostName internal-api-server
    User api-user
    ProxyJump staging-jump
```

Then you can directly SSH to the final server in AutoDeploy's configuration.

### Option 4: Use SSH Agent Forwarding

If you need to use your SSH keys on the jump server:

1. Enable SSH agent forwarding in your AutoDeploy SSH configuration
2. Use a single command: `ssh -A tis-staging-api 'bash updateStaging.sh'`

## Example AutoDeploy Configuration

For a monorepo sub-deployment that needs nested SSH:

**Deployment Steps:**

1. **Name:** Deploy to API Server
   **Command:** `ssh tis-staging-api 'cd /var/www/api && git pull && npm install && pm2 restart api'`
   **Working Directory:** `.`

Or with a deployment script:

1. **Name:** Run Deployment Script
   **Command:** `bash scripts/deploy-to-api.sh`
   **Working Directory:** `.`

## Best Practices

1. **Use SSH keys** on the jump server for passwordless authentication to the final server
2. **Test your SSH chain** manually before configuring in AutoDeploy
3. **Use absolute paths** in your commands since the working directory might be different
4. **Add error handling** to your scripts to catch connection failures

## Troubleshooting

If your deployment hangs:
- The SSH command might be waiting for a password (use SSH keys instead)
- The nested SSH might be waiting for host key verification (add `-o StrictHostKeyChecking=no` for known hosts)
- Check if the command needs a TTY (add `-t` flag to ssh command)