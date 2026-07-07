import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Workers from './pages/Workers';
import Materials from './pages/Materials';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { CMSProvider, useCMS } from './context/CMSContext';

function AppContent() {
  const { isAuthenticated } = useCMS();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="workers" element={<Workers />} />
          <Route path="materials" element={<Materials />} />
          <Route path="finance" element={<Finance />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <CMSProvider>
      <AppContent />
    </CMSProvider>
  );
}

export default App;
