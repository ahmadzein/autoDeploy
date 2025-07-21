# AutoDeploy Troubleshooting Guide

## Table of Contents
- [SSH Authentication Issues](#ssh-authentication-issues)
- [Connection Problems](#connection-problems)
- [Deployment Failures](#deployment-failures)
- [GUI Issues](#gui-issues)
- [Configuration Problems](#configuration-problems)
- [Performance Issues](#performance-issues)
- [Deployment History Issues](#deployment-history-issues)
- [Monorepo Issues](#monorepo-issues)
- [JSON Editor Issues](#json-editor-issues)

## SSH Authentication Issues

### Problem: "Permission denied (publickey)"

**Symptoms:**
- SSH connection fails with public key error
- Manual SSH works but AutoDeploy fails

**Solutions:**

1. **Verify key path is absolute:**
   ```bash
   # Bad: ~/Documents/key.pem
   # Good: /Users/john/Documents/key.pem
   ```

2. **Check key permissions:**
   ```bash
   ls -la /path/to/key.pem
   # Should show: -rw------- (600)
   
   # Fix if needed:
   chmod 600 /path/to/key.pem
   ```

3. **Test manually:**
   ```bash
   ssh -i /path/to/key.pem user@host
   ```

4. **Verify key is authorized:**
   ```bash
   # On server:
   cat ~/.ssh/authorized_keys | grep "your-key-comment"
   ```

### Problem: "Bad passphrase"

**Symptoms:**
- Key requires passphrase but wrong one provided
- Key has no passphrase but one was entered

**Solutions:**

1. **Leave passphrase empty if key has none:**
   - Press Enter without typing when prompted

2. **Test passphrase:**
   ```bash
   ssh-keygen -y -f /path/to/key.pem
   # Will prompt for passphrase if needed
   ```

3. **Remove passphrase (if desired):**
   ```bash
   ssh-keygen -p -f /path/to/key.pem
   # Enter old passphrase
   # Press Enter twice for no passphrase
   ```

### Problem: "No such file or directory"

**Symptoms:**
- AutoDeploy can't find private key file
- Path looks correct but fails

**Solutions:**

1. **Use absolute paths:**
   ```bash
   # Get absolute path:
   realpath ~/Documents/key.pem
   # Output: /Users/john/Documents/key.pem
   ```

2. **Check file exists:**
   ```bash
   ls -la /exact/path/to/key.pem
   ```

3. **Check for typos:**
   ```bash
   # Tab completion helps:
   ls /Users/john/Doc[TAB]
   ```

### Problem: Key format not supported

**Symptoms:**
- "invalid format" errors
- Key works with other tools but not AutoDeploy

**Solutions:**

1. **Check key format:**
   ```bash
   head -n 1 /path/to/key.pem
   ```

2. **Convert PuTTY to OpenSSH:**
   ```bash
   # Install putty-tools if needed
   puttygen key.ppk -O private-openssh -o key.pem
   ```

3. **Convert old RSA to new format:**
   ```bash
   ssh-keygen -p -m PEM -f old-key
   ```

## Connection Problems

### Problem: Port forwarding not working

**Symptoms:**
- Database connection fails during deployment
- Local port not accessible

**Solutions:**

1. **Check port availability:**
   ```bash
   lsof -i :5433
   # Should show nothing if port is free
   ```

2. **Test forwarding manually:**
   ```bash
   ssh -i key.pem -L 5433:database.host:5432 user@server
   # In another terminal:
   psql -h localhost -p 5433
   ```

3. **Use different local port:**
   ```bash
   # During setup:
   ? Port forwarding rules: 5434:database.host:5432
   ```

### Problem: Connection timeout

**Symptoms:**
- SSH connection hangs
- Times out after long wait

**Solutions:**

1. **Check firewall:**
   ```bash
   # Test basic connectivity
   nc -zv host 22
   ```

2. **Try different port:**
   ```bash
   # If SSH is on non-standard port
   ? SSH port: 2222
   ```

3. **Check SSH service:**
   ```bash
   # On server:
   sudo systemctl status sshd
   ```

## Deployment Failures

### Problem: "nothing to commit" stops deployment

**Note:** This should be fixed in latest version.

**Solutions:**

1. **Update AutoDeploy:**
   ```bash
   brew upgrade autodeploy
   ```

2. **Make a small change:**
   ```bash
   echo "" >> README.md
   git add . && git commit -m "trigger deploy"
   ```

### Problem: Commands not found on server

**Symptoms:**
- "pm2: command not found"
- "npm: command not found"
- Works in SSH but not deployment

**Solutions:**

1. **Path is loaded in deployment** (fixed in latest version)

2. **Use full paths in commands:**
   ```bash
   # Instead of: pm2 restart app
   # Use: /home/user/.npm/bin/pm2 restart app
   ```

3. **Source profile in step:**
   ```bash
   # Command: source ~/.bashrc && pm2 restart app
   ```

## GUI Issues

### Problem: Can't switch auth methods

**Symptoms:**
- Radio buttons don't work
- Can't change from password to key

**Solutions:**

1. **Clear browser cache:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

2. **Check console for errors:**
   - F12 → Console tab

3. **Use JSON edit mode:**
   - Edit project → JSON Mode
   - Manually update SSH section

### Problem: Test connection button disabled

**Symptoms:**
- Button stays gray
- Can't test SSH connection

**Solutions:**

1. **Fill all required fields:**
   - Host, username, and auth credentials
   - For key auth: key path required
   - For password: password required

2. **Check field validation:**
   - No spaces in host
   - Valid port number

## Configuration Problems

### Problem: Lost SSH credentials after edit

**Symptoms:**
- Password disappears
- Key path lost

**Solutions:**

1. **Re-enter credentials:**
   - Security feature: passwords not shown
   - Must re-enter when editing

2. **Use JSON mode to verify:**
   ```json
   "ssh": {
     "host": "server.com",
     "username": "deploy",
     "privateKeyPath": "/path/to/key.pem"
   }
   ```

### Problem: Migration issues from old format

**Symptoms:**
- Projects missing after update
- Can't see old projects

**Solutions:**

1. **Check backup:**
   ```bash
   ls ~/.autodeploy/projects.json.backup
   ```

2. **Manual migration:**
   ```bash
   node /path/to/autodeploy/src/config/migrate.js
   ```

3. **Restore from backup:**
   ```bash
   cp ~/.autodeploy/projects.json.backup ~/.autodeploy/projects.json
   # Restart AutoDeploy
   ```

## Performance Issues

### Problem: Slow key operations

**Symptoms:**
- Long delay when using keys
- Hangs during connection

**Solutions:**

1. **Use ssh-agent:**
   ```bash
   # Add key to agent
   ssh-add /path/to/key.pem
   
   # List loaded keys
   ssh-add -l
   ```

2. **Disable DNS lookup:**
   ```bash
   # In project SSH options:
   {"GSSAPIAuthentication": "no", "UseDNS": "no"}
   ```

## Getting Help

### Gather Information

Before reporting issues:

1. **Version info:**
   ```bash
   autodeploy --version
   node --version
   ```

2. **Test manually:**
   ```bash
   ssh -vvv -i key.pem user@host
   ```

3. **Check logs:**
   - Browser console (F12)
   - Terminal output

### Report Issues

1. GitHub Issues: https://github.com/ahmadzein/autodeploy/issues
2. Include:
   - OS and version
   - AutoDeploy version
   - Error messages
   - Steps to reproduce

### Debug Mode

Run with verbose output:
```bash
autodeploy gui --debug
```

Check API directly:
```bash
curl http://localhost:3000/api/health
```

## Deployment History Issues

### Problem: History not showing

**Symptoms:**
- No deployment history displayed
- History command returns empty

**Solutions:**

1. **Check if history file exists:**
   ```bash
   ls ~/.autodeploy/projects/my-project/history.json
   ```

2. **Verify deployment completed:**
   - Deployments are only recorded after completion
   - Check if deployment was interrupted

3. **For monorepos:**
   - Main project history: `autodeploy history my-monorepo`
   - Sub-project history: Check in sub-deployments folder

### Problem: Missing deployment logs

**Symptoms:**
- History shows deployment but no step details
- Verbose flag doesn't show output

**Solutions:**

1. **Check logs.json file:**
   ```bash
   ls ~/.autodeploy/projects/my-project/logs.json
   ```

2. **Old deployments:**
   - Pre-2025 deployments don't have separate logs
   - Step details were in history.json

## Monorepo Issues

### Problem: "Project is not a monorepo"

**Symptoms:**
- Can't add sub-deployments
- Deploy command doesn't recognize --sub flag

**Solutions:**

1. **Verify project type:**
   ```bash
   autodeploy edit my-project --json
   # Check for "type": "monorepo"
   ```

2. **Create as monorepo:**
   ```bash
   # Regular projects can't be converted
   autodeploy create-monorepo
   ```

### Problem: Sub-deployment SSH issues

**Symptoms:**
- Main project deploys but sub-project fails
- Different servers need different keys

**Solutions:**

1. **Override SSH settings:**
   ```bash
   autodeploy add-sub my-monorepo
   # Choose "No" for inheriting SSH settings
   ```

2. **Edit sub-deployment:**
   ```bash
   autodeploy edit-sub my-monorepo frontend
   ```

## JSON Editor Issues

### Problem: JSON validation errors

**Symptoms:**
- Red border in JSON editor
- Can't save changes

**Solutions:**

1. **Common JSON errors:**
   - Missing commas between items
   - Trailing commas (not allowed)
   - Unmatched quotes or brackets

2. **Use online validator:**
   - Copy JSON to jsonlint.com
   - Fix errors shown

### Problem: Changes not saving

**Symptoms:**
- Edit in JSON mode but changes lost
- File shows old content

**Solutions:**

1. **Check file permissions:**
   ```bash
   ls -la ~/.autodeploy/projects/my-project/
   # All files should be -rw------- (600)
   ```

2. **Edit specific file:**
   ```bash
   autodeploy edit my-project --json
   # Choose specific file instead of "Full Config"
   ```

## Common Error Messages

### "ENOENT: no such file or directory"

**Cause:** Working directory doesn't exist

**Fix:** 
- Check step working directories
- Use relative paths from project root
- Ensure directories exist before commands

### "Command failed: npm: command not found"

**Cause:** PATH not loaded in SSH session

**Fix:** 
- AutoDeploy now uses bash login shell
- For older versions, use full paths:
  ```bash
  /usr/local/bin/npm install
  ```

### "nothing to commit, working tree clean"

**Cause:** No changes to commit (not an error)

**Fix:** 
- This is now handled gracefully
- Deployment continues normally
- No action needed

### "Error: connect ECONNREFUSED"

**Cause:** API server not running

**Fix:**
```bash
# Check if API is running
lsof -i :3000

# Restart GUI
autodeploy gui
```