import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Square, Terminal, Clock, CheckCircle, XCircle, AlertCircle, History, FolderTree } from 'lucide-react';
import { projectAPI, deploymentAPI } from '../utils/api';

function DeploymentView() {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const terminalRef = useRef(null);
  const eventSourceRef = useRef(null);
  
  // Get monorepo parameters from URL
  const subDeployment = searchParams.get('sub');
  const deployAll = searchParams.get('all') === 'true';
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState([]);
  const [deploymentStatus, setDeploymentStatus] = useState('idle'); // idle, running, success, error
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [deploymentStartTime, setDeploymentStartTime] = useState(null);
  const [currentStepStartTime, setCurrentStepStartTime] = useState(null);
  const [stepTimings, setStepTimings] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [subDeployments, setSubDeployments] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [promptData, setPromptData] = useState(null);
  const [userInput, setUserInput] = useState('');
  const promptInputRef = useRef(null);

  useEffect(() => {
    fetchProject();
    fetchDeploymentHistory();
    return () => {
      // Cleanup EventSource on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [projectName]);

  useEffect(() => {
    // Auto-scroll terminal to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    // Update elapsed time every 100ms while deploying
    let interval;
    if (deploying && deploymentStartTime) {
      interval = setInterval(() => {
        setElapsedTime(((Date.now() - deploymentStartTime) / 1000).toFixed(1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [deploying, deploymentStartTime]);

  const fetchProject = async () => {
    try {
      const data = await projectAPI.getOne(projectName);
      setProject(data);
      
      // If it's a monorepo, fetch sub-deployments
      if (data.type === 'monorepo') {
        const subs = await projectAPI.getSubDeployments(projectName);
        setSubDeployments(subs || []);
        
        // Pre-select based on URL params
        if (deployAll) {
          setSelectedSubs(subs.map(s => s.name));
        } else if (subDeployment) {
          setSelectedSubs([subDeployment]);
        }
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeploymentHistory = async () => {
    try {
      const response = await fetch(`/api/projects/${projectName}/deployments`);
      const history = await response.json();
      // Ensure deploymentHistory is always an array
      setDeploymentHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error('Error fetching deployment history:', err);
      setDeploymentHistory([]); // Ensure deploymentHistory is an empty array on error
    }
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const startDeployment = async () => {
    // Prevent multiple deployments
    if (deploying || eventSourceRef.current) {
      return;
    }
    
    // For monorepos, ensure we have selected sub-deployments
    if (project?.type === 'monorepo' && selectedSubs.length === 0) {
      alert('Please select at least one sub-deployment');
      return;
    }
    
    setDeploying(true);
    setDeploymentStatus('running');
    setLogs([]);
    setStepTimings({});
    setDeploymentStartTime(Date.now());
    addLog('Starting deployment...', 'info');

    // Build query params for monorepo deployments
    let deployUrl = `/api/deployments/${projectName}`;
    if (project?.type === 'monorepo') {
      const params = new URLSearchParams();
      if (selectedSubs.length === subDeployments.length) {
        params.set('all', 'true');
      } else {
        selectedSubs.forEach(sub => params.append('sub', sub));
      }
      deployUrl += `?${params.toString()}`;
    }

    // Create EventSource for streaming logs
    const eventSource = new EventSource(deployUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'start':
            addLog(data.message, 'info');
            break;
          case 'progress':
            addLog(data.message, 'info');
            break;
          case 'step':
            addLog(`[STEP] ${data.message}`, 'step');
            setCurrentStepStartTime(Date.now());
            break;
          case 'step-complete':
            if (currentStepStartTime) {
              const duration = ((Date.now() - currentStepStartTime) / 1000).toFixed(1);
              addLog(`✓ ${data.step} completed (${duration}s)`, 'success');
              setStepTimings(prev => ({ ...prev, [data.step]: duration }));
            } else {
              addLog(`✓ ${data.step} completed`, 'success');
            }
            if (data.message) {
              addLog(data.message, 'output');
            }
            break;
          case 'step-error':
            if (currentStepStartTime) {
              const duration = ((Date.now() - currentStepStartTime) / 1000).toFixed(1);
              addLog(`✗ ${data.step} failed (${duration}s)`, 'error');
              setStepTimings(prev => ({ ...prev, [data.step]: duration }));
            } else {
              addLog(`✗ ${data.step} failed`, 'error');
            }
            if (data.message) {
              // Split error message by newlines and add each line
              const errorLines = data.message.split('\n').filter(line => line.trim());
              errorLines.forEach(line => {
                addLog(line.trim(), 'error-detail');
              });
            }
            break;
          case 'error':
            addLog(`ERROR: ${data.message}`, 'error');
            setDeploymentStatus('error');
            break;
          case 'complete':
            if (deploymentStartTime) {
              const totalDuration = ((Date.now() - deploymentStartTime) / 1000).toFixed(1);
              addLog(`${data.message} (Total time: ${totalDuration}s)`, 'success');
            } else {
              addLog(data.message, 'success');
            }
            setDeploymentStatus('success');
            break;
          case 'output':
            // Real-time output streaming
            if (data.data) {
              const lines = data.data.split('\n');
              lines.forEach(line => {
                if (line.trim()) {
                  addLog(line, data.outputType === 'stderr' ? 'error-detail' : 'output');
                }
              });
            }
            break;
          case 'prompt':
            // Interactive prompt detected
            addLog(`[PROMPT] ${data.prompt}`, 'prompt');
            setPromptData({
              sessionId: data.sessionId,
              step: data.step,
              prompt: data.prompt
            });
            // Focus input after state update
            setTimeout(() => {
              if (promptInputRef.current) {
                promptInputRef.current.focus();
              }
            }, 100);
            break;
          default:
            addLog(data.message || JSON.stringify(data), 'info');
        }
      } catch (err) {
        console.error('Error parsing event data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      if (eventSource.readyState === EventSource.CLOSED) {
        addLog('Connection to deployment server closed', 'warning');
        setDeploying(false);
        setElapsedTime(0);
        eventSourceRef.current = null;
      }
    };

    // Listen for close event
    eventSource.addEventListener('close', () => {
      eventSource.close();
      setDeploying(false);
      setElapsedTime(0);
      eventSourceRef.current = null;
    });
    
    // Also handle connection close on complete/error
    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'complete' || data.type === 'error') {
          setTimeout(() => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
              setDeploying(false);
              // Refresh deployment history after deployment
              fetchDeploymentHistory();
            }
          }, 500);
        }
      } catch (err) {
        // Ignore parse errors for this listener
      }
    });
  };

  const stopDeployment = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setDeploying(false);
    setDeploymentStatus('idle');
    setElapsedTime(0);
    addLog('Deployment stopped by user', 'warning');
    setPromptData(null);
    // Refresh history to show the stopped deployment
    setTimeout(() => {
      fetchDeploymentHistory();
    }, 500);
  };

  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    if (!promptData || !userInput.trim()) return;

    try {
      addLog(`> ${userInput}`, 'user-input');
      
      // Send the input to the server
      await deploymentAPI.sendDeploymentInput(projectName, {
        sessionId: promptData.sessionId,
        input: userInput
      });
      
      // Clear the prompt
      setPromptData(null);
      setUserInput('');
    } catch (err) {
      console.error('Error sending input:', err);
      addLog(`Failed to send input to server: ${err.response?.data?.error || err.message}`, 'error');
      // Don't clear the input so user can try again
      // setUserInput('');
    }
  };

  const getLogClass = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'step':
        return 'text-blue-400 font-semibold';
      case 'output':
        return 'text-gray-400 ml-4';
      case 'error-detail':
        return 'text-red-300 ml-6 text-xs';
      case 'prompt':
        return 'text-yellow-300 font-semibold';
      case 'user-input':
        return 'text-cyan-400';
      default:
        return 'text-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (deploymentStatus) {
      case 'running':
        return <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
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
            <h2 className="text-3xl font-bold text-gray-900">
              Deploy {project.displayName || project.name}
              {project.type === 'monorepo' && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  <FolderTree className="h-4 w-4 mr-1" />
                  Monorepo
                </span>
              )}
            </h2>
            <p className="mt-2 text-gray-600">{project.ssh.host}</p>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusIcon()}
            {deploying ? (
              <button
                onClick={stopDeployment}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Deployment
              </button>
            ) : (
              <button
                onClick={startDeployment}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Deployment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Project Info */}
      {/* Monorepo Sub-deployment Selector */}
      {project.type === 'monorepo' && subDeployments.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
            <FolderTree className="h-5 w-5 mr-2" />
            Select Sub-deployments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subDeployments.map((sub) => (
              <label
                key={sub.name}
                className="flex items-center p-3 bg-white rounded-md border border-purple-100 hover:border-purple-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSubs.includes(sub.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSubs([...selectedSubs, sub.name]);
                    } else {
                      setSelectedSubs(selectedSubs.filter(s => s !== sub.name));
                    }
                  }}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                  <p className="text-xs text-gray-600">{sub.relativePath}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedSubs(subDeployments.map(s => s.name))}
              className="text-sm text-purple-700 hover:text-purple-900 font-medium"
            >
              Select All
            </button>
            <span className="text-gray-400">|</span>
            <button
              type="button"
              onClick={() => setSelectedSubs([])}
              className="text-sm text-purple-700 hover:text-purple-900 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Configuration</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-semibold text-gray-700">Type</dt>
              <dd className="text-sm font-medium text-gray-900">
                {project.type === 'monorepo' ? (
                  <span className="inline-flex items-center">
                    <FolderTree className="h-4 w-4 mr-1 text-purple-600" />
                    Monorepo
                  </span>
                ) : (
                  'Standard Project'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-700">Local Path</dt>
              <dd className="text-sm font-medium text-gray-900">{project.localPath}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-700">Remote Path</dt>
              <dd className="text-sm font-medium text-gray-900">{project.remotePath}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-700">SSH Connection</dt>
              <dd className="text-sm font-medium text-gray-900">{project.ssh.username}@{project.ssh.host}:{project.ssh.port || 22}</dd>
            </div>
            {project.type === 'monorepo' && (
              <div>
                <dt className="text-sm font-semibold text-gray-700">Sub-deployments</dt>
                <dd className="text-sm font-medium text-gray-900">{subDeployments.length} configured</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Steps</h3>
          
          {project.type === 'monorepo' ? (
            <div>
              {selectedSubs.length === 0 ? (
                <p className="text-sm text-gray-500">Select sub-deployments to see their steps</p>
              ) : selectedSubs.length === 1 ? (
                // Show steps for single selected sub-deployment
                (() => {
                  const sub = subDeployments.find(s => s.name === selectedSubs[0]);
                  if (!sub) return null;
                  return (
                    <>
                      <p className="text-sm text-purple-700 font-medium mb-3">Steps for: {sub.name}</p>
                      {/* Local Steps */}
                      {sub.localSteps && sub.localSteps.length > 0 && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Local Steps</h4>
                          <ol className="space-y-2 mb-4">
                            {sub.localSteps.map((step, index) => (
                              <li key={`local-${index}`} className="flex items-start">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 mr-3">
                                  L{index + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{step.name}</p>
                                  <p className="text-xs text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded mt-1">{step.command}</p>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </>
                      )}
                      
                      {/* Remote Steps */}
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Remote Steps</h4>
                      {sub.deploymentSteps && sub.deploymentSteps.length > 0 ? (
                        <ol className="space-y-2">
                          {sub.deploymentSteps.map((step, index) => (
                            <li key={`remote-${index}`} className="flex items-start">
                              <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 mr-3">
                                R{index + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{step.name}</p>
                                <p className="text-xs text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded mt-1">{step.command}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-sm text-gray-500">No remote steps configured</p>
                      )}
                    </>
                  );
                })()
              ) : (
                // Multiple sub-deployments selected
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-2">
                    {selectedSubs.length} sub-deployments selected:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedSubs.map(name => (
                      <li key={name}>• {name}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    Each sub-deployment will run with its own configured steps
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Standard project steps
            <>
              {/* Local Steps */}
              {project.localSteps && project.localSteps.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Local Steps</h4>
                  <ol className="space-y-2 mb-4">
                    {project.localSteps.map((step, index) => (
                      <li key={`local-${index}`} className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 mr-3">
                          L{index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{step.name}</p>
                          <p className="text-xs text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded mt-1">{step.command}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              
              {/* Remote Steps */}
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Remote Steps</h4>
              {project.deploymentSteps && project.deploymentSteps.length > 0 ? (
                <ol className="space-y-2">
                  {project.deploymentSteps.map((step, index) => (
                    <li key={`remote-${index}`} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 mr-3">
                        R{index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{step.name}</p>
                        <p className="text-xs text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded mt-1">{step.command}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-500">No remote steps configured</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Terminal */}
      <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Deployment Terminal</span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            {deploying && deploymentStartTime && (
              <span className="flex items-center text-green-400">
                <Clock className="h-4 w-4 mr-1 animate-pulse" />
                Elapsed: {elapsedTime}s
              </span>
            )}
            <span className="flex items-center">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>
        
        <div 
          ref={terminalRef}
          className="p-4 h-96 overflow-y-auto font-mono text-sm"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          {logs.length === 0 ? (
            <div className="text-gray-500">
              $ Ready to deploy...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1 ${getLogClass(log.type)}`}>
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
          {promptData && (
            <form onSubmit={handlePromptSubmit} className="mt-4 flex items-center">
              <span className="text-yellow-300 mr-2">?</span>
              <input
                ref={promptInputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter your response..."
                className="flex-1 bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="ml-2 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
              >
                Send
              </button>
            </form>
          )}
          {deploying && (
            <div className="inline-block animate-pulse">_</div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      {deploymentStatus !== 'idle' && (
        <div className={`mt-4 p-4 rounded-lg ${
          deploymentStatus === 'success' ? 'bg-green-50 text-green-800' :
          deploymentStatus === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {deploymentStatus === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
              {deploymentStatus === 'error' && <XCircle className="h-5 w-5 mr-2" />}
              {deploymentStatus === 'running' && <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mr-2" />}
              <span className="font-medium">
                {deploymentStatus === 'success' && 'Deployment completed successfully!'}
                {deploymentStatus === 'error' && 'Deployment failed with errors'}
                {deploymentStatus === 'running' && 'Deployment in progress...'}
              </span>
            </div>
            {deploymentStatus !== 'running' && deploymentStartTime && (
              <span className="text-sm">
                Total time: {((Date.now() - deploymentStartTime) / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          
          {/* Step Timings Summary */}
          {deploymentStatus !== 'running' && Object.keys(stepTimings).length > 0 && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <p className="text-sm font-medium mb-2">Step Timings:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(stepTimings).map(([step, duration]) => (
                  <div key={step} className="flex justify-between">
                    <span>{step}:</span>
                    <span className="font-mono">{duration}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deployment History */}
      <div className="mt-8">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center text-gray-700 hover:text-gray-900 mb-4"
        >
          <History className="h-5 w-5 mr-2" />
          {showHistory ? 'Hide' : 'Show'} Deployment History
        </button>
        
        {showHistory && deploymentHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deploymentHistory.slice(0, 5).map((deployment, index) => {
                  const date = new Date(deployment.timestamp);
                  const duration = deployment.duration ? `${(deployment.duration / 1000).toFixed(1)}s` : 'N/A';
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {date.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {deployment.success ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Success
                          </span>
                        ) : deployment.stopped ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Stopped
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {duration}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {deployment.error && (
                          <div className="text-red-600 text-xs">
                            {deployment.error}
                          </div>
                        )}
                        {deployment.steps && deployment.steps.length > 0 && (
                          <div className="text-xs space-y-1">
                            <details className="cursor-pointer">
                              <summary className="text-gray-700 hover:text-gray-900">
                                {deployment.steps.length} steps
                                {deployment.steps.filter(s => !s.success).length > 0 && 
                                  ` (${deployment.steps.filter(s => !s.success).length} failed)`
                                }
                              </summary>
                              <div className="mt-1 ml-2 space-y-1">
                                {deployment.steps.map((step, i) => (
                                  <div key={i} className={step.success ? 'text-gray-600' : 'text-red-600'}>
                                    {step.success ? '✓' : '✗'} {step.name}
                                    {step.duration && (
                                      <span className="text-gray-500 ml-1">
                                        ({(step.duration / 1000).toFixed(1)}s)
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeploymentView;