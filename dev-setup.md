# Development Setup for AutoDeploy

## Repository Structure

1. **autoDeploy** (Main Development Repository)
   - Location: `/Users/ahmadzein/github/autoDeploy`
   - Purpose: All development happens here
   - Contains: Source code, GUI, documentation

2. **homebrew-autodeploy** (Distribution Repository)
   - Location: `/Users/ahmadzein/github/homebrew-autodeploy`
   - Purpose: Homebrew formulas for distribution
   - Update only when releasing new versions

## Development Workflow

### Daily Development

Always work in the autoDeploy repository:

```bash
cd /Users/ahmadzein/github/autoDeploy
```

### Testing CLI Locally

```bash
# Run CLI directly
node src/cli/interface.js --help

# Or create an alias for convenience
alias autodeploy-dev="node /Users/ahmadzein/github/autoDeploy/src/cli/interface.js"
```

### Testing GUI Locally

```bash
cd /Users/ahmadzein/github/autoDeploy/gui
pnpm install
pnpm dev  # For development with hot reload
pnpm electron  # To test Electron app
```

### Making Changes

1. **CLI Changes**: Edit files in `src/`
2. **GUI Changes**: Edit files in `gui/src/`
3. **Documentation**: Edit files in `docs/`

### Release Process

When you're ready to release a new version:

1. **Test Everything**
   ```bash
   # Test CLI
   node src/cli/interface.js --version
   node src/cli/interface.js add-project
   
   # Test GUI
   cd gui && pnpm build && pnpm electron
   ```

2. **Update Version**
   ```bash
   # Update version in package.json
   # Update version in gui/package.json
   ```

3. **Commit and Tag**
   ```bash
   git add .
   git commit -m "Release v1.1.0"
   git tag v1.1.0
   git push origin main
   git push origin v1.1.0
   ```

4. **Create GitHub Release**
   - Go to GitHub releases
   - Create release from tag
   - GitHub Actions will build artifacts (or build manually)

5. **Update Homebrew Formulas**
   ```bash
   # Download the release tarball
   curl -L https://github.com/ahmadzein/autoDeploy/archive/refs/tags/v1.1.0.tar.gz -o autodeploy-v1.1.0.tar.gz
   
   # Calculate SHA256
   shasum -a 256 autodeploy-v1.1.0.tar.gz
   
   # Update homebrew-autodeploy repository
   cd /Users/ahmadzein/github/homebrew-autodeploy
   # Edit Formula/autodeploy.rb with new version and SHA256
   # Edit Casks/autodeploy-gui.rb if GUI was updated
   git add .
   git commit -m "Update AutoDeploy to v1.1.0"
   git push
   ```

## Quick Development Commands

```bash
# Start developing
cd /Users/ahmadzein/github/autoDeploy

# Test CLI command
node src/cli/interface.js <command>

# Test GUI
cd gui && pnpm dev

# Run all tests (when you add them)
pnpm test

# Check code
pnpm lint
```

## Important Notes

- Never develop in the homebrew-autodeploy repository
- The homebrew formulas always point to GitHub releases, not local files
- Always test locally before creating a release
- Keep version numbers synchronized across all package.json files