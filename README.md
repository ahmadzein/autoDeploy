# AutoDeploy

A secure local deployment automation tool that helps you deploy projects to remote servers with one click. Available as both CLI and GUI applications.

## Documentation

- [GUI Documentation](GUI_DOCUMENTATION.md) - Comprehensive guide for the web interface
- [API Documentation](API_DOCUMENTATION.md) - REST API reference
- [CLI Reference](#cli-usage) - Command line interface guide
- [SSH Authentication Guide](SSH_AUTHENTICATION_GUIDE.md) - Complete SSH setup and troubleshooting
- [Monorepo Guide](MONOREPO_GUIDE.md) - Deploy multiple projects from one repository
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions
- [SSH Examples](examples/SSH_EXAMPLES.md) - Real-world SSH configuration examples

## Features

### Core Features
- 🔐 **Encrypted storage** of SSH credentials and project configurations
- 🚀 **One-click deployment** with automated git commit/push
- 📦 **Customizable pipelines** with local and remote deployment steps
- 🏗️ **Monorepo support** with sub-deployments and coordinated releases
- 🎯 **Multi-project support** with organized directory-based configuration

### SSH & Authentication
- 🔑 **SSH key authentication** with PEM files, id_rsa, id_ed25519
- 🔒 **Passphrase support** for encrypted private keys
- 🌐 **Port forwarding** for database connections and internal services
- 🔐 **Password authentication** with secure encrypted storage

### Deployment Features
- ⏱️ **Deployment timing** tracking for each step and total duration
- 📊 **Deployment history** with detailed logs stored separately
- 📈 **Statistics tracking** including deployments today and success rates
- 🔄 **Automatic git operations** (commit, push) before deployment
- 🔧 **Graceful error handling** including "nothing to commit" scenarios
- ⚡ **Parallel deployments** for monorepo sub-projects
- 🛑 **Deployment stopping** with proper cleanup and history tracking

### User Interface
- 🖥️ **Interactive CLI** with beautiful colored output
- 🎨 **Modern GUI** with React and real-time deployment logs
- 📝 **JSON editor mode** for direct configuration editing
- 🌐 **Integrated documentation** viewer in GUI
- 📋 **File-specific editing** (config, local steps, remote steps)

### Advanced Features
- 🔀 **Interactive command support** with auto-fill capabilities
- 📋 **Project duplication** for quick setup of similar projects
- 🔄 **Step reordering** with drag-and-drop in GUI
- 🗂️ **Organized file structure** with separate files for different concerns
- 🔍 **Comprehensive error logs** stored in dedicated logs.json files

## Installation

### Quick Install (Recommended)

```bash
# One-time setup
brew tap ahmadzein/autodeploy

# Install CLI
brew install autodeploy

# Or install CLI + GUI
brew install autodeploy --with-gui
```

### Alternative: Direct Install

```bash
# CLI only
brew install ahmadzein/autodeploy/autodeploy

# CLI + GUI  
brew install ahmadzein/autodeploy/autodeploy --with-gui
```

### From Source

```bash
# Prerequisites: Node.js and pnpm
git clone https://github.com/yourusername/autoDeploy.git
cd autoDeploy
pnpm install

# For CLI
pnpm link

# For GUI
pnpm electron:dev
```

## CLI Usage

### Add a New Project

```bash
autodeploy add-project
```

This will prompt you for:
- Project name
- Local project path
- SSH connection details (host, username, authentication method, port)
  - Password authentication
  - Private key authentication (PEM files, id_rsa, etc.)
  - Optional: Port forwarding configuration
- Remote project path
- Deployment steps (optional)

### Create a Monorepo Project

```bash
autodeploy create-monorepo      # Create monorepo project
autodeploy add-sub <name>       # Add sub-deployment
autodeploy list-sub <name>      # List sub-deployments
```

See [Monorepo Guide](MONOREPO_GUIDE.md) for detailed usage.

### Duplicate Projects and Sub-deployments

```bash
# Duplicate an existing project with a new name
autodeploy duplicate-project my-project

# Duplicate a sub-deployment within a monorepo
autodeploy duplicate-sub my-monorepo frontend
```

### Step Management and Reordering

```bash
# Reorder deployment steps for a regular project
autodeploy reorder-steps my-project

# Reorder steps for a specific sub-deployment
autodeploy reorder-steps my-monorepo --sub frontend
```

### List All Projects

```bash
autodeploy list
```

### Deploy a Project

```bash
# Deploy with interactive selection
autodeploy deploy

# Deploy specific project
autodeploy deploy my-project

# Deploy monorepo sub-projects
autodeploy deploy my-monorepo --all              # Deploy all sub-projects
autodeploy deploy my-monorepo --sub frontend     # Deploy specific sub-project
```

#### Deployment Process
1. **Local Steps** (run on your machine):
   ```bash
   # Example local steps:
   - Build application: npm run build
   - Run tests: npm test
   - Lint code: npm run lint
   ```

2. **Git Operations** (if enabled):
   ```bash
   # Automatic commit and push
   git add .
   git commit -m "Deployment commit"
   git push origin main
   ```

3. **Remote Steps** (run on server):
   ```bash
   # Example remote steps:
   - Pull changes: git pull origin main
   - Install deps: npm ci --production
   - Run migrations: npm run migrate
   - Restart service: pm2 restart app
   ```

#### Deployment Features
- **Real-time logs**: See command output as it happens
- **Step timing**: Track how long each step takes
- **Error handling**: Continue on error or stop deployment
- **History tracking**: All deployments are recorded with details
- **Interactive prompts**: Handle commands that require user input
- **Prefilled inputs**: Automate responses to known prompts

#### Interactive Steps
AutoDeploy supports interactive deployment steps that require user input:

```bash
# Example interactive step configuration:
Step Name: Deploy with Branch Selection
Command: ./deploy.sh
Interactive: Yes
Prefilled Inputs:
  - branch: main
  - environment: production
```

**Features:**
- Mark any step as "interactive" to enable prompt handling
- Configure prefilled inputs for automatic responses
- Leave input value empty for "Press enter" prompts
- Manual prompts appear when no prefilled input matches
- Works with both CLI and GUI interfaces

**Common Use Cases:**
- Branch/tag selection during deployment
- Environment selection (dev/staging/prod)
- Database migration confirmations
- Service restart confirmations

### Edit Project Configuration

```bash
# Interactive edit mode
autodeploy edit my-project

# Edit configuration in JSON mode
autodeploy edit my-project --json
```

This allows you to:
- Modify project settings and SSH credentials
- Add, remove, or reorder local steps (run on your machine)
- Add, remove, or reorder remote steps (run on server)
- Edit steps directly or in JSON format

### Interactive Commands

AutoDeploy supports interactive commands that require user input during deployment. When adding deployment steps, you can configure:

- **Interactive Mode**: Mark commands that require user input
- **Environment Variables**: Set custom environment variables for commands
- **Auto-fill Inputs**: Configure expected prompts with default values

**Example Interactive Step Configuration:**
```
Step Name: Ghost Backup
Command: ghost backup
Interactive: Yes
Inputs:
  - Prompt: "Enter your Ghost administrator email address"
    Default: "admin@example.com"
  - Prompt: "Enter backup location"
    Default: "/tmp/backup"
```

During deployment, AutoDeploy will automatically provide the configured responses to interactive prompts, while still allowing manual override when needed.

### Remove a Project

```bash
autodeploy remove my-project
```

### View Deployment History

```bash
# View history for a specific project
autodeploy history my-project

# Limit number of deployments shown
autodeploy history my-project --limit 20

# Show detailed output for all steps
autodeploy history my-project --verbose
```

Shows:
- Deployment timestamp and status
- Total duration and individual step timings
- Error details for failed deployments
- Stopped deployments are tracked separately

### View Deployment Statistics

```bash
# View global deployment statistics
autodeploy stats
```

This shows:
- Total projects and deployments
- Today's deployment count
- Last deployment details
- Active project count

## GUI Features

The GUI application provides:
- Visual project management with grid layout
- Real-time deployment logs with color-coded terminal output
- SSH connection testing before saving projects
- Separate local and remote deployment step configuration
- JSON editor mode with real-time validation
- Dashboard with deployment statistics and metrics
- Deployment history tracking with timing information
- Integrated documentation viewer with 9 sections
- Professional interface with improved text contrast
- Responsive design for all screen sizes

### Starting the GUI

```bash
# Start in development mode
autodeploy gui

# Custom ports
autodeploy gui --port 8080 --api-port 3001

# Production mode
autodeploy gui --production
```

## SSH Authentication

AutoDeploy supports multiple SSH authentication methods:

### Password Authentication
Traditional username/password authentication with encrypted storage:
```bash
autodeploy add-project
# Choose "Password" when prompted for authentication method
# Enter your SSH password (will be encrypted and stored securely)
```

### Private Key Authentication
Support for various SSH private key formats:
```bash
autodeploy add-project
# Choose "Private Key (PEM file)" as auth method
# Supported key types:
# - PEM files (AWS EC2, Google Cloud, Azure)
# - OpenSSH keys (id_rsa, id_ed25519, id_ecdsa)
# - Keys with passphrases

# Example paths:
/Users/you/Documents/ssh/aws-ec2-key.pem
/Users/you/.ssh/id_rsa
/Users/you/.ssh/id_ed25519
```

### Port Forwarding
Configure SSH tunnels for secure database access:
```bash
autodeploy add-project
# When prompted for port forwarding:
# Format: localPort:remoteHost:remotePort

# Examples:
5433:localhost:5432              # PostgreSQL on remote server
3307:database.internal:3306       # MySQL on internal network
27018:mongo.private:27017         # MongoDB cluster
6380:redis.local:6379            # Redis instance

# Multiple forwards (comma-separated):
5433:localhost:5432,3307:mysql.internal:3306
```

### Advanced SSH Options
Configure additional SSH options in JSON edit mode:
```json
{
  "ssh": {
    "host": "server.example.com",
    "username": "deploy",
    "privateKeyPath": "/Users/you/.ssh/id_rsa",
    "passphrase": "encrypted-passphrase",
    "port": 22,
    "sshOptions": {
      "ServerAliveInterval": 60,
      "ServerAliveCountMax": 3,
      "StrictHostKeyChecking": "no"
    }
  }
}
```

### Editing SSH Credentials
Update SSH settings without affecting other configuration:
```bash
# Interactive mode
autodeploy edit my-project
# Choose "Edit SSH credentials"

# JSON mode for specific file
autodeploy edit my-project --json
# Select "Config Only" to edit SSH settings
```

## Security

### Security Features

- All project configurations are stored encrypted in `~/.autodeploy/projects/`
- Each project has its own directory with separate encrypted files:
  - `config.json` - Project settings and SSH credentials
  - `local-steps.json` - Steps that run on your local machine
  - `remote-steps.json` - Steps that run on the deployment server
  - `history.json` - Deployment history (last 50 deployments)
  - `stats.json` - Deployment statistics
- SSH passwords and private key paths are encrypted using AES-256-GCM encryption
- All config files have restricted permissions (600)
- Encryption keys are derived from your machine's hardware identifiers

## Environment Variables

- `AUTODEPLOY_SECRET`: Custom encryption key (recommended for production use)

## Example Configurations

### Node.js Application
```bash
# Local Steps:
- name: "Install Dependencies"
  command: "npm install"
  workingDir: "."
  
- name: "Run Tests"
  command: "npm test"
  continueOnError: false
  
- name: "Build Application"
  command: "npm run build"
  workingDir: "."

# Remote Steps:
- name: "Pull Latest Code"
  command: "git pull origin main"
  workingDir: "."
  
- name: "Install Production Dependencies"
  command: "npm ci --production"
  workingDir: "."
  
- name: "Run Database Migrations"
  command: "npm run migrate"
  continueOnError: false
  
- name: "Restart Application"
  command: "pm2 restart ecosystem.config.js"
  workingDir: "."
```

### Python/Django Application
```bash
# Local Steps:
- name: "Create Virtual Environment"
  command: "python -m venv venv"
  workingDir: "."
  
- name: "Install Dependencies"
  command: "./venv/bin/pip install -r requirements.txt"
  workingDir: "."
  
- name: "Run Tests"
  command: "./venv/bin/python manage.py test"
  continueOnError: false

# Remote Steps:
- name: "Pull Latest Code"
  command: "git pull origin main"
  
- name: "Install Dependencies"
  command: "pip install -r requirements.txt"
  workingDir: "."
  
- name: "Collect Static Files"
  command: "python manage.py collectstatic --noinput"
  
- name: "Run Migrations"
  command: "python manage.py migrate"
  
- name: "Restart Gunicorn"
  command: "supervisorctl restart gunicorn"
```

### Docker-based Application
```bash
# Local Steps:
- name: "Build Docker Image"
  command: "docker build -t myapp:latest ."
  workingDir: "."
  
- name: "Tag Image"
  command: "docker tag myapp:latest registry.example.com/myapp:latest"
  
- name: "Push to Registry"
  command: "docker push registry.example.com/myapp:latest"

# Remote Steps:
- name: "Pull Latest Image"
  command: "docker pull registry.example.com/myapp:latest"
  
- name: "Stop Current Container"
  command: "docker-compose down"
  continueOnError: true
  
- name: "Start New Container"
  command: "docker-compose up -d"
  
- name: "Health Check"
  command: "docker-compose ps"
```

### Monorepo Example
```bash
# Main project: my-app
# Sub-deployments: frontend, backend, shared-lib

# Frontend (React):
Local Steps:
- name: "Install Dependencies"
  command: "npm install"
  workingDir: "apps/frontend"
  
- name: "Build Frontend"
  command: "npm run build"
  workingDir: "apps/frontend"

Remote Steps:
- name: "Deploy to CDN"
  command: "aws s3 sync dist/ s3://my-bucket/"
  workingDir: "apps/frontend"

# Backend (Node.js):
Local Steps:
- name: "Install Dependencies"
  command: "npm install"
  workingDir: "apps/backend"
  
- name: "Run Tests"
  command: "npm test"
  workingDir: "apps/backend"

Remote Steps:
- name: "Install Production Deps"
  command: "npm ci --production"
  workingDir: "apps/backend"
  
- name: "Restart Service"
  command: "pm2 restart backend"
```

## Project Structure

```
autoDeploy/
├── src/                    # CLI source code
│   ├── cli/interface.js    # CLI commands
│   ├── config/
│   │   ├── manager.js      # Configuration management (re-exports V2)
│   │   ├── manager-v2.js   # New directory-based config manager
│   │   └── migrate.js      # Migration script
│   ├── git/operations.js   # Git operations
│   ├── ssh/connection.js   # SSH connection handling
│   ├── pipeline/executor.js # Pipeline execution
│   └── utils/encryption.js # Encryption utilities
├── gui/                    # GUI application
│   ├── src/               # React components
│   └── public/            # Static assets
├── package.json
└── README.md
```

### Configuration Structure

```
~/.autodeploy/
├── projects/
│   ├── regular-project/
│   │   ├── config.json       # Project settings & SSH credentials
│   │   ├── local-steps.json  # Local deployment steps
│   │   ├── remote-steps.json # Remote deployment steps
│   │   ├── history.json      # Deployment history (metadata only)
│   │   ├── logs.json         # Detailed deployment logs and step outputs
│   │   └── stats.json        # Deployment statistics
│   └── monorepo-project/
│       ├── config.json       # Main monorepo configuration
│       ├── history.json      # Main project deployment history
│       ├── logs.json         # Main project logs
│       ├── stats.json        # Main project statistics
│       └── sub-deployments/  # Sub-project configurations
│           ├── frontend/
│           │   ├── config.json
│           │   ├── local-steps.json
│           │   ├── remote-steps.json
│           │   ├── history.json
│           │   ├── logs.json
│           │   └── stats.json
│           └── backend/
│               └── ... (same structure)
└── projects.json.backup      # Backup of old format (if migrated)
```

## Building

### Build GUI for Distribution

```bash
# macOS
pnpm build:gui
pnpm dist

# The .dmg file will be in gui/dist/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT