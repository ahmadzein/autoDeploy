import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon, PencilIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

function ProjectList({ projects, onRefresh }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (projectName) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) return;
    
    setDeleting(projectName);
    try {
      await window.electronAPI.removeProject(projectName);
      toast.success(`Project "${projectName}" deleted`);
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Link
          to="/add-project"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Add Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <RocketLaunchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No projects configured yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p><span className="font-medium">Local:</span> {project.localPath}</p>
                <p><span className="font-medium">Remote:</span> {project.ssh.username}@{project.ssh.host}</p>
                <p><span className="font-medium">Steps:</span> {project.deploymentSteps.length}</p>
              </div>
              
              <div className="flex space-x-2">
                <Link
                  to={`/deploy/${project.name}`}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white text-center rounded-md hover:bg-primary-700 transition-colors"
                >
                  Deploy
                </Link>
                <button
                  onClick={() => handleDelete(project.name)}
                  disabled={deleting === project.name}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectList;