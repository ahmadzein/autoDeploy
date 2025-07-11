# Homebrew Setup Instructions

## For Your homebrew-autodeploy Repository

### 1. Remove the extra formula files
Delete these files from your homebrew-autodeploy repo:
- `/Formula/cli.rb`
- `/Formula/gui.rb`

Keep only:
- `/Formula/autodeploy.rb` (replace with the new version)
- `/Casks/autodeploy-gui.rb` (keep as is)

### 2. Update the autodeploy.rb formula
Replace the content of `/Formula/autodeploy.rb` with the new version that supports options.

### 3. Commit and push
```bash
cd /Users/ahmadzein/github/homebrew-autodeploy
git add -A
git commit -m "Simplify formula structure - single formula with --with-gui option"
git push
```

## Usage After Changes

### Simple Installation Commands:
```bash
# CLI only (default)
brew install ahmadzein/autodeploy

# CLI + GUI
brew install ahmadzein/autodeploy --with-gui

# GUI only (if CLI already installed)
brew install --cask ahmadzein/autodeploy/autodeploy-gui
```

### For Users:
```bash
# First time
brew tap ahmadzein/autodeploy
brew install ahmadzein/autodeploy              # CLI only
brew install ahmadzein/autodeploy --with-gui   # Both

# Upgrade
brew upgrade ahmadzein/autodeploy
```

## Benefits of This Approach

1. **Simple default command**: `brew install ahmadzein/autodeploy`
2. **Clear option for GUI**: `--with-gui`
3. **Follows Homebrew conventions**
4. **Easy to remember and type**
5. **GUI can still be installed separately if needed**

## Future: Getting into Homebrew Core

Once your project has:
- 50+ GitHub stars
- Stable releases for 6+ months
- Active maintenance
- Good documentation

You can submit to homebrew-core, then users can simply:
```bash
brew install autodeploy
```

No tap needed!