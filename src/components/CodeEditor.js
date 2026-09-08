// CodeEditor.js
import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaCopy, FaCheckCircle, FaDownload, FaExpand, FaCompress,
    FaSearch, FaAlignLeft, FaAlignRight, FaCode, FaEye
} from 'react-icons/fa';
import { useToast } from '../context/ToastContext';

// --- Very lightweight, dependency-free syntax highlighter -----------------
const KEYWORDS = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'import', 'export', 'default', 'from', 'async', 'await', 'new', 'try',
    'catch', 'switch', 'case', 'break', 'class', 'extends', 'this', 'typeof',
    // SQL
    'SELECT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'FROM',
    'WHERE', 'CREATE', 'TABLE', 'PROCEDURE', 'ALTER', 'DROP', 'PRIMARY', 'KEY',
    'FOREIGN', 'REFERENCES', 'NOT', 'NULL', 'DEFAULT', 'CONSTRAINT', 'AS',
    'BEGIN', 'END', 'DECLARE', 'EXEC', 'GO', 'USE', 'JOIN', 'ON', 'AND', 'OR'
];

const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const highlight = (line) => {
    let escaped = escapeHtml(line);

    const tokenRegex = new RegExp(
        [
            `(?<comment>\\/\\/.*$|--.*$)`,
            `(?<string>&quot;.*?&quot;|'.*?'|\`.*?\`)`,
            `(?<keyword>\\b(?:${KEYWORDS.join('|')})\\b)`,
            `(?<number>\\b\\d+\\b)`
        ].join('|'),
        'gm'
    );

    return escaped.replace(tokenRegex, (match, comment, string, keyword, number) => {
        if (comment) return `<span class="tok-comment">${comment}</span>`;
        if (string) return `<span class="tok-str">${string}</span>`;
        if (keyword) return `<span class="tok-kw">${keyword}</span>`;
        if (number) return `<span class="tok-num">${number}</span>`;
        return match;
    });
};

const CodeEditor = ({ 
    code = '', 
    language = 'text', 
    filename = 'generated.txt', 
    height = 480,
    showPreviewToggle = false, // React Generator-kkaga mattum
    uiPreview = null 
}) => {
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState('code'); // 'code' or 'ui'
    const [copied, setCopied] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [wordWrap, setWordWrap] = useState(true);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);

    // ✅ FIX: Safely convert code to a clean String regardless of whether it's an Object, Array, or String
    const safeCodeString = useMemo(() => {
        if (!code) return '';
        if (typeof code === 'string') return code;
        if (typeof code === 'object') {
            // If passed an object of procedures, combine values into a single string
            return Object.values(code).join('\n\n');
        }
        return String(code);
    }, [code]);

    const lines = useMemo(() => safeCodeString.split('\n'), [safeCodeString]);

    const matchCount = useMemo(() => {
        if (!query) return 0;
        try {
            const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            return (safeCodeString.match(re) || []).length;
        } catch {
            return 0;
        }
    }, [query, safeCodeString]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(safeCodeString);
            setCopied(true);
            showToast('Copied to clipboard', 'success');
            setTimeout(() => setCopied(false), 1800);
        } catch {
            showToast('Copy failed — select and copy manually', 'error');
        }
    };

    const handleDownload = () => {
        const blob = new Blob([safeCodeString], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename}`, 'success');
    };

    if (!safeCodeString && !uiPreview) {
        return (
            <div className="code-editor code-editor-empty">
                <p className="text-secondary mb-0">Nothing generated yet — click Generate above.</p>
            </div>
        );
    }

    return (
        <motion.div
            ref={containerRef}
            className={`code-editor ${fullscreen ? 'code-editor-fullscreen' : ''}`}
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
            <div className="code-editor-toolbar">
                <div className="code-editor-toolbar-left">
                    <span className="code-editor-lang-badge">{language}</span>
                    <span className="code-editor-filename">{filename}</span>
                </div>
                
                <div className="code-editor-toolbar-right d-flex align-items-center gap-1">
                    {/* Code & Eye icons - Right Side Toolbar End */}
                    {showPreviewToggle && (
                        <>
                            <button
                                className={`ce-icon-btn ${viewMode === 'code' ? 'active text-primary' : ''}`}
                                title="Show Code Preview"
                                onClick={() => setViewMode('code')}
                            >
                                <FaCode />
                            </button>
                            <button
                                className={`ce-icon-btn ${viewMode === 'ui' ? 'active text-primary' : ''}`}
                                title="Show UI Preview"
                                onClick={() => setViewMode('ui')}
                            >
                                <FaEye />
                            </button>
                        </>
                    )}

                    {viewMode === 'code' && (
                        <>
                            <button className="ce-icon-btn" title="Search" onClick={() => setSearchOpen(v => !v)}>
                                <FaSearch />
                            </button>
                            <button className="ce-icon-btn" title="Toggle word wrap" onClick={() => setWordWrap(w => !w)}>
                                {wordWrap ? <FaAlignLeft /> : <FaAlignRight />}
                            </button>
                            <button className="ce-icon-btn" title="Copy" onClick={handleCopy}>
                                {copied ? <FaCheckCircle className="ce-copied" /> : <FaCopy />}
                            </button>
                            <button className="ce-icon-btn" title="Download" onClick={handleDownload}>
                                <FaDownload />
                            </button>
                        </>
                    )}

                    <button
                        className="ce-icon-btn"
                        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        onClick={() => setFullscreen(f => !f)}
                    >
                        {fullscreen ? <FaCompress /> : <FaExpand />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {searchOpen && viewMode === 'code' && (
                    <motion.div
                        className="code-editor-search"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <input
                            autoFocus
                            placeholder="Search in generated code..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <span className="code-editor-search-count">
                            {query ? `${matchCount} match${matchCount === 1 ? '' : 'es'}` : ''}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className="code-editor-body"
                style={{ maxHeight: fullscreen ? '80vh' : height, overflowY: 'auto' }}
            >
                {/* 1. CODE VIEW */}
                {viewMode === 'code' && (
                    <pre className={wordWrap ? 'wrap' : 'nowrap'}>
                        <code>
                            {lines.map((line, i) => {
                                const isMatch = query && line.toLowerCase().includes(query.toLowerCase());
                                return (
                                    <div key={i} className={`code-line ${isMatch ? 'code-line-match' : ''}`}>
                                        <span className="line-no">{i + 1}</span>
                                        <span
                                            className="line-content"
                                            dangerouslySetInnerHTML={{ __html: highlight(line) || '&nbsp;' }}
                                        />
                                    </div>
                                );
                            })}
                        </code>
                    </pre>
                )}

                {/* 2. UI DESIGN PREVIEW */}
                {viewMode === 'ui' && (
                    <div className="p-3 bg-white text-dark rounded min-vh-50">
                        {uiPreview ? (
                            uiPreview
                        ) : (
                            <div className="text-center py-4 text-muted">
                                UI Preview unavailable. Click "Generate Screen" button first.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CodeEditor;