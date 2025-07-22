# Monorepo Deployment Guide

AutoDeploy now supports monorepo deployments, allowing you to manage multiple sub-projects within a single repository with coordinated deployments.

## Overview

Monorepo support enables:
- Single repository with multiple deployable sub-projects
- Centralized configuration with project-specific settings
- Coordinated deployments across sub-projects
- Shared SSH credentials with optional overrides
- Automatic git commits at the monorepo root before deployments
- Individual deployment history for each sub-project
- Main project deployment tracking with aggregated statistics
- Separate logs and configuration files for better organization

## Quick Start

### 1. Create a Monorepo Project

```bash
autodeploy create-monorepo
```

This will prompt you for:
- Monorepo name
- Local repository root path
- SSH connection details

### 2. Add Sub-Deployments

```bash
autodeploy add-sub <monorepo-name>
```

For each sub-deployment, specify:
- Sub-project name (e.g., "frontend", "backend", "api")
- Relative path from monorepo root (e.g., "apps/frontend")
- Remote deployment path
- Whether to use parent SSH credentials or custom ones
- Deployment steps (local and remote)

### 3. Deploy

Deploy individual sub-projects:
```bash
autodeploy deploy <monorepo-name> --sub frontend
```

Deploy all sub-projects:
```bash
autodeploy deploy <monorepo-name> --all
```

Deploy selected sub-projects interactively:
```bash
autodeploy deploy <monorepo-name>
```

## GUI Features

### Monorepo Management Interface
The GUI provides comprehensive monorepo management capabilities:

#### Creating Monorepos
- Navigate to Projects → Add Project → Create Monorepo
- Configure monorepo settings and SSH credentials
- Set display name for user-friendly identification

#### Managing Sub-Deployments
- Click on monorepo project card to view sub-deployments
- **Edit Monorepo Settings**: Click "Edit Settings" button to modify:
  - Display name
  - Local and remote paths
  - SSH credentials
  - Port forwarding options
- Add new sub-deployments with dedicated form
- Edit existing sub-deployments with:
  - **Form Mode**: Inline step editing with pencil icon
  - **JSON Mode**: Direct configuration editing
  - Real-time validation
  - Multiple edit modes (full, config only, steps only)

#### Step Editing Features
- **Inline Editing**: Click pencil icon on any step
- Edit fields:
  - Step name
  - Command
  - Working directory
  - Continue on error flag
  - Interactive flag
- Save or cancel changes with dedicated buttons

#### Deployment Interface
- Visual sub-deployment selection
- Deploy all or specific sub-deployments
- Real-time deployment logs with color coding
- Interactive prompt support for dynamic inputs
- Deployment history tracking

## Commands Reference

### `autodeploy create-monorepo`
Creates a new monorepo project configuration.

### `autodeploy add-sub <project-name>`
Adds a sub-deployment to an existing monorepo.

### `autodeploy list-sub <project-name>`
Lists all sub-deployments in a monorepo with their configuration.

### `autodeploy deploy <project-name> [options]`
Deploy a monorepo project.

Options:
- `--sub <name>`: Deploy only the specified sub-deployment
- `--all`: Deploy all sub-deployments
- No options: Interactive selection of sub-deployments

## Configuration Structure

Monorepo projects are stored with this enhanced structure:
```
~/.autodeploy/projects/
  my-monorepo/
    config.json           # Main monorepo config
    history.json          # Main project deployment history (NEW)
    logs.json            # Aggregated deployment logs (NEW)
    stats.json           # Overall deployment statistics (NEW)
    sub-deployments/      # Sub-project configurations
      frontend/
        config.json       # Frontend config & SSH settings
        local-steps.json  # Frontend local build/test steps
        remote-steps.json # Frontend remote deployment steps
        history.json      # Frontend deployment history
        logs.json        # Frontend deployment logs (NEW)
        stats.json        # Frontend deployment statistics
      backend/
        config.json       # Backend config & SSH settings
        ...
```

## Example: Full-Stack Application

### 1. Create the Monorepo

```bash
$ autodeploy create-monorepo

Monorepo project name: myapp
Local monorepo root path: /Users/me/projects/myapp
SSH host: myserver.com
SSH username: deploy
SSH password: ****
SSH port: 22

✓ Monorepo project "myapp" created successfully!
```

