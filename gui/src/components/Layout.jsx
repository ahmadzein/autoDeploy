import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Plus, FileText, Settings, Book, Shield, Globe, AlertCircle, Code, Terminal, Zap, ChevronDown, ChevronRight } from 'lucide-react';

function Layout() {
  const location = useLocation();
  const [docsExpanded, setDocsExpanded] = useState(location.pathname.startsWith('/docs'));

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Add Project', href: '/projects/add', icon: Plus },
  ];

  const docSections = [
    { name: 'Getting Started', href: '/docs/getting-started', icon: Book },
    { name: 'Managing Projects', href: '/docs/projects', icon: Settings },
    { name: 'Deployment Steps', href: '/docs/deployment-steps', icon: Zap },
    { name: 'Running Deployments', href: '/docs/deployment', icon: Terminal },
    { name: 'Security', href: '/docs/security', icon: Shield },
    { name: 'API Reference', href: '/docs/api', icon: Globe },
    { name: 'CLI Reference', href: '/docs/cli', icon: Terminal },
    { name: 'Troubleshooting', href: '/docs/troubleshooting', icon: AlertCircle },
    { name: 'Examples', href: '/docs/examples', icon: Code },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">AutoDeploy</h1>
        </div>
        <nav className="mt-8">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700 font-semibold'
                    : 'text-gray-800 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
          
          {/* Documentation Section */}
          <div className="mt-6">
            <button
              onClick={() => setDocsExpanded(!docsExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="mr-3 h-5 w-5" />
                Documentation
              </div>
              {docsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {docsExpanded && (
              <div className="bg-gray-50">
                {docSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center pl-12 pr-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;