import React from 'react';
import { motion } from 'framer-motion';
import { FaReact, FaMagic, FaFileArchive } from 'react-icons/fa';
import { useAutomation } from '../context/AutomationContext';
import { useToast } from '../context/ToastContext';
import SummaryBar from '../components/SummaryBar';
import CodeEditor from '../components/CodeEditor';

const ReactGeneratorPage = () => {
    const {
        sqlPreview, handleGenerateScreen, handleGenerateBothDesigns, generateFiles,
        objectRowData, uiPreview,
    } = useAutomation();
    const { showToast } = useToast();

    const reactName = objectRowData.find(r => r.object === 'React')?.name || 'Screen';

    const onGenerate = () => {
        handleGenerateScreen();
        showToast('React screen generated', 'success');
    };

    const onGenerateBoth = () => {
        handleGenerateBothDesigns();
        showToast('Search + Add designs generated', 'success');
    };

    return (
        <motion.div
            className="page-fade"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <div className="generator-page-header generator-page-header-react">
                <FaReact className="generator-page-icon" />
                <div>
                    <h2 className="app-title mb-1">React Code Generator</h2>
                    <p className="text-secondary mb-0">Generates Search / Add / Add+Grid / Combined screens from your dashboard data.</p>
                </div>
            </div>

            <SummaryBar />

            <div className="section-card mb-4 d-flex flex-wrap gap-3">
                <button className="action-btn action-btn-primary" onClick={onGenerate}>
                    <FaMagic className="me-2" /> Generate Screen
                </button>
                <button className="action-btn action-btn-outline" onClick={onGenerateBoth}>
                    Generate Search + Add (both)
                </button>
                <button className="action-btn action-btn-outline" onClick={generateFiles}>
                    <FaFileArchive className="me-2" /> Download All Files (ZIP)
                </button>
            </div>

            {/* CodeEditor with Code & Eye Icons in Toolbar */}
            <CodeEditor
                code={sqlPreview}
                language="jsx"
                filename={`${reactName}_screen.js`}
                showPreviewToggle={true}
                uiPreview={uiPreview}
            />
        </motion.div>
    );
};

export default ReactGeneratorPage;