# Homebrew Formula Structure

## Overview

AutoDeploy is now available through three different Homebrew formulas:

### 1. Complete Installation (CLI + GUI)
```bash
brew install ahmadzein/autodeploy/autodeploy
```
- Installs both CLI and GUI components
- Best for users who want the full experience

### 2. CLI Only
```bash
brew install ahmadzein/autodeploy/cli
```
- Installs just the command-line interface
- Lightweight option for server environments or CLI-only users

### 3. GUI Only
```bash
brew install --cask ahmadzein/autodeploy/gui
```
- Installs just the GUI application
- Requires CLI to be installed (automatic dependency)

## Formula Files

### `/Formula/autodeploy.rb`
- Meta-formula that installs both components
- Dependencies: `ahmadzein/autodeploy/cli`
- Post-install: Automatically installs GUI cask

### `/Formula/cli.rb`
- CLI-only installation
- Dependencies: node, pnpm
- Installs from GitHub release tarball
- Creates `autodeploy` command symlink

### `/Formula/gui.rb` (or `/Casks/autodeploy-gui.rb`)
- GUI application cask
- Dependencies: `ahmadzein/autodeploy/cli`
- Installs from DMG release
- Includes proper app cleanup on uninstall

## Installation Commands

```bash
# First time setup
brew tap ahmadzein/autodeploy

# Install everything
brew install ahmadzein/autodeploy/autodeploy

# Or install individually
brew install ahmadzein/autodeploy/cli
brew install --cask ahmadzein/autodeploy/gui

# Upgrade
brew upgrade ahmadzein/autodeploy/autodeploy
brew upgrade ahmadzein/autodeploy/cli
brew upgrade --cask ahmadzein/autodeploy/gui
```

## Notes

- The GUI requires the CLI to function properly
- The meta-formula (autodeploy) provides the simplest installation experience
- All formulas use the same version numbering from GitHub releases