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
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Welcome to AutoDeploy</h3>
          <p className="mb-4 text-gray-800">
            AutoDeploy is a secure deployment automation tool that helps you deploy projects to remote servers with one click.
          </p>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Quick Start</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-800">
            <li>Add a new project using the "Add Project" button</li>
            <li>Configure your SSH connection details</li>
            <li>Define deployment steps for both local and remote execution</li>
            <li>Test your connection</li>
            <li>Click "Deploy" to run your deployment pipeline</li>
          </ol>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Key Features</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>Encrypted storage of credentials</li>
            <li>Local and remote deployment steps</li>
            <li>Real-time deployment logs</li>
            <li>Deployment history tracking</li>
            <li>Git integration for automatic commits</li>
          </ul>
        </div>
      )
    },
    'projects': {
      title: 'Managing Projects',
      icon: Settings,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Project Configuration</h3>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Project Fields</h4>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <dl className="space-y-3">
              <div>
                <dt className="font-semibold text-gray-900">Project Name</dt>
                <dd className="text-gray-800">Unique identifier for your project</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Local Path</dt>
                <dd className="text-gray-800">Path to your project on your local machine</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Remote Path</dt>
                <dd className="text-gray-800">Absolute path on the deployment server</dd>
              </div>
            </dl>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">SSH Configuration</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li><strong>Host:</strong> Server domain or IP address</li>
            <li><strong>Username:</strong> SSH user for deployment</li>
            <li><strong>Password:</strong> Encrypted and stored securely</li>
            <li><strong>Port:</strong> SSH port (default: 22)</li>
          </ul>

          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mt-4">
            <p className="text-blue-900">
              <strong>Tip:</strong> Always test your SSH connection before saving a project configuration.
            </p>
          </div>
        </div>
      )
    },
    'deployment-steps': {
      title: 'Deployment Steps',
      icon: Zap,
      content: (
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Configuring Deployment Steps</h3>
          
          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Local Steps</h4>
          <p className="mb-4 text-gray-800">
            Local steps run on your machine before connecting to the server. Common uses:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-800 mb-4">
            <li>Building your application</li>
            <li>Running tests</li>
            <li>Compiling assets</li>
            <li>Creating deployment artifacts</li>
          </ul>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Remote Steps</h4>
          <p className="mb-4 text-gray-800">
            Remote steps run on the deployment server. Common uses:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-800 mb-4">
            <li>Installing dependencies</li>
            <li>Running database migrations</li>
            <li>Restarting services</li>
            <li>Clearing caches</li>
          </ul>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Step Configuration</h4>
          <div className="bg-gray-100 p-4 rounded-lg">
            <dl className="space-y-3">
              <div>
                <dt className="font-semibold text-gray-900">Name</dt>
                <dd className="text-gray-800">Descriptive name for the step</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Command</dt>
                <dd className="text-gray-800">Shell command to execute</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Working Directory</dt>
                <dd className="text-gray-800">Directory to run the command in (relative to project path)</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Continue on Error</dt>
                <dd className="text-gray-800">Whether to continue deployment if this step fails</dd>
              </div>
            </dl>
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
npm run build
npm test
            </pre>
            <p className="font-semibold mb-2 mt-4 text-gray-900">Remote Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
npm ci --production
pm2 restart app
            </pre>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Laravel Application</h4>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2 text-gray-900">Local Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
composer install --no-dev
npm run production
            </pre>
            <p className="font-semibold mb-2 mt-4 text-gray-900">Remote Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
php artisan down
git pull origin main  
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
            </pre>
          </div>

          <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">Static Website</h4>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="font-semibold mb-2 text-gray-900">Local Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
npm run build
            </pre>
            <p className="font-semibold mb-2 mt-4 text-gray-900">Remote Steps:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
rsync -av --delete ./dist/ /var/www/html/
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