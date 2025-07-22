import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Code } from 'lucide-react';
import { projectAPI } from '../utils/api';

function EditProject() {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authMethod, setAuthMethod] = useState('password');
  const [formData, setFormData] = useState({
    name: '',
    localPath: '',
    ssh: {
      host: '',
      username: '',
      password: '',
      privateKeyPath: '',
      passphrase: '',
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

  const [activeTab, setActiveTab] = useState('remote');
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [jsonEditMode, setJsonEditMode] = useState('full'); // 'full', 'config', 'local-steps', 'remote-steps'

  useEffect(() => {
    fetchProject();
  }, [projectName]);

  const fetchProject = async () => {
    try {
      const project = await projectAPI.getOne(projectName);
      // Ensure localSteps exists
      if (!project.localSteps) {
        project.localSteps = [];
      }
      setFormData(project);
      setJsonContent(JSON.stringify(project, null, 2));
      // Determine auth method based on existing data
      if (project.ssh?.privateKeyPath) {
        setAuthMethod('key');
      } else {
        setAuthMethod('password');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

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

  const updateStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      deploymentSteps: prev.deploymentSteps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const updateLocalStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      localSteps: prev.localSteps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
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

  const moveStep = (index, direction) => {
    const steps = [...formData.deploymentSteps];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
      setFormData(prev => ({ ...prev, deploymentSteps: steps }));
    }
  };

  const moveLocalStep = (index, direction) => {
    const steps = [...formData.localSteps];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
      setFormData(prev => ({ ...prev, localSteps: steps }));
    }
  };

  const handleJsonChange = (e) => {
    setJsonContent(e.target.value);
  };

  const toggleJsonMode = () => {
    if (jsonMode) {
      // Switch from JSON to form mode
      try {
        const parsed = JSON.parse(jsonContent);
        
        // Update the appropriate data based on edit mode
        switch (jsonEditMode) {
          case 'config':
            setFormData(prev => ({
              ...prev,
              name: parsed.name,
              localPath: parsed.localPath,
              remotePath: parsed.remotePath,
              ssh: parsed.ssh
            }));
            break;
          case 'local-steps':
            setFormData(prev => ({ ...prev, localSteps: parsed }));
            break;
          case 'remote-steps':
            setFormData(prev => ({ ...prev, deploymentSteps: parsed }));
            break;
          default:
            setFormData(parsed);
        }
        
        setJsonMode(false);
      } catch (error) {
        alert('Invalid JSON: ' + error.message);
      }
    } else {
      // Switch from form to JSON mode
      let contentToEdit;
      switch (jsonEditMode) {
        case 'config':
          contentToEdit = {
            name: formData.name,
            localPath: formData.localPath,
            remotePath: formData.remotePath,
            ssh: formData.ssh
          };
          break;
        case 'local-steps':
          contentToEdit = formData.localSteps || [];
          break;
        case 'remote-steps':
          contentToEdit = formData.deploymentSteps || [];
          break;
        default:
          contentToEdit = formData;
      }
      setJsonContent(JSON.stringify(contentToEdit, null, 2));
      setJsonMode(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    let dataToSave = formData;
    if (jsonMode) {
      try {
        const parsed = JSON.parse(jsonContent);
        
        // Handle different JSON edit modes
        switch (jsonEditMode) {
          case 'config':
            dataToSave = {
              ...formData,
              name: parsed.name,
              localPath: parsed.localPath,
              remotePath: parsed.remotePath,
              ssh: parsed.ssh
            };
            break;
          case 'local-steps':
            dataToSave = { ...formData, localSteps: parsed };
            break;
          case 'remote-steps':
            dataToSave = { ...formData, deploymentSteps: parsed };
            break;
          default:
            dataToSave = parsed;
        }
      } catch (error) {
        alert('Invalid JSON: ' + error.message);
        setSaving(false);
        return;
      }
    }
    
    try {
      // Clean up SSH config based on auth method
      if (!jsonMode) {
        if (authMethod === 'password') {
          delete dataToSave.ssh.privateKeyPath;
          delete dataToSave.ssh.passphrase;
        } else {
          delete dataToSave.ssh.password;
          if (!dataToSave.ssh.passphrase) {
            delete dataToSave.ssh.passphrase;
          }
        }
      }
      
      await projectAPI.update(projectName, dataToSave);
      navigate('/projects');
    } catch (err) {
      console.error('Error updating project:', err);
      alert(err.response?.data?.error || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Edit Project</h2>
            <p className="mt-2 text-gray-600">Update project configuration for {formData.displayName || projectName}</p>
          </div>
          <div className="flex items-center space-x-2">
            {jsonMode && (
              <select
                value={jsonEditMode}
                onChange={(e) => {
                  setJsonEditMode(e.target.value);
                  // Update JSON content when mode changes
                  let contentToEdit;
                  switch (e.target.value) {
                    case 'config':
                      contentToEdit = {
                        name: formData.name,
                        localPath: formData.localPath,
                        remotePath: formData.remotePath,
                        ssh: formData.ssh
                      };
                      break;
                    case 'local-steps':
                      contentToEdit = formData.localSteps || [];
                      break;
                    case 'remote-steps':
                      contentToEdit = formData.deploymentSteps || [];
                      break;
                    default:
                      contentToEdit = formData;
                  }
                  setJsonContent(JSON.stringify(contentToEdit, null, 2));
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="full">Full Config</option>
                <option value="config">Config Only</option>
                <option value="local-steps">Local Steps</option>
                <option value="remote-steps">Remote Steps</option>
              </select>
            )}
            <button
              type="button"
              onClick={toggleJsonMode}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Code className="h-5 w-5 mr-2" />
              {jsonMode ? 'Form Mode' : 'JSON Mode'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {jsonMode ? (
          // JSON Editor Mode
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              JSON Configuration - {jsonEditMode === 'full' ? 'Full Project' : 
                                    jsonEditMode === 'config' ? 'Config Only' :
                                    jsonEditMode === 'local-steps' ? 'Local Steps' : 'Remote Steps'}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Edit the {jsonEditMode === 'full' ? 'complete project configuration' : 
                         jsonEditMode === 'config' ? 'project settings and credentials' :
                         jsonEditMode === 'local-steps' ? 'local deployment steps array' : 
                         'remote deployment steps array'}. Invalid JSON will prevent saving.
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    Valid JSON
                  </span>
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    Invalid JSON
                  </span>
                </div>
                <span className="text-gray-400">
                  Files stored in: ~/.autodeploy/projects/{projectName}/
                </span>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={jsonContent}
                onChange={handleJsonChange}
                className={`w-full h-96 px-3 py-2 border rounded-md font-mono text-sm focus:ring-2 focus:outline-none ${
                  (() => {
                    try {
                      JSON.parse(jsonContent);
                      return 'border-green-500 focus:ring-green-500 focus:border-green-500';
                    } catch {
                      return 'border-red-500 focus:ring-red-500 focus:border-red-500';
                    }
                  })()
                }`}
                spellCheck={false}
              />
              <div className="absolute top-2 right-2">
                {(() => {
                  try {
                    JSON.parse(jsonContent);
                    return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
                  } catch {
                    return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
                  }
                })()}
              </div>
            </div>
          </div>
        ) : (
          // Form Mode
          <>
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-sm text-gray-500">Project name cannot be changed</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password to change"
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
                    value={formData.ssh.privateKeyPath || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/Users/you/.ssh/id_rsa or .pem file"
                  />
                  <p className="mt-1 text-sm text-gray-500">Full path to your private key file</p>
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      <strong>Tips:</strong><br />
                      • Use absolute paths (no ~ symbol)<br />
                      • Check permissions: ls -la your-key.pem<br />
                      • Test manually: ssh -i your-key.pem user@host
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passphrase (optional)
                  </label>
                  <input
                    type="password"
                    name="ssh.passphrase"
                    value={formData.ssh.passphrase || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            />
          </div>
        </div>

        {/* Deployment Steps */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Deployment Steps</h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('local')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'local'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Local Steps ({formData.localSteps?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('remote')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'remote'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Remote Steps ({formData.deploymentSteps.length})
            </button>
          </div>

          {/* Local Steps Tab */}
          {activeTab === 'local' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Local steps run on your machine before the deployment.
              </p>
              
              {/* Existing Local Steps */}
              {formData.localSteps && formData.localSteps.length > 0 && (
                <div className="space-y-3 mb-6">
                  {formData.localSteps.map((step, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateLocalStep(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Step name"
                        />
                        <input
                          type="text"
                          value={step.command}
                          onChange={(e) => updateLocalStep(index, 'command', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                          placeholder="Command"
                        />
                        <input
                          type="text"
                          value={step.workingDir || '.'}
                          onChange={(e) => updateLocalStep(index, 'workingDir', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Working directory"
                        />
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={step.continueOnError || false}
                            onChange={(e) => updateLocalStep(index, 'continueOnError', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm">Continue on error</span>
                        </label>
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
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Local Step */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700">Add New Local Step</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={newLocalStep.name}
                      onChange={handleLocalStepChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Step name"
                    />
                  </div>
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
                </div>
                <div>
                  <input
                    type="text"
                    name="command"
                    value={newLocalStep.command}
                    onChange={handleLocalStepChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="Command to run locally"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="continueOnError"
                      checked={newLocalStep.continueOnError}
                      onChange={handleLocalStepChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Continue on error</span>
                  </label>
                  <button
                    type="button"
                    onClick={addLocalStep}
                    disabled={!newLocalStep.name || !newLocalStep.command}
                    className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Local Step
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Remote Steps Tab */}
          {activeTab === 'remote' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Remote steps run on the deployment server after connecting via SSH.
              </p>
              
              {/* Existing Remote Steps */}
              {formData.deploymentSteps.length > 0 && (
                <div className="space-y-3 mb-6">
                  {formData.deploymentSteps.map((step, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Step name"
                        />
                        <input
                          type="text"
                          value={step.command}
                          onChange={(e) => updateStep(index, 'command', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                          placeholder="Command"
                        />
                        <input
                          type="text"
                          value={step.workingDir || '.'}
                          onChange={(e) => updateStep(index, 'workingDir', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Working directory"
                        />
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={step.continueOnError || false}
                            onChange={(e) => updateStep(index, 'continueOnError', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm">Continue on error</span>
                        </label>
                      </div>
                      <div className="flex items-center ml-4 space-x-2">
                        <button
                          type="button"
                          onClick={() => moveStep(index, -1)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, 1)}
                          disabled={index === formData.deploymentSteps.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Remote Step */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700">Add New Remote Step</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={newStep.name}
                      onChange={handleStepChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Step name"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="workingDir"
                      value={newStep.workingDir}
                      onChange={handleStepChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Working directory"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    name="command"
                    value={newStep.command}
                    onChange={handleStepChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="Command to run on server"
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
                    className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Remote Step
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
          </>
        )}

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
            disabled={saving}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProject;