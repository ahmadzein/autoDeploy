import React from 'react';
import { useParams } from 'react-router-dom';
import { Book, Terminal, Globe, Shield, Zap, Settings, AlertCircle, Code, Command } from 'lucide-react';

function DocumentationPage() {
  const { section } = useParams();

  const sections = {
    'getting-started': {
      title: 'Getting Started',
      icon: Book,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Getting Started with AutoDeploy</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-blue-900 mb-2">Welcome to AutoDeploy!</h4>
            <p className="text-blue-800">
              AutoDeploy is a secure, local deployment automation tool that helps you deploy projects to remote servers with one click. 
              It features both CLI and GUI interfaces with encrypted credential storage and comprehensive deployment tracking.
            </p>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Installation Methods</h4>
          
          <div className="grid gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">📦 Homebrew (Recommended)</h5>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto mb-3">
{`# Add AutoDeploy tap
brew tap ahmadzein/autodeploy

# Install AutoDeploy
brew install autodeploy

# Verify installation
autodeploy --version`}
              </pre>
              <p className="text-gray-700 text-sm">
                <strong>Benefits:</strong> Automatic updates, easy uninstall, managed dependencies
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🔧 Manual Installation</h5>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto mb-3">
{`# Clone the repository
git clone https://github.com/ahmadzein/autoDeploy.git
cd autoDeploy

# Install dependencies
npm install

# Link globally
npm link

# Start using
autodeploy --version`}
              </pre>
              <p className="text-gray-700 text-sm">
                <strong>Benefits:</strong> Latest development features, contribute to development
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🐳 Docker Installation</h5>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto mb-3">
{`# Pull the image
docker pull ahmadzein/autodeploy:latest

# Run with GUI
docker run -d -p 8080:8080 -p 3000:3000 \\
  -v ~/.autodeploy:/root/.autodeploy \\
  -v ~/.ssh:/root/.ssh:ro \\
  ahmadzein/autodeploy:latest

# Access GUI at http://localhost:8080`}
              </pre>
              <p className="text-gray-700 text-sm">
                <strong>Benefits:</strong> Isolated environment, no local dependencies
              </p>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Quick Start Guide</h4>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-6">
              <h5 className="text-lg font-bold text-gray-900 mb-2">Step 1: Launch AutoDeploy</h5>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto mb-2">
{`# Start the GUI (recommended for beginners)
autodeploy gui

# Or use CLI directly
autodeploy add-project`}
              </pre>
              <p className="text-gray-700 text-sm">The GUI will open at http://localhost:8080 with the API running on port 3000.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-6">
              <h5 className="text-lg font-bold text-gray-900 mb-2">Step 2: Create Your First Project</h5>
              <p className="text-gray-700 mb-3">Click "Add Project" in the GUI or use the CLI:</p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto mb-2">
autodeploy add-project
              </pre>
              <p className="text-gray-700 text-sm">Follow the interactive prompts to configure your project and SSH connection.</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-6">
              <h5 className="text-lg font-bold text-gray-900 mb-2">Step 3: Configure Deployment Steps</h5>
              <p className="text-gray-700 mb-3">Add local and remote deployment steps. Example for a Node.js app:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">Local Steps:</p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs">
{`• Install Dependencies
• Build Application  
• Run Tests`}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">Remote Steps:</p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs">
{`• Install Prod Dependencies
• Restart Application
• Verify Health`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-red-500 pl-6">
              <h5 className="text-lg font-bold text-gray-900 mb-2">Step 4: Test & Deploy</h5>
              <p className="text-gray-700 mb-3">Test your SSH connection, then deploy:</p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto mb-2">
{`# Test connection (GUI has a test button)
autodeploy edit my-project

# Deploy your project
autodeploy deploy my-project`}
              </pre>
              <p className="text-gray-700 text-sm">Watch real-time logs in the GUI or CLI output.</p>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Project Types</h4>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🗂️ Standard Projects</h5>
              <p className="text-gray-700 mb-3">
                Single applications with their own deployment configuration.
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Individual web applications</li>
                <li>API services</li>
                <li>Static websites</li>
                <li>Database applications</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🏢 Monorepo Projects</h5>
              <p className="text-gray-700 mb-3">
                Multiple applications managed in a single repository.
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Frontend + Backend applications</li>
                <li>Microservices architecture</li>
                <li>Multi-environment deployments</li>
                <li>Shared libraries and tools</li>
              </ul>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Key Features</h4>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-bold text-green-900 mb-2">🔒 Security</h5>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• AES-256-GCM encryption</li>
                <li>• SSH key authentication</li>
                <li>• Local credential storage</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-bold text-blue-900 mb-2">⚡ Automation</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Local & remote steps</li>
                <li>• Git integration</li>
                <li>• Real-time logging</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="font-bold text-purple-900 mb-2">📊 Tracking</h5>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Deployment history</li>
                <li>• Performance metrics</li>
                <li>• Error logging</li>
              </ul>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Next Steps</h4>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-bold text-blue-900 mb-2">📖 Learn More</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Managing Projects</li>
                <li>• Deployment Steps</li>
                <li>• Security Best Practices</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-bold text-green-900 mb-2">🔧 Advanced</h5>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• SSH Key Authentication</li>
                <li>• Monorepo Setup</li>
                <li>• API Integration</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="font-bold text-purple-900 mb-2">💡 Examples</h5>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Node.js Applications</li>
                <li>• Laravel Projects</li>
                <li>• Static Websites</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    'projects': {
      title: 'Managing Projects',
      icon: Settings,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Managing Projects</h3>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-green-900 mb-2">Project Management Overview</h4>
            <p className="text-green-800">
              AutoDeploy supports both standard projects and monorepos. Each project has its own encrypted configuration, 
              deployment steps, and history tracking. You can manage projects through both the GUI and CLI interfaces.
            </p>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Creating Projects</h4>
          
          <div className="grid gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🌐 Standard Project Creation</h5>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">GUI Method:</h6>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    <li>Click "Add Project" button</li>
                    <li>Fill in project details</li>
                    <li>Configure SSH settings</li>
                    <li>Add deployment steps</li>
                    <li>Test connection</li>
                    <li>Save project</li>
                  </ol>
                </div>
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">CLI Method:</h6>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs">
{`autodeploy add-project

# Follow interactive prompts:
? Project name: my-api
? Local path: /Users/me/api
? SSH host: api.example.com
? SSH username: deploy
? Authentication: Private Key
? Key path: ~/.ssh/deploy-key`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🏢 Monorepo Project Creation</h5>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">GUI Method:</h6>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    <li>Click "Add Monorepo" button</li>
                    <li>Configure main repository</li>
                    <li>Add sub-deployments</li>
                    <li>Configure individual steps</li>
                    <li>Test connections</li>
                    <li>Save configuration</li>
                  </ol>
                </div>
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">CLI Method:</h6>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs">
{`autodeploy create-monorepo

# Then add sub-deployments:
autodeploy add-sub my-platform
? Sub-deployment name: frontend
? Relative path: apps/frontend
? Remote path: /var/www/frontend`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Project Configuration Fields</h4>
          
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <dl className="grid md:grid-cols-2 gap-6">
              <div>
                <dt className="font-semibold text-gray-900 mb-1">Project Name</dt>
                <dd className="text-gray-700 text-sm mb-3">
                  Unique identifier for your project. Must be alphanumeric with dashes/underscores only.
                  <br /><code className="text-xs bg-gray-800 text-gray-100 px-1 rounded">Example: my-api, frontend-app</code>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 mb-1">Local Path</dt>
                <dd className="text-gray-700 text-sm mb-3">
                  Absolute path to your project on local machine. AutoDeploy will execute local steps here.
                  <br /><code className="text-xs bg-gray-800 text-gray-100 px-1 rounded">Example: /Users/me/projects/api</code>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 mb-1">Remote Path</dt>
                <dd className="text-gray-700 text-sm mb-3">
                  Absolute path on deployment server where remote steps execute.
                  <br /><code className="text-xs bg-gray-800 text-gray-100 px-1 rounded">Example: /var/www/api</code>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 mb-1">Project Type</dt>
                <dd className="text-gray-700 text-sm mb-3">
                  Standard (single app) or Monorepo (multiple sub-deployments).
                  <br /><code className="text-xs bg-gray-800 text-gray-100 px-1 rounded">Set automatically during creation</code>
                </dd>
              </div>
            </dl>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">SSH Configuration</h4>
          
          <div className="grid gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🔐 Authentication Methods</h5>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">Password Authentication</h6>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-3">
                    <li>Host, username, password required</li>
                    <li>Password encrypted with AES-256-GCM</li>
                    <li>Suitable for development environments</li>
                  </ul>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs">
{`Host: server.example.com
Username: deploy
Password: [encrypted]
Port: 22 (optional)`}
                  </pre>
                </div>
                
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">Private Key Authentication</h6>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-3">
                    <li>Host, username, key path required</li>
                    <li>Supports PEM, OpenSSH formats</li>
                    <li>Optional passphrase protection</li>
                    <li>Recommended for production</li>
                  </ul>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs">
{`Host: server.example.com
Username: deploy
Key Path: /Users/me/.ssh/deploy-key.pem
Passphrase: [optional, encrypted]
Port: 22 (optional)`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🌐 Advanced SSH Features</h5>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">Port Forwarding</h6>
                  <p className="text-sm text-gray-700 mb-2">
                    Create secure tunnels for database access during deployment:
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs mb-2">
{`# Format: local_port:remote_host:remote_port
5433:localhost:5432
3307:db.internal:3306
9200:elasticsearch:9200`}
                  </pre>
                  <p className="text-xs text-gray-600">Access via localhost on specified local ports</p>
                </div>
                
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">SSH Options</h6>
                  <p className="text-sm text-gray-700 mb-2">
                    Custom SSH client options for advanced configurations:
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs mb-2">
{`{
  "StrictHostKeyChecking": "no",
  "UserKnownHostsFile": "/dev/null",
  "ConnectTimeout": "10"
}`}
                  </pre>
                  <p className="text-xs text-gray-600">JSON object with SSH client options</p>
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Project Operations</h4>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-bold text-blue-900 mb-2">✏️ Editing Projects</h5>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>GUI:</strong> Click settings icon on project card</p>
                <p><strong>CLI:</strong> <code className="bg-blue-900 text-blue-100 px-1 rounded">autodeploy edit &lt;name&gt;</code></p>
                <p><strong>JSON Mode:</strong> <code className="bg-blue-900 text-blue-100 px-1 rounded">autodeploy edit &lt;name&gt; --json</code></p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-bold text-green-900 mb-2">📋 Duplicating Projects</h5>
              <div className="text-sm text-green-800 space-y-2">
                <p><strong>GUI:</strong> Click copy icon on project card</p>
                <p><strong>CLI:</strong> <code className="bg-green-900 text-green-100 px-1 rounded">autodeploy duplicate-project &lt;name&gt;</code></p>
                <p><strong>Use Case:</strong> Create staging from production configs</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 className="font-bold text-red-900 mb-2">🗑️ Deleting Projects</h5>
              <div className="text-sm text-red-800 space-y-2">
                <p><strong>GUI:</strong> Click trash icon, confirm deletion</p>
                <p><strong>CLI:</strong> <code className="bg-red-900 text-red-100 px-1 rounded">autodeploy remove &lt;name&gt;</code></p>
                <p><strong>Warning:</strong> Deletes all config, history, and logs</p>
              </div>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Configuration Storage Structure</h4>
          
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <p className="text-gray-800 mb-4">
              Each project stores configuration in <code className="bg-gray-800 text-gray-100 px-2 py-1 rounded">~/.autodeploy/projects/&lt;project-name&gt;/</code>
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`~/.autodeploy/projects/my-api/
├── config.json       # Project settings & SSH credentials
├── local-steps.json  # Local deployment steps
├── remote-steps.json # Remote deployment steps
├── history.json      # Last 50 deployments
├── logs.json        # Detailed step outputs
└── stats.json       # Deployment statistics

# Monorepo structure:
~/.autodeploy/projects/my-platform/
├── config.json      # Main monorepo settings
├── history.json     # Main deployment history
├── logs.json       # Main deployment logs
├── stats.json      # Aggregate statistics
└── sub-deployments/
    ├── frontend/
    │   ├── config.json
    │   ├── local-steps.json
    │   ├── remote-steps.json
    │   ├── history.json
    │   ├── logs.json
    │   └── stats.json
    └── backend/
        └── ... (same structure)`}
            </pre>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">JSON Editor Mode</h4>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-800 mb-4">
              Both GUI and CLI support direct JSON editing for advanced configuration:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h6 className="font-semibold text-gray-800 mb-2">GUI JSON Editor</h6>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-3">
                  <li>Toggle between Form and JSON modes</li>
                  <li>Real-time validation with visual indicators</li>
                  <li>Edit specific files or full configuration</li>
                  <li>Green border/dot = valid JSON</li>
                  <li>Red border/dot = invalid JSON</li>
                </ul>
              </div>
              
              <div>
                <h6 className="font-semibold text-gray-800 mb-2">CLI JSON Editing</h6>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs mb-2">
{`# Edit specific configuration files
autodeploy edit my-api --json

Options:
1. Full Config (all settings)
2. Config Only (settings & SSH)
3. Local Steps
4. Remote Steps
5. View History (read-only)
6. View Stats (read-only)`}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h5 className="font-bold text-yellow-900 mb-2">⚠️ Security & Best Practices</h5>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• All configuration files encrypted with AES-256-GCM</li>
              <li>• File permissions set to 600 (owner read/write only)</li>
              <li>• SSH keys should have 600 permissions</li>
              <li>• Use absolute paths for SSH keys and project directories</li>
              <li>• Test SSH connections before saving configurations</li>
              <li>• Regular backups of ~/.autodeploy directory recommended</li>
            </ul>
          </div>
        </div>
      )
    },
    'deployment-steps': {
      title: 'Deployment Steps',
      icon: Zap,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Deployment Steps Configuration</h3>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-purple-900 mb-2">Deployment Steps Overview</h4>
            <p className="text-purple-800">
              AutoDeploy executes deployment in two phases: local steps on your machine and remote steps on the server. 
              Each step is a JSON object with specific properties that control execution behavior and error handling.
            </p>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Execution Order</h4>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-lg font-bold text-gray-900">Deployment Flow</h5>
              <span className="text-sm text-gray-600">Execution happens in this exact order</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">1</div>
                <div>
                  <h6 className="font-semibold text-gray-800">Local Steps Execution</h6>
                  <p className="text-sm text-gray-600">Run on your machine in project directory</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">2</div>
                <div>
                  <h6 className="font-semibold text-gray-800">Git Operations</h6>
                  <p className="text-sm text-gray-600">Commit changes and push to remote (if applicable)</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">3</div>
                <div>
                  <h6 className="font-semibold text-gray-800">SSH Connection</h6>
                  <p className="text-sm text-gray-600">Establish secure connection to deployment server</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">4</div>
                <div>
                  <h6 className="font-semibold text-gray-800">Remote Steps Execution</h6>
                  <p className="text-sm text-gray-600">Run on server in remote project directory</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">5</div>
                <div>
                  <h6 className="font-semibold text-gray-800">History Recording</h6>
                  <p className="text-sm text-gray-600">Save deployment results and timing</p>
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Step Configuration Properties</h4>
          
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <p className="text-gray-800 mb-4">Each deployment step is a JSON object with these properties:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto mb-4">
{`{
  "name": "Build Application",
  "command": "npm run build",
  "workingDir": ".",
  "continueOnError": false
}`}
            </pre>
            <dl className="grid md:grid-cols-2 gap-6">
              <div>
                <dt className="font-semibold text-gray-900 mb-1">name (required)</dt>
                <dd className="text-gray-700 text-sm mb-3">
                  Descriptive name displayed in logs and history. Use clear, action-oriented names.
                  <br /><code className="text-xs bg-gray-800 text-gray-100 px-1 rounded">Example: "Install Dependencies", "Run Tests"</code>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 mb-1">command (required)</dt>
                <dd className="text-gray-700 text-sm mb-3">
                  Shell command to execute. Can include pipes, redirects, and multiple commands.
                  <br /><code className="text-xs bg-gray-800 text-gray-100 px-1 rounded">Example: "npm install", "php artisan migrate --force"</code>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 mb-1">workingDir (optional)</dt>
                <dd className="text-gray-700 text-sm mb-3">
                  Directory relative to project path. Defaults to "." (project root).
                  <br /><code className="text-xs bg-gray-800 text-gray-100 px-1 rounded">Example: ".", "frontend", "api/src"</code>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 mb-1">continueOnError (optional)</dt>
                <dd className="text-gray-700 text-sm mb-3">
                  Whether to continue deployment if this step fails. Defaults to false.
                  <br /><code className="text-xs bg-gray-800 text-gray-100 px-1 rounded">true = continue, false = stop deployment</code>
                </dd>
              </div>
            </dl>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Local Steps</h4>
          
          <div className="grid gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-blue-900 mb-3">💻 Local Steps Overview</h5>
              <p className="text-blue-800 mb-4">
                Local steps execute on your development machine before any remote connection. They prepare your application for deployment.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h6 className="font-semibold text-blue-800 mb-2">Common Use Cases:</h6>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    <li>Installing dependencies</li>
                    <li>Building applications</li>
                    <li>Running tests and linting</li>
                    <li>Compiling assets (CSS, JS)</li>
                    <li>Creating deployment artifacts</li>
                    <li>Environment validation</li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-semibold text-blue-800 mb-2">Execution Context:</h6>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    <li>Runs in your local project directory</li>
                    <li>Has access to your local environment</li>
                    <li>Can modify files before deployment</li>
                    <li>Stops deployment if critical steps fail</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">📋 Local Steps Examples</h5>
              
              <div className="space-y-4">
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">Node.js/React Application:</h6>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Install Dependencies",
    "command": "npm ci",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Run Linting",
    "command": "npm run lint",
    "workingDir": ".",
    "continueOnError": true
  },
  {
    "name": "Run Tests",
    "command": "npm test -- --coverage",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Build Production Bundle",
    "command": "npm run build",
    "workingDir": ".",
    "continueOnError": false
  }
]`}
                  </pre>
                </div>

                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">Laravel Application:</h6>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Install PHP Dependencies",
    "command": "composer install --no-dev --optimize-autoloader",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Install Node Dependencies",
    "command": "npm ci",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Build Assets",
    "command": "npm run production",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Run PHP Tests",
    "command": "php artisan test",
    "workingDir": ".",
    "continueOnError": true
  }
]`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Remote Steps</h4>
          
          <div className="grid gap-6 mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-red-900 mb-3">🌐 Remote Steps Overview</h5>
              <p className="text-red-800 mb-4">
                Remote steps execute on your deployment server via SSH. They handle server-specific deployment tasks.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h6 className="font-semibold text-red-800 mb-2">Common Use Cases:</h6>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    <li>Pulling latest code from git</li>
                    <li>Installing production dependencies</li>
                    <li>Running database migrations</li>
                    <li>Restarting services (pm2, systemd)</li>
                    <li>Clearing caches</li>
                    <li>Setting file permissions</li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-semibold text-red-800 mb-2">Execution Context:</h6>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    <li>Runs in remote project directory</li>
                    <li>Uses bash login shell (PATH loaded)</li>
                    <li>Has access to server environment</li>
                    <li>Can access databases and services</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🚀 Remote Steps Examples</h5>
              
              <div className="space-y-4">
                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">Node.js API Server:</h6>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Pull Latest Code",
    "command": "git pull origin main",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Install Production Dependencies",
    "command": "npm ci --production",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Run Database Migrations",
    "command": "npm run migrate",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Restart Application",
    "command": "pm2 restart api",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Verify Health Check",
    "command": "curl -f http://localhost:3000/health || exit 1",
    "workingDir": ".",
    "continueOnError": false
  }
]`}
                  </pre>
                </div>

                <div>
                  <h6 className="font-semibold text-gray-800 mb-2">Laravel Web Application:</h6>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Enable Maintenance Mode",
    "command": "php artisan down --message='Deploying updates'",
    "workingDir": ".",
    "continueOnError": true
  },
  {
    "name": "Pull Latest Code",
    "command": "git pull origin main",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Install Dependencies",
    "command": "composer install --no-dev --optimize-autoloader",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Run Migrations",
    "command": "php artisan migrate --force",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Clear Application Cache",
    "command": "php artisan cache:clear",
    "workingDir": ".",
    "continueOnError": true
  },
  {
    "name": "Cache Configuration",
    "command": "php artisan config:cache",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Disable Maintenance Mode",
    "command": "php artisan up",
    "workingDir": ".",
    "continueOnError": false
  }
]`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Advanced Step Configuration</h4>
          
          <div className="grid gap-6 mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-yellow-900 mb-3">⚙️ Working Directory Usage</h5>
              <p className="text-yellow-800 mb-4">
                The workingDir property allows you to run commands in subdirectories relative to your project root.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h6 className="font-semibold text-yellow-800 mb-2">Monorepo Example:</h6>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs">
{`[
  {
    "name": "Build Frontend",
    "command": "npm run build",
    "workingDir": "apps/frontend",
    "continueOnError": false
  },
  {
    "name": "Test Backend",
    "command": "npm test",
    "workingDir": "apps/backend", 
    "continueOnError": true
  }
]`}
                  </pre>
                </div>
                <div>
                  <h6 className="font-semibold text-yellow-800 mb-2">Directory Structure:</h6>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs">
{`my-project/           # Project root
├── apps/
│   ├── frontend/     # workingDir: "apps/frontend"
│   └── backend/      # workingDir: "apps/backend"
├── shared/
└── package.json      # workingDir: "." (default)`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h5 className="text-lg font-bold text-orange-900 mb-3">🔄 Error Handling Strategies</h5>
              <p className="text-orange-800 mb-4">
                Use continueOnError strategically to handle non-critical failures while ensuring deployment safety.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h6 className="font-semibold text-orange-800 mb-2">Continue on Error (true):</h6>
                  <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                    <li>Linting and code quality checks</li>
                    <li>Optional cache clearing</li>
                    <li>Non-critical notifications</li>
                    <li>Performance optimizations</li>
                  </ul>
                  <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs mt-2">
{`{
  "name": "Clear Optional Cache",
  "command": "redis-cli flushall",
  "continueOnError": true
}`}
                  </pre>
                </div>
                <div>
                  <h6 className="font-semibold text-orange-800 mb-2">Stop on Error (false):</h6>
                  <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                    <li>Database migrations</li>
                    <li>Dependency installation</li>
                    <li>Critical service restarts</li>
                    <li>Security-related operations</li>
                  </ul>
                  <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs mt-2">
{`{
  "name": "Run Migrations",
  "command": "php artisan migrate --force",
  "continueOnError": false
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-xl font-bold mt-8 mb-4 text-gray-900">Step Management</h4>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-bold text-blue-900 mb-2">➕ Adding Steps</h5>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>GUI:</strong> Use step editor in project form</p>
                <p><strong>CLI:</strong> Edit via interactive prompts</p>
                <p><strong>JSON:</strong> Direct JSON file editing</p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-bold text-green-900 mb-2">🔄 Reordering Steps</h5>
              <div className="text-sm text-green-800 space-y-2">
                <p><strong>GUI:</strong> Drag and drop in step editor</p>
                <p><strong>CLI:</strong> <code className="bg-green-900 text-green-100 px-1 rounded">autodeploy reorder-steps</code></p>
                <p><strong>JSON:</strong> Manually reorder array items</p>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="font-bold text-purple-900 mb-2">✏️ Editing Steps</h5>
              <div className="text-sm text-purple-800 space-y-2">
                <p><strong>GUI:</strong> Click step to edit properties</p>
                <p><strong>CLI:</strong> <code className="bg-purple-900 text-purple-100 px-1 rounded">autodeploy edit &lt;project&gt;</code></p>
                <p><strong>JSON:</strong> <code className="bg-purple-900 text-purple-100 px-1 rounded">--json</code> flag for direct editing</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h5 className="font-bold text-red-900 mb-2">⚠️ Best Practices & Security</h5>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Test commands manually before adding to deployment steps</li>
              <li>• Use absolute paths for executables when PATH issues occur</li>
              <li>• Never include secrets or passwords in command strings</li>
              <li>• Use environment variables for configuration values</li>
              <li>• Set continueOnError=true only for non-critical steps</li>
              <li>• Keep step names descriptive and action-oriented</li>
              <li>• Use maintenance mode for zero-downtime deployments</li>
            </ul>
          </div>
        </div>
      )
    },
    'deployment': {
      title: 'Running Deployments',
      icon: Terminal,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Deployment Process</h3>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Deployment Flow</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-800">
            <li>Execute local pre-deployment steps</li>
            <li>Git operations (if enabled):
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Commit local changes</li>
                <li>Push to remote repository</li>
              </ul>
            </li>
            <li>Connect to remote server via SSH</li>
            <li>Execute remote deployment steps</li>
            <li>Record deployment history</li>
          </ol>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Real-time Logs</h4>
          <p className="mb-4 text-gray-800">
            The deployment view shows real-time logs with color coding:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li><span className="text-blue-600">Blue:</span> Informational messages</li>
            <li><span className="text-green-600">Green:</span> Successful operations</li>
            <li><span className="text-yellow-600">Yellow:</span> Warnings</li>
            <li><span className="text-red-600">Red:</span> Errors</li>
          </ul>

          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mt-4">
            <p className="text-yellow-900">
              <strong>Note:</strong> The deployment terminal auto-scrolls. Scroll up manually to pause auto-scrolling.
            </p>
          </div>
        </div>
      )
    },
    'security': {
      title: 'Security',
      icon: Shield,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Security Features</h3>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Credential Storage</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>All credentials are encrypted using AES-256-GCM</li>
            <li>Machine-specific encryption keys</li>
            <li>Stored in <code className="bg-gray-800 text-gray-100 px-2 py-1 rounded font-mono text-sm">~/.autodeploy/</code></li>
            <li>File permissions set to 0600 (owner read/write only)</li>
          </ul>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Best Practices</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-800">
            <li>Use SSH keys instead of passwords when possible</li>
            <li>Limit GUI access to localhost in production</li>
            <li>Regularly update AutoDeploy</li>
            <li>Use dedicated deployment users with limited permissions</li>
            <li>Enable firewall rules for SSH access</li>
          </ol>

          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mt-4">
            <p className="text-red-900">
              <strong>Warning:</strong> Never commit your <code className="bg-gray-800 text-gray-100 px-2 py-1 rounded font-mono text-sm">~/.autodeploy/</code> directory to version control.
            </p>
          </div>
        </div>
      )
    },
    'api': {
      title: 'API Reference',
      icon: Globe,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">API Endpoints</h3>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Projects</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="mb-2">GET /api/projects - List all projects</div>
            <div className="mb-2">GET /api/projects/:name - Get single project</div>
            <div className="mb-2">POST /api/projects - Create project</div>
            <div className="mb-2">PUT /api/projects/:name - Update project</div>
            <div className="mb-2">DELETE /api/projects/:name - Delete project</div>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Deployments</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="mb-2">GET /api/deployments/:name - Start deployment (SSE)</div>
            <div className="mb-2">GET /api/projects/:name/deployments - Get history</div>
            <div className="mb-2">GET /api/stats - Global statistics</div>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">System</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="mb-2">GET /api/health - Health check</div>
            <div className="mb-2">POST /api/test-connection - Test SSH</div>
          </div>
        </div>
      )
    },
    'troubleshooting': {
      title: 'Troubleshooting',
      icon: AlertCircle,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Common Issues</h3>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">GUI Won't Start</h4>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="font-mono text-sm mb-2 text-gray-900 font-semibold">Error: Port already in use</p>
            <p className="text-gray-800 font-medium">Solution: Use different ports</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded mt-2 text-sm overflow-x-auto">
autodeploy gui --port 8081 --api-port 3001
            </pre>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">SSH Connection Failed</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>Verify credentials are correct</li>
            <li>Check firewall allows SSH port</li>
            <li>Test connection manually: <code className="bg-gray-800 text-gray-100 px-2 py-1 rounded font-mono text-sm">ssh user@host</code></li>
            <li>Ensure remote path exists</li>
          </ul>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Deployment Hanging</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>Check if commands require user input</li>
            <li>Add timeout to long-running commands</li>
            <li>Use non-interactive command flags</li>
          </ul>

          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mt-4">
            <p className="text-blue-900">
              <strong>Debug Mode:</strong> Run with <code className="bg-blue-900 text-blue-100 px-2 py-1 rounded font-mono text-sm">autodeploy gui --debug</code> for detailed logs.
            </p>
          </div>
        </div>
      )
    },
    'cli': {
      title: 'CLI Reference',
      icon: Command,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Command Line Interface</h3>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Installation</h4>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
# Install globally
npm install -g autodeploy-cli

# Or run directly with npx
npx autodeploy-cli
          </pre>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Commands</h4>
          
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold text-gray-900">autodeploy list</p>
              <p className="text-gray-800 mt-1">List all configured projects with their details</p>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold text-gray-900">autodeploy add-project</p>
              <p className="text-gray-800 mt-1">Add a new project interactively</p>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold text-gray-900">autodeploy edit &lt;project-name&gt;</p>
              <p className="text-gray-800 mt-1">Edit project configuration and steps</p>
              <p className="text-gray-700 text-sm mt-2">Options:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                <li><code>--json</code> - Edit in JSON mode</li>
              </ul>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold text-gray-900">autodeploy deploy &lt;project-name&gt;</p>
              <p className="text-gray-800 mt-1">Deploy a project</p>
              <p className="text-gray-700 text-sm mt-2">Options:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                <li><code>--skip-git</code> - Skip git operations</li>
              </ul>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold text-gray-900">autodeploy delete &lt;project-name&gt;</p>
              <p className="text-gray-800 mt-1">Delete a project configuration</p>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold text-gray-900">autodeploy history &lt;project-name&gt;</p>
              <p className="text-gray-800 mt-1">View deployment history</p>
              <p className="text-gray-700 text-sm mt-2">Options:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                <li><code>--limit &lt;n&gt;</code> - Number of entries to show (default: 10)</li>
                <li><code>--verbose</code> - Show detailed output for all steps</li>
              </ul>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold text-gray-900">autodeploy stats</p>
              <p className="text-gray-800 mt-1">View global deployment statistics</p>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm font-bold text-gray-900">autodeploy gui</p>
              <p className="text-gray-800 mt-1">Start the web GUI</p>
              <p className="text-gray-700 text-sm mt-2">Options:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                <li><code>--port &lt;port&gt;</code> - GUI port (default: 8080)</li>
                <li><code>--api-port &lt;port&gt;</code> - API port (default: 3000)</li>
                <li><code>--no-browser</code> - Don't open browser automatically</li>
              </ul>
            </div>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Configuration</h4>
          <p className="text-gray-800 mb-4">
            All configurations are stored encrypted in <code className="bg-gray-800 text-gray-100 px-2 py-1 rounded font-mono text-sm">~/.autodeploy/projects/</code>
          </p>
          
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <p className="text-blue-900">
              <strong>Tip:</strong> Use <code className="bg-blue-900 text-blue-100 px-2 py-1 rounded font-mono text-sm">autodeploy edit &lt;project&gt; --json</code> to directly edit configuration files.
            </p>
          </div>
        </div>
      )
    },
    'examples': {
      title: 'Examples',
      icon: Code,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Deployment Examples</h3>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Node.js Application</h4>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2 text-gray-900">Local Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Install Dependencies",
    "command": "npm install",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Build Application",
    "command": "npm run build",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Run Tests",
    "command": "npm test",
    "workingDir": ".",
    "continueOnError": false
  }
]`}
            </pre>
            <p className="font-semibold mb-2 mt-4 text-gray-900">Remote Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Install Production Dependencies",
    "command": "npm ci --production",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Restart Application",
    "command": "pm2 restart app",
    "workingDir": ".",
    "continueOnError": false
  }
]`}
            </pre>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Laravel Application</h4>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2 text-gray-900">Local Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Install Dependencies",
    "command": "composer install --no-dev",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Build Assets",
    "command": "npm run production",
    "workingDir": ".",
    "continueOnError": false
  }
]`}
            </pre>
            <p className="font-semibold mb-2 mt-4 text-gray-900">Remote Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Enable Maintenance Mode",
    "command": "php artisan down",
    "workingDir": ".",
    "continueOnError": true
  },
  {
    "name": "Install Dependencies",
    "command": "composer install --no-dev --optimize-autoloader",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Run Migrations",
    "command": "php artisan migrate --force",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Cache Configuration",
    "command": "php artisan config:cache",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Cache Routes",
    "command": "php artisan route:cache",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Cache Views",
    "command": "php artisan view:cache",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Disable Maintenance Mode",
    "command": "php artisan up",
    "workingDir": ".",
    "continueOnError": false
  }
]`}
            </pre>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Static Website</h4>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="font-semibold mb-2 text-gray-900">Local Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Install Dependencies",
    "command": "npm install",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Build Static Site",
    "command": "npm run build",
    "workingDir": ".",
    "continueOnError": false
  }
]`}
            </pre>
            <p className="font-semibold mb-2 mt-4 text-gray-900">Remote Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "Copy Built Files",
    "command": "cp -r ./dist/* /var/www/html/",
    "workingDir": ".",
    "continueOnError": false
  },
  {
    "name": "Set File Permissions",
    "command": "chown -R www-data:www-data /var/www/html/",
    "workingDir": ".",
    "continueOnError": true
  }
]`}
            </pre>
          </div>
        </div>
      )
    }
  };

  const currentSection = sections[section] || sections['getting-started'];

  return (
    <div className="max-w-4xl mx-auto">
      {currentSection.content}
    </div>
  );
}

export default DocumentationPage;