# AutoDeploy CLI Reference

## Table of Contents
- [Global Options](#global-options)
- [Commands](#commands)
  - [add-project](#add-project)
  - [list](#list)
  - [deploy](#deploy)
  - [edit](#edit)
  - [remove](#remove)
  - [history](#history)
  - [stats](#stats)
  - [create-monorepo](#create-monorepo)
  - [add-sub](#add-sub)
  - [list-sub](#list-sub)
  - [edit-sub](#edit-sub)
  - [remove-sub](#remove-sub)
  - [duplicate-project](#duplicate-project)
  - [duplicate-sub](#duplicate-sub)
  - [reorder-steps](#reorder-steps)
  - [gui](#gui)
  - [help](#help)

## Global Options

```bash
autodeploy [command] [options]

Options:
  -V, --version     Display version number
  -h, --help        Display help for command
```

## Commands

### add-project

Create a new deployment project with SSH configuration.

```bash
autodeploy add-project
```

**Interactive Prompts:**
- Project name
- Local project path
- SSH host
- SSH username
- SSH authentication method (Password/Private Key)
- SSH password or private key path
- Private key passphrase (if applicable)
- SSH port (default: 22)
- Port forwarding rules (optional)
- Remote project path
- Local deployment steps (optional)
- Remote deployment steps (optional)

**Example:**
```bash
$ autodeploy add-project
? Project name: my-api
? Local project path: /Users/me/projects/api
? SSH host: api.example.com
? SSH username: deploy
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/me/.ssh/deploy-key.pem
? Private key passphrase: [hidden]
? SSH port: 22
? Enable port forwarding? Yes
? Port forwarding rules: 5433:localhost:5432
? Remote project path: /var/www/api
```

### list

List all configured projects.

```bash
autodeploy list
```

**Output Example:**
```
Projects:

1. my-api
   Type: Regular Project
   Local: /Users/me/projects/api
   Remote: deploy@api.example.com:/var/www/api
   Last deployed: 2 hours ago
   Deployments: 45

2. my-platform (Monorepo)
   Type: Monorepo
   Local: /Users/me/projects/platform
   Sub-deployments: frontend, backend, worker
   Last deployed: Yesterday
   Deployments: 23
```

### deploy

Deploy a project to its configured remote server.

```bash
autodeploy deploy [project-name] [options]
```

**Options:**
- `--all` - Deploy all sub-projects (monorepo only)
- `--sub <name>` - Deploy specific sub-project (monorepo only)
- `--skip-git` - Skip git commit/push (not recommended)

**Examples:**
```bash
# Interactive project selection
autodeploy deploy

# Deploy specific project
autodeploy deploy my-api

# Deploy all monorepo sub-projects
autodeploy deploy my-platform --all

# Deploy specific sub-project
autodeploy deploy my-platform --sub frontend
```

### edit

Edit project configuration, steps, or SSH credentials.

```bash
autodeploy edit <project-name> [options]
```

**Options:**
- `--json` - Edit configuration files directly in JSON format

**Interactive Mode Options:**
- Edit local steps
- Edit remote steps
- Edit SSH credentials
- Edit as JSON
- Cancel

**JSON Mode File Options:**
- Project Settings (config.json)
- Local Steps (local-steps.json)
- Remote Steps (remote-steps.json)
- View History (history.json) - Read Only
- View Stats (stats.json) - Read Only

**Examples:**
```bash
# Interactive edit
autodeploy edit my-api

# JSON edit mode
autodeploy edit my-api --json
```

### remove

Remove a project and all its configuration.

```bash
autodeploy remove <project-name>
```

**Example:**
```bash
$ autodeploy remove old-project
? Are you sure you want to remove "old-project"? Yes
✓ Project "old-project" removed successfully
```

### history

View deployment history for a project.

```bash
autodeploy history <project-name> [options]
```

**Options:**
- `-l, --limit <number>` - Number of deployments to show (default: 10)
- `-v, --verbose` - Show detailed output for all steps

**Examples:**
```bash
# View last 10 deployments
autodeploy history my-api

# View last 20 deployments with details
autodeploy history my-api --limit 20 --verbose

# View monorepo main project history
autodeploy history my-platform
```

**Output Example:**
```
Deployment History for my-api:

1. 12/07/2025, 10:30:45
   Status: ✓ Success
   Duration: 45.2s
   Steps:
     ✓ Build Application (5.1s)
     ✓ Run Tests (10.3s)
     ✓ Deploy to Server (29.8s)

2. 12/07/2025, 08:15:23
   Status: ✗ Failed
   Duration: 12.5s
   Error: Step failed: Run Tests
```

### stats

View global deployment statistics across all projects.

```bash
autodeploy stats
```

**Output Example:**
```
AutoDeploy Statistics

Total Projects: 8
Active Projects: 6
Total Deployments: 234
Deployments Today: 12

Last Deployment:
  Project: my-api
  Time: 2 hours ago
  Status: Success

Most Active Projects:
  1. my-api (89 deployments)
  2. frontend-app (56 deployments)
  3. backend-service (45 deployments)
```

### create-monorepo

Create a new monorepo project for managing multiple sub-deployments.

```bash
autodeploy create-monorepo
```

**Interactive Prompts:**
- Monorepo name
- Local repository path
- SSH configuration (same as add-project)

**Example:**
```bash
$ autodeploy create-monorepo
? Monorepo name: my-platform
? Local repository path: /Users/me/projects/platform
? SSH host: platform.example.com
? SSH username: deploy
? SSH authentication method: Private Key (PEM file)
? Path to private key file: /Users/me/.ssh/platform-key.pem
```

### add-sub

Add a sub-deployment to an existing monorepo.

```bash
autodeploy add-sub <monorepo-name>
```

**Interactive Prompts:**
- Sub-deployment name
- Relative path from monorepo root
- Remote deployment path
- Use same SSH credentials as parent? (Yes/No)
- If No: Complete SSH configuration
- Local steps configuration
- Remote steps configuration

**Example:**
```bash
$ autodeploy add-sub my-platform
? Sub-deployment name: frontend
? Relative path from monorepo root: apps/frontend
? Remote deployment path: /var/www/frontend
? Use same SSH credentials as parent monorepo? Yes
```

### list-sub

List all sub-deployments in a monorepo.

```bash
autodeploy list-sub <monorepo-name>
```

**Output Example:**
```
Sub-deployments for my-platform:

1. frontend
   Path: apps/frontend
   Remote: /var/www/frontend
   Last deployed: 2 hours ago

2. backend
   Path: apps/backend
   Remote: /var/www/backend
   Last deployed: Yesterday

3. worker
   Path: services/worker
   Remote: /opt/worker
   Last deployed: 3 days ago
```

### edit-sub

Edit a specific sub-deployment configuration.

```bash
autodeploy edit-sub <monorepo-name> <sub-name> [options]
```

**Options:**
- `--json` - Edit in JSON format

**Example:**
```bash
# Interactive edit
autodeploy edit-sub my-platform frontend

# JSON edit
autodeploy edit-sub my-platform frontend --json
```

### remove-sub

Remove a sub-deployment from a monorepo.

```bash
autodeploy remove-sub <monorepo-name> <sub-name>
```

**Example:**
```bash
$ autodeploy remove-sub my-platform old-service
? Are you sure you want to remove sub-deployment "old-service"? Yes
✓ Sub-deployment "old-service" removed from my-platform
```

### duplicate-project

Create a copy of an existing project with a new name.

```bash
autodeploy duplicate-project <source-project>
```

**Interactive Prompts:**
- New project name
- Update local path? (Yes/No)
- If Yes: New local path
- Update SSH settings? (Yes/No)
- If Yes: Complete SSH configuration

**Example:**
```bash
$ autodeploy duplicate-project production-api
? New project name: staging-api
? Update local path? No
? Update SSH settings? Yes
? SSH host: staging.example.com
```

### duplicate-sub

Create a copy of a sub-deployment within a monorepo.

```bash
autodeploy duplicate-sub <monorepo-name> <source-sub>
```

**Interactive Prompts:**
- New sub-deployment name
- Update relative path? (Yes/No)
- Update remote path? (Yes/No)
- Update SSH settings? (Yes/No)

**Example:**
```bash
$ autodeploy duplicate-sub my-platform frontend
? New sub-deployment name: frontend-v2
? Update relative path? Yes
? New relative path: apps/frontend-v2
```

### reorder-steps

Reorder deployment steps for a project or sub-deployment.

```bash
autodeploy reorder-steps <project-name> [options]
```

**Options:**
- `--sub <name>` - Reorder steps for a specific sub-deployment

**Interactive Process:**
1. Choose step type (local/remote)
2. Select step to move
3. Choose new position
4. Repeat or finish

**Example:**
```bash
# Reorder steps for regular project
autodeploy reorder-steps my-api

# Reorder steps for sub-deployment
autodeploy reorder-steps my-platform --sub frontend
```

### gui

Start the AutoDeploy GUI web interface.

```bash
autodeploy gui [options]
```

**Options:**
- `--port <number>` - GUI port (default: 8080)
- `--api-port <number>` - API server port (default: 3000)
- `--host <string>` - Host to bind (default: localhost)
- `--production` - Run in production mode
- `--no-open` - Don't open browser automatically

**Examples:**
```bash
# Start with defaults
autodeploy gui

# Custom ports
autodeploy gui --port 8080 --api-port 3001

# Production mode on all interfaces
autodeploy gui --production --host 0.0.0.0
```

### help

Display help information for any command.

```bash
autodeploy help [command]
```

**Examples:**
```bash
# General help
autodeploy help

# Command-specific help
autodeploy help deploy
autodeploy help create-monorepo
```

## Configuration Files

AutoDeploy stores all configuration in `~/.autodeploy/projects/` with the following structure:

```
~/.autodeploy/projects/
├── my-project/
│   ├── config.json       # Project settings & SSH credentials
│   ├── local-steps.json  # Local deployment steps
│   ├── remote-steps.json # Remote deployment steps
│   ├── history.json      # Deployment history
│   ├── logs.json        # Detailed deployment logs
│   └── stats.json       # Deployment statistics
└── my-monorepo/
    ├── config.json
    ├── history.json
    ├── logs.json
    ├── stats.json
    └── sub-deployments/
        ├── frontend/
        │   ├── config.json
        │   ├── local-steps.json
        │   ├── remote-steps.json
        │   ├── history.json
        │   ├── logs.json
        │   └── stats.json
        └── backend/
            └── ... (same structure)
```

All files are encrypted using AES-256-GCM encryption.

## Environment Variables

- `AUTODEPLOY_SECRET` - Custom encryption key (recommended for production)
- `AUTODEPLOY_API_PORT` - Default API port for GUI
- `AUTODEPLOY_GUI_PORT` - Default GUI port

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Configuration error
- `3` - Connection error
- `4` - Deployment error

## Tips and Best Practices

1. **Use SSH keys** instead of passwords for better security
2. **Test connections** before saving with GUI's test button
3. **Use absolute paths** for SSH keys and local directories
4. **Set proper permissions** (600) on private key files
5. **Use --verbose flag** when troubleshooting deployments
6. **Regular backups** of ~/.autodeploy directory
7. **Use port forwarding** for secure database access during deployment
8. **Configure steps carefully** - test commands manually first
9. **Use continue on error** sparingly - only for non-critical steps
10. **Monitor deployment history** regularly for failures