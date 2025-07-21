# SSH Authentication Guide for AutoDeploy

## Table of Contents
- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [CLI Usage](#cli-usage)
- [GUI Usage](#gui-usage)
- [Port Forwarding](#port-forwarding)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

AutoDeploy supports multiple SSH authentication methods to connect to your deployment servers securely. This guide covers all authentication options and how to use them effectively.

## Authentication Methods

### 1. Password Authentication
Traditional username and password authentication. While simple to use, it's less secure than key-based authentication.

**When to use:**
- Quick testing or development environments
- When key-based authentication is not available
- Internal servers with strict firewall rules

### 2. Private Key Authentication
Uses cryptographic key pairs for authentication. More secure and recommended for production environments.

**Supported key types:**
- PEM files (commonly used with AWS EC2, Google Cloud, Azure)
- OpenSSH keys (id_rsa, id_ed25519, id_ecdsa)
- Any OpenSSH-compatible private key format

**Key benefits:**
- No passwords transmitted over network
- Can be used with SSH agents
- Supports passphrase protection
- Required by many cloud providers

## New Features (2025)

### Enhanced SSH Key Support
- **Multiple key formats**: PEM, OpenSSH, Ed25519
- **Passphrase support**: Encrypted private keys
- **Key validation**: Automatic permission checking
- **Path resolution**: Supports both absolute and relative paths

### Port Forwarding
- **Multiple forwards**: Comma-separated list of forwards
- **Database access**: Secure tunnels to RDS, CloudSQL, etc.
- **Service access**: Redis, MongoDB, Elasticsearch
- **Internal networks**: Access services on private subnets

### SSH Configuration
- **Custom SSH options**: Via JSON edit mode
- **Keep-alive settings**: Prevent timeout on long deployments
- **Strict host checking**: Configurable for automation
- **Custom ports**: Support for non-standard SSH ports

## CLI Usage

### Adding a Project with SSH Key

```bash
$ autodeploy add-project
```

When prompted for authentication method, select "Private Key (PEM file)":

```
? SSH authentication method: (Use arrow keys)
  Password
❯ Private Key (PEM file)
```

Then provide your key details:
```
? Path to private key file: /Users/johndoe/Documents/ssh/production-server.pem
? Private key passphrase (press enter if none): ****
```

### Common Key Locations

**AWS EC2:**
```
/Users/[username]/Downloads/my-instance.pem
/Users/[username]/Documents/AWS/keys/production.pem
```

**Standard SSH Keys:**
```
/Users/[username]/.ssh/id_rsa
/Users/[username]/.ssh/id_ed25519
/Users/[username]/.ssh/id_ecdsa
```

**Custom Locations:**
```
/path/to/your/custom-key.pem
/home/[username]/keys/deployment-key
```

### Editing SSH Credentials

To change authentication method or update credentials:

```bash
$ autodeploy edit my-project
```

Select "Edit SSH credentials" and you can:
- Switch between password and key authentication
- Update key path or password
- Change host, username, or port
- Add/remove key passphrase

### Monorepo Projects

When creating a monorepo, the SSH credentials are inherited by all sub-deployments by default:

```bash
$ autodeploy create-monorepo
```

Sub-deployments can override the parent's SSH settings:

```bash
$ autodeploy add-sub my-monorepo
? Use same SSH credentials as parent monorepo? No
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/johndoe/.ssh/special-backend-key.pem
```

## GUI Usage

### Adding Projects in GUI

1. Click "Add Project" button
2. Fill in project details
3. In SSH Configuration section, select authentication method:
   - **Password**: Enter password in the password field
   - **Private Key**: Enter the full path to your key file

### Visual Indicators

- Radio buttons clearly show selected authentication method
- Conditional fields appear based on your selection
- Help text under fields provides guidance
- Test Connection button validates your credentials

### Editing Projects

1. Click on a project to edit
2. In SSH Configuration section, you can switch auth methods
3. Changes are validated before saving
4. Test connection to verify new credentials

## Port Forwarding

AutoDeploy supports SSH port forwarding for database connections and other services.

### Configuration During Setup

When adding a project, you'll be asked:
```
? Do you need port forwarding or additional SSH options? Yes
? Port forwarding rules (e.g., "7777:database.host.com:5432"): 5433:localhost:5432
```

### Format
```
localPort:remoteHost:remotePort
```

### Examples

**PostgreSQL Database:**
```
5433:localhost:5432
5433:db.internal.company.com:5432
```

**MySQL Database:**
```
3307:localhost:3306
3307:mysql-prod.internal:3306
```

**Multiple Forwards:**
Currently supports one forward per project. For multiple forwards, use SSH config file.

## Security Best Practices

### 1. File Permissions

Ensure your private key has correct permissions:
```bash
chmod 600 /path/to/your/private-key.pem
```

AutoDeploy will warn if permissions are too open.

### 2. Use Passphrases

Always use a passphrase for your private keys:
```bash
ssh-keygen -p -f /path/to/your/private-key
```

### 3. Key Storage

- Store keys outside of project directories
- Never commit keys to version control
- Use dedicated keys for deployment (not your personal SSH key)
- Rotate keys periodically

### 4. Encrypted Storage

AutoDeploy encrypts all credentials including:
- Passwords
- Private key paths
- Passphrases
- SSH connection details

### 5. Recommended Key Types

For new keys, use Ed25519 (most secure and efficient):
```bash
ssh-keygen -t ed25519 -f ~/.ssh/deployment-key
```

## Troubleshooting

### Common Issues

#### 1. "Permission denied (publickey)"

**Causes:**
- Wrong key file path
- Incorrect file permissions
- Key not authorized on server

**Solutions:**
```bash
# Check key permissions
ls -la /path/to/key.pem

# Fix permissions
chmod 600 /path/to/key.pem

# Test SSH connection manually
ssh -i /path/to/key.pem user@host
```

#### 2. "Failed to read private key"

**Causes:**
- File doesn't exist
- No read permissions
- Using ~ in path (use absolute path)

**Solutions:**
```bash
# Check file exists
ls -la /path/to/key.pem

# Use absolute path
# Bad: ~/Documents/key.pem
# Good: /Users/johndoe/Documents/key.pem
```

#### 3. "Bad passphrase"

**Causes:**
- Incorrect passphrase
- Key doesn't have a passphrase but one was provided

**Solutions:**
- Leave passphrase empty if key has no passphrase
- Double-check passphrase
- Test with ssh command directly

#### 4. "Host key verification failed"

**Causes:**
- First connection to server
- Server key changed

**Solutions:**
```bash
# Connect manually first to accept host key
ssh -i /path/to/key.pem user@host

# Or add to known_hosts
ssh-keyscan -H hostname >> ~/.ssh/known_hosts
```

### Debug Mode

Test your connection with verbose output:
```bash
ssh -vvv -i /path/to/key.pem user@host
```

## Examples

### Example 1: AWS EC2 Deployment

```bash
$ autodeploy add-project
? Project name: my-aws-app
? Local project path: /Users/johndoe/projects/my-app
? SSH host: ec2-52-201-234-156.compute-1.amazonaws.com
? SSH username: ubuntu
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/johndoe/Documents/AWS/my-app-key.pem
? Private key passphrase: [press enter if none]
? Remote project path: /var/www/my-app
? SSH port: 22
? Enable port forwarding? Yes
? Port forwarding rules: 5433:localhost:5432

✓ SSH connection test successful
✓ Project "my-aws-app" added successfully
```

### Example 2: Google Cloud Platform

```bash
$ autodeploy add-project
? Project name: gcp-backend
? Local project path: /Users/johndoe/projects/backend
? SSH host: 35.123.456.789
? SSH username: johndoe
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/johndoe/.ssh/google_compute_engine
? Private key passphrase: [hidden]
? Remote project path: /home/johndoe/apps/backend
? SSH port: 22
? Enable port forwarding? Yes
? Port forwarding rules: 3307:10.128.0.2:3306,6380:10.128.0.3:6379

# Deploy with database access
autodeploy deploy gcp-backend
# Now you can access:
# - MySQL at localhost:3307
# - Redis at localhost:6380
```

### Example 3: Digital Ocean with Custom Port

```bash
$ autodeploy add-project
? Project name: do-droplet-app
? Local project path: /Users/johndoe/projects/api
? SSH host: 159.65.234.123
? SSH username: deploy
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/johndoe/.ssh/do-deploy-key
? Private key passphrase: [enter for none]
? Remote project path: /home/deploy/api
? SSH port: 2222
```

### Example 4: Monorepo with Multiple Keys

```bash
# Create monorepo with main key
$ autodeploy create-monorepo
? Monorepo name: my-platform
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/johndoe/.ssh/platform-main.pem

# Add frontend with same key (inherited)
$ autodeploy add-sub my-platform
? Sub-deployment name: frontend
? Use same SSH credentials as parent monorepo? Yes

# Add backend with different key
$ autodeploy add-sub my-platform
? Sub-deployment name: backend
? Use same SSH credentials as parent monorepo? No
? SSH host: backend.internal.com
? SSH username: backend-deploy
? SSH authentication method: Private Key (PEM file)  
? Path to private key file: /Users/johndoe/.ssh/backend-key.pem
```

### Example 5: Azure VM with Ed25519 Key

```bash
$ autodeploy add-project
? Project name: azure-frontend
? Local project path: /Users/johndoe/projects/frontend
? SSH host: my-azure-vm.westus2.cloudapp.azure.com
? SSH username: azureuser
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/johndoe/.ssh/id_ed25519
? Private key passphrase: [hidden]
? Remote project path: /home/azureuser/apps/frontend
? SSH port: 22
? Enable port forwarding? No

# Edit to add custom SSH options
autodeploy edit azure-frontend --json
# Select "Config Only" and add:
{
  "ssh": {
    "sshOptions": {
      "ServerAliveInterval": 60,
      "ServerAliveCountMax": 3
    }
  }
}
```

### Example 6: Database Access via Port Forwarding

```bash
# PostgreSQL on RDS
$ autodeploy add-project
? Project name: production-app
? SSH host: bastion.example.com
? Enable port forwarding? Yes
? Port forwarding rules: 5433:prod-db.abc123.us-east-1.rds.amazonaws.com:5432

# Now during deployment, you can access:
psql -h localhost -p 5433 -U dbuser -d myapp

# Multiple databases
? Port forwarding rules: 5433:postgres.internal:5432,3307:mysql.internal:3306,6380:redis.internal:6379
```

### Example 7: Troubleshooting Connection Issues

```bash
# Test SSH connection manually
ssh -vvv -i /path/to/key.pem user@host

# Check key permissions
ls -la ~/.ssh/
# Should show: -rw------- (600) for private keys

# Fix permissions if needed
chmod 600 ~/.ssh/my-key.pem

# Test with AutoDeploy
autodeploy test-connection my-project
```

## Advanced Configuration

### JSON Configuration for Complex Setups

```json
{
  "name": "complex-project",
  "ssh": {
    "host": "server.example.com",
    "username": "deploy",
    "privateKeyPath": "/Users/me/.ssh/deploy-key",
    "passphrase": "encrypted-passphrase-here",
    "port": 22,
    "sshOptions": {
      "ServerAliveInterval": 60,
      "ServerAliveCountMax": 3,
      "StrictHostKeyChecking": "no",
      "UserKnownHostsFile": "/dev/null"
    }
  },
  "localPath": "/Users/me/projects/app",
  "remotePath": "/var/www/app"
}
```

### Using with CI/CD Systems

```yaml
# GitHub Actions Example
- name: Deploy with AutoDeploy
  env:
    AUTODEPLOY_SECRET: ${{ secrets.AUTODEPLOY_SECRET }}
  run: |
    # Install AutoDeploy
    npm install -g autodeploy
    
    # Configure SSH key
    echo "${{ secrets.DEPLOY_KEY }}" > deploy-key.pem
    chmod 600 deploy-key.pem
    
    # Deploy
    autodeploy deploy production-app
```

## Best Practices Summary

1. **Always use absolute paths** for SSH keys
2. **Set correct permissions** (600) on private key files
3. **Use passphrases** for additional security
4. **Enable port forwarding** only when needed
5. **Test connections** before deploying
6. **Use SSH config** for complex setups
7. **Rotate keys** regularly
8. **Monitor deployment logs** for security issues

Now you can connect to the database locally on port 5433 during deployment.

## Advanced Configuration

### SSH Config File Integration

For complex SSH setups, you can use your `~/.ssh/config` file:

```
Host my-deploy-server
    HostName 192.168.1.100
    User deploy
    Port 2222
    IdentityFile ~/.ssh/special-key
    ForwardAgent yes
    LocalForward 5433 localhost:5432
```

Then in AutoDeploy:
```
? SSH host: my-deploy-server
```

### Multiple SSH Hops

For bastion/jump hosts, configure in `~/.ssh/config`:

```
Host production
    HostName 10.0.1.50
    User deploy
    ProxyJump bastion
    IdentityFile ~/.ssh/production-key

Host bastion
    HostName bastion.company.com
    User ubuntu
    IdentityFile ~/.ssh/bastion-key
```

## Migration Guide

### Migrating from Password to Key Authentication

1. Generate or obtain your SSH key
2. Add public key to server's `~/.ssh/authorized_keys`
3. Test connection: `ssh -i /path/to/key user@host`
4. Update AutoDeploy:
   ```bash
   $ autodeploy edit my-project
   > Edit SSH credentials
   > Authentication method: Private Key (PEM file)
   ```

### Updating Key Paths

If you move your keys:
```bash
$ autodeploy edit my-project
> Edit SSH credentials
> Update the private key path
> Test connection
> Save
```

## Support

### Getting Help

```bash
# General help
$ autodeploy --help

# Command-specific help
$ autodeploy add-project --help
$ autodeploy edit --help
```

### Reporting Issues

If you encounter issues with SSH authentication:

1. Test connection manually with ssh command
2. Check file permissions
3. Verify key format (should start with `-----BEGIN`)
4. Report issue at: https://github.com/ahmadzein/autodeploy/issues

Include:
- AutoDeploy version
- SSH authentication method
- Error messages (sanitized)
- OS version