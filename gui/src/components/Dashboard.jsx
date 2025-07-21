import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, FolderOpen, Zap, Clock } from 'lucide-react';
import { projectAPI, systemAPI } from '../utils/api';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, statsData] = await Promise.all([
        projectAPI.getAll(),
        systemAPI.getStats()
      ]);
      // Ensure projects is always an array
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Make sure the API server is running.');
      console.error('Error fetching data:', err);
      setProjects([]); // Ensure projects is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatLastDeployment = (lastDeployment) => {
    if (!lastDeployment) return 'Never';
    
    const date = new Date(lastDeployment.timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const statsDisplay = [
    { 
      name: 'Total Projects', 
      value: projects.length, 
      icon: FolderOpen, 
      color: 'bg-blue-500' 
    },
    { 
      name: 'Total Deployments', 
      value: stats?.totalDeployments || 0, 
      icon: Activity, 
      color: 'bg-green-500' 
    },
    { 
      name: 'Deployments Today', 
      value: stats?.deploymentsToday || 0, 
      icon: Zap, 
      color: 'bg-purple-500' 
    },
    { 
      name: 'Last Deployment', 
      value: formatLastDeployment(stats?.lastDeployment), 
      icon: Clock, 
      color: stats?.lastDeployment ? 'bg-blue-500' : 'bg-gray-500' 
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">Welcome to AutoDeploy</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsDisplay.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-700">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/projects/add"
            className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="font-medium text-blue-700">Add New Project</span>
            <ArrowRight className="h-5 w-5 text-blue-700" />
          </Link>
          <Link
            to="/projects"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-700">View All Projects</span>
            <ArrowRight className="h-5 w-5 text-gray-700" />
          </Link>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading projects...</p>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No projects yet</p>
              <Link
                to="/projects/add"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Project
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div key={project.name} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.ssh.host}</p>
                  </div>
                  <Link
                    to={`/deployments/${project.name}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Deploy
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;