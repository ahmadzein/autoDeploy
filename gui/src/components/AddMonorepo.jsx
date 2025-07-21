import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FolderTree, AlertCircle } from 'lucide-react';
import { projectAPI } from '../utils/api';

function AddMonorepo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [authMethod, setAuthMethod] = useState('password');
  
  const [formData, setFormData] = useState({
    name: '',
    localPath: '',
    persistentSession: false,
    ssh: {
      host: '',
      username: '',
      password: '',
      privateKeyPath: '',
      passphrase: '',
      port: '22'
    },
    remotePath: '/var/www'
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    if (name.startsWith('ssh.')) {
      const sshField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        ssh: { ...prev.ssh, [sshField]: inputValue }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: inputValue }));
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await projectAPI.testConnection(formData.ssh);
      setTestResult({ success: true, message: 'Connection successful!' });
    } catch (err) {
      setTestResult({ 
        success: false, 
        message: err.response?.data?.message || 'Connection failed' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate project name
      if (!formData.name || formData.name.trim() === '') {
        alert('Project name is required');
        setLoading(false);
        return;
      }
      
      const monorepoData = {
        ...formData,
        type: 'monorepo',
        deploymentSteps: [],
        localSteps: [],
        subDeployments: []
      };
      
      // Clean up SSH config based on auth method
      if (authMethod === 'password') {
        delete monorepoData.ssh.privateKeyPath;
        delete monorepoData.ssh.passphrase;
      } else {
        delete monorepoData.ssh.password;
        if (!monorepoData.ssh.passphrase) {
          delete monorepoData.ssh.passphrase;
        }
      }
      
      await projectAPI.add(monorepoData);
      navigate('/projects');
    } catch (err) {
      console.error('Error creating monorepo:', err);
      alert(err.response?.data?.error || 'Failed to create monorepo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Projects
        </button>
        <div className="flex items-center">
          <FolderTree className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Create Monorepo</h2>
            <p className="mt-2 text-gray-600">Set up a monorepo project with multiple sub-deployments</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <p className="font-semibold mb-1">What is a Monorepo?</p>
                <p>A monorepo allows you to manage multiple related projects (frontend, backend, APIs) from a single repository. Each sub-project can have its own deployment configuration and destination.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monorepo Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="my-awesome-app"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-sm text-gray-500">A unique name for your monorepo project</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Repository Path
              </label>
              <input
                type="text"
                name="localPath"
                value={formData.localPath}
                onChange={handleInputChange}
                required
                placeholder="/Users/username/projects/my-monorepo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-sm text-gray-500">Root directory of your monorepo</p>
            </div>
          </div>
        </div>

        {/* SSH Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SSH Configuration</h3>
          <p className="text-sm text-gray-600 mb-4">Default SSH settings for all sub-deployments (can be overridden per sub-project)</p>
          
          {/* Persistent Session Option */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="persistentSession"
                checked={formData.persistentSession}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Use persistent SSH session (keeps connection alive between steps)
              </span>
            </label>
            <p className="ml-6 mt-1 text-xs text-gray-500">
              Enable this for deployments that require nested SSH connections or maintaining state between steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host
              </label>
              <input
                type="text"
                name="ssh.host"
                value={formData.ssh.host}
                onChange={handleInputChange}
                required
                placeholder="example.com or 192.168.1.100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="ssh.username"
                value={formData.ssh.username}
                onChange={handleInputChange}
                required
                placeholder="deploy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authentication Method
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="authMethod"
                    value="password"
                    checked={authMethod === 'password'}
                    onChange={(e) => setAuthMethod(e.target.value)}
                    className="mr-2"
                  />
                  Password
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="authMethod"
                    value="key"
                    checked={authMethod === 'key'}
                    onChange={(e) => setAuthMethod(e.target.value)}
                    className="mr-2"
                  />
                  Private Key (PEM file)
                </label>
              </div>
            </div>
            {authMethod === 'password' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="ssh.password"
                  value={formData.ssh.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Private Key Path
                  </label>
                  <input
                    type="text"
                    name="ssh.privateKeyPath"
                    value={formData.ssh.privateKeyPath}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="/Users/you/.ssh/id_rsa or .pem file"
                  />
                  <p className="mt-1 text-sm text-gray-500">Full path to your private key file</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passphrase (optional)
                  </label>
                  <input
                    type="password"
                    name="ssh.passphrase"
                    value={formData.ssh.passphrase}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Leave empty if key has no passphrase"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                name="ssh.port"
                value={formData.ssh.port}
                onChange={handleInputChange}
                placeholder="22"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Remote Path
            </label>
            <input
              type="text"
              name="remotePath"
              value={formData.remotePath}
              onChange={handleInputChange}
              required
              placeholder="/var/www"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="mt-1 text-sm text-gray-500">Base directory on the server for deployments</p>
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !formData.ssh.host || !formData.ssh.username || (authMethod === 'password' ? !formData.ssh.password : !formData.ssh.privateKeyPath)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            
            {testResult && (
              <div className={`mt-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-purple-900 mb-2">Next Steps</h3>
          <p className="text-sm text-purple-800 mb-3">After creating the monorepo, you'll be able to:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-purple-700">
            <li>Add sub-deployments (frontend, backend, API, etc.)</li>
            <li>Configure deployment steps for each sub-project</li>
            <li>Deploy individual sub-projects or all at once</li>
            <li>Track deployment history for each sub-project</li>
          </ul>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Creating...' : 'Create Monorepo'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddMonorepo;