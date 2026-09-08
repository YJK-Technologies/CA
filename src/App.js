import React, { Suspense, lazy, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AutomationProvider } from './context/AutomationContext';
import './App.css';
import './theme.css';

// Route-based code splitting: each page (and the heavy AgGrid-powered
// Dashboard) is only fetched when the user navigates to it.
const Dashboard = lazy(() => import('./screens/Dashboard'));
const ReactGeneratorPage = lazy(() => import('./screens/ReactGeneratorPage'));
const NodeGeneratorPage = lazy(() => import('./screens/NodeGeneratorPage'));
const TableGeneratorPage = lazy(() => import('./screens/TableGeneratorPage'));
const StoredProcedurePage = lazy(() => import('./screens/StoredProcedurePage'));
const SettingsPage = lazy(() => import('./screens/SettingsPage'));
const AboutPage = lazy(() => import('./screens/AboutPage'));

const PageLoader = () => (
    <div className="page-loader">
        <div className="page-loader-spinner" />
        <span>Loading module…</span>
    </div>
);

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/react-generator" element={<ReactGeneratorPage />} />
                    <Route path="/node-generator" element={<NodeGeneratorPage />} />
                    <Route path="/table-generator" element={<TableGeneratorPage />} />
                    <Route path="/stored-procedures" element={<StoredProcedurePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
};

const App = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen((v) => !v);

    return (
        <ThemeProvider>
            <ToastProvider>
                <AutomationProvider>
                    <div className={`app-shell d-flex ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
                        <Sidebar isOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
                        <div className="main-content flex-grow-1">
                            <Topbar onToggleSidebar={toggleSidebar} />
                            <div className="container-fluid py-4 px-4">
                                <AnimatedRoutes />
                            </div>
                        </div>
                    </div>
                </AutomationProvider>
            </ToastProvider>
        </ThemeProvider>
    );
};

export default App;
