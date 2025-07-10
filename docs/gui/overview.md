# GUI Overview

AutoDeploy GUI provides a modern, intuitive interface for managing deployments with visual feedback and real-time monitoring.

## Interface Layout

![AutoDeploy GUI Layout](./images/gui-layout.png)

### 1. Sidebar Navigation

The left sidebar provides quick access to all major features:

- **Dashboard** - Overview of all projects and recent deployments
- **Projects** - Manage your project configurations
- **Add Project** - Create new project configurations
- **Documentation** - Built-in documentation viewer
- **Settings** - Application preferences

### 2. Main Content Area

The central area displays the current view:
- Interactive forms for project configuration
- Real-time deployment logs
- Project cards with quick actions
- Documentation with search

### 3. Status Bar

Bottom status bar shows:
- Connection status
- Current operation
- Last deployment status
- Quick shortcuts

## Key Features

### Visual Project Management

Projects are displayed as cards showing:
- Project name and description
- Server connection details
- Number of deployment steps
- Last deployment status
- Quick action buttons

### Real-time Deployment Console

The deployment view features:
- Color-coded log output
- Step-by-step progress tracking
- Automatic scrolling
- Error highlighting
- Time stamps

### SSH Connection Testing

Before saving a project:
- Test SSH connectivity
- Verify credentials
- Check directory permissions
- Validate remote paths

### Drag-and-Drop Configuration

Deployment steps support:
- Drag to reorder
- Visual step editor
- Condition settings
- Error handling options

## Navigation

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New project |
| `Cmd/Ctrl + D` | Deploy current project |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + /` | Search documentation |
| `Cmd/Ctrl + L` | View logs |
| `Esc` | Cancel operation |

### Quick Actions

Right-click on any project for:
- Deploy
- Edit
- Clone
- Export
- Delete

## Window Management

### Multiple Windows

Open multiple projects simultaneously:
- `File > New Window`
- Drag project to new window
- Compare deployments side-by-side

### Layouts

Save custom layouts:
- Split view for logs
- Minimized sidebar
- Full-screen deployment

## Themes

Choose from built-in themes:
- **Light** - Default light theme
- **Dark** - Easy on the eyes
- **Auto** - Follows system preference
- **High Contrast** - Accessibility focused

## Getting Started with GUI

### First Launch

1. **Welcome Screen**
   - Quick tutorial
   - Import existing CLI projects
   - Create first project

2. **Project Import**
   - Automatically detects CLI configurations
   - One-click import all projects
   - Preserves all settings

3. **Dashboard Tour**
   - Interactive tooltips
   - Feature highlights
   - Sample project

### Adding Your First Project

1. Click "Add Project" in sidebar
2. Fill in project details:
   - Choose memorable name
   - Browse to local folder
   - Enter SSH credentials
3. Test connection
4. Add deployment steps
5. Save project

### Your First Deployment

1. Go to Projects view
2. Find your project card
3. Click "Deploy" button
4. Watch real-time logs
5. Check deployment summary

## GUI vs CLI

### When to Use GUI

- **Visual Learners** - See all options at once
- **Multiple Projects** - Manage many projects easily  
- **Monitoring** - Watch deployments in real-time
- **Configuration** - Visual step editor
- **Discovery** - Explore features interactively

### When to Use CLI

- **Automation** - Script deployments
- **Remote Access** - SSH to deployment server
- **Speed** - Quick deployments
- **Integration** - CI/CD pipelines
- **Minimal Resources** - Low memory usage

### Using Both

GUI and CLI share the same configuration:
- Projects added in GUI appear in CLI
- CLI changes reflect in GUI
- Same encryption and security
- Unified experience

## Customization

### Preferences

Access via `Cmd/Ctrl + ,`:

- **General**
  - Default project directory
  - Auto-save preferences
  - Update checking

- **Appearance**
  - Theme selection
  - Font size
  - Animation speed

- **Deployment**
  - Default timeout
  - Concurrent deployments
  - Log retention

- **Security**
  - Encryption settings
  - SSH key preferences
  - Password caching

### Custom Shortcuts

Create your own shortcuts:
1. Open Settings > Shortcuts
2. Find command
3. Click current shortcut
4. Press new combination
5. Save changes

## Advanced Features

### Project Templates

Save project as template:
1. Right-click project
2. Select "Save as Template"
3. Name your template
4. Use for similar projects

### Deployment Queues

Queue multiple deployments:
1. Select multiple projects
2. Click "Deploy Selected"
3. Monitor queue progress
4. Cancel or reorder

### Log Analysis

Built-in log analyzer:
- Search across deployments
- Filter by date/status
- Export for analysis
- Error pattern detection

### Notifications

Configure notifications:
- Desktop notifications
- Sound alerts
- Email summaries
- Slack integration

## Troubleshooting GUI

### Common Issues

**GUI Won't Start**
- Check system requirements
- Verify installation
- Look for error logs
- Try safe mode: `AutoDeploy --safe-mode`

**Slow Performance**
- Clear cache: Settings > Advanced > Clear Cache
- Disable animations
- Check system resources
- Update to latest version

**Connection Issues**
- Verify internet connection
- Check firewall settings
- Test with CLI
- Review proxy settings

### Debug Mode

Enable debug mode for detailed logs:
1. Settings > Advanced
2. Enable "Debug Mode"
3. Restart application
4. Check logs in Help > Debug Logs

## Next Steps

- Explore [GUI Features](./features.md)
- Learn [Keyboard Shortcuts](./shortcuts.md)
- Configure [Settings](./settings.md)
- Read about [Security](../security/overview.md)