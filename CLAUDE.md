# AutoDeploy - Claude Development Notes

## Project Overview

AutoDeploy is a secure local deployment automation tool that helps deploy projects to remote servers with one click. It features both CLI and GUI interfaces with encrypted credential storage.

## Recent Updates and Features

### Latest Updates (July 2025)

#### Key Features Added:
1. **SSH Key Authentication**: Support for PEM files and private keys with optional passphrases
2. **Port Forwarding**: Configure SSH port forwarding for database connections
3. **Deployment Timing**: Track duration for each step and total deployment time
4. **Stopped Deployments**: Track manually stopped deployments in history
5. **SSH PATH Fix**: Use bash login shell to ensure proper PATH loading
6. **Nothing to Commit Handling**: Gracefully handle Git "nothing to commit" scenarios
7. **CLI Reference in GUI**: Added comprehensive CLI documentation to GUI
8. **Deployments Today Fix**: Correctly count all deployments from today
9. **Deployment History Fix**: Fixed history recording for both single and monorepo projects
10. **Separate Logs Storage**: Deployment logs now stored in separate logs.json file
11. **Stateful SSH Sessions**: Maintain SSH session state for nested SSH scenarios
12. **Interactive Prompt Support**: Handle dynamic user prompts during deployment
13. **Inline Step Editing**: Edit deployment steps directly in the UI without JSON mode
14. **Monorepo Settings Editing**: Edit monorepo project settings through EditProject component
15. **Display Name Consistency**: Show user-friendly display names instead of slugs everywhere
16. **Prefilled Inputs for Interactive Steps**: Configure automatic responses for prompts
17. **Unified StepEditor Component**: Consistent step editing UI across all project types
18. **CLI Interactive Input Support**: Configure prefilled inputs via CLI edit command

### Configuration Structure Refactor

#### Directory-Based Configuration
- **Migration**: Automatic migration from single `projects.json` to directory structure
- **Organization**: Each project has its own directory under `~/.autodeploy/projects/`
- **File Separation**:
  - `config.json` - Core project settings and SSH credentials
  - `local-steps.json` - Steps executed on local machine
  - `remote-steps.json` - Steps executed on deployment server
  - `history.json` - Deployment history metadata (without step logs)
  - `logs.json` - Detailed deployment logs and step outputs
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
      "continueOnError": false,
      "interactive": false
    }
  ],
  "deploymentSteps": [
    {
      "name": "Install Dependencies", 
      "command": "npm ci --production",
      "workingDir": ".",
      "continueOnError": false,
      "interactive": false
    },
    {
      "name": "Run Deployment Script",
      "command": "bash updateStaging.sh",
      "workingDir": ".",
      "continueOnError": false,
      "interactive": true  // Set to true for scripts that ask questions
    }
  ]
}
```

#### Interactive Steps:
- Set `"interactive": true` for steps that prompt for user input
- The system will detect prompts ending with `?` or `:` 
- In GUI: A yellow prompt UI will appear for user input
- In CLI: The terminal will pause for user input
- Works with nested SSH sessions (jump servers)

#### Prefilled Inputs (New Feature):
- Configure automatic responses for interactive steps
- Structure:
```json
{
  "name": "Deploy with Branch",
  "command": "./deploy.sh",
  "interactive": true,
  "inputs": [
    { "name": "branch", "value": "main" },
    { "name": "environment", "value": "production" },
    { "name": "confirm", "value": "" }  // Empty value = press enter
  ]
}
```
- Inputs are matched to prompts in order
- Leave value empty for "Press enter" prompts
- If no prefilled input matches, user is prompted
- Configurable via:
  - GUI: StepEditor component with interactive UI
  - CLI: `autodeploy edit` command with prompts

- **Prefilled inputs**: Automatically answer prompts in order
- **Dynamic prompts**: If no prefilled input exists, GUI shows prompt
- **Press Enter prompts**: Detected automatically, shows special UI
- **Mixed mode**: Can have some prefilled, some manual prompts

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
- **NEW**: JSON mode now available for monorepo sub-deployments

#### Inline Step Editing:
- **NEW**: Edit deployment steps directly without switching to JSON mode
- Click the edit icon (pencil) on any step to enter edit mode
- Editable fields:
  - Step name
  - Command
  - Working directory
  - Continue on error flag
  - Interactive flag
- Save or cancel changes with dedicated buttons
- Available in both EditProject and EditSubDeployment components

#### Monorepo UI Enhancements:
- **NEW**: Edit Settings button in SubDeployments view
- Monorepo projects can be edited using the same EditProject component
- All monorepo settings are now editable through the UI
- Sub-deployment editing supports both form and JSON modes

#### Display Name Consistency:
- **NEW**: All views now show user-friendly display names instead of slugs
- Automatic fallback to slug if display name not set
- Consistent experience across:
  - Project lists
  - Edit forms
  - Sub-deployment views
  - Deployment views

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

#### Error Detection in SSH Commands:
- **Pattern-based Error Detection**: StatefulSSHExecutor now detects errors in command output
- **Success Pattern Override**: Explicit success messages override error detection
- **Smart Error Patterns**:
  - PHP/MySQL exceptions and fatal errors
  - Command not found errors
  - Database errors (table exists, access denied)
  - Git errors (fatal, push rejected)
  - Build/compilation failures
  - Exit code detection in output
- **False Positive Prevention**:
  - Ignores "0 errors" patterns
  - Skips error log references
  - Avoids error handling discussions
- **Error Reporting**: Commands marked as failed with error message in UI

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

#### SSH Key Authentication:
- Support for password and private key authentication methods
- Compatible with PEM files (AWS EC2, etc.) and standard SSH keys
- Optional passphrase support for encrypted keys
- SSH options configuration for advanced use cases
- Port forwarding support for database tunneling
- Example configuration:
```javascript
ssh: {
  host: 'example.com',
  username: 'deploy-user',
  privateKeyPath: '/Users/you/.ssh/id_rsa',
  passphrase: 'optional-key-passphrase',
  port: 22,
  sshOptions: {
    localPortForwarding: [{
      localPort: 7777,
      remoteHost: 'database.internal',
      remotePort: 5432
    }]
  }
}
```

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
- **Interactive Prompt UI**: Dynamic input fields for deployment prompts
- **Real-time prompt detection**: Automatic detection of script questions

### 8. Stateful SSH Sessions

#### Overview
The StatefulSSHExecutor class maintains persistent SSH sessions across multiple deployment steps, crucial for nested SSH scenarios where subsequent commands need the context from previous commands.

#### Key Features:
- **Persistent Shell Sessions**: Uses SSH2's shell() method instead of exec()
- **Session State Maintenance**: Preserves environment and directory context
- **Interactive Prompt Detection**: Identifies and handles user prompts
- **Real-time Output Streaming**: Streams output via EventEmitter
- **Script Completion Detection**: Recognizes natural script endings
- **Timeout Protection**: 30-second timeout with activity tracking

#### Implementation:
```javascript
// Located in src/pipeline/executor-stateful-ssh.js
export class StatefulSSHExecutor extends EventEmitter {
  constructor(sshConfig, projectPath) {
    super();
    this.sshConfig = sshConfig;
    this.projectPath = projectPath;
    this.currentStream = null;
    this.commandQueue = [];
    this.waitingForUserInput = false;
    this.sessionId = null;
  }
  
  handleUserInput(input) {
    if (this.waitingForUserInput && this.currentStream) {
      this.currentStream.write(input + '\n');
      this.waitingForUserInput = false;
      return true;
    }
    return false;
  }
}
```

#### Usage Scenarios:
1. **Nested SSH**: SSH to jump server, then SSH to target server
2. **Interactive Scripts**: Scripts that prompt for branch names, versions, etc.
3. **Environment-dependent Commands**: Commands that rely on previous cd or export
4. **Long-running Scripts**: Deployment scripts with multiple interactive steps

### 9. Interactive Prompt Support

#### GUI Implementation:
- **Prompt Detection**: Real-time detection of interactive prompts
- **User Input UI**: Yellow-highlighted prompt with input field
- **Async Communication**: WebSocket-like input handling via SSE
- **Context Preservation**: Maintains session ID for input routing

#### CLI Implementation:
- **Readline Interface**: Terminal-based prompt handling
- **Colored Prompts**: Yellow prompts with cyan input indicators
- **Synchronous Flow**: Waits for user input before proceeding

#### Prompt Patterns Detected:
- Questions ending with `?`
- Common prompts: `Enter:`, `Type:`, `Choose:`, `Select:`
- Yes/No prompts: `(y/n)`, `(yes/no)`
- Password prompts: `password:`, `passphrase:`
- Custom patterns: `What branch/tag do you want to deploy?`

#### Example Flow:
```
[PROMPT] What branch/tag do you want to deploy?
> main
[STATEFUL-SSH] Sending user input: main
Deploying branch: main...
```

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
- `POST /api/deployments/:name/input` - Send input for interactive prompts
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

### Nested SSH Stuck Issues
- Fixed by implementing StatefulSSHExecutor
- Maintains shell session state between commands
- No longer combines multiple commands into one
- Each step executes sequentially in same session

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
- [ ] SSH key authentication works with PEM files
- [ ] SSH key passphrase support functions correctly
- [ ] Port forwarding configuration saves and loads properly
- [ ] Edit SSH credentials option in CLI edit command
- [ ] GUI correctly switches between password and key auth modes
- [ ] Deployment logs saved separately in logs.json
- [ ] History command loads logs from separate file
- [ ] Old deployments still work without logs.json
- [ ] Error detection in SSH commands (MySQL errors, PHP errors, etc)
- [ ] Commands with errors marked as failed in deployment view
- [ ] Success patterns override error detection
- [ ] False positive error patterns are ignored
- [ ] Stateful SSH maintains session between commands
- [ ] Interactive prompts work in both GUI and CLI
- [ ] Nested SSH commands execute properly
- [ ] Script completion detection works correctly
- [ ] User input is properly sent to deployment scripts
- [ ] Prompt UI shows with correct styling
- [ ] Inline step editing works in both form views
- [ ] Monorepo settings can be edited through EditProject
- [ ] JSON mode works for sub-deployments
- [ ] Display names show correctly in all views

## Future Enhancements

1. ~~SSH key authentication support~~ ✅ Implemented
2. Deployment rollback functionality
3. Parallel step execution
4. Step templates/presets
5. Deployment scheduling
6. Webhook notifications
7. Multi-environment support
8. Step output filtering/parsing
9. Deployment approval workflow
10. Integration with CI/CD systems