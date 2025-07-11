# CLI Commands Reference

Complete reference for all AutoDeploy CLI commands, options, and usage examples.

## Global Options

These options can be used with any command:

```bash
--version, -v    Show version number
--help, -h       Show help for command
--verbose        Enable verbose output
--quiet          Suppress non-error output
--json           Output in JSON format
```

## Commands Overview

| Command | Description |
|---------|-------------|
| `add-project` | Add a new project configuration |
| `list` | List all configured projects |
| `deploy` | Deploy a project |
| `edit` | Edit project deployment steps |
| `remove` | Remove a project |
| `config` | Manage global configuration |
| `logs` | View deployment logs |
| `test` | Test SSH connection |
| `export` | Export project configuration |
| `import` | Import project configuration |

## Command Details

### `add-project`

Add a new project to AutoDeploy.

```bash
autodeploy add-project [options]
```

**Options:**
- `--name <name>` - Project name (skips prompt)
- `--local <path>` - Local project path
- `--host <host>` - SSH host
- `--user <username>` - SSH username
- `--port <port>` - SSH port (default: 22)
- `--remote <path>` - Remote project path
- `--no-test` - Skip SSH connection test
- `--from-file <file>` - Import from JSON file

**Interactive Mode:**
```bash
$ autodeploy add-project
? Project name: my-app
? Local project path: /home/user/projects/my-app
? SSH host: example.com
? SSH username: deploy
? SSH password: ********
? Remote project path: /var/www/my-app
? SSH port: 22
? Do you want to add deployment steps? Yes
```

**Non-Interactive Mode:**
```bash
autodeploy add-project \
  --name my-app \
  --local /home/user/projects/my-app \
  --host example.com \
  --user deploy \
  --remote /var/www/my-app
```

### `list`

List all configured projects with their details.

```bash
autodeploy list [options]
```

**Options:**
- `--json` - Output in JSON format
- `--details` - Show detailed information
- `--filter <term>` - Filter projects by name

**Examples:**
```bash
# Basic list
$ autodeploy list

Configured Projects:

1. my-website
   Local: /Users/john/projects/my-website
   Remote: john@server.com:/var/www/my-website
   Steps: 4

2. api-backend
   Local: /Users/john/projects/api
   Remote: deploy@api.server.com:/opt/api
   Steps: 6

# Detailed view
$ autodeploy list --details

# JSON output
$ autodeploy list --json > projects.json

# Filter projects
$ autodeploy list --filter api
```

### `deploy`

Deploy a project to its configured remote server.

```bash
autodeploy deploy [project-name] [options]
```

**Options:**
- `--dry-run` - Show what would be executed without deploying
- `--skip-git` - Skip git commit/push
- `--force` - Force deployment even with errors
- `--step <n>` - Start from specific step number
- `--only <steps>` - Run only specific steps (comma-separated)
- `--tag <tag>` - Tag the deployment

**Examples:**
```bash
# Deploy specific project
$ autodeploy deploy my-website

# Interactive selection
$ autodeploy deploy

# Dry run
$ autodeploy deploy my-website --dry-run

# Skip git operations
$ autodeploy deploy my-website --skip-git

# Start from step 3
$ autodeploy deploy my-website --step 3

# Run only specific steps
$ autodeploy deploy my-website --only 1,3,5
```

### `edit`

Edit deployment steps for a project.

```bash
autodeploy edit <project-name> [options]
```

**Options:**
- `--add` - Add new steps
- `--clear` - Clear all steps
- `--reorder` - Reorder existing steps
- `--step <n>` - Edit specific step

**Examples:**
```bash
# Interactive edit
$ autodeploy edit my-website

Current steps for my-website:
1. Pull latest changes: git pull origin main
2. Install dependencies: npm install
3. Build project: npm run build
4. Restart service: pm2 restart app

What would you like to do?
> Add new steps
  Remove a step
  Reorder steps
  Edit a step
  Clear all steps

# Add steps directly
$ autodeploy edit my-website --add

# Clear all steps
$ autodeploy edit my-website --clear
```

### `remove`

Remove a project from AutoDeploy.

```bash
autodeploy remove <project-name> [options]
```

**Options:**
- `--yes, -y` - Skip confirmation prompt
- `--backup` - Create backup before removing

**Examples:**
```bash
# Interactive removal
$ autodeploy remove my-website
? Are you sure you want to remove "my-website"? (y/N)

# Skip confirmation
$ autodeploy remove my-website --yes

# With backup
$ autodeploy remove my-website --backup
✓ Backup created at ~/.autodeploy/backups/my-website-2024-01-15.json
✓ Project "my-website" removed
```

