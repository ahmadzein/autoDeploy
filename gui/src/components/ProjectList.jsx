import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Play, Settings, FolderTree, ChevronRight, Copy } from 'lucide-react';
import { projectAPI } from '../utils/api';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateProject, setDuplicateProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');

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

  const handleDuplicateStart = (project) => {
    setDuplicateProject(project);
    setNewProjectName(`${project.name}-copy`);
    setDuplicating(true);
  };

  const handleDuplicateConfirm = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    // Check if name already exists
    if (projects.some(p => p.name.toLowerCase() === newProjectName.toLowerCase())) {
      alert('A project with this name already exists');
      return;
    }

    try {
      const projectData = {
        ...duplicateProject,
        name: newProjectName,
        createdAt: undefined, // Let backend set new timestamp
        updatedAt: undefined
      };

      // Remove deployment history and stats for the copy
      delete projectData.deploymentHistory;
      delete projectData.lastDeployment;
      delete projectData.deploymentCount;
      delete projectData.lastDeploymentStatus;

      if (duplicateProject.type === 'monorepo') {
        await projectAPI.add(projectData);
      } else {
        await projectAPI.add(projectData);
      }

      setDuplicating(false);
      setDuplicateProject(null);
      setNewProjectName('');
      fetchProjects();
    } catch (err) {
      console.error('Error duplicating project:', err);
      alert(err.response?.data?.error || 'Failed to duplicate project');
    }
  };

  const handleDuplicateCancel = () => {
    setDuplicating(false);
    setDuplicateProject(null);
    setNewProjectName('');
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
        <div className="flex space-x-2">
          <Link
            to="/projects/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Project
          </Link>
          <Link
            to="/projects/add-monorepo"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <FolderTree className="h-5 w-5 mr-2" />
            Add Monorepo
          </Link>
        </div>
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
            <div key={project.name} className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${project.type === 'monorepo' ? 'border-2 border-purple-200' : ''}`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.type === 'monorepo' ? (
                      <Link 
                        to={`/projects/${project.name}/sub-deployments`}
                        className="hover:text-purple-700"
                      >
                        {project.name}
                      </Link>
                    ) : (
                      project.name
                    )}
                  </h3>
                  {project.type === 'monorepo' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <FolderTree className="h-3 w-3 mr-1" />
                      Monorepo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 font-medium mb-4">{project.ssh.host}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Local:</span> <span className="text-gray-700">{project.localPath}</span>
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Remote:</span> <span className="text-gray-700">{project.remotePath}</span>
                  </p>
                  
                  {project.type === 'monorepo' ? (
                    <>
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">Sub-deployments:</span> <span className="text-gray-700">{project.subDeployments?.length || 0}</span>
                      </p>
                      {project.subDeployments && project.subDeployments.length > 0 && (
                        <div className="pl-4 space-y-1">
                          {project.subDeployments.slice(0, 3).map((sub, idx) => (
                            <p key={idx} className="text-xs text-gray-600 flex items-center">
                              <ChevronRight className="h-3 w-3 mr-1" />
                              {sub}
                            </p>
                          ))}
                          {project.subDeployments.length > 3 && (
                            <p className="text-xs text-gray-500">+{project.subDeployments.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">Local Steps:</span> <span className="text-gray-700">{project.localSteps?.length || 0}</span>
                      </p>
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">Remote Steps:</span> <span className="text-gray-700">{project.deploymentSteps?.length || 0}</span>
                      </p>
                    </>
                  )}
                  
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
                    {project.type === 'monorepo' ? (
                      <>
                        <Link
                          to={`/projects/${project.name}/sub-deployments`}
                          className="text-purple-600 hover:text-purple-700"
                          title="Manage Sub-deployments"
                        >
                          <FolderTree className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/projects/${project.name}/sub-deployments`}
                          className="text-gray-600 hover:text-gray-700"
                          title="Manage Sub-deployments"
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                      </>
                    ) : (
                      <Link
                        to={`/projects/edit/${project.name}`}
                        className="text-gray-600 hover:text-gray-700"
                        title="Edit"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleDuplicateStart(project)}
                      className="text-green-600 hover:text-green-700"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
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

      {/* Duplicate Project Modal */}
      {duplicating && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <Copy className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Duplicate Project
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Create a copy of "{duplicateProject?.name}" with a new name:
              </p>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter new project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleDuplicateConfirm()}
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleDuplicateCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateConfirm}
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectList;