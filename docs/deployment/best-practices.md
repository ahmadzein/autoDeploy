# Deployment Best Practices

Follow these best practices to ensure reliable, secure, and efficient deployments with AutoDeploy.

## Pre-Deployment Checklist

### 1. Version Control
- ✅ All changes committed to Git
- ✅ Code reviewed and tested locally
- ✅ Feature branch merged to main/master
- ✅ No uncommitted changes in working directory

### 2. Testing
- ✅ Unit tests passing
- ✅ Integration tests passing
- ✅ Build process successful locally
- ✅ No linting errors or warnings

### 3. Environment Preparation
- ✅ Environment variables configured
- ✅ Database migrations ready
- ✅ Dependencies up to date
- ✅ Server resources adequate

## Deployment Strategies

### Blue-Green Deployment

Minimize downtime by maintaining two production environments:

```yaml
Steps:
1. Deploy to inactive environment (green)
2. Run smoke tests on green
3. Switch router/load balancer to green
4. Keep blue as instant rollback option
```

**AutoDeploy Configuration:**
```javascript
{
  "deploymentSteps": [
    {
      "name": "Deploy to Green",
      "command": "rsync -av --exclude='.env' ./ /var/www/green/",
      "workingDir": "."
    },
    {
      "name": "Install Dependencies",
      "command": "npm ci --production",
      "workingDir": "/var/www/green"
    },
    {
      "name": "Run Tests",
      "command": "npm test",
      "workingDir": "/var/www/green"
    },
    {
      "name": "Switch to Green",
      "command": "ln -sfn /var/www/green /var/www/current",
      "workingDir": "."
    }
  ]
}
```

### Rolling Deployment

Update servers one at a time to maintain availability:

```yaml
Benefits:
- Zero downtime
- Gradual rollout
- Easy rollback
- Load distribution
```

### Canary Deployment

Test new version with small percentage of users:

```yaml
Steps:
1. Deploy to 5% of servers
2. Monitor metrics for 30 minutes
3. If stable, increase to 25%
4. Continue gradual rollout
5. Full deployment after validation
```

## Security Best Practices

### 1. Credential Management

**Never store credentials in:**
- ❌ Source code
- ❌ Git repositories
- ❌ Unencrypted files
- ❌ Client-side code

**Always use:**
- ✅ Environment variables
- ✅ Encrypted storage
- ✅ Key management services
- ✅ AutoDeploy's built-in encryption

### 2. SSH Security

**Use SSH Keys:**
```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "deploy@example.com"

# Add to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# Configure in AutoDeploy
autodeploy config set ssh.key ~/.ssh/id_ed25519
```

**Restrict SSH Access:**
```bash
# Limit SSH to deployment IPs only
# /etc/ssh/sshd_config
AllowUsers deploy@192.168.1.0/24
PermitRootLogin no
PasswordAuthentication no
```

### 3. File Permissions

Set appropriate permissions post-deployment:

```javascript
{
  "deploymentSteps": [
    {
      "name": "Set Permissions",
      "command": "find . -type f -exec chmod 644 {} \\; && find . -type d -exec chmod 755 {} \\;",
      "workingDir": "/var/www/app"
    },
    {
      "name": "Secure Config",
      "command": "chmod 600 .env config/*.json",
      "workingDir": "/var/www/app"
    }
  ]
}
```

## Performance Optimization

### 1. Asset Optimization

**Build and Minify:**
```javascript
{
  "name": "Build Assets",
  "command": "npm run build:production",
  "workingDir": "."
}
```

**Enable Compression:**
```javascript
{
  "name": "Compress Assets",
  "command": "gzip -9 -k dist/*.{js,css,html}",
  "workingDir": "."
}
```

### 2. Caching Strategy

**Clear Caches Intelligently:**
```javascript
{
  "deploymentSteps": [
    {
      "name": "Clear App Cache",
      "command": "php artisan cache:clear",
      "continueOnError": true
    },
    {
      "name": "Warm Cache",
      "command": "php artisan cache:warmup",
      "continueOnError": true
    }
  ]
}
```

### 3. Database Optimization

**Run Migrations Safely:**
```javascript
{
  "name": "Database Migration",
  "command": "php artisan migrate --force",
  "continueOnError": false
}
```

## Error Handling

### 1. Graceful Failures

**Use Continue on Error Wisely:**
```javascript
{
  "deploymentSteps": [
    {
      "name": "Optional Cache Clear",
      "command": "redis-cli FLUSHALL",
      "continueOnError": true  // OK if Redis is down
    },
    {
      "name": "Critical Service Start",
      "command": "systemctl start app",
      "continueOnError": false  // Must succeed
    }
  ]
}
```

### 2. Health Checks

**Implement Health Endpoints:**
```javascript
{
  "name": "Health Check",
  "command": "curl -f http://localhost/health || exit 1",
  "workingDir": "."
}
```

### 3. Rollback Strategy

**Automatic Rollback on Failure:**
```javascript
{
  "deploymentSteps": [
    {
      "name": "Backup Current",
      "command": "cp -r /var/www/current /var/www/backup",
      "workingDir": "."
    },
    {
      "name": "Deploy New",
      "command": "rsync -av ./ /var/www/current/",
      "workingDir": "."
    },
    {
      "name": "Test Deployment",
      "command": "npm test || (rm -rf /var/www/current && mv /var/www/backup /var/www/current && exit 1)",
      "workingDir": "/var/www/current"
    }
  ]
}
```

## Monitoring and Logging

### 1. Deployment Logs

**Centralize Logs:**
```javascript
{
  "name": "Log Deployment",
  "command": "echo '[$(date)] Deployment complete' >> /var/log/deployments.log",
  "workingDir": "."
}
```

### 2. Performance Metrics

**Track Deployment Times:**
```javascript
{
  "deploymentSteps": [
    {
      "name": "Start Timer",
      "command": "echo $(date +%s) > /tmp/deploy_start",
      "workingDir": "."
    },
    // ... other steps ...
    {
      "name": "Log Duration",
      "command": "echo \"Deployment took $(($(date +%s) - $(cat /tmp/deploy_start))) seconds\"",
      "workingDir": "."
    }
  ]
}
```

### 3. Notifications

**Send Deployment Notifications:**
```javascript
{
  "name": "Notify Team",
  "command": "curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL -d '{\"text\":\"Deployment complete!\"}'",
  "continueOnError": true
}
```

## Common Patterns

### Node.js Application

```javascript
{
  "deploymentSteps": [
    {
      "name": "Pull Latest Code",
      "command": "git pull origin main"
    },
    {
      "name": "Install Dependencies",
      "command": "npm ci --production"
    },
    {
      "name": "Run Migrations",
      "command": "npm run migrate"
    },
    {
      "name": "Build Application",
      "command": "npm run build"
    },
    {
      "name": "Restart Service",
      "command": "pm2 restart ecosystem.config.js --update-env"
    },
    {
      "name": "Health Check",
      "command": "sleep 5 && curl -f http://localhost:3000/health"
    }
  ]
}
```

### Docker Application

```javascript
{
  "deploymentSteps": [
    {
      "name": "Pull Latest Code",
      "command": "git pull origin main"
    },
    {
      "name": "Build Image",
      "command": "docker-compose build --no-cache"
    },
    {
      "name": "Stop Current",
      "command": "docker-compose down"
    },
    {
      "name": "Start New",
      "command": "docker-compose up -d"
    },
    {
      "name": "Cleanup",
      "command": "docker system prune -f"
    }
  ]
}
```

### Static Website

```javascript
{
  "deploymentSteps": [
    {
      "name": "Pull Latest Code",
      "command": "git pull origin main"
    },
    {
      "name": "Install Dependencies",
      "command": "npm ci"
    },
    {
      "name": "Build Site",
      "command": "npm run build"
    },
    {
      "name": "Deploy to Web Root",
      "command": "rsync -av --delete dist/ /var/www/html/"
    },
    {
      "name": "Clear CDN Cache",
      "command": "curl -X POST https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache",
      "continueOnError": true
    }
  ]
}
```

## Maintenance Windows

### Planning Deployments

**Best Times to Deploy:**
- ✅ Low traffic periods
- ✅ After thorough testing
- ✅ With team available
- ✅ Not on Fridays!

**Deployment Schedule:**
```javascript
// Check if safe to deploy
{
  "name": "Check Deployment Window",
  "command": "[ $(date +%u) -lt 5 ] || (echo 'No Friday deployments!' && exit 1)"
}
```

## Troubleshooting Deployments

### Common Issues

1. **Permission Denied**
   ```bash
   # Fix: Ensure proper ownership
   sudo chown -R deploy:deploy /var/www/app
   ```

2. **Port Already in Use**
   ```bash
   # Fix: Find and kill process
   lsof -i :3000
   kill -9 <PID>
   ```

3. **Out of Memory**
   ```bash
   # Fix: Increase swap or upgrade server
   sudo fallocate -l 4G /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

## Deployment Checklist Template

Create a checklist for your team:

```markdown
## Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Environment variables set
- [ ] Database backup taken

## Deployment
- [ ] Deployment started
- [ ] Services stopped gracefully
- [ ] Code deployed
- [ ] Database migrated
- [ ] Services restarted

## Post-Deployment
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Performance verified
- [ ] Users notified
- [ ] Monitoring alerts configured
```

## Next Steps

- Review [Security Best Practices](../security/overview.md)
- Learn about [Pipeline Configuration](./pipeline.md)
- Explore [Deployment Strategies](./strategies.md)
- Set up [Monitoring](../troubleshooting/common-issues.md)