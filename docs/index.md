# AutoDeploy Documentation

Welcome to the AutoDeploy documentation! AutoDeploy is a powerful deployment automation tool that simplifies the process of deploying projects to remote servers with just one click.

## What is AutoDeploy?

AutoDeploy is a secure, user-friendly deployment automation tool available as both a command-line interface (CLI) and a graphical user interface (GUI). It handles the entire deployment pipeline from committing local changes to executing remote deployment steps on your servers.

## Key Features

- **🔐 Secure Credential Storage**: All SSH credentials and configurations are encrypted using AES encryption
- **🚀 One-Click Deployment**: Deploy your projects with a single command or button click
- **📦 Custom Deployment Pipelines**: Define multiple deployment steps that execute in sequence
- **🔄 Git Integration**: Automatically commit and push changes before deployment
- **📊 Real-time Monitoring**: Track deployment progress with detailed logs
- **🎨 Modern GUI**: Beautiful Electron-based interface for visual deployment management
- **🖥️ Cross-Platform**: Works on macOS, Windows, and Linux

## Quick Start

### Installation

**For CLI only:**
```bash
brew tap yourusername/autodeploy
brew install autodeploy
```

**For GUI application:**
```bash
brew install --cask autodeploy-gui
```

### Your First Deployment

1. Add a project:
   ```bash
   autodeploy add-project
   ```

2. Configure your deployment steps (e.g., git pull, npm install, restart service)

3. Deploy:
   ```bash
   autodeploy deploy my-project
   ```

## Documentation Overview

### Getting Started
- [Installation Guide](./getting-started/installation.md)
- [Quick Start Tutorial](./getting-started/quick-start.md)
- [Basic Concepts](./getting-started/concepts.md)

### CLI Documentation
- [CLI Commands Reference](./cli/commands.md)
- [CLI Configuration](./cli/configuration.md)
- [CLI Examples](./cli/examples.md)

### GUI Documentation
- [GUI Overview](./gui/overview.md)
- [GUI Features](./gui/features.md)
- [GUI Shortcuts](./gui/shortcuts.md)

### Deployment
- [Deployment Strategies](./deployment/strategies.md)
- [Pipeline Configuration](./deployment/pipeline.md)
- [Best Practices](./deployment/best-practices.md)

### Security
- [Security Overview](./security/overview.md)
- [Encryption Details](./security/encryption.md)
- [SSH Key Management](./security/ssh-keys.md)

### API Reference
- [Core API](./api/core.md)
- [Configuration API](./api/configuration.md)
- [Extension API](./api/extensions.md)

### Troubleshooting
- [Common Issues](./troubleshooting/common-issues.md)
- [Error Messages](./troubleshooting/errors.md)
- [FAQ](./troubleshooting/faq.md)

## Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/autoDeploy/issues)
- **Discussions**: [Join the community](https://github.com/yourusername/autoDeploy/discussions)
- **Email**: support@autodeploy.example.com

## Contributing

We welcome contributions! See our [Contributing Guide](https://github.com/yourusername/autoDeploy/blob/main/CONTRIBUTING.md) for details.

---

*Last updated: {{ date }}*