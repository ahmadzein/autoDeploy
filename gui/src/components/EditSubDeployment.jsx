import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, ChevronRight } from 'lucide-react';
import { projectAPI } from '../utils/api';

function EditSubDeployment() {
  const { projectName, subName } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    relativePath: '',
    remotePath: '',
    inheritSSH: true,
    ssh: {
      host: '',
      username: '',
      password: '',
      port: '22'
    },
    localSteps: [],
    deploymentSteps: []
  });

  const [newLocalStep, setNewLocalStep] = useState({
    name: '',
    command: '',
    workingDir: '.',
    continueOnError: false,
    interactive: false,
    inputs: [],
    envVars: []
  });

  const [newRemoteStep, setNewRemoteStep] = useState({
    name: '',
    command: '',
    workingDir: '.',
    continueOnError: false,
    interactive: false,
    inputs: [],
    envVars: []
  });

  useEffect(() => {
    fetchSubDeployment();
  }, [projectName, subName]);

  const fetchSubDeployment = async () => {
    try {
      setLoading(true);
      const projectData = await projectAPI.getOne(projectName);
      if (projectData.type !== 'monorepo') {
        navigate('/projects');
        return;
      }
      setProject(projectData);
      
      const subDeployments = await projectAPI.getSubDeployments(projectName);
      const subDeployment = subDeployments.find(sub => sub.name === subName);
      
      if (!subDeployment) {
        navigate(`/projects/${projectName}/sub-deployments`);
        return;
      }
      
      setFormData({
        name: subDeployment.name,
        relativePath: subDeployment.relativePath || '',
        remotePath: subDeployment.remotePath,
        inheritSSH: !subDeployment.ssh || JSON.stringify(subDeployment.ssh) === JSON.stringify(projectData.ssh),
        ssh: subDeployment.ssh || projectData.ssh,
        localSteps: subDeployment.localSteps || [],
        deploymentSteps: subDeployment.deploymentSteps || []
      });
    } catch (err) {
      console.error('Error fetching sub-deployment:', err);
      navigate(`/projects/${projectName}/sub-deployments`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('ssh.')) {
      const sshField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        ssh: { ...prev.ssh, [sshField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Step management functions (same as AddSubDeployment)
  const handleLocalStepChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLocalStep(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRemoteStepChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRemoteStep(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Move step functions
  const moveLocalStep = (index, direction) => {
    const steps = [...formData.localSteps];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
      setFormData(prev => ({ ...prev, localSteps: steps }));
    }
  };

  const moveRemoteStep = (index, direction) => {
    const steps = [...formData.deploymentSteps];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
      setFormData(prev => ({ ...prev, deploymentSteps: steps }));
    }
  };

  const removeLocalStep = (index) => {
    setFormData(prev => ({
      ...prev,
      localSteps: prev.localSteps.filter((_, i) => i !== index)
    }));
  };

  const removeRemoteStep = (index) => {
    setFormData(prev => ({
      ...prev,
      deploymentSteps: prev.deploymentSteps.filter((_, i) => i !== index)
    }));
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
        continueOnError: false,
        interactive: false,
        inputs: [],
        envVars: []
      });
    }
  };

  const addRemoteStep = () => {
    if (newRemoteStep.name && newRemoteStep.command) {
      setFormData(prev => ({
        ...prev,
        deploymentSteps: [...prev.deploymentSteps, { ...newRemoteStep }]
      }));
      setNewRemoteStep({
        name: '',
        command: '',
        workingDir: '.',
        continueOnError: false,
        interactive: false,
        inputs: [],
        envVars: []
      });
    }
  };

  // Input and environment variable functions (same as AddSubDeployment)
  const addLocalInput = () => {
    setNewLocalStep(prev => ({
      ...prev,
      inputs: [...prev.inputs, { prompt: '', defaultValue: '', required: true }]
    }));
  };

  const updateLocalInput = (index, field, value) => {
    setNewLocalStep(prev => ({
      ...prev,
      inputs: prev.inputs.map((input, i) => 
        i === index ? { ...input, [field]: value } : input
      )
    }));
  };

  const removeLocalInput = (index) => {
    setNewLocalStep(prev => ({
      ...prev,
      inputs: prev.inputs.filter((_, i) => i !== index)
    }));
  };

  const addLocalEnvVar = () => {
    setNewLocalStep(prev => ({
      ...prev,
      envVars: [...prev.envVars, { name: '', value: '' }]
    }));
  };

  const updateLocalEnvVar = (index, field, value) => {
    setNewLocalStep(prev => ({
      ...prev,
      envVars: prev.envVars.map((envVar, i) => 
        i === index ? { ...envVar, [field]: value } : envVar
      )
    }));
  };

  const removeLocalEnvVar = (index) => {
    setNewLocalStep(prev => ({
      ...prev,
      envVars: prev.envVars.filter((_, i) => i !== index)
    }));
  };

  // Same functions for remote steps
  const addRemoteInput = () => {
    setNewRemoteStep(prev => ({
      ...prev,
      inputs: [...prev.inputs, { prompt: '', defaultValue: '', required: true }]
    }));
  };

  const updateRemoteInput = (index, field, value) => {
    setNewRemoteStep(prev => ({
      ...prev,
      inputs: prev.inputs.map((input, i) => 
        i === index ? { ...input, [field]: value } : input
      )
    }));
  };

  const removeRemoteInput = (index) => {
    setNewRemoteStep(prev => ({
      ...prev,
      inputs: prev.inputs.filter((_, i) => i !== index)
    }));
  };

  const addRemoteEnvVar = () => {
    setNewRemoteStep(prev => ({
      ...prev,
      envVars: [...prev.envVars, { name: '', value: '' }]
    }));
  };

  const updateRemoteEnvVar = (index, field, value) => {
    setNewRemoteStep(prev => ({
      ...prev,
      envVars: prev.envVars.map((envVar, i) => 
        i === index ? { ...envVar, [field]: value } : envVar
      )
    }));
  };

  const removeRemoteEnvVar = (index) => {
    setNewRemoteStep(prev => ({
      ...prev,
      envVars: prev.envVars.filter((_, i) => i !== index)
    }));
  };

  const handleTestConnection = async () => {
    if (formData.inheritSSH || !formData.ssh.password) return;
    
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
    setSaving(true);
    
    try {
      const subData = {
        ...formData,
        ssh: formData.inheritSSH ? undefined : formData.ssh
      };
      
      await projectAPI.updateSubDeployment(projectName, subName, subData);
      navigate(`/projects/${projectName}/sub-deployments`);
    } catch (err) {
      console.error('Error updating sub-deployment:', err);
      alert(err.response?.data?.error || 'Failed to update sub-deployment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate(`/projects/${projectName}/sub-deployments`)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Sub-deployments
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Edit Sub-deployment</h2>
          <p className="mt-2 text-gray-600">Edit "{subName}" in {projectName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sub-deployment Information</h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub-deployment Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">Name cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relative Path
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-600">
                  {project?.localPath}/
                </span>
                <input
                  type="text"
                  name="relativePath"
                  value={formData.relativePath}
                  onChange={handleInputChange}
                  required
                  placeholder="apps/frontend"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Path relative to monorepo root</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remote Deployment Path
              </label>
              <input
                type="text"
                name="remotePath"
                value={formData.remotePath}
                onChange={handleInputChange}
                required
                placeholder="/var/www/app-frontend"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-sm text-gray-500">Absolute path on the deployment server</p>
            </div>
          </div>
        </div>

        {/* SSH Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SSH Configuration</h3>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="inheritSSH"
                checked={formData.inheritSSH}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Use same SSH credentials as parent monorepo</span>
            </label>
          </div>
          
          {!formData.inheritSSH && (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.ssh.host || !formData.ssh.username || !formData.ssh.password}
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
          )}
        </div>

        {/* Local Steps - reusing the exact same structure as AddSubDeployment but with existing steps */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Local Deployment Steps</h3>
          <p className="text-sm text-gray-600 mb-4">Commands that run on your local machine before deployment</p>
          
          {/* Existing Steps */}
          {formData.localSteps.length > 0 && (
            <div className="space-y-3 mb-6">
              {formData.localSteps.map((step, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{step.name}</p>
                    <p className="text-sm text-gray-600 font-mono">{step.command}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>Working dir: {step.workingDir}</span>
                      {step.interactive && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Interactive</span>
                      )}
                      {step.envVars && step.envVars.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{step.envVars.length} env vars</span>
                      )}
                      {step.inputs && step.inputs.length > 0 && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{step.inputs.length} inputs</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center ml-4 space-x-2">
                    <button
                      type="button"
                      onClick={() => moveLocalStep(index, -1)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLocalStep(index, 1)}
                      disabled={index === formData.localSteps.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLocalStep(index)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete step"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Add New Step - same as AddSubDeployment */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700">Add New Local Step</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={newLocalStep.name}
                onChange={handleLocalStepChange}
                name="name"
                placeholder="Step name"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={newLocalStep.workingDir}
                onChange={handleLocalStepChange}
                name="workingDir"
                placeholder="Working directory"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <input
              type="text"
              value={newLocalStep.command}
              onChange={handleLocalStepChange}
              name="command"
              placeholder="Command to run"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
            />
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="continueOnError"
                    checked={newLocalStep.continueOnError}
                    onChange={handleLocalStepChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Continue on error</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="interactive"
                    checked={newLocalStep.interactive}
                    onChange={handleLocalStepChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Interactive command</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addLocalStep}
                  disabled={!newLocalStep.name || !newLocalStep.command}
                  className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Remote Steps - same structure as local steps */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Remote Deployment Steps</h3>
          <p className="text-sm text-gray-600 mb-4">Commands that run on the deployment server</p>
          
          {/* Existing Steps */}
          {formData.deploymentSteps.length > 0 && (
            <div className="space-y-3 mb-6">
              {formData.deploymentSteps.map((step, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{step.name}</p>
                    <p className="text-sm text-gray-600 font-mono">{step.command}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>Working dir: {step.workingDir}</span>
                      {step.interactive && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Interactive</span>
                      )}
                      {step.envVars && step.envVars.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{step.envVars.length} env vars</span>
                      )}
                      {step.inputs && step.inputs.length > 0 && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{step.inputs.length} inputs</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center ml-4 space-x-2">
                    <button
                      type="button"
                      onClick={() => moveRemoteStep(index, -1)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRemoteStep(index, 1)}
                      disabled={index === formData.deploymentSteps.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRemoteStep(index)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete step"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Add New Step */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700">Add New Remote Step</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={newRemoteStep.name}
                onChange={handleRemoteStepChange}
                name="name"
                placeholder="Step name"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={newRemoteStep.workingDir}
                onChange={handleRemoteStepChange}
                name="workingDir"
                placeholder="Working directory"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <input
              type="text"
              value={newRemoteStep.command}
              onChange={handleRemoteStepChange}
              name="command"
              placeholder="Command to run"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
            />
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="continueOnError"
                    checked={newRemoteStep.continueOnError}
                    onChange={handleRemoteStepChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Continue on error</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="interactive"
                    checked={newRemoteStep.interactive}
                    onChange={handleRemoteStepChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Interactive command</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addRemoteStep}
                  disabled={!newRemoteStep.name || !newRemoteStep.command}
                  className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectName}/sub-deployments`)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditSubDeployment;