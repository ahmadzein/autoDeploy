import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import AddProject from './components/AddProject';
import EditProject from './components/EditProject';
import DeploymentView from './components/DeploymentView';
import DocumentationPage from './components/DocumentationPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/add" element={<AddProject />} />
        <Route path="projects/edit/:projectName" element={<EditProject />} />
        <Route path="deployments/:projectName" element={<DeploymentView />} />
        <Route path="docs/:section" element={<DocumentationPage />} />
        <Route path="docs" element={<Navigate to="/docs/getting-started" replace />} />
      </Route>
    </Routes>
  );
}

export default App;