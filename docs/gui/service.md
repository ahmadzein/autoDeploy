# Running AutoDeploy GUI as a Service

The AutoDeploy GUI can be run as a service on a fixed port, making it accessible like a web application.

## Quick Start

### Using the CLI (Recommended)

```bash
# Run on default port 8080
autodeploy gui

# Run on custom port
autodeploy gui --port 3000

# Run without opening browser
autodeploy gui --no-open

# Run in production mode
autodeploy gui --production
```

### Command Options

- `--port <port>` - Port to run the GUI on (default: 8080)
- `--host <host>` - Host to bind to (default: localhost)
- `--api-port <port>` - Port to run the API server on (default: 3000)
- `--no-open` - Don't open browser automatically
- `--debug` - Show debug output
- `--production` - Run in production mode

### Configuration Methods

1. **Command Line Options** (highest priority):
   ```bash
   autodeploy gui --port 8080 --api-port 3001
   ```

2. **Environment Variables**:
   ```bash
   export AUTODEPLOY_GUI_PORT=8080
   export AUTODEPLOY_API_PORT=3001
   export AUTODEPLOY_GUI_HOST=localhost
   export AUTODEPLOY_API_HOST=localhost
   autodeploy gui
   ```

3. **Configuration File** (.env):
   ```bash
   # Create .env file in project root
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

### Port Conflict Resolution

If port 3000 is already in use:

```bash
# Use a different API port
autodeploy gui --api-port 3001

# Or set environment variable
export AUTODEPLOY_API_PORT=3001
autodeploy gui
```

## Running as a System Service

### macOS (using launchd)

1. Install the service:
   ```bash
   cd /usr/local/opt/autodeploy/services
   ./setup-service.sh
   ```

2. The GUI will now:
   - Start automatically on login
   - Run on port 8080
   - Restart if it crashes

3. Manage the service:
   ```bash
   # Start
   launchctl start com.autodeploy.gui
   
   # Stop
   launchctl stop com.autodeploy.gui
   
   # Restart
   launchctl stop com.autodeploy.gui && launchctl start com.autodeploy.gui
   
   # View logs
   tail -f /usr/local/var/log/autodeploy-gui.out.log
   ```

### Linux (using systemd)

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/autodeploy-gui.service
   ```

2. Add the following content:
   ```ini
   [Unit]
   Description=AutoDeploy GUI Service
   After=network.target
   
   [Service]
   Type=simple
   User=YOUR_USERNAME
   ExecStart=/usr/local/bin/autodeploy gui --port 8080 --no-open
   Restart=always
   RestartSec=10
   
   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable autodeploy-gui
   sudo systemctl start autodeploy-gui
   ```

4. Check status:
   ```bash
   sudo systemctl status autodeploy-gui
   ```

## Running with PM2

For more advanced process management:

```bash
# Install PM2
npm install -g pm2

# Start AutoDeploy GUI
pm2 start autodeploy --name "autodeploy-gui" -- gui --port 8080 --no-open

# Save PM2 configuration
pm2 save
pm2 startup
```

## Running in Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
RUN npm install -g pnpm
RUN npm install -g @ahmadzein/autodeploy
EXPOSE 8080
CMD ["autodeploy", "gui", "--port", "8080", "--host", "0.0.0.0"]
```

Build and run:

```bash
docker build -t autodeploy-gui .
docker run -d -p 8080:8080 --name autodeploy autodeploy-gui
```

## Security Considerations

When running as a service:

1. **Bind to localhost only** (default) unless you need external access
2. **Use a reverse proxy** (nginx/Apache) for external access
3. **Enable authentication** if exposing to network
4. **Use HTTPS** for production deployments

### Nginx Reverse Proxy Example

```nginx
server {
    listen 80;
    server_name autodeploy.example.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Service Won't Start

1. Check logs:
   - macOS: `/usr/local/var/log/autodeploy-gui.err.log`
   - Linux: `journalctl -u autodeploy-gui`

2. Verify installation:
   ```bash
   which autodeploy
   autodeploy --version
   ```

3. Check permissions:
   ```bash
   ls -la ~/.autodeploy
   ```