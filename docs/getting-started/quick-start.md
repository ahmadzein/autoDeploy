# Quick Start Tutorial

This tutorial will guide you through setting up your first deployment with AutoDeploy in under 5 minutes.

## Prerequisites

- AutoDeploy installed ([Installation Guide](./installation.md))
- A project to deploy (local Git repository)
- SSH access to a remote server
- Basic familiarity with command line

## Step 1: Add Your First Project

### Using CLI

```bash
autodeploy add-project
```

You'll be prompted for:
1. **Project name**: `my-website`
2. **Local path**: `/Users/you/projects/my-website`
3. **SSH host**: `example.com`
4. **SSH username**: `deploy`
5. **SSH password**: `********`
6. **Remote path**: `/var/www/my-website`
7. **SSH port**: `22` (press Enter for default)

### Using GUI

1. Launch AutoDeploy GUI
2. Click "Add Project" in the sidebar
3. Fill in the form:
   - Project Name: `my-website`
   - Local Path: Browse to your project folder
   - SSH Configuration: Enter your server details
   - Click "Test SSH Connection" to verify
4. Click "Add Project"

## Step 2: Configure Deployment Steps

### Common Web Application Pipeline

When prompted "Do you want to add deployment steps?", select Yes and add:

```
Step 1:
- Name: Pull latest changes
- Command: git pull origin main
- Working directory: .
- Continue on error: No

Step 2:
- Name: Install dependencies
- Command: npm install
- Working directory: .
- Continue on error: No

Step 3:
- Name: Build application
- Command: npm run build
- Working directory: .
- Continue on error: No

Step 4:
- Name: Restart application
- Command: pm2 restart app
- Working directory: .
- Continue on error: Yes
```

### Common Static Site Pipeline

```
Step 1:
- Name: Pull latest changes
- Command: git pull origin main

Step 2:
- Name: Build static files
- Command: npm run build

Step 3:
- Name: Copy to web root
- Command: cp -r dist/* /var/www/html/
```

## Step 3: Deploy Your Project

### Using CLI

```bash
# Deploy by name
autodeploy deploy my-website

# Or use interactive selection
autodeploy deploy
```

### Using GUI

1. Go to Projects view
2. Find your project card
3. Click the "Deploy" button
4. Watch real-time logs in the deployment console

## What Happens During Deployment?

1. **Git Operations** (if local directory is a Git repo):
   - Commits any uncommitted changes
   - Pushes to remote repository

2. **SSH Connection**:
   - Connects to your server securely
   - Changes to your project directory

3. **Pipeline Execution**:
   - Runs each step in sequence
   - Shows real-time output
   - Stops on error (unless "continue on error" is set)

## Example Output

```
📦 Deploying my-website...

✓ Changes committed and pushed successfully

🚀 Starting deployment pipeline...

[12:34:56] Step 1/4: Pull latest changes
Already up to date.
✓ Pull latest changes ✓

[12:35:02] Step 2/4: Install dependencies
added 125 packages in 15s
✓ Install dependencies ✓

[12:35:18] Step 3/4: Build application
Creating optimized production build...
Build completed in 30s
✓ Build application ✓

[12:35:48] Step 4/4: Restart application
[PM2] Restarting app...
✓ Restart application ✓

📊 Deployment Summary:
Total steps: 4
Successful: 4
Failed: 0

✅ Deployment completed successfully!
```

## Verification

After deployment, verify your application:

1. **Check Application Status**:
   ```bash
   ssh deploy@example.com "pm2 status"
   ```

2. **View Logs**:
   ```bash
   ssh deploy@example.com "pm2 logs app --lines 50"
   ```

3. **Test in Browser**:
   - Visit your website URL
   - Check all functionality works

## Managing Multiple Projects

### List All Projects
```bash
autodeploy list
```

### Deploy Different Projects
```bash
autodeploy deploy project-1
autodeploy deploy project-2
```

### Edit Project Steps
```bash
autodeploy edit my-website
```

## Tips for Success

### 1. Start Simple
Begin with basic steps and add complexity gradually:
- First deployment: Just pull changes
- Next: Add build step
- Finally: Add restart/reload

### 2. Test SSH Connection First
Always verify SSH access before adding a project:
```bash
ssh deploy@example.com "echo 'Connection successful'"
```

### 3. Use Version Control
Ensure your project is in Git:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:you/project.git
```

### 4. Set Up PM2 (for Node.js apps)
On your server:
```bash
npm install -g pm2
pm2 start app.js --name my-app
pm2 save
pm2 startup
```

## Common Deployment Patterns

### Node.js Application
```yaml
1. git pull origin main
2. npm install --production
3. npm run build
4. pm2 restart app
```

### Python Application
```yaml
1. git pull origin main
2. pip install -r requirements.txt
3. python manage.py migrate
4. systemctl restart gunicorn
```

### Docker Application
```yaml
1. git pull origin main
2. docker-compose build
3. docker-compose down
4. docker-compose up -d
```

### Static Website
```yaml
1. git pull origin main
2. npm run build
3. rsync -av dist/ /var/www/html/
```

## Next Steps

Now that you've completed your first deployment:

1. **Add More Projects**: Set up deployment for all your projects
2. **Customize Pipelines**: Create specific deployment flows
3. **Explore Advanced Features**:
   - [Environment Variables](../deployment/pipeline.md#environment-variables)
   - [Pre/Post Hooks](../deployment/pipeline.md#hooks)
   - [Conditional Steps](../deployment/pipeline.md#conditional-execution)
4. **Set Up CI/CD**: Integrate with GitHub Actions
5. **Learn Best Practices**: Read our [deployment guide](../deployment/best-practices.md)

## Getting Help

- **Documentation**: Browse the full [documentation](../index.md)
- **Examples**: See more [CLI examples](../cli/examples.md)
- **Troubleshooting**: Check [common issues](../troubleshooting/common-issues.md)
- **Community**: Join our [Discord server](https://discord.gg/autodeploy)