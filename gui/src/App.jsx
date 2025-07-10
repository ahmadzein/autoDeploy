import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import AddProject from './components/AddProject';
import DeploymentView from './components/DeploymentView';
import Documentation from './components/Documentation';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await window.electronAPI.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard projects={projects} />} />
          <Route path="/projects" element={<ProjectList projects={projects} onRefresh={loadProjects} />} />
          <Route path="/add-project" element={<AddProject onSuccess={loadProjects} />} />
          <Route path="/deploy/:projectName" element={<DeploymentView projects={projects} />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/docs/:section/:page" element={<Documentation />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;