### 2. Add Frontend Sub-Deployment

```bash
$ autodeploy add-sub myapp

Sub-deployment name: frontend
Relative path from monorepo root: apps/web
Remote deployment path: /var/www/myapp-frontend
Use same SSH credentials as parent project? Yes

Add deployment steps now? Yes

Add local steps? Yes
Local step name: Build Frontend
Command to run: npm run build
Working directory: .

Add remote steps? Yes
Remote step name: Install Dependencies
Command to run: npm ci --production
Working directory: .

Remote step name: Restart Service
Command to run: pm2 restart frontend
Working directory: .

✓ Sub-deployment "frontend" added to "myapp"
```

### 3. Add Backend Sub-Deployment

```bash
$ autodeploy add-sub myapp

Sub-deployment name: backend
Relative path from monorepo root: apps/api
Remote deployment path: /var/www/myapp-backend
Use same SSH credentials as parent project? Yes

Add local steps? Yes
Local step name: Build Backend
Command to run: npm run build
Working directory: .

Add remote steps? Yes
Remote step name: Install Dependencies
Command to run: npm ci --production
Working directory: .

Remote step name: Run Migrations
Command to run: npm run migrate
Working directory: .

Remote step name: Restart Service
Command to run: pm2 restart backend
Working directory: .

✓ Sub-deployment "backend" added to "myapp"
```

### 4. List Configuration

```bash
$ autodeploy list

Configured Projects:

1. myapp [MONOREPO]
   Local: /Users/me/projects/myapp
   Remote: deploy@myserver.com:/var/www
   Sub-deployments: 2
     - frontend: /var/www/myapp-frontend
     - backend: /var/www/myapp-backend
```

### 5. Deploy Everything

```bash
$ autodeploy deploy myapp --all

🚀 Deploying myapp (2 sub-deployments)...

📝 Committing monorepo changes...
✓ Changes committed and pushed

📦 Deploying frontend...
[Local] Build Frontend ✓
[Remote] Install Dependencies ✓
[Remote] Restart Service ✓

📦 Deploying backend...
[Local] Build Backend ✓
[Remote] Install Dependencies ✓
[Remote] Run Migrations ✓
[Remote] Restart Service ✓

✓ Monorepo deployment completed!
```

## Best Practices

1. **Organize Your Monorepo**
   ```
   my-monorepo/
     apps/
       frontend/
       backend/
       mobile/
     packages/
       shared-utils/
       ui-components/
     libs/
       database/
       auth/
   ```

2. **Use Consistent Naming**
   - Sub-deployment names should match directory names
   - Use descriptive names (frontend, backend, api, admin)

3. **Shared Dependencies**
   - Place shared code in packages/ or libs/
   - Build shared packages in local steps before sub-projects

4. **Deployment Order**
   - Deploy shared libraries first
   - Deploy backend services before frontend
   - Use `--all` for correct order or deploy individually

5. **Environment Variables**
   - Store environment-specific configs on the server
   - Don't commit sensitive data to the repository

## Advanced Usage

### Custom SSH per Sub-Deployment

If different sub-projects deploy to different servers:

```bash
$ autodeploy add-sub myapp

Sub-deployment name: admin
Relative path: apps/admin
Remote deployment path: /var/www/admin
Use same SSH credentials as parent project? No

SSH host: admin-server.com
SSH username: admin-deploy
SSH password: ****
SSH port: 22
```

### Selective Deployments

Deploy only what changed:
```bash
# Only frontend
autodeploy deploy myapp --sub frontend

# Backend and API
autodeploy deploy myapp
# Then select: [x] backend [x] api [ ] frontend
```

### View Sub-Deployment History

```bash
$ autodeploy history myapp/frontend

Deployment History for myapp/frontend:
1. 2 minutes ago - Success (45s)
2. 1 hour ago - Success (52s)
3. Yesterday - Failed (12s)
```

## New Features (2025)

### Enhanced Deployment Tracking
- **Main project history**: Tracks overall monorepo deployments
- **Sub-project history**: Individual deployment history for each sub-project
- **Deployment logs**: Detailed step outputs stored in separate logs.json files
- **Statistics**: Deployment counts, success rates, and timing metrics

