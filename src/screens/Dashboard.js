// Dashboard.js
import React from 'react';
import { motion } from 'framer-motion';
import { AgGridReact } from 'ag-grid-react';
import { Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaPlus, FaMinus, FaReact, FaServer, FaTable, FaDatabase } from 'react-icons/fa';
import { useAutomation } from '../context/AutomationContext';
import GeneratorCard from '../components/GeneratorCard';
import Select from 'react-select';

const Dashboard = () => {
    const {
        name, setName,
        objectType, setObjectType,
        objectRowData,
        objectGridRef,
        objectClumnDefs,
        defaultColDef,
        handleKeyDown,
        handleAddObject,
        handleDetailsClick,

        screenType, setScreenType,
        screens,
        activeScreen,
        handleTabClick,
        handleSaveScreen,
        handleClearScreens,

        enableAudit, setEnableAudit,
        downloadExcelTemplate,
        handleExcelUpload,
        fileInputRef,

        rowData,
        mainGridRef,
        columnDefs,
        handleAddRow,
        handleRemoveRow,
        updateColumnVisibility,

        detailsTabs,
        activeDetailTab, setActiveDetailTab,
        detailsDefs,
        detailsDataMap,
        handleDetailsAddRow,
        handleDetailsRemoveRow,

        detailsTableTypes,
        toggleDetailTableType
    } = useAutomation();

    const objectTypeOptions = [
        { value: 'DB', label: 'DB Name' },
        { value: 'Table', label: 'Table Name' },
        { value: 'StoredProcedure', label: 'SP Name' },
        { value: 'React', label: 'React Name' }
    ];

    const screenTypeOptions = [
        { value: 'search', label: 'Search Screen' },
        { value: 'add', label: 'Add Screen' },
        { value: 'combined', label: 'Add + Search + Grid Screen' }
    ];

    const customSelectStyles = {
        control: (base) => ({
            ...base,
            minHeight: '38px',
            borderRadius: '0.375rem',
            borderColor: '#dee2e6',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#86b7fe'
            }
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    };

    return (
        <motion.div
            className="page-fade"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
        >
            <div className="dashboard-hero">
                <h2 className="app-title mb-1">Design Studio</h2>
                <p className="text-secondary mb-0">
                    Define your project once here, then jump into any generator below —
                    everything you enter carries over automatically.
                </p>
            </div>

            {screens.length > 0 && (
                <div className="mb-3 d-flex gap-2 flex-wrap">
                    {screens.map((screen, index) => (
                        <Button
                            key={index}
                            variant={activeScreen === screen.screenName ? 'primary' : 'outline-primary'}
                            onClick={() => handleTabClick(screen)}
                        >
                            {screen.screenName}
                        </Button>
                    ))}
                </div>
            )}

            <div className="section-card mb-4">
                <h5 className="section-heading mb-3">Common Configuration</h5>

                <Row className="g-3 align-items-end mb-3">
                    <Col md={3}>
                        <Form.Label>Object Type</Form.Label>
                        <Select
                            options={objectTypeOptions}
                            value={objectTypeOptions.find(opt => opt.value === objectType) || null}
                            onChange={(selected) => setObjectType(selected ? selected.value : '')}
                            isClearable
                            placeholder="Select Object Type"
                            styles={customSelectStyles}
                            menuPortalTarget={document.body}
                        />
                    </Col>

                    <Col md={3}>
                        <Form.Label>Object Name</Form.Label>
                        <InputGroup>
                            <Form.Control
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter object name"
                            />
                            <Button
                                variant="primary"
                                onClick={handleAddObject}
                            >
                                Add
                            </Button>
                        </InputGroup>
                    </Col>

                    <Col md={3}>
                        <Form.Label>Screen Type</Form.Label>
                        <Select
                            options={screenTypeOptions}
                            value={screenTypeOptions.find(opt => opt.value === screenType) || null}
                            onChange={(selected) => setScreenType(selected ? selected.value : '')}
                            isClearable
                            placeholder="Select Screen Type"
                            styles={customSelectStyles}
                            menuPortalTarget={document.body}
                        />
                    </Col>
                </Row>

                <Row className="g-3 align-items-end">
                    <Col md={4}>
                        <div className="d-grid gap-2 d-md-flex">
                            <Button variant="success" onClick={handleSaveScreen}>Save Screen</Button>
                            <Button variant="danger" onClick={handleClearScreens}>Clear Screens</Button>
                        </div>
                    </Col>

                    <Col md={8}>
                        <div className="d-flex flex-wrap gap-2 align-items-center h-100">
                            <Form.Check
                                type="checkbox"
                                label="Enable Audit Columns"
                                checked={enableAudit}
                                onChange={(e) => setEnableAudit(e.target.checked)}
                            />
                            <Button variant="outline-secondary" onClick={downloadExcelTemplate}>
                                Download Template
                            </Button>
                            <input
                                type="file"
                                accept=".xlsx"
                                ref={fileInputRef}
                                onChange={handleExcelUpload}
                                style={{ display: 'none' }}
                            />
                            <Button variant="outline-primary" onClick={() => fileInputRef.current.click()}>
                                Upload Excel
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>

            <div className="section-card mb-4">
                <h5 className="section-heading mb-3">Project / API / Table Objects</h5>
                <div className="ag-theme-alpine" style={{ height: 200, width: '100%', maxWidth: 700 }}>
                    <AgGridReact
                        ref={objectGridRef}
                        rowData={objectRowData}
                        columnDefs={objectClumnDefs}
                        rowHeight={35}
                        defaultColDef={defaultColDef}
                    />
                </div>
            </div>

            <div className="section-card mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="section-heading mb-0">Fields, Data Types &amp; Constraints</h5>
                    <div className="d-flex gap-2">
                        {/* ✅ Details Button directly where GRID is created */}
                        <Button variant="info" size="sm" onClick={handleDetailsClick}>
                            Configure Details Grid
                        </Button>
                        <Button variant="primary" onClick={handleAddRow}><FaPlus /></Button>
                        <Button variant="danger" onClick={handleRemoveRow}><FaMinus /></Button>
                    </div>
                </div>

                <div className="ag-theme-alpine mb-2" style={{ height: 380 }}>
                    <AgGridReact
                        ref={mainGridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        rowHeight={35}
                        stopEditingWhenCellsLoseFocus={true}
                        onGridReady={(params) => updateColumnVisibility(params.api)}
                        onCellValueChanged={(params) => updateColumnVisibility(params.api)}
                    />
                </div>
            </div>

            {detailsTabs.length > 0 && (
                <div className="mb-3 p-2 border rounded bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                        <strong className="me-2 text-muted">Detail Tabs:</strong>
                        {detailsTabs.map((tab, index) => (
                            <Button
                                key={index}
                                variant={activeDetailTab === tab ? 'primary' : 'outline-primary'}
                                size="sm"
                                onClick={() => setActiveDetailTab(tab)}
                            >
                                {tab}
                            </Button>
                        ))}
                    </div>

                    {/* 🔹 Separate Table Option per Selected Active Detail Tab */}
                    {activeDetailTab && (
                        <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 rounded border">
                            <Form.Check
                                type="switch"
                                id={`separate-table-switch-${activeDetailTab}`}
                                label={
                                    <span className="fw-semibold text-dark">
                                        Treat <span className="text-primary">{activeDetailTab}</span> as Separate Table
                                    </span>
                                }
                                checked={!!detailsTableTypes[activeDetailTab]}
                                onChange={(e) => toggleDetailTableType(activeDetailTab, e.target.checked)}
                            />
                        </div>
                    )}
                </div>
            )}

            {detailsDefs && (
                <div className="section-card mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="section-heading mb-0">Details Grid</h5>
                        <div className="d-flex gap-2">
                            <Button variant="primary" onClick={handleDetailsAddRow}><FaPlus /></Button>
                            <Button variant="danger" onClick={handleDetailsRemoveRow}><FaMinus /></Button>
                        </div>
                    </div>
                    <div className="ag-theme-alpine" style={{ height: 300 }}>
                        <AgGridReact
                            rowData={detailsDataMap[activeDetailTab] || []}
                            columnDefs={detailsDefs}
                            defaultColDef={defaultColDef}
                            context={{ activeDetailTab }}
                            stopEditingWhenCellsLoseFocus={true}
                            onGridReady={(params) => {
                                window.detailsGridApi = params.api;
                                updateColumnVisibility(params.api);
                            }}
                            onCellValueChanged={(params) => {
                                updateColumnVisibility(params.api);
                                if (window.detailsGridApi) updateColumnVisibility(window.detailsGridApi);
                            }}
                        />
                    </div>
                </div>
            )}

            <h5 className="section-heading mb-3 mt-5">Generate Code</h5>
            <div className="generator-card-grid">
                <GeneratorCard
                    icon={<FaReact />}
                    title="React Code Generator"
                    description="Search, Add, Add+Grid and Combined screens generated straight from your fields grid."
                    to="/react-generator"
                    accent="react"
                />
                <GeneratorCard
                    icon={<FaServer />}
                    title="Node API Generator"
                    description="Controllers, services, routes and validation for single & loop CRUD operations."
                    to="/node-generator"
                    accent="node"
                />
                <GeneratorCard
                    icon={<FaTable />}
                    title="Database Table Generator"
                    description="CREATE TABLE, UDD and constraint scripts, including master-detail tables."
                    to="/table-generator"
                    accent="table"
                />
                <GeneratorCard
                    icon={<FaDatabase />}
                    title="Stored Procedure Generator"
                    description="Insert, Update, Delete, GetById and List procedures, ready to preview or export."
                    to="/stored-procedures"
                    accent="sp"
                />
            </div>
        </motion.div>
    );
};

export default Dashboard;