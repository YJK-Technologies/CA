import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FaTh, FaReact, FaServer, FaTable, FaDatabase,
    FaCog, FaInfoCircle, FaMoon, FaSun, FaTools
} from 'react-icons/fa';
import { useAppTheme } from '../context/ThemeContext';
import Logo from '../assets/logo.PNG'

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: <FaTh />, end: true },
    { to: '/react-generator', label: 'React Generator', icon: <FaReact /> },
    { to: '/node-generator', label: 'Node Generator', icon: <FaServer /> },
    { to: '/table-generator', label: 'Table Generator', icon: <FaTable /> },
    { to: '/stored-procedures', label: 'Stored Procedure', icon: <FaDatabase /> },
];

const FOOTER_ITEMS = [
    { to: '/settings', label: 'Settings', icon: <FaCog /> },
    { to: '/about', label: 'About', icon: <FaInfoCircle /> },
];

const Sidebar = ({ isOpen, onToggleSidebar }) => {
    const { theme, toggleTheme } = useAppTheme();

    // MOBILE ONLY: Link click panna sidebar auto-close aagum. Desktop-la trigger AAGADHU!
    const handleNavClick = (e) => {
        // Stop Event Bubbling to prevent page clicks from closing sidebar
        e.stopPropagation();

        if (window.innerWidth <= 768 && isOpen && onToggleSidebar) {
            onToggleSidebar();
        }
    };

    return (
        <>
            {/* MOBILE ONLY BACKDROP OVERLAY */}
            {isOpen && (
                <div 
                    className="sidebar-overlay d-md-none" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSidebar();
                    }}
                />
            )}

            <aside 
                className={`sidebar ${isOpen ? 'open' : 'closed'}`}
                onClick={(e) => e.stopPropagation()} /* Prevents click leaking */
            >
                <div className="sidebar-header p-3 d-flex align-items-center justify-content-center">
                    {isOpen ? (
                        <div className="d-flex align-items-center gap-2">
                            {/* Expand-il Text-ukku Munnadi Logo */}
                            <img 
                                src={Logo} 
                                alt="CodeForge Logo" 
                                className="sidebar-logo-img"
                                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                            />
                            <h5 className="m-0 text-truncate">CodeForge Studio</h5>
                        </div>
                    ) : (
                        /* Collapse State-il FaTools-ukku Badhila Standalone Logo */
                        <img 
                            src={Logo}
                            alt="CodeForge Logo" 
                            className="sidebar-logo-img"
                            style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                        />
                    )}
                </div>

                <ul className="list-unstyled ps-0 flex-grow-1 mb-0">
                    {NAV_ITEMS.map(item => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                end={item.end}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                    `sidebar-link d-flex align-items-center ${isActive ? 'sidebar-link-active' : ''}`
                                }
                            >
                                <motion.span
                                    className="sidebar-icon"
                                    whileHover={{ scale: 1.15 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                >
                                    {item.icon}
                                </motion.span>
                                {isOpen && <span className="sidebar-label">{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="sidebar-divider" />

                <ul className="list-unstyled ps-0 mb-0">
                    {FOOTER_ITEMS.map(item => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                    `sidebar-link d-flex align-items-center ${isActive ? 'sidebar-link-active' : ''}`
                                }
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                {isOpen && <span className="sidebar-label">{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}

                    <li>
                        <button 
                            className="sidebar-link d-flex align-items-center sidebar-theme-toggle" 
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleTheme();
                            }}
                        >
                            <span className="sidebar-icon">{theme === 'dark' ? <FaSun /> : <FaMoon />}</span>
                            {isOpen && <span className="sidebar-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                        </button>
                    </li>
                </ul>
            </aside>
        </>
    );
};

export default Sidebar;