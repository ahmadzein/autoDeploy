import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  BookOpenIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import docStructure from '../../../../docs/structure.json';

function Documentation() {
  const navigate = useNavigate();
  const { section, page } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Initialize Fuse.js for search
  const fuse = new Fuse(getAllDocPages(), {
    keys: ['title', 'content', 'description'],
    threshold: 0.3,
    includeScore: true
  });

  function getAllDocPages() {
    const pages = [];
    docStructure.sections.forEach(section => {
      section.items.forEach(item => {
        pages.push({
          title: item.title,
          description: item.description,
          section: section.title,
          sectionPath: section.path,
          path: item.path
        });
      });
    });
    return pages;
  }

  useEffect(() => {
    // Expand current section
    if (section) {
      setExpandedSections(prev => ({ ...prev, [section]: true }));
    }
  }, [section]);

  useEffect(() => {
    loadDocumentation();
  }, [section, page]);

  useEffect(() => {
    if (searchQuery) {
      const results = fuse.search(searchQuery);
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadDocumentation = async () => {
    setLoading(true);
    try {
      let path = '/docs/index.md';
      if (section && page) {
        path = `/docs/${section}/${page}`;
      }
      
      const response = await window.electronAPI.readFile(path);
      setContent(response);
    } catch (error) {
      console.error('Failed to load documentation:', error);
      setContent('# Documentation Not Found\n\nThe requested documentation page could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionPath) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionPath]: !prev[sectionPath]
    }));
  };

  const navigateToDoc = (sectionPath, pagePath) => {
    navigate(`/docs/${sectionPath}/${pagePath}`);
    setShowSearch(false);
    setSearchQuery('');
  };

  const renderIcon = (iconName) => {
    const icons = {
      rocket: '🚀',
      terminal: '💻',
      desktop: '🖥️',
      cloud: '☁️',
      shield: '🛡️',
      code: '📝',
      bug: '🐛'
    };
    return <span className="text-xl mr-2">{icons[iconName] || '📄'}</span>;
  };

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h2>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              placeholder="Search documentation..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearch(false);
                }}
                className="absolute right-3 top-2.5"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {showSearch && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-4 right-4 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-96 overflow-y-auto"
              >
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => navigateToDoc(result.item.sectionPath, result.item.path)}
                    className="block w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{result.item.title}</div>
                    <div className="text-sm text-gray-500">{result.item.section}</div>
                    {result.item.description && (
                      <div className="text-xs text-gray-400 mt-1">{result.item.description}</div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Tree */}
        <nav className="p-4">
          <button
            onClick={() => navigate('/docs')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              !section ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Home
          </button>

          <div className="mt-4 space-y-2">
            {docStructure.sections.map((sectionItem) => (
              <div key={sectionItem.path}>
                <button
                  onClick={() => toggleSection(sectionItem.path)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    {renderIcon(sectionItem.icon)}
                    {sectionItem.title}
                  </div>
                  {expandedSections[sectionItem.path] ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedSections[sectionItem.path] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-8 mt-1 space-y-1 overflow-hidden"
                    >
                      {sectionItem.items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => navigateToDoc(sectionItem.path, item.path)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            section === sectionItem.path && page === item.path
                              ? 'bg-primary-50 text-primary-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {item.title}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="prose prose-lg max-w-none"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  a({ href, children, ...props }) {
                    // Handle internal links
                    if (href && href.startsWith('./')) {
                      const parts = href.replace('./', '').replace('.md', '').split('/');
                      return (
                        <button
                          onClick={() => {
                            if (parts.length === 2) {
                              navigate(`/docs/${parts[0]}/${parts[1]}.md`);
                            } else if (parts.length === 1) {
                              navigate(`/docs/${section}/${parts[0]}.md`);
                            }
                          }}
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          {children}
                        </button>
                      );
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          {children}
                        </table>
                      </div>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Documentation;