/*
 * AutomationContext.js
 * -------------------------------------------------------------------------
 * IMPORTANT: This file contains ZERO new business/generation logic.
 * Every state hook, ref, constant, and handler function below is copied
 * VERBATIM (unmodified) from the original single-file Pages/Automation.js.
 * It has only been *relocated* into a Context Provider so that the same
 * state + handlers can be shared across multiple routed pages (Dashboard,
 * React Generator, Node Generator, Table Generator, Stored Procedure)
 * instead of a single monolithic screen.
 *
 * Do not add, remove, or alter any generation/validation logic here.
 * -------------------------------------------------------------------------
 */
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import Select from 'react-select';
import * as Babel from '@babel/standalone';
import JSZip from "jszip";
import ExcelJS from 'exceljs';
import { saveAs } from "file-saver";
import { provideGlobalGridOptions } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { getNodeSingleCrudScript, getNodeLoopCrudScripts, getAllNodeSingleCrudScripts, getAllNodeLoopCrudScripts, getAllNodeCrudScripts } from '../Pages/nodeGenerator';
import {
    getFrontendSearchDesignCode,
    getFrontendAddDesignCode,
    getFrontendCombinedDesignCode,
    getAllFrontendScreens
} from '../Pages/frontGenerator';
import * as XLSX from "xlsx";
import {
    getTableSQL,
    getStoredProcSQL,
    getAllStoredProcSQL,
    getPreviewTableSQL,
    getOnlyUDDSQL,
} from '../Pages/sqlGenerator';
import ReactSelectCellEditor from './ReactSelectEditor';

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const AutomationContext = createContext(null);

// eslint-disable-next-line no-unused-vars
const useAutomationEngine = () => {
    const [name, setName] = useState('');
    const [objectType, setObjectType] = useState('DB');
    const [sqlPreview, setSqlPreview] = useState('');
    const [rowData, setRowData] = useState([]);
    const [detailsRowData, setDetailsRowData] = useState([]);
    const [detailsTabs, setDetailsTabs] = useState([]);
    const [activeDetailTab, setActiveDetailTab] = useState("");
    const [detailsDataMap, setDetailsDataMap] = useState({});
    const objectGridRef = useRef();
    const mainGridRef = useRef();
    const previewRef = useRef(null);
    const [uiPreview, setUiPreview] = useState(null);
    const [uiPreviewEnabled, setUiPreviewEnabled] = useState(false);
    const [copied, setCopied] = useState(false);
    const [objectRowData, setObjectRowData] = useState([]);
    const [detailsDefs, setDetailsDefs] = useState(null);
    const [enableAudit, setEnableAudit] = useState(false);
    const fileInputRef = useRef();
    const [screenType, setScreenType] = useState("combined");
    const STORAGE_KEY = "savedScreens";

    const [screens, setScreens] = useState([]);
    const [activeScreen, setActiveScreen] = useState(null);

    const [detailsTableTypes, setDetailsTableTypes] = useState({});

    const toggleDetailTableType = (tabName, isSeparate) => {
        setDetailsTableTypes(prev => ({
            ...prev,
            [tabName]: isSeparate
        }));
    };

    const validDataTypes = [
        'INT', 'BIGINT', 'VARCHAR', 'TEXT', 'FLOAT',
        'DATE', 'DATETIME', 'BIT', 'NVARCHAR',
        'VARBINARY', 'DECIMAL', 'GRID'
    ];

    const constraintMap = {
        "PRIMARY KEY": "PK",
        "PRIMARYKEY": "PK",
        "PK": "PK",

        "NOT NULL": "NN",
        "NOTNULL": "NN",
        "NN": "NN",

        "UNIQUE": "UQ",
        "UQ": "UQ",

        "FOREIGN KEY": "FK",
        "FOREIGNKEY": "FK",
        "FK": "FK",

        "DEFAULT": "DF",
        "DF": "DF",

        "CHECK": "CHK",
        "CHK": "CHK",

        "AUTO INCREMENT": "AI",
        "AUTOINCREMENT": "AI",
        "AI": "AI"
    };

    const validConstraints = ["PK", "NN", "UQ", "FK", "DF", "CHK", "AI"];

    const downloadExcelTemplate = () => {
        const headers = [
            "Field Name",
            "Data Type",
            "Size",
            "File Type",
            "Constraints",
            "Reference Table",
            "Reference Column",
            "Default Value",
            "Check Condition",
            "Design SC Select",
            "Design SC Order No",
            "Design SC Buttons",
            "Design Add Screen Select",
            "RCL",
            "Add Screen Tooltip",
            "Design Add Screen Buttons",
            "Add Screen Button Position"
        ];

        const data = [headers];

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Column width
        ws["!cols"] = headers.map(() => ({ wch: 22 }));

        // Add dropdowns (Data Validation)
        ws["!dataValidation"] = {
            B2: {
                type: "list",
                allowBlank: 1,
                showInputMessage: 1,
                showErrorMessage: 1,
                formula1: '"INT,BIGINT,VARCHAR,TEXT,FLOAT,DATE,DATETIME,BIT,NVARCHAR,VARBINARY,DECIMAL,GRID"'
            },
            D2: {
                type: "list",
                allowBlank: 1,
                showInputMessage: 1,
                showErrorMessage: 1,
                formula1: '"Primary Key,Not Null,Unique,Foreign Key,Default,Check,Auto Increment"'
            },
            E2: {
                type: "list",
                allowBlank: 1,
                showInputMessage: 1,
                showErrorMessage: 1,
                formula1: '"Image,File,Audio,Video"'
            },
        };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");

        XLSX.writeFile(wb, "Grid_Template.xlsx");
    };

    // const downloadExcelTemplate = async () => {
    //     // 1. Create a new Workbook and Worksheet
    //     const workbook = new ExcelJS.Workbook();
    //     const worksheet = workbook.addWorksheet('Template');

    //     // 2. Define Headers
    //     const headers = [
    //         "Field Name",
    //         "Data Type",
    //         "Size",
    //         "Existing UDD",
    //         "File Type",
    //         "Constraints",
    //         "Default Value",
    //         "Check Condition",
    //         "Reference Table",
    //         "Reference Column",
    //         "Design SC Select",
    //         "Design SC Order No",
    //         "Design SC Buttons",
    //         "Design Add Screen Select",
    //         "RCL",
    //         "Add Screen Tooltip",
    //         "Design Add Screen Buttons",
    //         "Add Screen Button Position"
    //     ];

    //     // Add Header Row
    //     const headerRow = worksheet.addRow(headers);

    //     // Apply Style to Header
    //     headerRow.font = { bold: true };
    //     headerRow.eachCell((cell) => {
    //         cell.fill = {
    //             type: 'pattern',
    //             pattern: 'solid',
    //             fgColor: { argb: 'FFE0E0E0' }
    //         };
    //     });

    //     // Column Widths
    //     worksheet.columns = headers.map(() => ({ width: 22 }));

    //     // Define Options for Dropdowns
    //     const dataTypeOptions = '"INT,BIGINT,VARCHAR,TEXT,FLOAT,DATE,DATETIME,BIT,NVARCHAR,VARBINARY,DECIMAL,GRID"';
    //     const fileTypeOptions = '"Image,File,Audio,Video"';
    //     const constraintsOptions = '"Primary Key,Not Null,Unique,Foreign Key,Default,Check,Auto Increment"';
    //     const scSelectOptions = '"Text,Dropdown,Date,Toggle,Number"';
    //     const scButtonsOptions = '"Search,Refresh,Add,Delete,Update,Print,Excel"';
    //     const addScreenSelectOptions = '"Text,Dropdown,Date,File,Number,Text Area,Grid,Toggle"';
    //     const addScreenButtonsOptions = '"Save,Update,Print,Excel,Refresh,Close"';
    //     const buttonPositionOptions = '"Top,Bottom"';

    //     // 3. Add Empty Rows (Row 2 to 100) and Apply Data Validation (Dropdowns)
    //     for (let i = 2; i <= 100; i++) {
    //         const row = worksheet.getRow(i);

    //         // Data Type (Col B - Column 2)
    //         row.getCell(2).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [dataTypeOptions]
    //         };

    //         // File Type (Col E - Column 5)
    //         row.getCell(5).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [fileTypeOptions]
    //         };

    //         // Constraints (Col F - Column 6)
    //         row.getCell(6).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [constraintsOptions]
    //         };

    //         // Design SC Select (Col K - Column 11)
    //         row.getCell(11).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [scSelectOptions]
    //         };

    //         // Design SC Buttons (Col M - Column 13)
    //         row.getCell(13).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [scButtonsOptions]
    //         };

    //         // Design Add Screen Select (Col N - Column 14)
    //         row.getCell(14).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [addScreenSelectOptions]
    //         };

    //         // Design Add Screen Buttons (Col Q - Column 17)
    //         row.getCell(17).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [addScreenButtonsOptions]
    //         };

    //         // Add Screen Button Position (Col R - Column 18)
    //         row.getCell(18).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [buttonPositionOptions]
    //         };
    //     }

    //     // 4. Generate Excel File and Trigger Download
    //     const buffer = await workbook.xlsx.writeBuffer();
    //     const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    //     saveAs(blob, 'Grid_Template.xlsx');
    // };

    const handleGenerateScreen = () => {

        let code = "";

        if (screenType === "search") {
            code = getFrontendSearchDesignCode(rowData, objectRowData);
        }

        else if (screenType === "add") {
            const detailsTables = Object.entries(detailsDataMap || {}).map(
                ([gridName, rowData]) => ({
                    gridName,
                    rowData
                })
            );

            code = getFrontendAddDesignCode(
                rowData,
                objectRowData,
                detailsTables
            );
        }

        else if (screenType === "add-grid") {
            // Same add function, but GRID fields will render automatically
            const detailsTables = Object.entries(detailsDataMap || {}).map(
                ([gridName, rowData]) => ({
                    gridName,
                    rowData
                })
            );

            code = getFrontendAddDesignCode(
                rowData,
                objectRowData,
                detailsTables
            );
        }

        else if (screenType === "combined") {

            // MULTI SCREEN MODE
            if (screens.length > 0) {

                code = getAllFrontendScreens();

            } else {

                // SINGLE SCREEN MODE
                code = getFrontendCombinedDesignCode(
                    rowData,
                    objectRowData,
                    detailsRowData,
                    screens
                );
            }
        }

        if (!code) {
            alert("No valid data to generate screen");
            return;
        }

        setSqlPreview(code);

        setUiPreview(
            <div>
                {renderReactCodeFromString(code)}
            </div>
        );

        setUiPreviewEnabled(true);
        setTimeout(() => {
            if (mainGridRef.current?.api) {
                updateColumnVisibility(mainGridRef.current.api);
            }
        }, 0);
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (evt) => {
            const binaryStr = evt.target.result;
            const workbook = XLSX.read(binaryStr, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(sheet);

            const headerMap = {
                "Field Name": "fieldName",
                "Data Type": "dataType",
                "Size": "size",
                "File Type": "fileType",
                "Constraints": "constraints",
                "Reference Table": "referenceTable",
                "Reference Column": "referenceColumn",
                "Default Value": "defaultValue",
                "Check Condition": "checkCondition",
                "Design SC Select": "designSCSelect",
                "Design SC Order No": "designSCOrderNo",
                "Design SC Buttons": "designSCButtons",
                "Design Add Screen Select": "designAddScreenSelect",
                "RCL": "RCL",
                "Add Screen Tooltip": "addScreenTooltip",
                "Design Add Screen Buttons": "designAddScreenButtons",
                "Add Screen Button Position": "addScreenButtonPosition"
            };

            const data = rawData.map(row => {

                const formattedRow = {};

                Object.keys(row).forEach(key => {

                    const mappedKey = headerMap[key] || key;

                    formattedRow[mappedKey] = row[key];
                });

                return formattedRow;
            });

            validateAndLoadData(data);

            // ✅ RESET INPUT VALUE
            e.target.value = "";
        };

        reader.readAsBinaryString(file);
    };

    const normalizeValue = (value) => {
        if (!value) return "";
        return value.toString().trim().toUpperCase();
    };

    const validateAndLoadData = (data) => {
        const errors = [];

        const fieldNames = data.map(r => r.fieldName?.trim().toLowerCase());

        const duplicateFields = fieldNames.filter(
            (item, index) =>
                item &&
                fieldNames.indexOf(item) !== index
        );

        if (duplicateFields.length > 0) {
            errors.push(`Duplicate field names found: ${[...new Set(duplicateFields)].join(", ")}`);
        }

        const formattedData = data.map((row, index) => {
            const rowNum = index + 2; // Excel row (header = row 1)

            // ================= COLUMN LEVEL VALIDATION =================

            // fieldName validation
            if (row.fieldName && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(row.fieldName)) {
                errors.push(`Row ${rowNum}: fieldName must start with letter/underscore and contain no spaces`);
            }

            // size validation
            if (row.size !== null && row.size !== undefined && row.size !== "") {

                const sizeValue = row.size.toString().trim();

                if (!/^[a-zA-Z0-9_,()]+$/.test(sizeValue)) {
                    errors.push(
                        `Row ${rowNum}: size contains invalid characters`
                    );
                }
            }

            // designSCOrderNo validation
            if (row.designSCOrderNo !== null && row.designSCOrderNo !== undefined && row.designSCOrderNo !== "") {
                if (!/^\d+$/.test(row.designSCOrderNo)) {
                    errors.push(`Row ${rowNum}: designSCOrderNo must be a number`);
                }
            }

            // designAddOrderNo validation (RCL format)
            const addOrderValue = row.RCL || row.designAddOrderNo;

            if (addOrderValue) {
                const regex = /^\d+,\d+(?:,\d+)?$/;

                if (!regex.test(addOrderValue)) {
                    errors.push(`Row ${rowNum}: designAddOrderNo must be row,column or row,column,length`);
                } else {
                    const parts = addOrderValue.split(",").map(Number);

                    if (parts.length === 3 && parts[2] > 12) {
                        errors.push(`Row ${rowNum}: length (3rd value) cannot be greater than 12`);
                    }
                }
            }

            // designSCSelect validation
            const validSCSelect = ["TEXT", "DROPDOWN", "DATE", "TOGGLE", "NUMBER"];
            if (row.designSCSelect && !validSCSelect.includes(normalizeValue(row.designSCSelect))) {
                errors.push(`Row ${rowNum}: Invalid designSCSelect value`);
            }

            // designAddScreenSelect validation
            const validAddSelect = ["TEXT", "DROPDOWN", "DATE", "FILE", "NUMBER", "TEXT AREA", "GRID", "TOGGLE"];
            if (row.designAddScreenSelect && !validAddSelect.includes(normalizeValue(row.designAddScreenSelect))) {
                errors.push(`Row ${rowNum}: Invalid designAddScreenSelect value`);
            }

            // designSCButtons validation
            const validSCButtons = ['SEARCH', 'REFRESH', 'ADD', 'DELETE', 'UPDATE', 'PRINT', 'EXCEL'];
            if (row.designSCButtons && !validSCButtons.includes(normalizeValue(row.designSCButtons))) {
                errors.push(`Row ${rowNum}: Invalid designSCButtons value`);
            }

            // designAddScreenButtons validation
            const validAddButtons = ['SAVE', 'UPDATE', 'PRINT', 'EXCEL', 'REFRESH', 'CLOSE'];
            if (row.designAddScreenButtons && !validAddButtons.includes(normalizeValue(row.designAddScreenButtons))) {
                errors.push(`Row ${rowNum}: Invalid designAddScreenButtons value`);
            }

            // addScreenButtonPosition validation
            if (row.addScreenButtonPosition && !["TOP", "BOTTOM"].includes(normalizeValue(row.addScreenButtonPosition))) {
                errors.push(`Row ${rowNum}: addScreenButtonPosition must be Top or Bottom`);
            }

            if (!row.fieldName) {
                errors.push(`Row ${rowNum}: fieldName is required`);
            }

            const dataType = normalizeValue(row.dataType);

            // size required for VARCHAR/NVARCHAR/DECIMAL
            if (["VARCHAR", "NVARCHAR", "DECIMAL"].includes(dataType) && !row.size) {
                errors.push(`Row ${rowNum}: size is required for ${dataType}`);
            }

            if (!validDataTypes.includes(dataType)) {
                errors.push(`Row ${rowNum}: Invalid dataType`);
            }

            if (dataType === "GRID") {
                if (!row.fieldName) {
                    errors.push(`Row ${rowNum}: GRID must have fieldName`);
                }
            }

            let constraintsArray = [];

            if (row.constraints) {
                constraintsArray = row.constraints
                    .split(",")
                    .map(c => c.trim())
                    .map(c => {
                        const key = c.toUpperCase().replace(/\s+/g, " ").trim();
                        return constraintMap[key];
                    });

                constraintsArray.forEach(c => {
                    if (!c || !validConstraints.includes(c)) {
                        errors.push(`Row ${rowNum}: Invalid constraint`);
                    }
                });
            }

            // FK validation
            if (constraintsArray.includes("FK")) {
                if (!row.referenceTable || !row.referenceColumn) {
                    errors.push(`Row ${rowNum}: FK requires referenceTable & referenceColumn`);
                }
            }

            // DF validation
            if (constraintsArray.includes("DF") && !row.defaultValue) {
                errors.push(`Row ${rowNum}: DF requires defaultValue`);
            }

            // CHK validation
            if (constraintsArray.includes("CHK") && !row.checkCondition) {
                errors.push(`Row ${rowNum}: CHK requires checkCondition`);
            }

            // AI validation
            if (
                constraintsArray.includes("AI") &&
                !["INT", "BIGINT"].includes(dataType)
            ) {
                errors.push(`Row ${rowNum}: AI only allowed for INT/BIGINT`);
            }

            return {
                ...row,

                designAddOrderNo: row.RCL || row.designAddOrderNo || "",

                fieldName: row.fieldName?.trim(),

                dataType,

                size:
                    row.size !== undefined &&
                        row.size !== null
                        ? row.size.toString().trim()
                        : "",

                constraints: constraintsArray.map(c => normalizeValue(c)),

                designSCSelect: row.designSCSelect
                    ? row.designSCSelect.toString().trim()
                    : "",

                designSCButtons: row.designSCButtons
                    ? row.designSCButtons.toString().trim()
                        .toLowerCase()
                        .replace(/\b\w/g, c => c.toUpperCase())
                    : "",

                designAddScreenSelect:
                    dataType === "BIT"
                        ? "TOGGLE"
                        : normalizeValue(row.designAddScreenSelect),

                designAddScreenButtons: row.designAddScreenButtons
                    ? row.designAddScreenButtons.toString().trim()
                        .toLowerCase()
                        .replace(/\b\w/g, c => c.toUpperCase())
                    : "",

                addScreenButtonPosition: normalizeValue(
                    row.addScreenButtonPosition || row.designAddScreenButtonPosition
                ),

                referenceTable: row.referenceTable?.trim(),
                referenceColumn: row.referenceColumn?.trim(),

                defaultValue: row.defaultValue?.trim(),
                checkCondition: row.checkCondition?.trim(),

                fileType: row.fileType || '',
            };
        });

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return;
        }

        setRowData(formattedData);
    };

    useEffect(() => {
        const existingLink = document.querySelector("link[href*='bootstrap-icons']");
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css';
            document.head.appendChild(link);
        }
    }, []);

    useEffect(() => {
        if (mainGridRef.current?.api) {
            updateColumnVisibility(mainGridRef.current.api);
        }
    }, [sqlPreview, rowData]);

    useEffect(() => {
        const savedScreens = localStorage.getItem(STORAGE_KEY);

        if (savedScreens) {
            const parsed = JSON.parse(savedScreens);
            setScreens(parsed);

            if (parsed.length > 0) {
                setActiveScreen(parsed[0].screenName);

                // load first screen data
                setRowData(parsed[0].rowData || []);
                setObjectRowData(parsed[0].objectRowData || []);
                setDetailsDataMap(
                    parsed[0].detailsDataMap || {}
                );

                const tabs = Object.keys(
                    parsed[0].detailsDataMap || {}
                );

                setDetailsTabs(tabs);

                if (tabs.length > 0) {
                    setActiveDetailTab(tabs[0]);
                }
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
    }, [screens]);

    useEffect(() => {

        if (mainGridRef.current?.api) {

            setTimeout(() => {
                updateColumnVisibility(mainGridRef.current.api);
            }, 0);
        }

    }, [rowData]);

    const handleSaveScreen = () => {

        const gridRows = [];

        // ✅ FIXED HERE
        if (mainGridRef.current && mainGridRef.current.api) {
            mainGridRef.current.api.forEachNode(node => {
                if (node?.data) {
                    gridRows.push(node.data);
                }
            });
        }

        const reactName =
            objectRowData.find(r => r.object === "React")?.name || "";

        if (!reactName) {
            alert("React Name is required");
            return;
        }

        const detailsTables = Object.entries(detailsDataMap || {}).map(
            ([gridName, rowData]) => ({
                gridName,
                rowData
            })
        );

        const screenData = {
            screenName: reactName,
            objectRowData,
            rowData: gridRows,

            detailsDataMap,
            detailsTables,

            screenType,
            enableAudit
        };

        // Existing saved screens
        const existing =
            JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        // Replace existing screen if same name
        const filtered =
            existing.filter(
                s => s.screenName !== reactName
            );

        filtered.push(screenData);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(filtered)
        );

        // ✅ UPDATE STATE IMMEDIATELY
        setScreens(filtered);

        // KEEP ONLY DB NAME
        // KEEP ONLY DB ROW
        const dbRow =
            objectRowData.find(r => r.object === "DB");

        setObjectRowData(
            dbRow?.name
                ? [{
                    object: "DB",
                    name: dbRow.name
                }]
                : []
        );

        // Clear grids
        setRowData([]);
        setDetailsDataMap({});
        setDetailsTabs([]);
        setActiveDetailTab("");

        alert("Screen Saved Successfully");
    };

    const handleClearScreens = () => {
        localStorage.removeItem(STORAGE_KEY);
        setScreens([]);
        setActiveScreen(null);
        setRowData([]);
        setObjectRowData([]);
        setDetailsRowData([]);
    };

    const handleTabClick = (screen) => {
        setActiveScreen(screen.screenName);
        setObjectRowData(screen.objectRowData || []);
        setRowData(screen.rowData || []);
        setDetailsDataMap(screen.detailsDataMap || {});
        setScreenType(screen.screenType || "combined");
        setEnableAudit(screen.enableAudit || false);
        const tabs = Object.keys(
            screen.detailsDataMap || {}
        );
        setDetailsTabs(tabs);

        if (tabs.length > 0) {
            setActiveDetailTab(tabs[0]);
        }
    };

    // const handleKeyDown = (e) => {
    //     if (e.key === "Enter") {
    //         const trimmedName = name.trim();

    //         if (!trimmedName) {
    //             alert("⚠️ Object name cannot be empty!");
    //             return;
    //         }

    //         const isDuplicate = objectRowData.some(
    //             (row) =>
    //                 row.object.toLowerCase() === objectType.toLowerCase() &&
    //                 row.name.toLowerCase() === trimmedName.toLowerCase()
    //         );

    //         if (isDuplicate) {
    //             alert(`⚠️ The ${objectType} already exists!`);
    //             return;
    //         }

    //         const newRow = { object: objectType.trim(), name: trimmedName };

    //         setObjectRowData((prev) => [...prev, newRow]);
    //     }
    // };

    const handleAddObject = () => {
        const trimmedName = name.trim();

        if (!objectType) {
            alert("⚠️ Please select an Object Type!");
            return;
        }

        if (!trimmedName) {
            alert("⚠️ Object name cannot be empty!");
            return;
        }

        const isDuplicate = objectRowData.some(
            (row) =>
                row.object.toLowerCase() === objectType.toLowerCase() &&
                row.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            alert(`⚠️ The ${objectType} already exists!`);
            return;
        }

        const newRow = { object: objectType.trim(), name: trimmedName };
        setObjectRowData((prev) => [...prev, newRow]);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleAddObject();
        }
    };

    const handleDelete = (index) => {
        setObjectRowData((prevData) => prevData.filter((_, i) => i !== index));
    };

    const objectClumnDefs = [
        { field: 'object', headerName: 'Object', editable: true },
        { field: 'name', headerName: 'Name', editable: true },
        {
            headerName: "Delete",
            field: "delete",
            cellRenderer: (params) => (
                <i
                    className="bi bi-trash-fill"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleDelete(params.node.rowIndex)} // FIXED HERE
                />
            ),
            maxWidth: 90,
            editable: false
        },
    ];

    const handleDeleteRow = (index) => {
        setRowData((prevData) => prevData.filter((_, i) => i !== index));
    };

    const handleAdd = (rowIndex) => {
        const newRow = {
            fieldName: '',
            dataType: 'VARCHAR',
            size: null,
            fileType: '',
            notNull: false,
            primaryKey: false,
            isForeignKey: false,
            referenceTable: '',
            referenceColumn: '',
            tableFieldSelect: false,
            nodeSelect: false,
            designSCSelect: '',
            designSCOrderNo: null,
            designSCButtons: '',
            designAddScreenSelect: '',
            designAddOrderNo: '',
            addScreenTooltip: '',
            designAddScreenButtons: '',
            addScreenButtonPosition: '',
            constraints: [],
            defaultValue: '',
            checkCondition: '',
        };

        const updatedRows = [...rowData];

        updatedRows.splice(rowIndex + 1, 0, newRow);

        setRowData(updatedRows);
    };

    const constraintOptions = [
        { value: "PK", label: "Primary Key" },
        { value: "NN", label: "Not Null" },
        { value: "UQ", label: "Unique" },
        { value: "FK", label: "Foreign Key" },
        { value: "DF", label: "Default" },
        { value: "CHK", label: "Check Constraint" },
        { value: "AI", label: "Auto Increment" } // Added
    ];

    const updateColumnVisibility = (api) => {

        if (!api) return;

        const allRows = [];

        api.forEachNode((node) => {
            if (node?.data) {
                allRows.push(node.data);
            }
        });

        // FK columns
        const showFK = allRows.some(row =>
            (row.constraints && row.constraints.includes("FK")) ||
            row.referenceTable ||
            row.referenceColumn
        );

        // DEFAULT column
        const showDF = allRows.some(row =>
            (row.constraints && row.constraints.includes("DF")) ||
            row.defaultValue
        );

        // CHECK column
        const showCHK = allRows.some(row =>
            (row.constraints && row.constraints.includes("CHK")) ||
            row.checkCondition
        );

        // FILE TYPE column
        const showFileType = allRows.some(row => {

            const dataType =
                row.dataType?.toUpperCase?.() || "";

            return (
                dataType === "VARBINARY" ||
                row.fileType
            );
        });

        // ONLY control conditional columns
        api.setColumnsVisible(
            ["referenceTable", "referenceColumn"],
            showFK
        );

        api.setColumnsVisible(
            ["defaultValue"],
            showDF
        );

        api.setColumnsVisible(
            ["checkCondition"],
            showCHK
        );

        // SHOW/HIDE FILE TYPE COLUMN
        const hasFileTypeColumn =
            api.getColumn("fileType");

        if (hasFileTypeColumn) {

            api.setColumnsVisible(
                ["fileType"],
                showFileType
            );
        }

    };

    const ConstraintRenderer = (props) => {
        const value = props.value || [];

        return (
            <Select
                options={constraintOptions}
                isMulti
                isClearable
                placeholder="Select Constraints"
                closeMenuOnSelect={false}
                blurInputOnSelect={false}
                hideSelectedOptions={false}
                value={constraintOptions.filter(opt => value.includes(opt.value))}

                onChange={(selected) => {
                    let values = selected ? selected.map(s => s.value) : [];

                    if (
                        values.includes("AI") &&
                        !["INT", "BIGINT"].includes(props.data.dataType?.toUpperCase())
                    ) {
                        alert("Auto Increment allowed only for INT or BIGINT");
                        values = values.filter(v => v !== "AI");
                    }

                    props.node.setDataValue("constraints", values);

                    if (!values.includes("FK")) {
                        props.node.setDataValue("referenceTable", "");
                        props.node.setDataValue("referenceColumn", "");
                    }

                    if (!values.includes("DF")) {
                        props.node.setDataValue("defaultValue", "");
                    }

                    if (!values.includes("CHK")) {
                        props.node.setDataValue("checkCondition", "");
                    }

                    setTimeout(() => updateColumnVisibility(props.api), 0);
                }}

                components={{
                    MultiValue: () => null, // hide individual chips

                    // Custom ValueContainer displaying count or placeholder
                    ValueContainer: ({ children, hasValue }) => {
                        const count = value.length;

                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: '6px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#333333', // Explicit dark text color
                                    flex: 1
                                }}
                            >
                                {count > 0 ? `${count} selected` : children}
                            </div>
                        );
                    }
                }}

                menuPortalTarget={document.body}

                styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    control: base => ({
                        ...base,
                        minHeight: "30px",
                        height: "30px",
                        backgroundColor: "#ffffff",
                        borderColor: "#ccc",
                        color: "#333333"
                    }),
                    valueContainer: base => ({
                        ...base,
                        height: "30px",
                        padding: "0 6px",
                        color: "#333333"
                    }),
                    placeholder: base => ({
                        ...base,
                        color: "#666666" // Dark gray placeholder text
                    }),
                    singleValue: base => ({
                        ...base,
                        color: "#333333"
                    }),
                    indicatorsContainer: base => ({ ...base, height: "30px" }),
                    option: (base, state) => ({
                        ...base,
                        color: state.isSelected ? "#ffffff" : "#333333", // Dark option text in dropdown
                        backgroundColor: state.isSelected
                            ? "#2684FF"
                            : state.isFocused
                                ? "#deebff"
                                : "#ffffff"
                    })
                }}
            />
        );
    };

    const columnDefs = [
        {
            field: 'Action',
            headerName: 'Action',
            cellRenderer: (params) => {
                return (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <i
                            className="bi bi-trash-fill text-danger"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleDeleteRow(params.node.rowIndex)}
                        />
                        <i
                            className="bi bi-plus-circle text-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleAdd(params.node.rowIndex)}
                        />
                    </div>
                );
            },
            maxWidth: 80,
            minWidth: 80,
            editable: false,
        },
        {
            field: 'fieldName',
            headerName: 'Field Name',
            editable: true,
            valueSetter: (params) => {
                const newValue = params.newValue?.toString().trim();
                if (newValue) {
                    params.data.fieldName = newValue;
                    return true;
                }
                return false;
            }
        },
        {
            field: 'dataType',
            headerName: 'Data Type',
            editable: true,
            cellEditor: ReactSelectCellEditor,
            cellEditorParams: {
                options: [
                    'INT',
                    'BIGINT',
                    'VARCHAR',
                    'TEXT',
                    'FLOAT',
                    'DATE',
                    'DATETIME',
                    'BIT',
                    'NVARCHAR',
                    'VARBINARY',
                    'DECIMAL',
                    'GRID'
                ]
            },
            cellEditorPopup: true,
            onCellValueChanged: (params) => {
                setTimeout(() => {
                    updateColumnVisibility(params.api);
                }, 0);
            },
            minWidth: 140,
        },
        {
            field: 'size',
            headerName: 'Size',
            editable: true,
            minWidth: 80,

            valueSetter: (params) => {

                params.data.size =
                    params.newValue !== undefined &&
                        params.newValue !== null
                        ? params.newValue.toString()
                        : "";

                return true;
            }
        },
        {
            headerName: "Existing UDD",
            field: "existingUDD",
            editable: true,
            width: 150,
        },
        {
            field: 'fileType',
            headerName: 'File Type',
            editable: true,
            hide: true,
            minWidth: 140,
            cellEditor: ReactSelectCellEditor,
            cellEditorParams: {
                options: [
                    'Image',
                    'File',
                    'Audio',
                    'Video'
                ]
            },
            cellEditorPopup: true,
        },
        {
            field: 'constraints',
            headerName: 'Constraints',
            cellRenderer: ConstraintRenderer,
            editable: false,
            minWidth: 220
        },
        {
            field: 'defaultValue',
            headerName: 'Default Value',
            editable: true,
            hide: true,
        },
        {
            field: 'checkCondition',
            headerName: 'Check Condition',
            editable: true,
            hide: true,
        },
        {
            field: 'referenceTable',
            headerName: 'Ref Table',
            editable: true,
            hide: true,
        },
        {
            field: 'referenceColumn',
            headerName: 'Ref Column',
            editable: true,
            hide: true,
        },
        {
            field: 'designSCSelect',
            headerName: 'Design SC Select',
            editable: true,
            sortable: false,
            filter: false,
            cellEditor: ReactSelectCellEditor,
            cellEditorParams: {
                options: [
                    'Text',
                    'Dropdown',
                    'Date',
                    'Toggle',
                    'Number'
                ]
            },
            cellEditorPopup: true,
            minWidth: 180,
        },
        {
            field: 'designSCOrderNo',
            headerName: 'Design SC order No',
            editable: true,
            minWidth: 160,
        },
        {
            field: 'designSCButtons',
            headerName: 'Design SC Buttons',
            editable: true,
            cellEditor: ReactSelectCellEditor,
            cellEditorParams: {
                options: [
                    'Search',
                    'Refresh',
                    'Add',
                    'Delete',
                    'Update',
                    'Print',
                    'Excel'
                ]
            },
            cellEditorPopup: true,
            minWidth: 180,
        },
        {
            field: 'designAddScreenSelect',
            headerName: 'Design Add Screen Select',
            editable: true,
            cellEditor: ReactSelectCellEditor,
            cellEditorParams: {
                options: [
                    'Text',
                    'Dropdown',
                    'Date',
                    'File',
                    'Number',
                    'Text Area',
                    'Grid',
                    'Toggle'
                ]
            },
            cellEditorPopup: true,
            minWidth: 200,
        },
        {
            field: 'designAddOrderNo',
            headerName: 'RCL',
            headerTooltip: 'Row No, Column No, Length No',
            editable: true,
            minWidth: 100,
            valueSetter: (params) => {
                const newValue = params.newValue?.toString().trim();
                const regex = /^\d+,\d+(?:,\d+)?$/;
                if (!regex.test(newValue)) {
                    alert(`Invalid format in "${params.colDef.headerName}". Please use: row,column OR row,column,length (example: 1,1 or 1,1,6)`);
                    return false;
                }
                const parts = newValue.split(",").map(v => parseInt(v.trim()));
                if (parts.length === 3 && parts[2] > 12) {
                    alert(`In "${params.colDef.headerName}", the 3rd value (length) cannot be more than 12`);
                    return false;
                }
                params.data.designAddOrderNo = newValue;
                return true;
            }
        },
        {
            field: 'addScreenTooltip',
            headerName: 'Add Screen Tooltip',
            editable: true,
            minWidth: 200,
        },
        {
            field: 'designAddScreenButtons',
            headerName: 'Design Add Screen Buttons',
            editable: true,
            cellEditor: ReactSelectCellEditor,
            cellEditorParams: {
                options: [
                    'Save',
                    'Update',
                    'Print',
                    'Excel',
                    'Refresh',
                    'Close'
                ]
            },
            cellEditorPopup: true,
            minWidth: 220,
        },
        {
            field: 'addScreenButtonPosition',
            headerName: 'Add Screen Button Position',
            editable: true,
            cellEditor: ReactSelectCellEditor,
            cellEditorParams: {
                options: [
                    'Top',
                    'Bottom'
                ]
            },
            cellEditorPopup: true,
            minWidth: 220,
        },
    ];

    const defaultColDef = {
        editable: true,
    };

    const handleAddRow = () => {
        setRowData(prev => [
            ...prev,
            {
                fieldName: '',
                dataType: 'VARCHAR',
                size: null,
                fileType: '',
                notNull: false,
                primaryKey: false,
                isForeignKey: false,
                referenceTable: '',
                referenceColumn: '',
                tableFieldSelect: false,
                nodeSelect: false,
                designSCSelect: '',
                designSCOrderNo: null,
                designAddScreenSelect: '',
                designAddOrderNo: '',
                constraints: [],
                defaultValue: '',
                checkCondition: '',
            },
        ]);
    };

    const handleDetailsAddRow = () => {

        if (!activeDetailTab) return;

        const newRow = {
            fieldName: '',
            dataType: 'VARCHAR',
            size: '',
            existingUDD: '',
            fileType: '',
            constraints: [],
            referenceTable: '',
            referenceColumn: '',
            defaultValue: '',
            checkCondition: '',
            gridOrderNo: '',
            gridTooltip: ''
        };

        setDetailsDataMap(prev => ({
            ...prev,
            [activeDetailTab]: [
                ...(prev[activeDetailTab] || []),
                newRow
            ]
        }));
    };

    const handleRemoveRow = () => {
        setRowData(prev => {
            if (prev.length === 0) return prev;
            return prev.slice(0, prev.length - 1); // remove last row
        });
    };

    const handleDetailsRemoveRow = () => {

        if (!activeDetailTab) return;

        setDetailsDataMap(prev => ({
            ...prev,
            [activeDetailTab]:
                (prev[activeDetailTab] || []).slice(0, -1)
        }));
    };

    const previewTableSQL = () => {

        // =========================
        // MULTI SCREEN MODE
        // =========================
        if (screens.length > 0) {
            const script = getPreviewTableSQL(enableAudit);
            setSqlPreview(script);
            return;
        }

        // =========================
        // SINGLE SCREEN MODE
        // =========================

        // 1. Generate UDD first
        const uddScript = getOnlyUDDSQL(
            rowData,
            detailsDataMap,
            enableAudit
        );

        // 2. Generate table WITH detailsTableTypes mapping
        const tableScript = getTableSQL(
            rowData,
            objectRowData,
            detailsDataMap,
            detailsDefs,
            enableAudit,
            detailsTableTypes // 🔹 Pass the state dictionary containing separate/main table flags
        );

        // 3. Combine both
        const hasUDD = uddScript && uddScript.trim() !== '';

        const script = hasUDD
            ? `-- =============================================
            -- UDD
            -- =============================================

            ${uddScript.trim()}

            -- =============================================
            -- TABLE
            -- =============================================

            ${tableScript.trim()}
            `
            : `-- =============================================
            -- TABLE
            -- =============================================

            ${tableScript.trim()}
            `;

        setSqlPreview(script);
    };

    const previewSPCode = () => {

        // =========================
        // MULTI SCREEN MODE
        // =========================
        if (screens.length > 0) {
            const spScript = getAllStoredProcSQL(enableAudit);
            if (spScript) {
                setSqlPreview(spScript);
            }
            return;
        }

        // =========================
        // SINGLE SCREEN MODE
        // =========================
        const spScript = getStoredProcSQL(
            rowData,
            objectRowData,
            detailsDataMap,
            detailsDefs,
            enableAudit,
            detailsTableTypes
        );

        if (spScript) {
            setSqlPreview(spScript);
        }
    };

    const previewNodeSingle = () => {

        // =========================
        // MULTI SCREEN MODE
        // =========================
        if (screens.length > 0) {
            const singleNodeScript = getAllNodeSingleCrudScripts();
            if (singleNodeScript) {
                setSqlPreview(singleNodeScript);
            }
            return;
        }

        // =========================
        // SINGLE SCREEN MODE
        // =========================
        const detailsTables = Object.entries(detailsDataMap || {}).map(
            ([gridName, rowData]) => ({
                gridName,
                rowData
            })
        );

        const singleNodeScript =
            getNodeSingleCrudScript(
                rowData,
                objectRowData,
                detailsTables,
                enableAudit,
                detailsTableTypes
            );

        if (singleNodeScript) {
            setSqlPreview(singleNodeScript);
        }
    };

    const previewNodeLoop = () => {

        // =========================
        // MULTI SCREEN MODE
        // =========================
        if (screens.length > 0) {
            const loopNodeScript = getAllNodeLoopCrudScripts();
            if (loopNodeScript) {
                setSqlPreview(loopNodeScript);
            }
            return;
        }

        // =========================
        // SINGLE SCREEN MODE
        // =========================
        const detailsTables = Object.entries(detailsDataMap || {}).map(
            ([gridName, rowData]) => ({
                gridName,
                rowData
            })
        );

        const loopNodeScript =
            getNodeLoopCrudScripts(
                rowData,
                objectRowData,
                detailsTables,
                enableAudit,
                detailsTableTypes
            );

        if (loopNodeScript) {
            setSqlPreview(loopNodeScript);
        }
    };

    const generateFiles = () => {
        const zip = new JSZip();
        let hasFiles = false;

        // Helper to extract object name
        const getName = (type) => objectRowData.find(row => row.object === type)?.name || "Default";
        const reactName = getName("React");

        // =============================================
        // 1. SQL GENERATION (Table & SP)
        // =============================================
        if (screens.length > 0) {
            screens.forEach((screen) => {
                const screenReactName = screen.objectRowData?.find(r => r.object === "React")?.name || screen.screenName;
                const screenTableName = screen.objectRowData?.find(r => r.object === "Table")?.name || screenReactName;
                const screenSpName = screen.objectRowData?.find(r => r.object === "StoredProcedure")?.name || screenReactName;

                // Generate Table SQL
                const tableSQL = getTableSQL(screen.rowData, screen.objectRowData, screen.detailsDataMap, detailsDefs, screen.enableAudit);
                const uddSQL = getOnlyUDDSQL(screen.rowData, screen.detailsDataMap, screen.enableAudit);
                const fullTableSQL = uddSQL ? `-- UDD STATEMENTS\n${uddSQL.trim()}\n\n${tableSQL.trim()}` : tableSQL.trim();

                if (fullTableSQL) {
                    // Split Main Table and Detail Tables properly
                    const tableBlocks = fullTableSQL.split(/(?=-- =============================================\n-- DETAILS TABLE :|-- Create Details Table)/i);

                    tableBlocks.forEach((block, idx) => {
                        const cleanBlock = block.trim();
                        if (!cleanBlock) return;

                        let fileName = `tbl_${screenTableName}.sql`;
                        if (idx > 0) {
                            const match = cleanBlock.match(/CREATE TABLE\s+\[?(\w+)\]?/i);
                            fileName = match ? `${match[1]}.sql` : `tbl_${screenTableName}_Detail_${idx}.sql`;
                        }

                        zip.file(`sql/Table/${fileName}`, cleanBlock);
                        hasFiles = true;
                    });
                }

                // Generate SP SQL
                const spResult = getStoredProcSQL(screen.rowData, screen.objectRowData, screen.detailsDataMap, detailsDefs, screen.enableAudit);
                if (typeof spResult === "object" && spResult !== null) {
                    Object.entries(spResult).forEach(([spKey, content]) => {
                        if (content && content.trim()) {
                            zip.file(`sql/SP/${spKey}.sql`, content.trim());
                            hasFiles = true;
                        }
                    });
                } else if (typeof spResult === "string" && spResult.trim()) {
                    zip.file(`sql/SP/sp_${screenSpName}.sql`, spResult.trim());
                    hasFiles = true;
                }
            });
        } else {
            // SINGLE SCREEN MODE
            const mainTableName = getName("Table");
            const mainSpName = getName("StoredProcedure");

            const tableSQL = getTableSQL(rowData, objectRowData, detailsDataMap, detailsDefs, enableAudit);
            const uddSQL = getOnlyUDDSQL(rowData, detailsDataMap, enableAudit);
            const fullTableSQL = uddSQL ? `-- UDD STATEMENTS\n${uddSQL.trim()}\n\n${tableSQL.trim()}` : tableSQL.trim();

            if (fullTableSQL) {
                const tableBlocks = fullTableSQL.split(/(?=-- =============================================\n-- DETAILS TABLE :|-- Create Details Table)/i);

                tableBlocks.forEach((block, idx) => {
                    const cleanBlock = block.trim();
                    if (!cleanBlock) return;

                    let fileName = `tbl_${mainTableName}.sql`;
                    if (idx > 0) {
                        const match = cleanBlock.match(/CREATE TABLE\s+\[?(\w+)\]?/i);
                        fileName = match ? `${match[1]}.sql` : `tbl_${mainTableName}_Detail_${idx}.sql`;
                    }

                    zip.file(`sql/Table/${fileName}`, cleanBlock);
                    hasFiles = true;
                });
            }

            // Stored Procedures
            const spResult = getStoredProcSQL(rowData, objectRowData, detailsDataMap, detailsDefs, enableAudit);
            if (typeof spResult === "object" && spResult !== null) {
                Object.entries(spResult).forEach(([spKey, content]) => {
                    if (content && content.trim()) {
                        zip.file(`sql/SP/${spKey}.sql`, content.trim());
                        hasFiles = true;
                    }
                });
            } else if (typeof spResult === "string" && spResult.trim()) {
                zip.file(`sql/SP/sp_${mainSpName}.sql`, spResult.trim());
                hasFiles = true;
            }
        }

        // =============================================
        // 2. NODE GENERATION (Single & Loop)
        // =============================================
        if (screens.length > 0) {
            screens.forEach((screen) => {
                const screenReactName = screen.objectRowData?.find(r => r.object === "React")?.name || screen.screenName;
                const detailsList = Object.entries(screen.detailsDataMap || {}).map(([gridName, rows]) => ({ gridName, rowData: rows }));

                const singleScript = getNodeSingleCrudScript(screen.rowData, screen.objectRowData, detailsList, screen.enableAudit);
                const loopScript = getNodeLoopCrudScripts(screen.rowData, screen.objectRowData, detailsList, screen.enableAudit);

                if (singleScript && singleScript.trim()) {
                    zip.file(`node/Single/${screenReactName}.js`, singleScript.trim());
                    hasFiles = true;
                }
                if (loopScript && loopScript.trim()) {
                    zip.file(`node/Loop/${screenReactName}.js`, loopScript.trim());
                    hasFiles = true;
                }
            });
        } else {
            const detailsList = Object.entries(detailsDataMap || {}).map(([gridName, rows]) => ({ gridName, rowData: rows }));

            const singleScript = getNodeSingleCrudScript(rowData, objectRowData, detailsList, enableAudit);
            const loopScript = getNodeLoopCrudScripts(rowData, objectRowData, detailsList, enableAudit);

            if (singleScript && singleScript.trim()) {
                zip.file(`node/Single/${reactName}.js`, singleScript.trim());
                hasFiles = true;
            }
            if (loopScript && loopScript.trim()) {
                zip.file(`node/Loop/${reactName}.js`, loopScript.trim());
                hasFiles = true;
            }
        }

        // =============================================
        // 3. REACT GENERATION
        // =============================================
        if (screens.length > 0) {
            screens.forEach((screen) => {
                const screenReactName = screen.objectRowData?.find(r => r.object === "React")?.name || screen.screenName;
                const detailsList = Object.entries(screen.detailsDataMap || {}).map(([gridName, rows]) => ({ gridName, rowData: rows }));

                let reactCode = "";
                let suffix = "Combined";

                if (screen.screenType === "search") {
                    reactCode = getFrontendSearchDesignCode(screen.rowData, screen.objectRowData);
                    suffix = "Search";
                } else if (screen.screenType === "add" || screen.screenType === "add-grid") {
                    reactCode = getFrontendAddDesignCode(screen.rowData, screen.objectRowData, detailsList);
                    suffix = "Add";
                } else {
                    reactCode = getFrontendCombinedDesignCode(screen.rowData, screen.objectRowData, detailsList, screens);
                    suffix = "Combined";
                }

                if (reactCode && reactCode.trim()) {
                    zip.file(`react/${screenReactName}_${suffix}.jsx`, reactCode.trim());
                    hasFiles = true;
                }
            });
        } else {
            const detailsList = Object.entries(detailsDataMap || {}).map(([gridName, rows]) => ({ gridName, rowData: rows }));

            let reactCode = "";
            let suffix = "Combined";

            if (screenType === "search") {
                reactCode = getFrontendSearchDesignCode(rowData, objectRowData);
                suffix = "Search";
            } else if (screenType === "add" || screenType === "add-grid") {
                reactCode = getFrontendAddDesignCode(rowData, objectRowData, detailsList);
                suffix = "Add";
            } else {
                reactCode = getFrontendCombinedDesignCode(rowData, objectRowData, detailsList, screens);
                suffix = "Combined";
            }

            if (reactCode && reactCode.trim()) {
                zip.file(`react/${reactName}_${suffix}.jsx`, reactCode.trim());
                hasFiles = true;
            }
        }

        // =============================================
        // 4. DOWNLOAD ZIP
        // =============================================
        if (hasFiles) {
            zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, "Generated_Code_Export.zip");
            });
        } else {
            alert("No files generated. Please check your inputs.");
        }
    };

    const renderReactCodeFromString = (codeString) => {

        try {

            // Remove imports + exports only
            let cleanedCode = codeString
                .replace(/^import .*;$/gm, '')
                .replace(/^export default .*;$/gm, '')
                .trim();

            // Find component name safely
            const componentMatch =
                cleanedCode.match(/const\s+(\w+Screen)\s*=\s*\(\)\s*=>/);

            if (!componentMatch) {

                return (
                    <div className="text-danger">
                        ❌ Component function not found
                    </div>
                );
            }

            const componentName = componentMatch[1];

            // Compile JSX
            const compiledCode = Babel.transform(cleanedCode, {
                presets: ['react']
            }).code;

            // Create executable component
            const Component = new Function(
                'React',
                'Select',
                'AgGridReact',
                `
            ${compiledCode}
            return ${componentName};
            `
            )(
                React,
                Select,
                AgGridReact
            );

            return <Component />;

        } catch (err) {

            return (
                <div className="text-danger">
                    ❌ Error in preview: {err.message}
                </div>
            );
        }
    };

    const handleGenerateBothDesigns = () => {
        let searchCode = "";
        let addCode = "";

        // Check if search design fields have values safely
        const hasSearchData = rowData.some(row =>
            (row.designSCSelect && row.designSCSelect.length > 0) ||
            (row.designSCButtons && row.designSCButtons.length > 0)
        );

        if (hasSearchData) {
            searchCode = getFrontendSearchDesignCode(rowData, objectRowData);
        }

        // Check if add form design fields have values safely
        const hasAddData = rowData.some(row =>
            (row.designAddScreenSelect && row.designAddScreenSelect.length > 0) ||
            (row.designAddScreenButtons && row.designAddScreenButtons.length > 0)
        );

        if (hasAddData) {
            const detailsTables = Object.entries(detailsDataMap || {}).map(
                ([gridName, rowData]) => ({
                    gridName,
                    rowData
                })
            );

            addCode = getFrontendAddDesignCode(
                rowData,
                objectRowData,
                detailsTables
            );
        }

        const hasSearchDesign = !!searchCode.trim();
        const hasAddDesign = !!addCode.trim();

        if (!hasSearchDesign && !hasAddDesign) {
            alert("❌ No valid Search or Add screen data found in AG Grid.");
            return;
        }


        // Combine code
        const combinedCode = [
            hasSearchDesign ? searchCode : '',
            hasAddDesign ? `/* ================= Add Form ================= */\n\n${addCode}` : ''
        ].filter(Boolean).join('\n\n');

        setSqlPreview(combinedCode);

        // Set UI preview
        const uiElements = [];

        if (hasSearchDesign) {
            uiElements.push(
                <div key="search">
                    <h5 className="text-primary">🔎 Search Design Preview</h5>
                    {renderReactCodeFromString(searchCode)}
                </div>
            );
        }

        if (hasAddDesign) {
            uiElements.push(
                <div key="add">
                    <h5 className="text-success">➕ Add Form Preview</h5>
                    {renderReactCodeFromString(addCode)}
                </div>
            );
        }

        setUiPreview(<div className="d-flex flex-column gap-4">{uiElements}</div>);
        setUiPreviewEnabled(true);
    };

    const handleCopy = () => {
        if (previewRef.current) {
            navigator.clipboard.writeText(previewRef.current.value).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const handleDetailDeleteRow = (index) => {

        if (!activeDetailTab) return;

        setDetailsDataMap(prev => ({

            ...prev,

            [activeDetailTab]:
                prev[activeDetailTab].filter(
                    (_, i) => i !== index
                )

        }));
    };

    const handleDetailsAdd = (rowIndex) => {

        if (!activeDetailTab) return;

        const newRow = {
            fieldName: '',
            dataType: 'VARCHAR',
            size: '',
            existingUDD: '',
            fileType: '',
            constraints: [],
            referenceTable: '',
            referenceColumn: '',
            defaultValue: '',
            checkCondition: '',
            gridOrderNo: '',
            gridTooltip: ''
        };

        setDetailsDataMap(prev => {

            const updatedRows = [
                ...(prev[activeDetailTab] || [])
            ];

            updatedRows.splice(
                rowIndex + 1,
                0,
                newRow
            );

            return {
                ...prev,
                [activeDetailTab]: updatedRows
            };
        });
    };

    const handleDetailsClick = () => {

        // GET ALL GRID ROWS
        const gridFields = rowData.filter(
            (row) => row.dataType?.toUpperCase() === "GRID"
        );

        if (gridFields.length === 0) {
            alert("No GRID fields found");
            return;
        }

        // TAB NAMES = FIELD NAMES
        const tabNames = gridFields.map(row => row.fieldName);

        setDetailsTabs(tabNames);

        // DEFAULT ACTIVE TAB
        const currentActiveTab = activeDetailTab || tabNames[0];
        if (!activeDetailTab) {
            setActiveDetailTab(tabNames[0]);
        }

        // INITIALIZE DATA MAP
        setDetailsDataMap(prev => {
            const updated = { ...prev };
            tabNames.forEach(tab => {
                if (!updated[tab]) {
                    updated[tab] = [];
                }
            });
            return updated;
        });

        // DETAILS GRID COLUMN DEFS
        const newDetailsDefs = [
            {
                field: 'Action',
                headerName: 'Action',
                cellRenderer: (params) => {
                    // Retrieve current tab from grid context or fallback state
                    const currentTab = params.context?.activeDetailTab || activeDetailTab;

                    return (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center'
                        }}>
                            <i
                                className="bi bi-trash-fill text-danger"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    const targetTab = params.context?.activeDetailTab || activeDetailTab;
                                    if (!targetTab) return;

                                    setDetailsDataMap(prev => ({
                                        ...prev,
                                        [targetTab]: (prev[targetTab] || []).filter(
                                            (_, i) => i !== params.node.rowIndex
                                        )
                                    }));
                                }}
                            />

                            <i
                                className="bi bi-plus-circle text-primary"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    const targetTab = params.context?.activeDetailTab || activeDetailTab;
                                    if (!targetTab) return;

                                    const newRow = {
                                        fieldName: '',
                                        dataType: 'VARCHAR',
                                        size: '',
                                        existingUDD: '',
                                        fileType: '',
                                        constraints: [],
                                        referenceTable: '',
                                        referenceColumn: '',
                                        defaultValue: '',
                                        checkCondition: '',
                                        gridOrderNo: '',
                                        gridTooltip: ''
                                    };

                                    setDetailsDataMap(prev => {
                                        const updatedRows = [...(prev[targetTab] || [])];
                                        updatedRows.splice(params.node.rowIndex + 1, 0, newRow);
                                        return {
                                            ...prev,
                                            [targetTab]: updatedRows
                                        };
                                    });
                                }}
                            />
                        </div>
                    );
                },
                maxWidth: 120,
                editable: false,
            },
            {
                field: 'fieldName',
                headerName: 'Field Name',
                editable: true
            },
            {
                field: 'dataType',
                headerName: 'Data Type',
                editable: true,
                cellEditor: ReactSelectCellEditor,
                cellEditorParams: {
                    options: [
                        'INT',
                        'VARCHAR',
                        'TEXT',
                        'FLOAT',
                        'DATE',
                        'DATETIME',
                        'BIT',
                        'NVARCHAR',
                        'VARBINARY',
                        'DECIMAL'
                    ]
                },
                cellEditorPopup: true,
                onCellValueChanged: (params) => {
                    const currentTab = params.context?.activeDetailTab || activeDetailTab;
                    const allRows = detailsDataMap?.[currentTab] || [];

                    const showFileType = allRows.some(row =>
                        row.dataType?.toUpperCase() === "VARBINARY"
                    );

                    params.api.setColumnsVisible(
                        ["fileType"],
                        showFileType
                    );
                },
            },
            {
                field: 'size',
                headerName: 'Size',
                editable: true
            },
            {
                headerName: "Existing UDD",
                field: "existingUDD",
                editable: true,
                width: 150,
            },
            {
                field: 'fileType',
                headerName: 'File Type',
                editable: true,
                hide: true,
                minWidth: 160,
                cellEditor: ReactSelectCellEditor,
                cellEditorParams: {
                    options: [
                        'Image',
                        'File',
                        'Audio',
                        'Video'
                    ]
                },
                cellEditorPopup: true,
            },
            {
                field: 'constraints',
                headerName: 'Constraints',
                cellRenderer: ConstraintRenderer,
                editable: false,
                minWidth: 220
            },
            {
                field: 'defaultValue',
                headerName: 'Default Value',
                editable: true,
                hide: true,
            },
            {
                field: 'checkCondition',
                headerName: 'Check Condition',
                editable: true,
                hide: true,
            },
            {
                field: 'referenceTable',
                headerName: 'Ref Table',
                editable: true,
                hide: true,
            },
            {
                field: 'referenceColumn',
                headerName: 'Ref Column',
                editable: true,
                hide: true,
            },
            {
                field: 'gridOrderNo',
                headerName: 'Grid Order No',
                editable: true
            },
            {
                field: 'gridTooltip',
                headerName: 'Grid Tooltip',
                editable: true
            }
        ];

        setTimeout(() => {
            const currentRows = detailsDataMap?.[currentActiveTab] || [];
            const showFileType = currentRows.some(
                row => row.dataType?.toUpperCase() === "VARBINARY"
            );

            if (window.detailsGridApi) {
                window.detailsGridApi.setColumnsVisible(
                    ["fileType"],
                    showFileType
                );
            }
        }, 0);

        setDetailsDefs(newDetailsDefs);
    };

    return {
        // simple fields
        name, setName,
        objectType, setObjectType,
        sqlPreview, setSqlPreview,
        rowData, setRowData,
        detailsRowData, setDetailsRowData,
        detailsTabs, setDetailsTabs,
        activeDetailTab, setActiveDetailTab,
        detailsDataMap, setDetailsDataMap,
        objectGridRef, mainGridRef, previewRef,
        uiPreview, setUiPreview,
        uiPreviewEnabled, setUiPreviewEnabled,
        copied, setCopied,
        objectRowData, setObjectRowData,
        detailsDefs, setDetailsDefs,
        enableAudit, setEnableAudit,
        fileInputRef,
        screenType, setScreenType,
        STORAGE_KEY,
        screens, setScreens,
        activeScreen, setActiveScreen,

        // constants
        validDataTypes, constraintMap, validConstraints,
        constraintOptions, objectClumnDefs, columnDefs, defaultColDef,

        // handlers (all logic unchanged, exposed as-is)
        downloadExcelTemplate,
        handleGenerateScreen,
        handleExcelUpload,
        normalizeValue,
        validateAndLoadData,
        handleSaveScreen,
        handleClearScreens,
        handleTabClick,
        handleKeyDown,
        handleAddObject,
        handleDelete,
        handleDeleteRow,
        handleAdd,
        updateColumnVisibility,
        ConstraintRenderer,
        handleAddRow,
        handleDetailsAddRow,
        handleRemoveRow,
        handleDetailsRemoveRow,
        previewTableSQL,
        previewSPCode,
        previewNodeSingle,
        previewNodeLoop,
        generateFiles,
        renderReactCodeFromString,
        handleGenerateBothDesigns,
        handleCopy,
        handleDetailDeleteRow,
        handleDetailsAdd,
        handleDetailsClick,
        detailsTableTypes,
        toggleDetailTableType
    };
};

export const AutomationProvider = ({ children }) => {
    const engine = useAutomationEngine();
    return (
        <AutomationContext.Provider value={engine}>
            {children}
        </AutomationContext.Provider>
    );
};

export const useAutomation = () => {
    const ctx = useContext(AutomationContext);
    if (!ctx) {
        throw new Error('useAutomation must be used within an AutomationProvider');
    }
    return ctx;
};

export default AutomationContext;
