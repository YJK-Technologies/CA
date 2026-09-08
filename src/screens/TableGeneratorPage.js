// TableGeneratorPage.js
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTable, FaFileArchive } from 'react-icons/fa';
import { useAutomation } from '../context/AutomationContext';
import { useToast } from '../context/ToastContext';
import SummaryBar from '../components/SummaryBar';
import CodeEditor from '../components/CodeEditor';

// Helper to extract table name from a block
const extractTableName = (block) => {
    const match = block.match(/CREATE\s+TABLE\s+(?:\[?\w+\]?\.)?\[?(\w+)\]?/i);
    return match ? match[1] : null;
};

// Helper to extract USE [DatabaseName] if present in raw SQL
const extractUseDatabase = (sqlData) => {
    const match = sqlData.match(/USE\s+\[?(\w+)\]?;\s*GO/i);
    return match ? match[0] : 'USE [YJKERP];\nGO';
};

// Helper to filter UDD statements specifically used in a given table block
const filterUDDsForTable = (tableBlock, allUddStatements) => {
    if (!tableBlock || !allUddStatements.length) return '';

    const uddMatches = tableBlock.match(/udd_\w+/gi) || [];
    const usedUddNames = new Set(uddMatches.map(u => u.toLowerCase()));

    const relevantUdds = allUddStatements.filter(uddStmt => {
        const typeMatch = uddStmt.match(/CREATE\s+TYPE\s+(udd_\w+)/i);
        if (typeMatch) {
            return usedUddNames.has(typeMatch[1].toLowerCase());
        }
        return false;
    });

    return relevantUdds.join('\n');
};

const splitTableSQL = (sqlData) => {
    if (!sqlData) return [];

    if (typeof sqlData === 'object' && !Array.isArray(sqlData)) {
        return Object.entries(sqlData).map(([name, code]) => ({
            label: name,
            sql: code
        }));
    }

    if (typeof sqlData === 'string') {
        let tabs = [];
        const useDbStatement = extractUseDatabase(sqlData);

        // 1. Clean up invalid GRID type statements
        let cleanedSql = sqlData.replace(/CREATE\s+TYPE\s+.*?FROM\s+GRID\s*;?[\s\n]*(?:GO\b)?/gi, '');

        // 2. Collect all individual UDD statements
        const uddRegex = /CREATE\s+TYPE\s+udd_\w+\s+FROM\s+[^;\n]+;?(?:\s*GO)?/gi;
        const allUddStatements = cleanedSql.match(uddRegex) || [];

        // 3. Remove global UDD blocks and extra USE statements
        cleanedSql = cleanedSql.replace(/--\s*=+\s*UDD\s*=+\s*[\s\S]*?(?=(--\s*=+\s*TABLE|CREATE\s+TABLE))/gi, '');
        cleanedSql = cleanedSql.replace(/USE\s+\[?\w+\]?;\s*GO/gi, '');

        // 4. Split script cleanly by CREATE TABLE
        const rawChunks = cleanedSql.split(/(?=CREATE\s+TABLE)/gi).filter(chunk => /CREATE\s+TABLE/i.test(chunk));

        rawChunks.forEach((chunk, index) => {
            const tableName = extractTableName(chunk) || `Table_${index + 1}`;
            
            // 5. Trim trailing comments/headers (e.g., -- DETAILS TABLE : ...) to prevent leak from previous table
            let pureTableCode = chunk;
            const endMatch = chunk.match(/\);[\s\n]*(?:GO\b)?/i);
            if (endMatch) {
                const endIndex = endMatch.index + endMatch[0].length;
                pureTableCode = chunk.substring(0, endIndex).trim();
            }

            // 6. Filter UDDs relevant ONLY to this specific table
            const tableSpecificUDDs = filterUDDsForTable(pureTableCode, allUddStatements);

            let tabSql = '';
            
            // 1. Table Name Banner Header
            tabSql += `-- =============================================\n`;
            tabSql += `-- TABLE NAME: ${tableName}\n`;
            tabSql += `-- =============================================\n\n`;
            
            // 2. USE Database Statement
            tabSql += `${useDbStatement}\n\n`;

            // 3. UDD Types Banner & Definitions
            if (tableSpecificUDDs) {
                tabSql += `-- =============================================\n`;
                tabSql += `-- UDD Types for ${tableName}\n`;
                tabSql += `-- =============================================\n`;
                tabSql += `${tableSpecificUDDs}\n\n`;
            }

            // 4. Clean Table Definition Only
            tabSql += pureTableCode;

            tabs.push({
                label: tableName,
                sql: tabSql
            });
        });

        if (tabs.length === 0) return [{ label: 'Table Script', sql: sqlData }];

        return tabs;
    }

    return [];
};

const TableGeneratorPage = () => {
    const { sqlPreview, previewTableSQL, generateFiles, objectRowData } = useAutomation();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState(0);

    const tableName = objectRowData.find(r => r.object === 'Table')?.name || 'table';

    const onGenerate = () => {
        previewTableSQL();
        setActiveTab(0);
        showToast('Table SQL generated', 'success');
    };

    const tabs = useMemo(() => splitTableSQL(sqlPreview), [sqlPreview]);
    const current = tabs[activeTab] || tabs[0];

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
            <div className="generator-page-header generator-page-header-table">
                <FaTable className="generator-page-icon" />
                <div>
                    <h2 className="app-title mb-1">Database Table Generator</h2>
                    <p className="text-secondary mb-0">CREATE TABLE, UDD and constraint scripts, including master-detail tables.</p>
                </div>
            </div>

            <SummaryBar />

            <div className="section-card mb-4 d-flex flex-wrap gap-3">
                <button className="action-btn action-btn-primary" onClick={onGenerate}>
                    Generate Table SQL
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
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            <CodeEditor
                code={currentCode}
                language="sql"
                filename={current?.label ? `${current.label}.sql` : `tbl_${tableName}.sql`}
            />
        </motion.div>
    );
};

export default TableGeneratorPage;