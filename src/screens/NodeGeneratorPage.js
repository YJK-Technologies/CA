import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaServer, FaFileArchive } from 'react-icons/fa';
import { useAutomation } from '../context/AutomationContext';
import { useToast } from '../context/ToastContext';
import SummaryBar from '../components/SummaryBar';
import CodeEditor from '../components/CodeEditor';

// Helper function to split generated Node CRUD code into clean Tab Names
const splitNodeScript = (scriptContent, mainName) => {
    if (!scriptContent) return [];

    // 🔹 FIX: Handle cases where scriptContent is an Object instead of a String
    if (typeof scriptContent === 'object' && scriptContent !== null) {
        return Object.entries(scriptContent).map(([key, code]) => ({
            label: key,
            code: typeof code === 'string' ? code : String(code || '')
        }));
    }

    // 🔹 FIX: Ensure scriptContent is strictly a string before calling .split()
    if (typeof scriptContent !== 'string') {
        return [];
    }

    const tabs = [];

    // Split script by Detail Comments Block (Handles both Single & Loop mode headers)
    const parts = scriptContent.split(/(?=\/\/\s*[-=]*\s*.*?\s*DETAILS(?:\s*LOOP)?\s*CRUD\s*[-=]*)/i);

    // 1. Main / Header Tab Name
    if (parts.length > 0 && parts[0].trim()) {
        tabs.push({
            label: mainName,
            code: parts[0].trim()
        });
    }

    // 2. Grid Details Tab Names (Cleans leading/trailing dashes & extra spaces)
    for (let i = 1; i < parts.length; i++) {
        const block = parts[i].trim();
        
        // Extract raw text before "DETAILS" keyword
        const match = block.match(/(?:\/\/\s*)?[-=]*\s*(.*?)\s+DETAILS(?:\s*LOOP)?\s*CRUD/i);
        
        let detailName = `Detail ${i}`;
        if (match && match[1]) {
            // Remove any remaining leading/trailing dashes, underscores, or special symbols
            detailName = match[1].replace(/^[-=_\s]+|[-=_\s]+$/g, '').trim();
        }

        tabs.push({
            label: detailName || `Detail ${i}`,
            code: block
        });
    }

    return tabs;
};

const NodeGeneratorPage = () => {
    const { sqlPreview, previewNodeSingle, previewNodeLoop, generateFiles, objectRowData } = useAutomation();
    const { showToast } = useToast();
    const [mode, setMode] = useState('single');
    const [activeTab, setActiveTab] = useState(0);

    const reactName = objectRowData.find(r => r.object === 'React')?.name || 'api';

    const tabs = useMemo(() => {
        return splitNodeScript(sqlPreview, reactName);
    }, [sqlPreview, reactName]);

    const onSingle = () => {
        previewNodeSingle();
        setMode('single');
        setActiveTab(0);
        showToast('Node single-CRUD script generated', 'success');
    };

    const onLoop = () => {
        previewNodeLoop();
        setMode('loop');
        setActiveTab(0);
        showToast('Node loop-CRUD script generated', 'success');
    };

    const currentTab = tabs[activeTab] || tabs[0];
    const currentCode = currentTab 
        ? currentTab.code 
        : (typeof sqlPreview === 'string' ? sqlPreview : '');

    return (
        <motion.div
            className="page-fade"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <div className="generator-page-header generator-page-header-node">
                <FaServer className="generator-page-icon" />
                <div>
                    <h2 className="app-title mb-1">Node API Generator</h2>
                    <p className="text-secondary mb-0">Controllers, services, routes and validation, generated from your dashboard fields.</p>
                </div>
            </div>

            <SummaryBar />

            <div className="section-card mb-4 d-flex flex-wrap gap-3">
                <button
                    className={`action-btn ${mode === 'single' ? 'action-btn-primary' : 'action-btn-outline'}`}
                    onClick={onSingle}
                >
                    Generate Node (Single)
                </button>
                <button
                    className={`action-btn ${mode === 'loop' ? 'action-btn-primary' : 'action-btn-outline'}`}
                    onClick={onLoop}
                >
                    Generate Node (Loop)
                </button>
                <button className="action-btn action-btn-outline" onClick={generateFiles}>
                    <FaFileArchive className="me-2" /> Download All Files (ZIP)
                </button>
            </div>

            {/* Dynamic Clean Tab Buttons */}
            {tabs.length > 0 && (
                <div className="mb-3 d-flex gap-2 flex-wrap sp-tabs">
                    {tabs.map((t, i) => (
                        <button
                            key={i}
                            className={`sp-tab ${activeTab === i ? 'sp-tab-active' : ''}`}
                            onClick={() => setActiveTab(i)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            <CodeEditor
                code={currentCode}
                language="javascript"
                filename={
                    currentTab?.label
                        ? `${currentTab.label.replace(/\s+/g, '_')}_${mode}.js`
                        : `${reactName}_${mode}.js`
                }
            />
        </motion.div>
    );
};

export default NodeGeneratorPage;