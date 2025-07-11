# AutoDeploy Installation Guide

## Current Status ✅

The Homebrew formula is now simplified and working! You can install AutoDeploy using:

### CLI Only (Default)
```bash
brew tap ahmadzein/autodeploy
brew install ahmadzein/autodeploy/autodeploy
```

### CLI + GUI (When GUI is ready)
```bash
brew tap ahmadzein/autodeploy
brew install ahmadzein/autodeploy/autodeploy --with-gui
```

## What's Working

✅ **CLI Installation** - Fully functional
- Simple command: `brew install ahmadzein/autodeploy/autodeploy`
- Installs version 1.1.0 with all dependencies
- `autodeploy` command available globally

## What's Pending

⏳ **GUI Installation** - Needs DMG file
- The GUI cask formula exists but needs:
  1. Build the GUI as a .dmg file
  2. Upload it to GitHub releases for v1.1.0
  3. Update the cask formula with correct URL and SHA256

## Next Steps for GUI

1. **Build the GUI**:
   ```bash
   cd gui
   pnpm build
   # Then package as .dmg (using electron-builder or similar)
   ```

2. **Upload to GitHub Release**:
   - File should be named: `AutoDeploy-1.1.0-mac.dmg`
   - Upload to: https://github.com/ahmadzein/autoDeploy/releases/tag/v1.1.0

3. **Update the Cask**:
   - Fix URL in `/Casks/autodeploy-gui.rb`
   - Update SHA256 hash
   - Change version from 1.0.0 to 1.1.0

## Summary

- ✅ Homebrew tap is working
- ✅ CLI formula is simplified and functional
- ✅ Installation command is now simple: `brew install ahmadzein/autodeploy/autodeploy`
- ⏳ GUI requires DMG file to be built and uploaded
- 🎯 Future goal: Submit to homebrew-core for `brew install autodeploy`