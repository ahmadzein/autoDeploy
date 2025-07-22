import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Trash2, Play, ChevronRight, FolderTree, Copy } from 'lucide-react';
import { projectAPI } from '../utils/api';
import Breadcrumb from './Breadcrumb';

function SubDeployments() {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [subDeployments, setSubDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateSubDeployment, setDuplicateSubDeployment] = useState(null);
  const [newSubName, setNewSubName] = useState('');

  useEffect(() => {
    fetchProjectAndSubs();
  }, [projectName]);

  const fetchProjectAndSubs = async () => {
    try {
      setLoading(true);
      const projectData = await projectAPI.getOne(projectName);
      
      if (projectData.type !== 'monorepo') {
        navigate('/projects');
        return;
      }
      
      setProject(projectData);
      
      // Fetch sub-deployments
      if (projectData.subDeployments && projectData.subDeployments.length > 0) {
        const subsData = await projectAPI.getSubDeployments(projectName);
        setSubDeployments(subsData || []);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSub = async (subName) => {
    if (window.confirm(`Are you sure you want to delete sub-deployment "${subName}"?`)) {
      try {
        await projectAPI.deleteSubDeployment(projectName, subName);
        fetchProjectAndSubs();
      } catch (err) {
        console.error('Error deleting sub-deployment:', err);
        alert('Failed to delete sub-deployment');
      }
    }
  };

  const handleDuplicateSubStart = (subDeployment) => {
    setDuplicateSubDeployment(subDeployment);
    setNewSubName(`${subDeployment.name}-copy`);
    setDuplicating(true);
  };

  const handleDuplicateSubConfirm = async () => {
    if (!newSubName.trim()) {
      alert('Please enter a sub-deployment name');
      return;
    }

    // Check if name already exists
    if (subDeployments.some(sub => sub.name.toLowerCase() === newSubName.toLowerCase())) {
      alert('A sub-deployment with this name already exists');
      return;
    }

    try {
      const subData = {
        ...duplicateSubDeployment,
        name: newSubName,
        createdAt: undefined, // Let backend set new timestamp
        updatedAt: undefined
      };

      // Remove deployment history and stats for the copy
      delete subData.deploymentHistory;
      delete subData.stats;

      await projectAPI.addSubDeployment(projectName, subData);
      
      setDuplicating(false);
      setDuplicateSubDeployment(null);
      setNewSubName('');
      fetchProjectAndSubs();
    } catch (err) {
      console.error('Error duplicating sub-deployment:', err);
      alert(err.response?.data?.error || 'Failed to duplicate sub-deployment');
    }
  };

  const handleDuplicateSubCancel = () => {
    setDuplicating(false);
    setDuplicateSubDeployment(null);
    setNewSubName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          {
            label: project?.displayName || project?.name || projectName,
            href: null // Current page
          }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <FolderTree className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{project?.displayName || project?.name}</h2>
              <p className="mt-2 text-gray-600">Manage sub-deployments for this monorepo</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {subDeployments.length > 0 && (
              <Link
                to={`/deployments/${projectName}?all=true`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Play className="h-5 w-5 mr-2" />
                Deploy All
              </Link>
            )}
            <Link
              to={`/projects/${projectName}/add-sub`}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Sub-deployment
            </Link>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Monorepo Configuration</h3>
          <Link
            to={`/projects/edit/${projectName}`}
            className="inline-flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Settings className="h-4 w-4 mr-1" />
            Edit Settings
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Local Path</p>
            <p className="font-medium text-gray-900">{project?.localPath}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">SSH Host</p>
            <p className="font-medium text-gray-900">{project?.ssh.username}@{project?.ssh.host}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Base Remote Path</p>
            <p className="font-medium text-gray-900">{project?.remotePath}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Sub-deployments</p>
            <p className="font-medium text-gray-900">{subDeployments.length}</p>
          </div>
        </div>
      </div>

      {/* Sub-deployments List */}
      {subDeployments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No sub-deployments configured yet</p>
          <Link
            to={`/projects/${projectName}/add-sub`}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add Your First Sub-deployment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subDeployments.map((sub) => (
            <div key={sub.name} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-purple-100">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{sub.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{sub.relativePath || sub.name}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Sub-deployment
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Local:</span> <span className="text-gray-700">{sub.localPath}</span>
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Remote:</span> <span className="text-gray-700">{sub.remotePath}</span>
                  </p>
                  <div className="flex space-x-4 text-sm">
                    <p className="text-gray-800">
                      <span className="font-semibold">Local Steps:</span> <span className="text-gray-700">{sub.localSteps?.length || 0}</span>
                    </p>
                    <p className="text-gray-800">
                      <span className="font-semibold">Remote Steps:</span> <span className="text-gray-700">{sub.deploymentSteps?.length || 0}</span>
                    </p>
                  </div>
                  
                  {sub.stats?.lastDeployment && (
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">Last Deploy:</span>{' '}
                      <span className={`${sub.stats.lastDeploymentStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {new Date(sub.stats.lastDeployment).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <Link
                    to={`/deployments/${projectName}?sub=${sub.name}`}
                    className="inline-flex items-center text-purple-600 hover:text-purple-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Deploy
                  </Link>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/projects/${projectName}/sub/${sub.name}/edit`}
                      className="text-gray-600 hover:text-gray-700"
                      title="Edit"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDuplicateSubStart(sub)}
                      className="text-green-600 hover:text-green-700"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSub(sub.name)}
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

      {/* Quick Deploy All */}
      {subDeployments.length > 0 && (
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-purple-900">Deploy All Sub-projects</h3>
              <p className="text-sm text-purple-700 mt-1">Deploy all {subDeployments.length} sub-deployments at once</p>
            </div>
            <Link
              to={`/deployments/${projectName}?all=true`}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Play className="h-5 w-5 mr-2" />
              Deploy All
            </Link>
          </div>
        </div>
      )}

      {/* Duplicate Sub-deployment Modal */}
      {duplicating && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <Copy className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Duplicate Sub-deployment
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Create a copy of "{duplicateSubDeployment?.name}" with a new name:
              </p>
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="Enter new sub-deployment name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleDuplicateSubConfirm()}
              />
              <div className="text-xs text-gray-500 mt-2">
                This will copy all configuration, steps, and settings but not deployment history.
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleDuplicateSubCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateSubConfirm}
                  disabled={!newSubName.trim()}
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

export default SubDeployments;