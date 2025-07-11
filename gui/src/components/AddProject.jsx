import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { projectAPI } from '../utils/api';

function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    localPath: '',
    ssh: {
      host: '',
      username: '',
      password: '',
      port: '22'
    },
    remotePath: '',
    localSteps: [],
    deploymentSteps: []
  });

  const [newStep, setNewStep] = useState({
    name: '',
    command: '',
    workingDir: '.',
    continueOnError: false
  });

  const [newLocalStep, setNewLocalStep] = useState({
    name: '',
    command: '',
    workingDir: '.',
    continueOnError: false
  });

  const [activeTab, setActiveTab] = useState('local');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('ssh.')) {
      const sshField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        ssh: { ...prev.ssh, [sshField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStepChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewStep(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocalStepChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLocalStep(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addStep = () => {
    if (newStep.name && newStep.command) {
      setFormData(prev => ({
        ...prev,
        deploymentSteps: [...prev.deploymentSteps, { ...newStep }]
      }));
      setNewStep({
        name: '',
        command: '',
        workingDir: '.',
        continueOnError: false
      });
    }
  };

  const addLocalStep = () => {
    if (newLocalStep.name && newLocalStep.command) {
      setFormData(prev => ({
        ...prev,
        localSteps: [...prev.localSteps, { ...newLocalStep }]
      }));
      setNewLocalStep({
        name: '',
        command: '',
        workingDir: '.',
        continueOnError: false
      });
    }
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      deploymentSteps: prev.deploymentSteps.filter((_, i) => i !== index)
    }));
  };

  const removeLocalStep = (index) => {
    setFormData(prev => ({
      ...prev,
      localSteps: prev.localSteps.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await projectAPI.add(formData);
      navigate('/projects');
    } catch (err) {
      console.error('Error adding project:', err);
      alert(err.response?.data?.error || 'Failed to add project. Check your SSH credentials.');
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
        <h2 className="text-3xl font-bold text-gray-900">Add New Project</h2>
        <p className="mt-2 text-gray-600">Configure a new deployment project</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Project Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                placeholder="my-awesome-project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Path
              </label>
              <input
                type="text"
                name="localPath"
                value={formData.localPath}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="/Users/username/projects/my-project"
              />
            </div>
          </div>
        </div>

        {/* SSH Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SSH Configuration</h3>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="example.com or 192.168.1.100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="deploy-user"
              />
            </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                name="ssh.port"
                value={formData.ssh.port}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remote Path
            </label>
            <input
              type="text"
              name="remotePath"
              value={formData.remotePath}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="/var/www/my-project"
            />
            <p className="mt-1 text-sm text-gray-500">Absolute path on the remote server</p>
          </div>
        </div>

        {/* Deployment Steps */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Deployment Steps</h3>
          
          {/* Tab Selector */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('local')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'local'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Local Steps ({formData.localSteps.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('remote')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'remote'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Remote Steps ({formData.deploymentSteps.length})
              </button>
            </nav>
          </div>

          {/* Local Steps Tab */}
          {activeTab === 'local' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                These steps run on your local machine before deployment
              </p>
              
              {/* Existing Local Steps */}
              {formData.localSteps.length > 0 && (
                <div className="space-y-3 mb-6">
                  {formData.localSteps.map((step, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{step.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-mono">{step.command}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Working dir: {step.workingDir} | Continue on error: {step.continueOnError ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLocalStep(index)}
                          className="ml-4 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Local Step Form */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Add Local Step</h4>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={newLocalStep.name}
                      onChange={handleLocalStepChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Step name (e.g., Build Application)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="command"
                      value={newLocalStep.command}
                      onChange={handleLocalStepChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Command (e.g., npm run build)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="workingDir"
                        value={newLocalStep.workingDir}
                        onChange={handleLocalStepChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Working directory"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="continueOnError"
                        checked={newLocalStep.continueOnError}
                        onChange={handleLocalStepChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700">Continue on error</label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addLocalStep}
                    disabled={!newLocalStep.name || !newLocalStep.command}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Local Step
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Remote Steps Tab */}
          {activeTab === 'remote' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                These steps run on the remote server after SSH connection
              </p>
              
              {/* Existing Remote Steps */}
              {formData.deploymentSteps.length > 0 && (
                <div className="space-y-3 mb-6">
                  {formData.deploymentSteps.map((step, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{step.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-mono">{step.command}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Working dir: {step.workingDir} | Continue on error: {step.continueOnError ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="ml-4 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

          {/* Add New Step */}
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newStep.name}
                  onChange={handleStepChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Install dependencies"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Directory
                </label>
                <input
                  type="text"
                  name="workingDir"
                  value={newStep.workingDir}
                  onChange={handleStepChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Command
              </label>
              <input
                type="text"
                name="command"
                value={newStep.command}
                onChange={handleStepChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="npm install"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="continueOnError"
                  checked={newStep.continueOnError}
                  onChange={handleStepChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Continue on error</span>
              </label>
              <button
                type="button"
                onClick={addStep}
                disabled={!newStep.name || !newStep.command}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Remote Step
              </button>
            </div>
          </div>
            </div>
          )}
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Project'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProject;