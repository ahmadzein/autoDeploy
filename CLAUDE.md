# AutoDeploy - Claude Development Notes

## Project Overview

AutoDeploy is a secure local deployment automation tool that helps deploy projects to remote servers with one click. It features both CLI and GUI interfaces with encrypted credential storage.

## Recent Updates and Features

### Latest Updates (July 2025)

#### Key Features Added:
1. **Deployment Timing**: Track duration for each step and total deployment time
2. **Stopped Deployments**: Track manually stopped deployments in history
3. **SSH PATH Fix**: Use bash login shell to ensure proper PATH loading
4. **Nothing to Commit Handling**: Gracefully handle Git "nothing to commit" scenarios
5. **CLI Reference in GUI**: Added comprehensive CLI documentation to GUI
6. **Deployments Today Fix**: Correctly count all deployments from today

### Configuration Structure Refactor

#### Directory-Based Configuration
- **Migration**: Automatic migration from single `projects.json` to directory structure
- **Organization**: Each project has its own directory under `~/.autodeploy/projects/`
- **File Separation**:
  - `config.json` - Core project settings and SSH credentials
  - `local-steps.json` - Steps executed on local machine
  - `remote-steps.json` - Steps executed on deployment server
  - `history.json` - Last 50 deployments with full details
  - `stats.json` - Deployment statistics and counters
- **Benefits**:
  - Better organization and maintainability
  - Smaller, focused files
  - Easier debugging and manual inspection
  - Better performance (load only what's needed)
  - Cleaner separation of concerns

#### Migration Process:
```bash
# Automatic migration happens on first run
# Or manually run:
node src/config/migrate.js
```

## Core Features

### 1. Local and Remote Deployment Steps
- **Local Steps**: Execute on the user's machine before deployment
- **Remote Steps**: Execute on the deployment server via SSH
- **Storage**: Step types are stored in separate encrypted files:
  - Local steps: `~/.autodeploy/projects/<project>/local-steps.json`
  - Remote steps: `~/.autodeploy/projects/<project>/remote-steps.json`

#### Step Structure:
```json
{
  "localSteps": [
    {
      "name": "Build Application",
      "command": "npm run build",
      "workingDir": ".",
      "continueOnError": false
    }
  ],
  "deploymentSteps": [
    {
      "name": "Install Dependencies", 
      "command": "npm ci --production",
      "workingDir": ".",
      "continueOnError": false
    }
  ]
}
```

### 2. Deployment History Tracking
- Records all deployments with timestamps, duration, and step results
- Stores last 50 deployments per project
- Dashboard shows aggregate statistics
- Human-readable time formatting ("2 mins ago", "3 hours ago")

### 3. CLI Enhancements

#### New Commands:
- `autodeploy history <project>` - View deployment history
- `autodeploy history <project> --limit 20` - Limit history entries
- `autodeploy history <project> --verbose` - Show detailed output for all steps
- `autodeploy stats` - View global deployment statistics
- `autodeploy edit <project> --json` - Edit configuration in JSON format

#### Edit Command Features:
- Separate editing for local and remote steps
- JSON mode for direct configuration editing
- Full validation before saving

### 4. GUI Improvements

#### Documentation Integration:
- Documentation moved to main sidebar as expandable section
- No more double sidebars
- Direct routes for each documentation section:
  - `/docs/getting-started`
  - `/docs/projects`
  - `/docs/deployment-steps`
  - `/docs/deployment`
  - `/docs/security`
  - `/docs/api`
  - `/docs/troubleshooting`
  - `/docs/examples`
  - `/docs/cli` - CLI reference documentation

#### JSON Editor Mode:
- Toggle between Form and JSON modes in project editing
- Edit modes for different configuration files:
  - Full Config (entire project)
  - Config Only (settings and credentials)
  - Local Steps (local deployment steps)
  - Remote Steps (remote deployment steps)
- Real-time JSON validation with visual indicators
- Green border/dot for valid JSON
- Red border/dot for invalid JSON
- Seamless switching between modes
- Shows file location: `~/.autodeploy/projects/{projectName}/`

#### Contrast and UI Improvements:
- Fixed low contrast issues throughout the app
- Documentation uses:
  - `text-gray-800` for body text (was `text-gray-700`)
  - `text-gray-900` for headers with `font-bold`
  - `bg-gray-100` for light backgrounds (was `bg-gray-50`)
  - `bg-gray-900 text-gray-100` for code blocks
- Error messages are bold with proper contrast
- All inline code uses dark background with light text

### 5. API Server Updates

#### Local Step Execution:
```javascript
// Execute local steps before SSH connection
if (project.localSteps && project.localSteps.length > 0) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  for (const step of project.localSteps) {
    const workingDir = step.workingDir === '.' 
      ? project.localPath 
      : join(project.localPath, step.workingDir);
    
    const { stdout, stderr } = await execAsync(step.command, {
      cwd: workingDir,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
  }
}
```

#### Deployment Recording:
- Records deployments after completion/failure/stop
- Includes duration, step results, and error details
- Tracks individual step timing and total duration
- Updates project statistics
- Distinguishes between failed and stopped deployments

#### SSH Execution Enhancement:
- Uses bash login shell for proper PATH loading
- Sources `.bashrc`, `.profile`, and `.nvm/nvm.sh`
- Fixes "command not found" errors for tools like pm2
- Command format: `bash -c 'source files && cd path && command'`

#### Git Operation Handling:
- Gracefully handles "nothing to commit" scenarios
- Treats "nothing to commit" as non-error
- Continues deployment when no changes exist
- Proper error messaging for actual Git failures

### 6. Port Configuration
- API server port is configurable via:
  - CLI flag: `--api-port 3001`
  - Environment variable: `AUTODEPLOY_API_PORT`
  - Automatic port detection if default is in use

### 7. Deployment View Enhancements
- Professional terminal-style interface
- Real-time log streaming with color coding
- Auto-scrolling with manual pause
- Status indicators with animations
- Step-by-step progress tracking with timing
- Deployment completion handling (prevents looping)
- Shows elapsed time for current deployment
- Displays individual step durations
- Total deployment time in completion message
- Deployment history section with last 10 deployments

## Architecture Details

### Configuration Storage
- Location: `~/.autodeploy/projects/<project-name>/`
- Files per project:
  - `config.json` - Project settings and credentials
  - `local-steps.json` - Local deployment steps
  - `remote-steps.json` - Remote deployment steps  
  - `history.json` - Deployment history (max 50)
  - `stats.json` - Deployment statistics
- Encryption: AES-256-GCM with machine-specific keys
- Permissions: 0600 (owner read/write only) for all files
- Automatic migration from old single-file format

### Execution Order
1. Local steps (on user's machine)
2. Git operations (commit and push if applicable)
3. Remote steps (on deployment server)
4. Record deployment history

### Component Structure
```
gui/src/
├── components/
│   ├── Dashboard.jsx         # Stats and overview
│   ├── ProjectList.jsx       # Project grid with history
│   ├── AddProject.jsx        # New project form with tabs
│   ├── EditProject.jsx       # Edit with JSON mode
│   ├── DeploymentView.jsx    # Real-time deployment
│   ├── DocumentationPage.jsx # Unified docs component
│   └── Layout.jsx            # Main navigation with docs
└── utils/
    └── api.js               # API client with stats endpoint
```

### API Endpoints
- `GET /api/projects` - List all projects
- `GET /api/projects/:name` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:name` - Update project
- `DELETE /api/projects/:name` - Delete project
- `GET /api/deployments/:name` - Start deployment (SSE)
- `GET /api/projects/:name/deployments` - Get deployment history
- `GET /api/stats` - Global deployment statistics
- `GET /api/health` - Health check
- `POST /api/test-connection` - Test SSH connection

## Known Issues and Solutions

### Port Conflicts
- Default ports: GUI (8080), API (3000)
- Use `--port` and `--api-port` flags to change
- Automatic port detection finds next available port

### Deployment Looping
- Fixed by proper EventSource closing
- Sends `event: close` after deployment completion
- Client closes connection on receiving close event

### Contrast Issues
- All fixed with darker backgrounds and text
- Headers use `font-bold` for better visibility
- Code blocks use high contrast dark theme

### SSH Command Not Found
- Fixed by using bash login shell
- Sources necessary files (.bashrc, .profile, .nvm/nvm.sh)
- Ensures tools like pm2, nvm are in PATH

### Git Nothing to Commit
- No longer treated as error
- Deployment continues normally
- Proper messaging in logs

### Deployment Count Issues
- Fixed by counting all deployments in history
- Correctly shows "Deployments Today" on dashboard
- Iterates through full history for accurate counts

## Testing Checklist

- [ ] Local steps execute before remote steps
- [ ] Deployment history records all deployments (including stopped)
- [ ] JSON editor validates in real-time for all edit modes
- [ ] Documentation sidebar expands/collapses correctly
- [ ] CLI documentation accessible in GUI
- [ ] Port configuration works with all methods
- [ ] CLI edit command handles both step types
- [ ] Dashboard shows accurate statistics (especially "Deployments Today")
- [ ] Error handling for failed steps
- [ ] Git operations between local and remote steps
- [ ] "Nothing to commit" handled gracefully
- [ ] SSH commands find tools in PATH (pm2, nvm, etc)
- [ ] Deployment timing tracks correctly
- [ ] Stopped deployments show in history

## Future Enhancements

1. SSH key authentication support
2. Deployment rollback functionality
3. Parallel step execution
4. Step templates/presets
5. Deployment scheduling
6. Webhook notifications
7. Multi-environment support
8. Step output filtering/parsing
9. Deployment approval workflow
10. Integration with CI/CD systems