### `config`

Manage global AutoDeploy configuration.

```bash
autodeploy config [subcommand] [options]
```

**Subcommands:**
- `get <key>` - Get configuration value
- `set <key> <value>` - Set configuration value
- `list` - List all configuration
- `reset` - Reset to defaults

**Examples:**
```bash
# View all config
$ autodeploy config list
encryption.algorithm: aes-256-cbc
logs.retention: 30
logs.level: info
ui.theme: auto

# Set config value
$ autodeploy config set logs.level debug
✓ Configuration updated

# Get specific value
$ autodeploy config get logs.retention
30

# Reset to defaults
$ autodeploy config reset
```

### `logs`

View deployment logs.

```bash
autodeploy logs [project-name] [options]
```

**Options:**
- `--lines <n>` - Number of lines to show (default: 50)
- `--follow, -f` - Follow log output
- `--since <date>` - Show logs since date
- `--deployment <id>` - Show specific deployment
- `--failed` - Show only failed deployments

**Examples:**
```bash
# View recent logs
$ autodeploy logs my-website

# Follow logs in real-time
$ autodeploy logs my-website -f

# Show last 100 lines
$ autodeploy logs my-website --lines 100

# Show logs from today
$ autodeploy logs my-website --since "2024-01-15"

# Show only failed deployments
$ autodeploy logs my-website --failed
```

### `test`

Test SSH connection to a server.

```bash
autodeploy test [project-name|host] [options]
```

**Options:**
- `--host <host>` - SSH host
- `--user <username>` - SSH username
- `--port <port>` - SSH port
- `--key <path>` - SSH key path

**Examples:**
```bash
# Test project connection
$ autodeploy test my-website
Testing connection to example.com...
✓ SSH connection successful
✓ Remote directory exists: /var/www/my-website
✓ Write permissions verified

# Test custom connection
$ autodeploy test --host newserver.com --user deploy
```

### `export`

Export project configuration.

```bash
autodeploy export <project-name> [options]
```

**Options:**
- `--output <file>` - Output file (default: stdout)
- `--format <format>` - Output format (json, yaml)
- `--no-secrets` - Exclude sensitive data

**Examples:**
```bash
# Export to file
$ autodeploy export my-website --output my-website.json

# Export without secrets
$ autodeploy export my-website --no-secrets

# Export as YAML
$ autodeploy export my-website --format yaml
```

### `import`

Import project configuration.

```bash
autodeploy import <file> [options]
```

**Options:**
- `--name <name>` - Override project name
- `--merge` - Merge with existing project
- `--dry-run` - Preview import without saving

**Examples:**
```bash
# Import from file
$ autodeploy import my-website.json

# Import with new name
$ autodeploy import template.json --name my-new-project

# Preview import
$ autodeploy import project.json --dry-run
```

## Advanced Usage

### Environment Variables

AutoDeploy recognizes these environment variables:

```bash
AUTODEPLOY_SECRET     # Encryption key for credentials
AUTODEPLOY_CONFIG     # Path to config directory
AUTODEPLOY_LOG_LEVEL  # Log level (debug, info, warn, error)
NO_COLOR              # Disable colored output
```

### Configuration File

Create `.autodeploy.json` in your project root:

```json
{
  "name": "my-project",
  "remote": {
    "host": "example.com",
    "user": "deploy",
    "path": "/var/www/my-project"
  },
  "steps": [
    {
      "name": "Deploy",
      "command": "git pull && npm install && npm run build"
    }
  ]
}
```

### Scripting

Use AutoDeploy in scripts:

```bash
#!/bin/bash
# deploy-all.sh

projects=("website" "api" "admin")

for project in "${projects[@]}"; do
  echo "Deploying $project..."
  autodeploy deploy "$project" --quiet
  
  if [ $? -eq 0 ]; then
    echo "✓ $project deployed successfully"
  else
    echo "✗ $project deployment failed"
    exit 1
  fi
done
```

### Aliases

Add useful aliases to your shell:

```bash
# ~/.bashrc or ~/.zshrc
alias ad='autodeploy'
alias add='autodeploy deploy'
alias adl='autodeploy list'
alias ada='autodeploy add-project'
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Connection error |
| 4 | Deployment error |
| 5 | Authentication error |
| 127 | Command not found |

## See Also

- [CLI Configuration](./configuration.md)
- [CLI Examples](./examples.md)
- [Troubleshooting](../troubleshooting/common-issues.md)