### SSH Key Authentication
- **Full SSH key support**: PEM files, OpenSSH keys, Ed25519
- **Passphrase protection**: Encrypted private keys supported
- **Inheritance model**: Sub-projects can inherit or override SSH settings
- **Port forwarding**: Database and service tunnels during deployment

### CLI Enhancements
```bash
# View monorepo statistics
autodeploy stats

# Detailed deployment history
autodeploy history my-monorepo --verbose

# Edit specific sub-deployment
autodeploy edit-sub my-monorepo frontend

# Duplicate sub-deployment
autodeploy duplicate-sub my-monorepo frontend

# JSON editing mode
autodeploy edit my-monorepo --json
```

### Deployment Process Improvements
1. **Automatic Git operations**: Commits at monorepo root before deployment
2. **Parallel sub-deployments**: Deploy multiple sub-projects simultaneously
3. **Error handling**: Continue deployment of other sub-projects on failure
4. **Real-time logging**: See deployment progress as it happens

## Advanced Examples

### Example 1: Microservices Architecture
```bash
# Create monorepo for microservices
autodeploy create-monorepo
? Monorepo name: microservices-platform
? Local repository path: /Users/me/platform
? SSH host: k8s-master.example.com
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/me/.ssh/k8s-deploy.pem

# Add services
autodeploy add-sub microservices-platform
? Sub-deployment name: auth-service
? Relative path: services/auth
? Remote path: /opt/services/auth

autodeploy add-sub microservices-platform
? Sub-deployment name: user-service
? Relative path: services/user
? Remote path: /opt/services/user

# Deploy all services
autodeploy deploy microservices-platform --all
```

### Example 2: Multi-Environment Monorepo
```bash
# Different SSH credentials per environment
autodeploy add-sub production-app
? Sub-deployment name: frontend-prod
? Use same SSH credentials as parent monorepo? No
? SSH host: prod-frontend.example.com
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/me/.ssh/prod-key.pem

autodeploy add-sub production-app
? Sub-deployment name: frontend-staging
? Use same SSH credentials as parent monorepo? No
? SSH host: staging-frontend.example.com
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/me/.ssh/staging-key.pem
```

### Example 3: Complex Deployment Steps
```bash
# Local steps for building shared dependencies
Local Steps:
- name: "Install Root Dependencies"
  command: "npm install"
  workingDir: "."
  
- name: "Build Shared Libraries"
  command: "npm run build:shared"
  workingDir: "packages/shared"
  
- name: "Run All Tests"
  command: "npm test"
  workingDir: "."
  continueOnError: false

# Remote steps for sub-project
Remote Steps:
- name: "Pull Latest Code"
  command: "git pull origin main"
  
- name: "Install Dependencies"
  command: "npm ci --production"
  workingDir: "apps/backend"
  
- name: "Run Migrations"
  command: "npm run migrate:prod"
  workingDir: "apps/backend"
  
- name: "Restart Service"
  command: "pm2 restart backend"
```

## Troubleshooting

### "Project is not a monorepo"
- Ensure you created the project with `create-monorepo`
- Regular projects cannot be converted to monorepos

### Sub-deployment not found
- Check the exact name with `autodeploy list-sub <project>`
- Names are case-sensitive

### Git commit fails
- Ensure the monorepo root is a git repository
- Check for uncommitted changes blocking the deployment
- Use `--skip-git` flag if needed (not recommended)

### Path issues
- Use relative paths from monorepo root for sub-projects
- Ensure working directories in steps are correct
- Test commands locally first

## Migration from Regular Projects

If you have separate projects that should be a monorepo:

1. Create the monorepo structure locally
2. Move projects into subdirectories
3. Create new monorepo config with `autodeploy create-monorepo`
4. Add each sub-project with `autodeploy add-sub`
5. Remove old individual project configs

## Future Enhancements

Planned features for monorepo support:
- Dependency graph for deployment order
- Parallel sub-deployment execution
- Change detection for selective deployments
- Rollback coordination across sub-projects
- Shared deployment steps
- GUI support for monorepo management