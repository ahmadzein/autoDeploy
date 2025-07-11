#!/bin/bash

# AutoDeploy GUI Service Setup Script

echo "AutoDeploy GUI Service Setup"
echo "============================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "This script is for macOS only. For Linux, use systemd instead."
    exit 1
fi

# Check if autodeploy is installed
if ! command -v autodeploy &> /dev/null; then
    echo "Error: autodeploy is not installed. Please install it first:"
    echo "  brew tap ahmadzein/autodeploy"
    echo "  brew install autodeploy"
    exit 1
fi

SERVICE_FILE="com.autodeploy.gui.plist"
SERVICE_PATH="$HOME/Library/LaunchAgents/$SERVICE_FILE"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "This will install the AutoDeploy GUI as a service that:"
echo "- Starts automatically on login"
echo "- Runs on port 8080"
echo "- Restarts if it crashes"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$HOME/Library/LaunchAgents"

# Copy the plist file
cp "$SCRIPT_DIR/$SERVICE_FILE" "$SERVICE_PATH"

# Load the service
launchctl load "$SERVICE_PATH"

echo ""
echo "✅ Service installed successfully!"
echo ""
echo "The AutoDeploy GUI is now running at: http://localhost:8080"
echo ""
echo "To manage the service:"
echo "  Start:   launchctl start com.autodeploy.gui"
echo "  Stop:    launchctl stop com.autodeploy.gui"
echo "  Restart: launchctl stop com.autodeploy.gui && launchctl start com.autodeploy.gui"
echo "  Disable: launchctl unload ~/Library/LaunchAgents/com.autodeploy.gui.plist"
echo "  Enable:  launchctl load ~/Library/LaunchAgents/com.autodeploy.gui.plist"
echo "  Remove:  launchctl unload ~/Library/LaunchAgents/com.autodeploy.gui.plist && rm ~/Library/LaunchAgents/com.autodeploy.gui.plist"
echo ""
echo "Logs are available at:"
echo "  /usr/local/var/log/autodeploy-gui.out.log"
echo "  /usr/local/var/log/autodeploy-gui.err.log"