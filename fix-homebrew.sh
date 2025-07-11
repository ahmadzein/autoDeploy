#!/bin/bash

echo "Fixing Homebrew formulas..."

# Navigate to homebrew repo
cd /Users/ahmadzein/github/homebrew-autodeploy

# Show what changed
echo "Changes made:"
git status

# Commit and push
git add -A
git commit -m "Simplify to single formula with --with-gui option

- Removed separate cli.rb and gui.rb formulas
- Single autodeploy.rb formula now handles both CLI and GUI
- Use 'brew install ahmadzein/autodeploy/autodeploy' for CLI only
- Use 'brew install ahmadzein/autodeploy/autodeploy --with-gui' for both"

git push

echo "✅ Homebrew formula updated and pushed!"
echo ""
echo "Now users can:"
echo "  brew untap ahmadzein/autodeploy"
echo "  brew tap ahmadzein/autodeploy"
echo "  brew install ahmadzein/autodeploy/autodeploy"