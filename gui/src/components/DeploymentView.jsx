import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Terminal, Clock, CheckCircle, XCircle, AlertCircle, History } from 'lucide-react';
import { projectAPI } from '../utils/api';

function DeploymentView() {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const terminalRef = useRef(null);
  const eventSourceRef = useRef(null);
  
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
      setDeploymentHistory(history);
    } catch (err) {
      console.error('Error fetching deployment history:', err);
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
    
    setDeploying(true);
    setDeploymentStatus('running');
    setLogs([]);
    setStepTimings({});
    setDeploymentStartTime(Date.now());
    addLog('Starting deployment...', 'info');

    // Create EventSource for streaming logs
    const eventSource = new EventSource(`/api/deployments/${projectName}`);
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
    // Refresh history to show the stopped deployment
    setTimeout(() => {
      fetchDeploymentHistory();
    }, 500);
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
            <h2 className="text-3xl font-bold text-gray-900">Deploy {project.name}</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Configuration</h3>
          <dl className="space-y-3">
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
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Steps</h3>
          
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