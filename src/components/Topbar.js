import React from 'react';
import { useLocation } from 'react-router-dom';
import { FaBars, FaFileArchive } from 'react-icons/fa';
import { useAutomation } from '../context/AutomationContext';

const TITLES = {
    '/': 'Dashboard',
    '/react-generator': 'React Code Generator',
    '/node-generator': 'Node API Generator',
    '/table-generator': 'Database Table Generator',
    '/stored-procedures': 'Stored Procedure Generator',
    '/settings': 'Settings',
    '/about': 'About',
};

const Topbar = ({ onToggleSidebar }) => {
    const location = useLocation();
    const { generateFiles } = useAutomation();
    const title = TITLES[location.pathname] || 'CodeForge Studio';

    return (
        <div className="app-topbar">
            <button className="topbar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
                <FaBars />
            </button>
            <h1 className="topbar-title">{title}</h1>
            <div className="topbar-actions">
                <button className="topbar-export-btn" onClick={generateFiles} title="Download all generated files as a ZIP">
                    <FaFileArchive className="me-2" />
                    Export All (ZIP)
                </button>
            </div>
        </div>
    );
};

export default Topbar;
