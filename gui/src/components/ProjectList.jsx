import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Play, Settings } from 'lucide-react';
import { projectAPI } from '../utils/api';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectAPI.getAll();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectName) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      try {
        await projectAPI.delete(projectName);
        fetchProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
        alert('Failed to delete project');
      }
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.ssh.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <p className="mt-2 text-gray-600">Manage your deployment projects</p>
        </div>
        <Link
          to="/projects/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Project
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No projects found matching your search' : 'No projects yet'}
          </p>
          {!searchTerm && (
            <Link
              to="/projects/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Your First Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.name} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-700 font-medium mb-4">{project.ssh.host}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Local:</span> <span className="text-gray-700">{project.localPath}</span>
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Remote:</span> <span className="text-gray-700">{project.remotePath}</span>
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Steps:</span> <span className="text-gray-700">{project.deploymentSteps?.length || 0}</span>
                  </p>
                  {project.lastDeployment && (
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">Last Deploy:</span>{' '}
                      <span className={`text-gray-700 ${project.lastDeploymentStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {new Date(project.lastDeployment).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Link
                    to={`/deployments/${project.name}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Deploy
                  </Link>
                  <div className="flex space-x-2">
                    <Link
                      to={`/projects/edit/${project.name}`}
                      className="text-gray-600 hover:text-gray-700"
                      title="Edit"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(project.name)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectList;