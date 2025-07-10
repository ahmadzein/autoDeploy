# Installation Guide

This guide covers all installation methods for AutoDeploy, including system requirements, installation steps, and verification procedures.

## System Requirements

### Minimum Requirements
- **Operating System**: macOS 10.15+, Windows 10+, or Linux (Ubuntu 18.04+, Debian 10+, Fedora 32+)
- **Node.js**: Version 18.0.0 or higher
- **Memory**: 4GB RAM minimum (8GB recommended for GUI)
- **Storage**: 500MB free disk space
- **Network**: Internet connection for remote deployments

### Additional Requirements for GUI
- **Display**: 1280x720 minimum resolution
- **Graphics**: Hardware acceleration support recommended

## Installation Methods

### Method 1: Homebrew (macOS/Linux) - Recommended

#### CLI Installation
```bash
# Add the AutoDeploy tap
brew tap yourusername/autodeploy

# Install the CLI
brew install autodeploy

# Verify installation
autodeploy --version
```

#### GUI Installation
```bash
# Install the GUI application
brew install --cask autodeploy-gui

# The application will be available in your Applications folder
```

### Method 2: Package Managers

#### npm (Global Installation)
```bash
# Install globally with npm
npm install -g autodeploy-cli

# Verify installation
autodeploy --version
```

#### pnpm (Recommended for Development)
```bash
# Install globally with pnpm
pnpm add -g autodeploy-cli

# Verify installation
autodeploy --version
```

### Method 3: From Source

#### Prerequisites
1. Install Node.js (v18+):
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. Install pnpm:
   ```bash
   npm install -g pnpm
   ```

#### Clone and Build
```bash
# Clone the repository
git clone https://github.com/yourusername/autoDeploy.git
cd autoDeploy

# Install dependencies
pnpm install

# Link CLI globally
pnpm link

# Verify CLI installation
autodeploy --version

# For GUI development
pnpm electron:dev
```

### Method 4: Binary Downloads

Download pre-built binaries from the [releases page](https://github.com/yourusername/autoDeploy/releases):

#### macOS
1. Download `AutoDeploy-1.0.0-mac.dmg`
2. Open the DMG file
3. Drag AutoDeploy to Applications folder
4. Open AutoDeploy from Applications

#### Windows
1. Download `AutoDeploy-1.0.0-win.exe`
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu

#### Linux
1. Download `AutoDeploy-1.0.0.AppImage`
2. Make it executable: `chmod +x AutoDeploy-1.0.0.AppImage`
3. Run: `./AutoDeploy-1.0.0.AppImage`

## Post-Installation Setup

### 1. Verify Installation

#### CLI Verification
```bash
# Check version
autodeploy --version

# View help
autodeploy --help

# List commands
autodeploy list
```

#### GUI Verification
- Launch the application
- Check Help > About for version information
- Ensure all menu items are accessible

### 2. Initial Configuration

#### Set Custom Encryption Key (Recommended)
```bash
# Set environment variable for enhanced security
export AUTODEPLOY_SECRET="your-secure-encryption-key"

# Add to shell profile for persistence
echo 'export AUTODEPLOY_SECRET="your-secure-encryption-key"' >> ~/.bashrc
```

#### Configure Default Editor
```bash
# Set your preferred editor for deployment scripts
export EDITOR=vim  # or nano, code, etc.
```

### 3. Directory Structure

AutoDeploy creates the following directories:

```
~/.autodeploy/
├── projects.json     # Encrypted project configurations
├── logs/            # Deployment logs
├── backups/         # Configuration backups
└── cache/           # Temporary files
```

## Updating AutoDeploy

### Homebrew
```bash
# Update CLI
brew upgrade autodeploy

# Update GUI
brew upgrade --cask autodeploy-gui
```

### npm/pnpm
```bash
# Update globally
npm update -g autodeploy-cli
# or
pnpm update -g autodeploy-cli
```

### From Source
```bash
cd autoDeploy
git pull origin main
pnpm install
pnpm link
```

## Uninstallation

### Homebrew
```bash
# Remove CLI
brew uninstall autodeploy

# Remove GUI
brew uninstall --cask autodeploy-gui

# Remove tap
brew untap yourusername/autodeploy
```

### npm/pnpm
```bash
# Remove global package
npm uninstall -g autodeploy-cli
# or
pnpm remove -g autodeploy-cli
```

### Manual Cleanup
```bash
# Remove configuration and data
rm -rf ~/.autodeploy

# Remove from PATH if manually added
# Edit ~/.bashrc or ~/.zshrc and remove AutoDeploy entries
```

## Troubleshooting Installation

### Common Issues

#### 1. Command Not Found
```bash
# Check if binary is in PATH
which autodeploy

# Add to PATH if needed
export PATH="$PATH:/usr/local/bin"
```

#### 2. Permission Denied
```bash
# Fix permissions
sudo chmod +x /usr/local/bin/autodeploy
```

#### 3. Node Version Mismatch
```bash
# Check Node version
node --version

# Update if needed
nvm install 18
nvm use 18
```

#### 4. SSL/TLS Errors
```bash
# For corporate networks
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Getting Help

If you encounter issues:
1. Check the [troubleshooting guide](../troubleshooting/common-issues.md)
2. Search [existing issues](https://github.com/yourusername/autoDeploy/issues)
3. Join our [Discord community](https://discord.gg/autodeploy)
4. Create a new issue with installation logs

## Next Steps

- Follow the [Quick Start Tutorial](./quick-start.md)
- Learn about [Basic Concepts](./concepts.md)
- Configure your first [project](../cli/commands.md#add-project)