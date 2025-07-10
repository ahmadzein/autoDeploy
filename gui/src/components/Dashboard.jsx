import React from 'react';
import { Link } from 'react-router-dom';
import { ChartBarIcon, FolderIcon, RocketLaunchIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

function Dashboard({ projects }) {
  const stats = {
    totalProjects: projects.length,
    withSteps: projects.filter(p => p.deploymentSteps.length > 0).length,
    totalSteps: projects.reduce((sum, p) => sum + p.deploymentSteps.length, 0),
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <FolderIcon className="w-12 h-12 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projects with Steps</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withSteps}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <ChartBarIcon className="w-12 h-12 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Steps</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSteps}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Projects</h2>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <RocketLaunchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No projects configured yet</p>
            <Link
              to="/add-project"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Add Your First Project
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <div key={project.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.ssh.username}@{project.ssh.host}</p>
                </div>
                <Link
                  to={`/deploy/${project.name}`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Deploy
                </Link>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Dashboard;