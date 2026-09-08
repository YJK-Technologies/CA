import React from 'react';
import { motion } from 'framer-motion';
import { FaMoon, FaSun, FaTrash } from 'react-icons/fa';
import { useAppTheme } from '../context/ThemeContext';
import { useAutomation } from '../context/AutomationContext';
import { useToast } from '../context/ToastContext';

const SettingsPage = () => {
    const { theme, toggleTheme } = useAppTheme();
    const { handleClearScreens } = useAutomation();
    const { showToast } = useToast();

    const onClear = () => {
        if (window.confirm('This clears all saved screens from local storage. Continue?')) {
            handleClearScreens();
            showToast('Saved screens cleared', 'info');
        }
    };

    return (
        <motion.div
            className="page-fade"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <h2 className="app-title mb-4">Settings</h2>

            <div className="section-card mb-4">
                <h5 className="section-heading mb-2">Appearance</h5>
                <p className="text-secondary">Choose the interface theme for CodeForge Studio.</p>
                <button className="action-btn action-btn-outline" onClick={toggleTheme}>
                    {theme === 'dark' ? <FaSun className="me-2" /> : <FaMoon className="me-2" />}
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </button>
            </div>

            <div className="section-card">
                <h5 className="section-heading mb-2">Data</h5>
                <p className="text-secondary">Saved screens are stored in your browser's local storage.</p>
                <button className="action-btn action-btn-danger" onClick={onClear}>
                    <FaTrash className="me-2" /> Clear Saved Screens
                </button>
            </div>
        </motion.div>
    );
};

export default SettingsPage;
