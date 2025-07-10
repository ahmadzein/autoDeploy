import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

function DeploymentView({ projects }) {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const project = projects.find(p => p.name === projectName);

  useEffect(() => {
    if (!project) {
      toast.error('Project not found');
      navigate('/projects');
    }
  }, [project, navigate]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    let unsubscribe;
    if (deploying) {
      unsubscribe = window.electronAPI.onDeploymentLog((log) => {
        setLogs(prev => [...prev, {
          ...log,
          timestamp: new Date().toLocaleTimeString()
        }]);
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [deploying]);

  const handleDeploy = async () => {
    setDeploying(true);
    setLogs([]);

    try {
      const result = await window.electronAPI.deployProject(projectName);
      
      if (result.success) {
        toast.success('Deployment completed successfully!');
      } else {
        toast.error(`Deployment failed: ${result.message}`);
      }
    } catch (error) {
      toast.error('Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  if (!project) return null;

  return (
    <div>
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back to Projects
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
        <p className="text-gray-600">Deploy to {project.ssh.username}@{project.ssh.host}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deployment Steps</h2>
        {project.deploymentSteps.length === 0 ? (
          <p className="text-gray-500">No deployment steps configured</p>
        ) : (
          <ol className="space-y-2">
            {project.deploymentSteps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{step.name}</p>
                  <p className="text-sm text-gray-600 font-mono">{step.command}</p>
                  {step.continueOnError && (
                    <p className="text-xs text-amber-600 mt-1">⚠ Continues on error</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Deployment Console</h2>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <RocketLaunchIcon className="w-5 h-5 mr-2" />
            {deploying ? 'Deploying...' : 'Start Deployment'}
          </button>
        </div>

        <div className="bg-gray-900 text-gray-100 rounded-md p-4 h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">Deployment logs will appear here...</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  {log.output && (
                    <pre className="mt-1 ml-4 text-gray-400 whitespace-pre-wrap">{log.output}</pre>
                  )}
                </motion.div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeploymentView;