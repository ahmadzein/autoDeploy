# AutoDeploy GUI Documentation

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Features](#features)
5. [User Interface](#user-interface)
6. [API Integration](#api-integration)
7. [Configuration](#configuration)
8. [Deployment Process](#deployment-process)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

## Overview

AutoDeploy GUI is a modern web-based interface for managing deployment configurations and executing deployments. Built with React and Vite, it provides a user-friendly alternative to the CLI while maintaining all the same functionality.

### Key Features
- **Project Management**: Create, edit, and delete deployment projects
- **SSH Key Authentication**: Support for PEM files and OpenSSH keys with passphrases
- **Port Forwarding**: Configure SSH tunnels for database access
- **Monorepo Support**: Manage multiple sub-deployments within a single repository
- **Interactive Commands**: Configure auto-fill responses for interactive deployment steps
- **Project Duplication**: Clone existing projects and sub-deployments with new names
- **Step Reordering**: Drag-and-drop reordering of deployment steps
- **JSON Editor Mode**: Direct configuration editing with file-specific views
- **Real-time Deployment**: Live deployment status with terminal-style output
- **Deployment History**: Track all deployments with detailed logs and timing
- **Statistics Dashboard**: Monitor deployment metrics and success rates
- **Integrated Documentation**: Built-in docs viewer with 9 sections
- **Responsive Design**: Works on desktop and mobile devices
- **Enhanced Contrast**: Improved text readability throughout the interface

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager
- AutoDeploy CLI installed

### Starting the GUI

```bash
# Development mode with hot reload
autodeploy gui

# Production mode
autodeploy gui --production

# Custom ports
autodeploy gui --port 8080 --api-port 3001

# Bind to all interfaces
autodeploy gui --host 0.0.0.0
```

### First Launch
1. Start the GUI service: `autodeploy gui`
2. Browser opens automatically at `http://localhost:8080`
3. Dashboard displays deployment statistics and recent projects
4. Add your first project via the "Add Project" button

## Architecture

### Technology Stack
- **Frontend**: React 18 with React Router
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **API Client**: Axios with interceptors for error handling
- **Real-time Updates**: Server-Sent Events (SSE) for deployment logs

### Component Structure
```
gui/src/
├── components/
│   ├── Dashboard.jsx       # Main statistics view
│   ├── ProjectList.jsx     # Project grid display
│   ├── AddProject.jsx      # New project form
│   ├── EditProject.jsx     # Project editor
│   ├── DeploymentView.jsx  # Real-time deployment
│   └── Layout.jsx          # App shell with navigation
├── utils/
│   └── api.js             # API client configuration
└── App.jsx                # Router configuration
```

## Features

### 1. Dashboard
The dashboard provides an at-a-glance view of your deployment infrastructure:

- **Total Projects**: Number of configured projects
- **Total Deployments**: All-time deployment count
- **Deployments Today**: Today's deployment activity
- **Last Deployment**: Most recent deployment across all projects
- **Quick Actions**: Fast access to common tasks
- **Recent Projects**: Quick deployment access for active projects

### 2. Project Management

#### Adding Projects
1. Click "Add Project" from dashboard or projects page
2. Fill in project details:
   - **Project Name**: Unique identifier
   - **Local Path**: Path to your project on local machine
   - **SSH Details**: 
     - Host, username, port
     - Authentication method (Password or Private Key)
     - Password or private key path with optional passphrase
     - Port forwarding configuration (optional)
   - **Remote Path**: Absolute path on deployment server
3. Add deployment steps:
   - **Step Name**: Descriptive name (e.g., "Install Dependencies")
   - **Command**: Shell command to execute
   - **Working Directory**: Relative to remote project path
   - **Continue on Error**: Whether to proceed if step fails
   - **Interactive Mode**: Mark commands that require user input
   - **Environment Variables**: Set custom environment variables
   - **Auto-fill Inputs**: Configure responses for interactive prompts
4. Test connection before saving

#### Editing Projects
- Access via settings icon on project card
- Modify all project settings including display name
- **Form Mode Editing**:
  - Inline step editing - click pencil icon to edit steps in place
  - Edit step name, command, working directory
  - Toggle continue on error and interactive flags
  - Add, remove, or reorder deployment steps
  - Move steps up/down with arrow buttons
- **JSON Mode Editing**:
  - Toggle between Form and JSON modes
  - Edit full config, config only, local steps, or remote steps
  - Real-time JSON validation with visual indicators
  - File location shown for reference
- Test connection after changes
- Works for both regular projects and monorepos

#### Monorepo Management
- **Create Monorepo**: Special project type for multiple sub-deployments
- **Edit Monorepo Settings**: Click "Edit Settings" in sub-deployments view
- **Sub-deployment Management**: 
  - Add, edit, and manage individual sub-projects
  - Full form and JSON editing modes for sub-deployments
  - Inline step editing for sub-deployment steps
  - Override SSH credentials per sub-deployment
- **Coordinated Deployment**: Deploy all sub-projects or selected ones
- **Individual SSH Settings**: Override SSH credentials per sub-deployment
- **Step Inheritance**: Configure deployment steps for each sub-project
- **Display Names**: All views show user-friendly names with fallback to slugs

#### Project Duplication
- **Clone Projects**: Duplicate existing projects with new names
- **Clone Sub-deployments**: Duplicate sub-deployments within monorepos
- **Configuration Copying**: All settings, steps, and configurations are copied
- **History Exclusion**: Deployment history is not copied to new projects
- **Name Validation**: Prevents duplicate names and conflicts

#### Project Cards Display
- Project name and SSH host
- Local and remote paths
- Number of deployment steps
- Last deployment time and status
- Quick deploy and edit actions
- **Monorepo Indicator**: Special badge for monorepo projects
- **Sub-deployment Count**: Number of configured sub-deployments

#### Interactive Command Configuration

When adding deployment steps, you can configure interactive commands:

1. **Enable Interactive Mode**: Check the "Interactive command" option
2. **Add Environment Variables**:
   - Variable name (e.g., "NODE_ENV")
   - Variable value (e.g., "production")
3. **Configure Auto-fill Inputs**:
   - Expected prompt text (e.g., "Enter your email address")
   - Default response value (e.g., "admin@example.com")
   - Required flag

**Example Configuration:**
```
Step: Ghost Backup
Command: ghost backup
Interactive: ✓ Enabled
Environment Variables:
  - GHOST_URL: https://blog.example.com
  - BACKUP_PATH: /tmp/backup
Auto-fill Inputs:
  - Prompt: "Enter your Ghost administrator email address"
    Default: "admin@example.com"
    Required: ✓
```

During deployment, AutoDeploy will automatically provide the configured responses while displaying the interaction in the real-time terminal.

### 3. Deployment Interface

#### Real-time Terminal
- **Live Output**: Streams deployment logs as they happen
- **Color Coding**:
  - Blue: Informational messages
  - Green: Successful operations
  - Yellow: Warnings
  - Red: Errors and failures
- **Auto-scroll**: Follows log output automatically
- **Manual scroll**: Pause auto-scroll by scrolling up
- **Timestamps**: Each log entry shows precise timing

#### Deployment Status
- **Starting**: Initializing deployment
- **In Progress**: Executing deployment steps
- **Completed**: Successfully finished
- **Failed**: Encountered errors

#### Step Tracking
- Visual progress through deployment steps
- Success/failure indication per step
- Step duration timing
- Error details on failure

### 4. Deployment History

#### Project History
- Accessible from project cards
- Shows last 50 deployments
- Details include:
  - Timestamp
  - Duration
  - Success/failure status
  - Step-by-step breakdown

#### Global Statistics
- Aggregate metrics across all projects
- Daily deployment trends
- Success rate tracking
- Most active projects

## New Features (2025)

### SSH Key Authentication
The GUI now fully supports SSH key authentication:
- **Authentication Method Selection**: Radio buttons for Password vs Private Key
- **Key Path Input**: File path field with validation
- **Passphrase Support**: Optional passphrase field for encrypted keys
- **Visual Tips**: Helpful hints about key permissions and formats
- **Connection Testing**: Test SSH connection before saving

### JSON Editor Mode
Enhanced configuration editing:
- **Mode Toggle**: Switch between Form and JSON views
- **File Selection**: Choose specific files to edit:
  - Full Config (entire project)
  - Config Only (settings and credentials)
  - Local Steps (local deployment steps)
  - Remote Steps (remote deployment steps)
- **Real-time Validation**: Green/red indicators for valid/invalid JSON
- **Syntax Highlighting**: Proper JSON formatting
- **File Location Display**: Shows actual file paths

### Deployment History Enhancements
- **Deployment Timing**: Shows duration for each step
- **Total Time**: Overall deployment duration
- **Stopped Deployments**: Tracks manually cancelled deployments
- **Detailed Logs**: Step outputs stored in separate logs.json
- **Last 10 History**: Quick view on project cards

### Documentation Integration
- **Sidebar Access**: Documentation expandable in main navigation
- **9 Sections**: Complete guide within the GUI
- **Direct Routes**: Each section has its own URL
- **Enhanced Contrast**: Improved readability with darker text

## User Interface

### Navigation
- **Sidebar**: Always visible on desktop, collapsible on mobile
  - Dashboard
  - Projects
  - Documentation (expandable)
  - Settings
- **Dashboard**: Home view with statistics
- **Projects**: Grid view of all projects with history
- **Add Project**: Multi-tab form for new configurations
- **Deployment**: Active deployment terminal with auto-scroll

### Responsive Design
- **Desktop**: Full sidebar, multi-column layouts
- **Tablet**: Collapsible sidebar, 2-column grids
- **Mobile**: Bottom navigation, single column

### Theme
- Professional dark theme
- High contrast for readability
- Consistent color scheme:
  - Primary: Blue (#3B82F6)
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Error: Red (#EF4444)

## API Integration

### Endpoints

#### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:name` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:name` - Update project
- `DELETE /api/projects/:name` - Delete project

#### Deployments
- `GET /api/deployments/:name` - Start deployment (SSE)
- `GET /api/projects/:name/deployments` - Get history
- `GET /api/stats` - Global statistics

#### System
- `GET /api/health` - Health check
- `GET /api/system/status` - System information

### Error Handling
- Automatic retry on network failures
- User-friendly error messages
- Detailed error logs in console
- Connection status indicators

### Authentication
- Token-based authentication ready
- Stored in localStorage
- Auto-refresh on 401 responses

## Configuration

### Environment Variables
```bash
# GUI Port (default: 8080)
AUTODEPLOY_GUI_PORT=8080

# API Port (default: 3000)
AUTODEPLOY_API_PORT=3000

# Host binding (default: localhost)
AUTODEPLOY_GUI_HOST=localhost

# Auto-open browser (default: true)
AUTODEPLOY_NO_OPEN=false
```

### Vite Configuration
- Proxy configuration for API routes
- Environment variable support
- Build optimization settings
- Development server options

### API Configuration
- Base URL configuration
- Timeout settings (30 seconds default)
- Request/response interceptors
- CORS handling

## Deployment Process

### Pre-deployment
1. **Git Operations**: Auto-commit and push if Git repository
2. **Connection Test**: Verify SSH connectivity
3. **Path Validation**: Ensure remote directory exists

### During Deployment
1. **Step Execution**: Run each configured step sequentially
2. **Error Handling**: Stop on error unless configured otherwise
3. **Progress Updates**: Real-time status via SSE
4. **Logging**: Capture all output for history

### Post-deployment
1. **History Recording**: Save deployment details
2. **Statistics Update**: Refresh dashboard metrics
3. **Notification**: Success/failure indication
4. **Cleanup**: Close SSH connections

## Security

### SSH Authentication Methods

#### Password Authentication
- Traditional username/password
- Encrypted storage using AES-256-GCM
- Secure password input fields
- Good for development/testing environments

#### Private Key Authentication
- Support for PEM files (AWS EC2, Google Cloud, Azure)
- Standard SSH keys (id_rsa, id_ed25519, etc.)
- Optional passphrase protection
- More secure than passwords
- Required by most cloud providers

#### Key File Requirements
- Must use absolute paths (no ~ symbol)
- Proper permissions (chmod 600)
- Readable by the AutoDeploy process
- Common locations displayed as hints

#### Port Forwarding
- Configure SSH tunnels for databases
- Format: localPort:remoteHost:remotePort
- Example: 5433:database.internal:5432
- Useful for secure database connections during deployment

### SSH Credentials Storage
- Encrypted storage using AES-256-GCM
- Stored in `~/.autodeploy/projects/<project>/config.json`
- Never transmitted in plain text
- Machine-specific encryption keys
- Private key paths encrypted, not the key contents

### Configuration Structure
Each project has its own encrypted directory with organized files:

```
~/.autodeploy/projects/
├── my-project/
│   ├── config.json       # Credentials and project settings
│   ├── local-steps.json  # Local deployment steps
│   ├── remote-steps.json # Remote deployment steps
│   ├── history.json      # Deployment history (last 50)
│   ├── logs.json        # Detailed deployment logs (NEW)
│   └── stats.json       # Deployment statistics
└── my-monorepo/
    ├── config.json       # Main monorepo config
    ├── history.json      # Aggregated history (NEW)
    ├── logs.json        # Aggregated logs (NEW)
    ├── stats.json       # Overall statistics (NEW)
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

#### Example config.json with SSH key:
```json
{
  "name": "production-api",
  "localPath": "/Users/me/projects/api",
  "remotePath": "/var/www/api",
  "ssh": {
    "host": "api.example.com",
    "username": "deploy",
    "privateKeyPath": "/Users/me/.ssh/deploy-key.pem",
    "passphrase": "encrypted-passphrase",
    "port": 22,
    "sshOptions": {
      "ServerAliveInterval": 60
    }
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-12T10:00:00Z"
}
```

- All files encrypted with AES-256-GCM
- File permissions set to 0600
- Encryption keys derived from machine ID

### API Security
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection via React

### Best Practices
- Use SSH keys when possible
- Limit GUI access to localhost
- Use HTTPS in production
- Regular security updates

## Troubleshooting

### Common Issues

#### GUI Won't Start
```bash
# Check if ports are in use
lsof -i :8080
lsof -i :3000

# Use different ports
autodeploy gui --port 8081 --api-port 3001
```

#### Projects Not Showing
1. Check API server is running
2. Verify browser console for errors
3. Clear browser cache
4. Check network tab for 404s

#### Deployment Loops
- Fixed in latest version
- Ensure EventSource properly closes
- Check for deployment step loops

#### SSH Connection Errors

**Password Authentication Issues:**
```bash
# Test SSH manually
ssh user@host -p 22

# Check if password auth is enabled on server
grep PasswordAuthentication /etc/ssh/sshd_config
```

**Private Key Authentication Issues:**
```bash
# Test with your key
ssh -i /path/to/key.pem user@host

# Check key permissions
ls -la /path/to/key.pem
# Should show: -rw------- (600)

# Fix permissions if needed
chmod 600 /path/to/key.pem

# Verify key format
head -1 /path/to/key.pem
# Should show: -----BEGIN RSA PRIVATE KEY----- or similar
```

**Common SSH Errors:**
- **"Permission denied (publickey)"**: Wrong key or key not authorized
- **"Bad permissions"**: Key file permissions too open (must be 600)
- **"No such file"**: Check absolute path to key file
- **"Bad passphrase"**: Wrong passphrase or key has no passphrase

**Port Forwarding Issues:**
```bash
# Test port forwarding manually
ssh -i key.pem -L 5433:database.host:5432 user@host

# Check if local port is already in use
lsof -i :5433
```

#### General Connection Issues
```bash
# Check firewall rules
# Verify credentials
# Check remote path exists
```

#### Style Issues
- Clear browser cache
- Check for CSS conflicts
- Verify Tailwind classes load
- Inspect computed styles

### Debug Mode
```bash
# Enable debug output
autodeploy gui --debug

# Check logs
# API logs in terminal
# Frontend logs in browser console
```

### Performance Tips
1. **Large Projects**: Use .gitignore for node_modules
2. **Slow Networks**: Increase API timeout
3. **Many Steps**: Group related commands
4. **History**: Auto-limited to 50 entries

### Getting Help
1. Check browser console for errors
2. Review API server logs
3. Test with CLI first
4. Report issues on GitHub

## Advanced Usage

### Custom Deployment Steps
```javascript
// Example complex deployment
{
  name: "Deploy with PM2",
  steps: [
    {
      name: "Install Dependencies",
      command: "npm ci --production",
      workingDir: ".",
      continueOnError: false
    },
    {
      name: "Build Application",
      command: "npm run build",
      workingDir: ".",
      continueOnError: false
    },
    {
      name: "Stop Previous",
      command: "pm2 stop app || true",
      workingDir: ".",
      continueOnError: true
    },
    {
      name: "Start Application",
      command: "pm2 start ecosystem.config.js",
      workingDir: ".",
      continueOnError: false
    },
    {
      name: "Save PM2 Config",
      command: "pm2 save",
      workingDir: ".",
      continueOnError: false
    }
  ]
}
```

### API Client Usage
```javascript
// Custom API calls
import { projectAPI } from './utils/api';

// Get all projects
const projects = await projectAPI.getAll();

// Deploy with options
const deployment = await projectAPI.deploy('my-project', {
  skipGit: false,
  verbose: true
});

// Stream logs
const eventSource = deploymentAPI.streamLogs(
  'my-project',
  'deployment-id',
  (data) => console.log('Log:', data),
  (error) => console.error('Error:', error)
);
```

### Building for Production
```bash
# Build optimized bundle
cd gui
npm run build

# Output in gui/dist/
# Serve with any static server

# Using the built files
autodeploy gui --production
```

### Extending the GUI
1. **Add Components**: Create in `src/components/`
2. **New Routes**: Update `App.jsx` router
3. **API Methods**: Extend `utils/api.js`
4. **Styling**: Use Tailwind classes
5. **Icons**: Import from `lucide-react`

---

## Summary

AutoDeploy GUI provides a powerful, user-friendly interface for deployment management. With real-time feedback, comprehensive history tracking, and a professional design, it makes deployment automation accessible to teams of all sizes.

For CLI documentation, see [README.md](README.md).
For API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).