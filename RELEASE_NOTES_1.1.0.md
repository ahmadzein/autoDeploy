# Release Notes - v1.1.0

## New Features

### 🚀 Local Deployment Steps
- Execute steps on your local machine before remote deployment
- Separate configuration for local and remote steps
- Full CLI and GUI support for managing local steps

### ⏱️ Deployment Timing
- Track duration for each deployment step
- Display total deployment time
- Show elapsed time during active deployments
- Timing information in deployment history

### 📂 Directory-Based Configuration
- Refactored from single JSON file to organized directory structure
- Each project has its own directory with separate files:
  - `config.json` - Project settings and SSH credentials
  - `local-steps.json` - Local deployment steps
  - `remote-steps.json` - Remote deployment steps  
  - `history.json` - Deployment history (last 50)
  - `stats.json` - Deployment statistics
- Automatic migration from old format

### 📝 Enhanced JSON Editor
- Edit different configuration files separately:
  - Full Config
  - Config Only (settings/credentials)
  - Local Steps Only
  - Remote Steps Only
- Real-time JSON validation with visual indicators
- File location display

### 📚 CLI Documentation in GUI
- Added comprehensive CLI reference to the GUI documentation
- Accessible via `/docs/cli` route
- Includes all commands with examples and options

### 🐛 Bug Fixes

#### SSH Command Not Found
- Fixed "pm2: command not found" and similar errors
- Now uses bash login shell to properly load PATH
- Sources `.bashrc`, `.profile`, and `.nvm/nvm.sh`

#### Git "Nothing to Commit"
- No longer treated as an error
- Deployment continues when there are no changes
- Proper status messaging

#### Deployments Today Counter
- Fixed incorrect count on dashboard
- Now correctly counts all deployments from current day
- Iterates through full history for accuracy

### 🎨 UI Improvements

#### Better Text Contrast
- Fixed low contrast issues throughout the application
- Darker text colors for better readability
- Bold headers and proper background colors
- High contrast code blocks

#### Documentation Integration
- Documentation moved to main sidebar
- Expandable sections for better navigation
- No more double sidebars

#### Deployment History
- Shows stopped deployments separately
- Displays timing information for each step
- Last 10 deployments visible in deployment view

### 🔧 CLI Enhancements

#### New Options
- `autodeploy history <project> --verbose` - Show detailed step output
- `autodeploy edit <project> --json` - Direct JSON editing mode
- Better step management for both local and remote steps

#### Improved Commands
- History command shows step timings
- Stats command with accurate deployment counts
- Edit command supports all new configuration options

## Breaking Changes
- Configuration files have moved from `~/.autodeploy/projects.json` to `~/.autodeploy/projects/<project-name>/`
- Automatic migration handles this transparently

## Upgrade Instructions
```bash
# For Homebrew users
brew upgrade autodeploy

# The first run will automatically migrate your configuration
autodeploy list
```

## Migration Notes
- Your existing configuration will be automatically migrated
- A backup is created at `~/.autodeploy/projects.json.backup`
- No manual intervention required

## Contributors
Thank you to everyone who contributed to this release!