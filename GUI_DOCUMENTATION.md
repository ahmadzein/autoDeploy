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
- **Monorepo Support**: Manage multiple sub-deployments within a single repository
- **Interactive Commands**: Configure auto-fill responses for interactive deployment steps
- **Project Duplication**: Clone existing projects and sub-deployments with new names
- **Step Reordering**: Drag-and-drop reordering of deployment steps
- **Real-time Deployment**: Live deployment status with terminal-style output
- **Deployment History**: Track all deployments with detailed logs
- **Statistics Dashboard**: Monitor deployment metrics and success rates
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Professional dark theme for reduced eye strain

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
   - **SSH Details**: Host, username, password, port
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
- Modify all project settings
- Add, remove, or reorder deployment steps
- Drag-and-drop step reordering with move up/down buttons
- Test connection after changes

#### Monorepo Management
- **Create Monorepo**: Special project type for multiple sub-deployments
- **Sub-deployment Management**: Add, edit, and manage individual sub-projects
- **Coordinated Deployment**: Deploy all sub-projects or selected ones
- **Individual SSH Settings**: Override SSH credentials per sub-deployment
- **Step Inheritance**: Configure deployment steps for each sub-project

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

## User Interface

### Navigation
- **Sidebar**: Always visible on desktop, collapsible on mobile
- **Dashboard**: Home view with statistics
- **Projects**: Grid view of all projects
- **Add Project**: Form for new configurations
- **Deployment**: Active deployment terminal

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

### SSH Credentials
- Encrypted storage using AES-256-GCM
- Stored in `~/.autodeploy/projects/<project>/config.json`
- Never transmitted in plain text
- Machine-specific encryption keys
- Secure password input fields

### Configuration Structure
- Each project has its own encrypted directory
- Separate files for different data types:
  - `config.json` - Credentials and project settings
  - `local-steps.json` - Local deployment steps
  - `remote-steps.json` - Remote deployment steps
  - `history.json` - Deployment history (last 50)
  - `stats.json` - Deployment statistics
- All files encrypted with AES-256-GCM
- File permissions set to 0600

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

#### Connection Errors
```bash
# Test SSH manually
ssh user@host -p 22

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