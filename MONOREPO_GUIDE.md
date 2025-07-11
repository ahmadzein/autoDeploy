# Monorepo Deployment Guide

AutoDeploy now supports monorepo deployments, allowing you to manage multiple sub-projects within a single repository with coordinated deployments.

## Overview

Monorepo support enables:
- Single repository with multiple deployable sub-projects
- Centralized configuration with project-specific settings
- Coordinated deployments across sub-projects
- Shared SSH credentials with optional overrides
- Automatic git commits at the monorepo root before deployments

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

Monorepo projects are stored with this structure:
```
~/.autodeploy/projects/
  my-monorepo/
    config.json           # Main monorepo config
    sub-deployments/      # Sub-project configurations
      frontend/
        config.json       # Frontend config
        local-steps.json  # Frontend local steps
        remote-steps.json # Frontend remote steps
        history.json      # Frontend deployment history
        stats.json        # Frontend statistics
      backend/
        config.json       # Backend config
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