# AutoDeploy

A secure local deployment automation tool that helps you deploy projects to remote servers with one click. Available as both CLI and GUI applications.

## Documentation

- [GUI Documentation](GUI_DOCUMENTATION.md) - Comprehensive guide for the web interface
- [API Documentation](API_DOCUMENTATION.md) - REST API reference
- [CLI Reference](#cli-usage) - Command line interface guide

## Features

- 🔐 Encrypted storage of SSH credentials and project configurations
- 🚀 One-click deployment with automated git commit/push
- 📦 Customizable deployment pipelines with local and remote steps
- 🎯 Support for multiple projects with directory-based configuration
- 🔄 Automatic git operations (commit, push) before deployment
- ⏱️ Deployment timing tracking for each step and total duration
- 🖥️ Interactive CLI with beautiful output and full feature parity
- 🎨 Modern GUI with React and real-time deployment logs
- 📊 Deployment history and statistics tracking
- 📝 JSON editor mode for direct configuration editing
- 🔧 Graceful handling of "nothing to commit" scenarios
- 🌐 Integrated documentation viewer in GUI

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
- SSH connection details (host, username, password, port)
- Remote project path
- Deployment steps (optional)

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
```

This will:
1. Commit and push any local changes (if it's a git repository)
2. Connect to the remote server via SSH
3. Execute all configured deployment steps

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

## Security

### Security Features

- All project configurations are stored encrypted in `~/.autodeploy/projects/`
- Each project has its own directory with separate encrypted files:
  - `config.json` - Project settings and SSH credentials
  - `local-steps.json` - Steps that run on your local machine
  - `remote-steps.json` - Steps that run on the deployment server
  - `history.json` - Deployment history (last 50 deployments)
  - `stats.json` - Deployment statistics
- SSH passwords are encrypted using AES-256-GCM encryption
- All config files have restricted permissions (600)
- Encryption keys are derived from your machine's hardware identifiers

## Environment Variables

- `AUTODEPLOY_SECRET`: Custom encryption key (recommended for production use)

## Example Deployment Steps

### Local Steps (run on your machine)
```
1. Build application: npm run build
2. Run tests: npm test
3. Compress assets: npm run compress
```

### Remote Steps (run on server)
```
1. Pull latest changes: git pull origin main
2. Install dependencies: npm ci --production
3. Run migrations: npm run migrate
4. Restart service: pm2 restart app
```

Each step can be configured with:
- Custom working directory
- Continue on error flag
- Individual timing tracking

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
│   ├── project-name/
│   │   ├── config.json      # Project settings & SSH credentials
│   │   ├── local-steps.json # Local deployment steps
│   │   ├── remote-steps.json # Remote deployment steps
│   │   ├── history.json     # Deployment history
│   │   └── stats.json       # Deployment statistics
│   └── another-project/
└── projects.json.backup     # Backup of old format (if migrated)
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