import React from 'react';
import { motion } from 'framer-motion';
import { 
    FaCode, 
    FaDatabase, 
    FaServer, 
    FaReact, 
    FaLayerGroup, 
    FaCheckCircle, 
    FaInfoCircle 
} from 'react-icons/fa';

const AboutPage = () => {
    const features = [
        {
            icon: <FaReact className="text-primary" size={24} />,
            title: 'React Screen Generator',
            description: 'Generates responsive React UI components, form inputs, dynamic AG Grid tables, and form validations.'
        },
        {
            icon: <FaServer className="text-success" size={24} />,
            title: 'Node.js API Generator',
            description: 'Produces express routes, controllers, services, and validation middleware for Single and Loop CRUD operations.'
        },
        {
            icon: <FaDatabase className="text-warning" size={24} />,
            title: 'SQL Table & SP Generator',
            description: 'Creates optimized SQL Server database schema, primary/foreign key relations, and complex stored procedures.'
        },
        {
            icon: <FaLayerGroup className="text-info" size={24} />,
            title: 'Single Definition Workflow',
            description: 'Define your entity fields once on the dashboard and seamlessly output full-stack code across all layers.'
        }
    ];

    return (
        <motion.div
            className="page-fade"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            {/* Header Section */}
            <div className="generator-page-header mb-4">
                <FaCode className="generator-page-icon text-primary" />
                <div>
                    <h2 className="app-title mb-1">About CodeForge Studio</h2>
                    <p className="text-secondary mb-0">
                        Full-Stack Code Automation Workbench & Rapid Application Builder
                    </p>
                </div>
            </div>

            {/* Overview Card */}
            <div className="section-card mb-4">
                <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <FaInfoCircle className="text-primary" /> Overview
                </h4>
                <p className="fs-6 mb-3">
                    <strong>CodeForge Studio</strong> is an advanced code automation engine engineered to eliminate repetitive boilerplate development. It automatically transforms a single shared project definition into production-ready React screens, Node.js API layers, database tables, and SQL stored procedures.
                </p>
                <div className="p-3 rounded bg-secondary bg-opacity-10 border border-secondary border-opacity-25 text-secondary fs-7">
                    <FaCheckCircle className="text-success me-2" />
                    <strong>Note:</strong> All generation engine scripts, schema validations, and file ZIP exports operate with 100% functional parity while providing a modernized developer UI/UX experience.
                </div>
            </div>

            {/* Features Grid */}
            <div className="row g-3 mb-4">
                {features.map((item, idx) => (
                    <div key={idx} className="col-md-6">
                        <div className="section-card h-100 p-4">
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="p-2 rounded bg-secondary bg-opacity-10 border border-secondary border-opacity-25 d-flex align-items-center justify-content-center">
                                    {item.icon}
                                </div>
                                <h5 className="mb-0 fw-bold">{item.title}</h5>
                            </div>
                            <p className="text-secondary mb-0 fs-7">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* System Info / Metadata Footer */}
            <div className="section-card d-flex flex-wrap align-items-center justify-content-between gap-3 text-secondary fs-7">
                <div>
                    <span className="fw-bold">Engine Version:</span> v2.4.0 (Studio Edition)
                </div>
                <div>
                    <span className="fw-bold">Target Stack:</span> React • Node.js / Express • T-SQL / SQL Server
                </div>
                <div>
                    <span className="fw-bold">Environment:</span> Developer Workbench
                </div>
            </div>
        </motion.div>
    );
};

export default AboutPage;