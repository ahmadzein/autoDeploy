# SSH Authentication Examples

## Common Scenarios

### 1. AWS EC2 Instance with PEM File

```bash
$ autodeploy add-project
? Project name: aws-production-app
? Local project path: /Users/john/projects/my-app
? SSH host: ec2-52-201-234-56.compute-1.amazonaws.com
? SSH username: ec2-user
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/john/Documents/AWS/production-key.pem
? Private key passphrase: [enter for none]
? Remote project path: /home/ec2-user/apps/my-app
? SSH port: 22
```

### 2. Digital Ocean Droplet with Standard SSH Key

```bash
$ autodeploy add-project
? Project name: do-api-server
? Local project path: /Users/jane/work/api
? SSH host: 159.65.234.123
? SSH username: deploy
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/jane/.ssh/id_rsa
? Private key passphrase: ****
? Remote project path: /var/www/api
? SSH port: 22
```

### 3. Google Cloud Platform with Custom Port

```bash
$ autodeploy add-project
? Project name: gcp-microservice
? Local project path: /Users/mike/microservices/auth
? SSH host: 35.237.123.45
? SSH username: mike_admin
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/mike/.ssh/gcp-key
? Private key passphrase: [enter for none]
? Remote project path: /opt/services/auth
? SSH port: 2222
```

### 4. Traditional VPS with Password

```bash
$ autodeploy add-project
? Project name: legacy-app
? Local project path: /Users/sarah/legacy/app
? SSH host: legacy.company.com
? SSH username: admin
? SSH authentication method: Password
? SSH password: ****
? Remote project path: /var/www/html/app
? SSH port: 22
```

### 5. Development Server with Port Forwarding

```bash
$ autodeploy add-project
? Project name: dev-with-database
? Local project path: /Users/tom/dev/webapp
? SSH host: dev.internal.com
? SSH username: developer
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/tom/.ssh/dev-key
? Private key passphrase: [enter for none]
? Remote project path: /home/developer/webapp
? SSH port: 22
? Do you need port forwarding or additional SSH options? Yes
? Port forwarding rules: 5433:localhost:5432
? Additional SSH options: {"keepaliveInterval": 30000}
```

### 6. Monorepo with Mixed Authentication

```bash
# Create monorepo with main key
$ autodeploy create-monorepo
? Monorepo name: platform
? Local repository path: /Users/alex/platform
? SSH host: platform.company.com
? SSH username: deploy
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/alex/.ssh/platform-main.pem

# Add frontend (inherits parent SSH)
$ autodeploy add-sub platform
? Sub-deployment name: frontend
? Relative path: apps/web
? Remote deployment path: /var/www/frontend
? Use same SSH credentials as parent monorepo? Yes

# Add backend with different server
$ autodeploy add-sub platform
? Sub-deployment name: backend
? Relative path: apps/api
? Remote deployment path: /opt/api
? Use same SSH credentials as parent monorepo? No
? SSH host: api.company.com
? SSH username: api-deploy
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/alex/.ssh/api-server.pem
```

## Switching Authentication Methods

### From Password to Key

```bash
$ autodeploy edit my-project
? What would you like to do? Edit SSH credentials
? SSH host: server.example.com  # Keep existing
? SSH username: deploy          # Keep existing
? SSH port: 22                  # Keep existing
? SSH authentication method: Private Key (PEM file)  # Change
? Path to private key file: /Users/you/.ssh/new-deploy-key.pem
? Private key passphrase: ****
```

### From Key to Password

```bash
$ autodeploy edit my-project
? What would you like to do? Edit SSH credentials
? SSH host: server.example.com  # Keep existing
? SSH username: deploy          # Keep existing  
? SSH port: 22                  # Keep existing
? SSH authentication method: Password  # Change
? SSH password: ****
```

## Advanced Configurations

### Using SSH Config File

If you have complex SSH configurations in `~/.ssh/config`:

```
Host myserver
    HostName 192.168.1.100
    User deploy
    Port 2222
    IdentityFile ~/.ssh/special-key
    ProxyJump bastion
```

Use in AutoDeploy:
```bash
$ autodeploy add-project
? SSH host: myserver  # Uses SSH config
```

### Multiple Port Forwards

For complex forwarding needs, configure in SSH config:

```
Host db-tunnel
    HostName production.server.com
    User deploy
    IdentityFile ~/.ssh/prod-key
    LocalForward 5433 db1.internal:5432
    LocalForward 5434 db2.internal:5432
    LocalForward 6380 redis.internal:6379
```

## Troubleshooting Examples

### Key Permission Issues

```bash
# Wrong permissions
$ ls -la /path/to/key.pem
-rw-rw-r-- 1 user user 1679 Jan 1 10:00 key.pem

# Fix permissions
$ chmod 600 /path/to/key.pem

# Verify
$ ls -la /path/to/key.pem
-rw------- 1 user user 1679 Jan 1 10:00 key.pem
```

### Testing Connection

```bash
# Test with SSH directly
$ ssh -i /path/to/key.pem user@host

# Test with verbose output
$ ssh -vvv -i /path/to/key.pem user@host

# Test port forwarding
$ ssh -i /path/to/key.pem -L 5433:localhost:5432 user@host
```

### Key Format Issues

```bash
# Check key format
$ head -n 1 /path/to/key.pem

# Should show one of:
-----BEGIN RSA PRIVATE KEY-----
-----BEGIN OPENSSH PRIVATE KEY-----
-----BEGIN EC PRIVATE KEY-----

# Convert PuTTY key to OpenSSH
$ puttygen putty-key.ppk -O private-openssh -o openssh-key.pem
```

## Security Best Practices

### 1. Dedicated Deployment Keys

```bash
# Generate deployment-specific key
$ ssh-keygen -t ed25519 -f ~/.ssh/autodeploy-prod -C "autodeploy@production"

# Add to server
$ ssh-copy-id -i ~/.ssh/autodeploy-prod.pub user@server
```

### 2. Key Rotation

```bash
# Generate new key
$ ssh-keygen -t ed25519 -f ~/.ssh/autodeploy-prod-new

# Add new key to server
$ ssh-copy-id -i ~/.ssh/autodeploy-prod-new.pub user@server

# Update AutoDeploy
$ autodeploy edit production-app
> Edit SSH credentials
> Update private key path

# Remove old key from server
$ ssh user@server
$ sed -i '/old-key-comment/d' ~/.ssh/authorized_keys
```

### 3. Passphrase Protection

```bash
# Add passphrase to existing key
$ ssh-keygen -p -f ~/.ssh/deployment-key

# Use ssh-agent to avoid repeated passphrase entry
$ ssh-add ~/.ssh/deployment-key
```