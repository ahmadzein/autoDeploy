import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function AddProject({ onSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testingSSH, setTestingSSH] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    localPath: '',
    host: '',
    username: '',
    password: '',
    remotePath: '',
    port: '22',
    deploymentSteps: []
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      deploymentSteps: [
        ...formData.deploymentSteps,
        { name: '', command: '', workingDir: '.', continueOnError: false }
      ]
    });
  };

  const updateStep = (index, field, value) => {
    const steps = [...formData.deploymentSteps];
    steps[index][field] = value;
    setFormData({ ...formData, deploymentSteps: steps });
  };

  const removeStep = (index) => {
    const steps = formData.deploymentSteps.filter((_, i) => i !== index);
    setFormData({ ...formData, deploymentSteps: steps });
  };

  const testSSH = async () => {
    setTestingSSH(true);
    try {
      const result = await window.electronAPI.testSSH({
        host: formData.host,
        username: formData.username,
        password: formData.password,
        port: parseInt(formData.port)
      });
      
      if (result.success) {
        toast.success('SSH connection successful!');
      } else {
        toast.error(`SSH connection failed: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to test SSH connection');
    } finally {
      setTestingSSH(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const project = {
        name: formData.name,
        localPath: formData.localPath,
        ssh: {
          host: formData.host,
          username: formData.username,
          password: formData.password,
          port: parseInt(formData.port)
        },
        remotePath: formData.remotePath,
        deploymentSteps: formData.deploymentSteps.filter(step => step.name && step.command)
      };

      await window.electronAPI.addProject(project);
      toast.success('Project added successfully!');
      onSuccess();
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Project</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Local Project Path
          </label>
          <input
            type="text"
            name="localPath"
            value={formData.localPath}
            onChange={handleChange}
            required
            placeholder="/Users/username/projects/myapp"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SSH Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host
              </label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                name="port"
                value={formData.port}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remote Project Path
            </label>
            <input
              type="text"
              name="remotePath"
              value={formData.remotePath}
              onChange={handleChange}
              required
              placeholder="/home/user/projects/myapp"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="button"
            onClick={testSSH}
            disabled={testingSSH || !formData.host || !formData.username || !formData.password}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {testingSSH ? 'Testing...' : 'Test SSH Connection'}
          </button>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Deployment Steps</h3>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Step
            </button>
          </div>

          {formData.deploymentSteps.map((step, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step Name
                  </label>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => updateStep(index, 'name', e.target.value)}
                    placeholder="Pull latest changes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Working Directory
                  </label>
                  <input
                    type="text"
                    value={step.workingDir}
                    onChange={(e) => updateStep(index, 'workingDir', e.target.value)}
                    placeholder="."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Command
                </label>
                <input
                  type="text"
                  value={step.command}
                  onChange={(e) => updateStep(index, 'command', e.target.value)}
                  placeholder="git pull origin main"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mt-2 flex justify-between items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={step.continueOnError}
                    onChange={(e) => updateStep(index, 'continueOnError', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Continue on error</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Project'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProject;