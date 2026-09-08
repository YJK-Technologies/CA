// StoredProcedurePage.js
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaDatabase, FaFileArchive } from 'react-icons/fa';
import { useAutomation } from '../context/AutomationContext';
import { useToast } from '../context/ToastContext';
import SummaryBar from '../components/SummaryBar';
import CodeEditor from '../components/CodeEditor';

// Helper to convert either an Object or String SQL payload into individual tabs
const splitProcedures = (sqlData) => {
    if (!sqlData) return [];

    // CASE 1: sqlData is an Object returned by getStoredProcSQL ({ sp_Employee: "...", sp_Personal_Details: "..." })
    if (typeof sqlData === 'object' && !Array.isArray(sqlData)) {
        return Object.entries(sqlData).map(([procName, procSql]) => ({
            label: procName,
            sql: procSql
        }));
    }

    // CASE 2: sqlData is a single String
    if (typeof sqlData === 'string') {
        const parts = sqlData.split(/(?=CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE)/gi);

        let headerText = '';
        const procs = [];

        parts.forEach((part) => {
            const trimmed = part.trim();
            if (!trimmed) return;

            if (/^CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE/i.test(trimmed)) {
                procs.push(trimmed);
            } else {
                headerText += trimmed + '\n\n';
            }
        });

        if (procs.length === 0) return [{ label: 'Script', sql: sqlData }];

        return procs.map((procSql, i) => {
            const match = procSql.match(/CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+(?:\[?\w+\]?\.)?\[?(\w+)\]?/i);
            let label = match ? match[1] : `Procedure ${i + 1}`;
            const fullSql = i === 0 && headerText ? headerText + procSql : procSql;
            return { label, sql: fullSql };
        });
    }

    return [];
};

const guessTabIcon = (label) => {
    const l = label.toLowerCase();
    if (l.includes('insert')) return 'Insert';
    if (l.includes('update')) return 'Update';
    if (l.includes('delete')) return 'Delete';
    if (l.includes('getbyid') || l.includes('get_by_id')) return 'GetById';
    if (l.includes('list') || l.includes('getall') || l.includes('search')) return 'List';
    return label;
};

const StoredProcedurePage = () => {
    const { sqlPreview, previewSPCode, generateFiles, objectRowData } = useAutomation();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState(0);

    const spName = objectRowData.find(r => r.object === 'StoredProcedure')?.name || 'sp';

    const onGenerate = () => {
        previewSPCode();
        setActiveTab(0);
        showToast('Stored procedures generated', 'success');
    };

    const tabs = useMemo(() => splitProcedures(sqlPreview), [sqlPreview]);
    const current = tabs[activeTab] || tabs[0];

    // Safely extract string code for CodeEditor
    const currentCode = typeof current?.sql === 'string' 
        ? current.sql 
        : (typeof sqlPreview === 'string' ? sqlPreview : '');

    return (
        <motion.div
            className="page-fade"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <div className="generator-page-header generator-page-header-sp">
                <FaDatabase className="generator-page-icon" />
                <div>
                    <h2 className="app-title mb-1">Stored Procedure Generator</h2>
                    <p className="text-secondary mb-0">Insert, Update, Delete, GetById and List procedures for your table.</p>
                </div>
            </div>

            <SummaryBar />

            <div className="section-card mb-4 d-flex flex-wrap gap-3">
                <button className="action-btn action-btn-primary" onClick={onGenerate}>
                    Generate Stored Procedures
                </button>
                <button className="action-btn action-btn-outline" onClick={generateFiles}>
                    <FaFileArchive className="me-2" /> Download All Files (ZIP)
                </button>
            </div>

            {tabs.length > 0 && (
                <div className="mb-3 d-flex gap-2 flex-wrap sp-tabs">
                    {tabs.map((t, i) => (
                        <button
                            key={i}
                            className={`sp-tab ${activeTab === i ? 'sp-tab-active' : ''}`}
                            onClick={() => setActiveTab(i)}
                        >
                            {guessTabIcon(t.label)}
                        </button>
                    ))}
                </div>
            )}

            <CodeEditor
                code={currentCode}
                language="sql"
                filename={
                    current?.label
                        ? `${current.label}.sql`
                        : `sp_${spName}.sql`
                }
            />
        </motion.div>
    );
};

export default StoredProcedurePage;