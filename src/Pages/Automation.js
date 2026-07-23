import React, { useState, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Select from 'react-select';
import * as Babel from '@babel/standalone';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button, Form, Row, Col } from 'react-bootstrap';
import { FaPlus, FaMinus, FaCopy, FaCheckCircle } from 'react-icons/fa';
import { provideGlobalGridOptions } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { getNodeSingleCrudScript, getNodeLoopCrudScripts, getAllNodeSingleCrudScripts, getAllNodeLoopCrudScripts, getAllNodeCrudScripts } from './nodeGenerator';
import {
    getFrontendSearchDesignCode,
    getFrontendAddDesignCode,
    getFrontendCombinedDesignCode,
    getAllFrontendCode,
    getAllFrontendScreens
} from './frontGenerator';
import * as XLSX from "xlsx";
import {
    getTableSQL,
    getStoredProcSQL,
    getAllStoredProcSQL,
    getAllSQLScripts,
    getPreviewTableSQL,
    getOnlyUDDSQL
} from './sqlGenerator';

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const Automation = () => {
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

    const handleGenerateScreen = () => {

        let code = "";

        if (screenType === "search") {
            code = getFrontendSearchDesignCode(mainGridRef, objectRowData);
        }

        else if (screenType === "add") {
            const detailsTables = Object.entries(detailsDataMap || {}).map(
                ([gridName, rowData]) => ({
                    gridName,
                    rowData
                })
            );

            code = getFrontendAddDesignCode(
                mainGridRef,
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
                mainGridRef,
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
                    mainGridRef,
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



    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            const trimmedName = name.trim();

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

        // DO NOT touch other columns
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

                hideSelectedOptions={false}   // ✅ FIX: keep selected items visible

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
                    setTimeout(() => {
                        updateColumnVisibility(props.api);
                    }, 0);

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
                    MultiValue: () => null, // hide chips

                    ValueContainer: ({ children }) => {
                        const count = value.length;

                        return (
                            <div style={{ paddingLeft: "6px", fontSize: "12px" }}>
                                {count > 0 ? `${count} selected` : children}
                            </div>
                        );
                    }
                }}

                menuPortalTarget={document.body}

                styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    control: base => ({ ...base, minHeight: "30px", height: "30px" }),
                    valueContainer: base => ({ ...base, height: "30px", padding: "0 6px" }),
                    indicatorsContainer: base => ({ ...base, height: "30px" })
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
                            className="bi bi-trash-fill"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleDeleteRow(params.node.rowIndex)}
                        />
                        <i
                            className="bi bi-plus-circle"
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
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: [
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
                ],
            },

            onCellValueChanged: (params) => {

                setTimeout(() => {
                    updateColumnVisibility(params.api);
                }, 0);
            },

            minWidth: 100,
        },
        {
            field: 'size',
            headerName: 'Size',
            editable: true,
            minWidth: 80,

            valueSetter: (params) => {

                // Allow both numbers and text
                params.data.size =
                    params.newValue !== undefined &&
                        params.newValue !== null
                        ? params.newValue.toString()
                        : "";

                return true;
            }
        },
        {
            field: 'fileType',
            headerName: 'File Type',
            editable: true,
            hide: true,
            minWidth: 140,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Image', 'File', 'Audio', 'Video']
            }
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
            sortable: false,
            filter: false,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ["Text", "Dropdown", "Date", "Toggle", "Number"]
            },
            // maxWidth: 150,
            minWidth: 150,
        },
        {
            field: 'designSCOrderNo',
            headerName: 'Design SC order No',
            editable: true,
            // maxWidth: 160,
            minWidth: 160,
        },
        {
            field: 'designSCButtons',
            headerName: 'Design SC Buttons',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Search', 'Refresh', 'Add', 'Delete', 'Update', 'Print', 'Excel'],
            },
            // maxWidth: 150,
            minWidth: 150,
        },
        {
            field: 'designAddScreenSelect',
            headerName: 'Design Add Screen Select',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ["Text", "Dropdown", "Date", "File", "Number", "Text Area", "Grid", "Toggle"]
            },
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
            minWidth: 200,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Save', 'Update', 'Print', 'Excel', 'Refresh', 'Close'],
            },
        },
        {
            field: 'addScreenButtonPosition',
            headerName: 'Add Screen Button Position',
            editable: true,
            minWidth: 200,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Top', 'Bottom'],
            },
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

            const script =
                getPreviewTableSQL(enableAudit);

            setSqlPreview(script);

            return;
        }

        // =========================
        // SINGLE SCREEN MODE
        // =========================

        // SINGLE SCREEN MODE

        const rows = [];

        if (mainGridRef.current?.api) {
            mainGridRef.current.api.forEachNode(node => {
                if (node?.data) {
                    rows.push(node.data);
                }
            });
        }

        // ✅ Generate UDD first
        const uddScript = getOnlyUDDSQL(
            rows,
            detailsDataMap,
            enableAudit
        );

        // ✅ Generate table
        const tableScript = getTableSQL(
            mainGridRef,
            objectRowData,
            detailsDataMap,
            detailsDefs,
            enableAudit
        );

        // ✅ Combine both
        const script = `

-- =============================================
-- UDD
-- =============================================

${uddScript}

-- =============================================
-- TABLE
-- =============================================

${tableScript}
`;

        setSqlPreview(script);
    };

    const previewSPCode = () => {

        // =========================
        // MULTI SCREEN MODE
        // =========================

        if (screens.length > 0) {

            const spScript =
                getAllStoredProcSQL(enableAudit);

            if (spScript) {
                setSqlPreview(spScript);
            }

            return;
        }

        // =========================
        // SINGLE SCREEN MODE
        // =========================

        const spScript = getStoredProcSQL(
            mainGridRef,
            objectRowData,
            detailsDataMap,
            detailsDefs,
            enableAudit
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

            const singleNodeScript =
                getAllNodeSingleCrudScripts();

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
                mainGridRef,
                objectRowData,
                detailsTables,
                enableAudit
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

            const loopNodeScript =
                getAllNodeLoopCrudScripts();

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
                mainGridRef,
                objectRowData,
                detailsTables,
                enableAudit
            );

        if (loopNodeScript) {
            setSqlPreview(loopNodeScript);
        }
    };

    const generateFiles = () => {
        const zip = new JSZip();

        // Get Names
        const getName = (type) => objectRowData.find(row => row.object === type)?.name || "unknown";
        const tableName = getName("Table");
        const spName = getName("StoredProcedure");
        const reactName = getName("React");

        let hasFiles = false;

        //SQL Folder
        const sqlFolder = zip.folder("sql");

        let finalTableSQL = "";

        // =============================================
        // MULTI SCREEN MODE
        // =============================================

        if (screens.length > 0) {

            finalTableSQL = getPreviewTableSQL(enableAudit);

        } else {

            // =============================================
            // SINGLE SCREEN MODE
            // =============================================

            const uddSQL = getOnlyUDDSQL(
                rowData,
                detailsDataMap,
                enableAudit
            );

            const tableSQL = getTableSQL(
                mainGridRef,
                objectRowData,
                detailsDataMap,
                detailsDefs,
                enableAudit
            );

            finalTableSQL = `

-- =============================================
-- UDD
-- =============================================

${uddSQL}

-- =============================================
-- TABLE
-- =============================================

${tableSQL}
`;
        }
        if (finalTableSQL) {
            // Extract DB name from USE statement
            const dbMatch = finalTableSQL.match(/USE\s+\[(.*?)\];/i);
            const dbName = dbMatch ? dbMatch[1] : "unknownDB";

            // Split by Details marker
            const [headerPart, ...detailsParts] =
                finalTableSQL.split(/-- Create Details Table/i);

            //Save Header table SQL (no duplicate USE)
            if (headerPart.trim()) {
                const headerScript = headerPart.trim();  // already has USE
                sqlFolder.file(`tbl_${tableName}.sql`, headerScript);
                hasFiles = true;
            }

            //Save each Details table SQL separately (add USE explicitly here)
            detailsParts.forEach((detailPart, idx) => {
                const detailScript = `USE [${dbName}];\nGO\n\n-- Create Details Table${detailPart.trim()}`;
                // Try to extract real detail table name
                const match = detailScript.match(/CREATE TABLE\s+\[([^\]]+)\]/i);
                const detailFileName = match ? match[1] : `${tableName}_details_${idx + 1}`;
                sqlFolder.file(`${detailFileName}.sql`, detailScript);
                hasFiles = true;
            });
        }

        let spSQL = "";

        // =============================================
        // MULTI SCREEN MODE
        // =============================================

        if (screens.length > 0) {

            spSQL = getAllStoredProcSQL(enableAudit);

        } else {

            // =============================================
            // SINGLE SCREEN MODE
            // =============================================

            spSQL = getStoredProcSQL(
                mainGridRef,
                objectRowData,
                detailsDataMap,
                detailsDefs,
                enableAudit
            );
        }

        if (spSQL) {

            sqlFolder.file(
                `sp_${spName || "all"}.sql`,
                spSQL
            );

            hasFiles = true;
        }

        // ✅ Node Folder
        const nodeFolder = zip.folder("node");

        let nodeSingle = "";
        let nodeLoop = "";

        // =============================================
        // MULTI SCREEN MODE
        // =============================================

        if (screens.length > 0) {

            nodeSingle = getAllNodeSingleCrudScripts();

            nodeLoop = getAllNodeLoopCrudScripts();

        } else {

            // =============================================
            // SINGLE SCREEN MODE
            // =============================================

            const nodeSingleDetailsTables = Object.entries(detailsDataMap || {}).map(
                ([gridName, rowData]) => ({
                    gridName,
                    rowData
                })
            );

            nodeSingle = getNodeSingleCrudScript(
                mainGridRef,
                objectRowData,
                nodeSingleDetailsTables,
                enableAudit
            );

            const nodeLoopDetailsTables = Object.entries(detailsDataMap || {}).map(
                ([gridName, rowData]) => ({
                    gridName,
                    rowData
                })
            );

            nodeLoop = getNodeLoopCrudScripts(
                mainGridRef,
                objectRowData,
                nodeLoopDetailsTables,
                enableAudit
            );
        }

        // =============================================
        // SAVE FILES
        // =============================================

        if (nodeSingle) {

            nodeFolder.file(
                `${reactName || "all"}_single.js`,
                nodeSingle
            );

            hasFiles = true;
        }

        if (nodeLoop) {

            nodeFolder.file(
                `${reactName || "all"}_loop.js`,
                nodeLoop
            );

            hasFiles = true;
        }

        // ✅ React Folder
        const reactFolder = zip.folder("react");

        let searchDesign = "";
        let addDesign = "";
        let addGridDesign = "";
        let combinedDesign = "";

        // =============================================
        // MULTI SCREEN MODE
        // =============================================

        if (screens.length > 0) {

            // SEARCH + ADD + GRID + COMBINED
            combinedDesign = getAllFrontendScreens();

            // SEARCH GRID CODE
            searchDesign = getAllFrontendScreens();

        } else {

            // =============================================
            // SINGLE SCREEN MODE
            // =============================================

            searchDesign =
                getFrontendSearchDesignCode(
                    mainGridRef,
                    objectRowData
                );

            const detailsTables = Object.entries(detailsDataMap || {}).map(
                ([gridName, rowData]) => ({
                    gridName,
                    rowData
                })
            );

            addDesign =
                getFrontendAddDesignCode(
                    mainGridRef,
                    objectRowData,
                    detailsTables
                );

            // ADD + GRID
            addGridDesign =
                getFrontendAddDesignCode(
                    mainGridRef,
                    objectRowData,
                    detailsTables
                );

            // SEARCH + ADD + GRID
            combinedDesign =
                getFrontendCombinedDesignCode(
                    mainGridRef,
                    objectRowData,
                    detailsTables,
                    screens
                );
        }
        // =============================================
        // MULTI SCREEN SAVE
        // =============================================

        if (screens.length > 0) {

            if (combinedDesign) {

                reactFolder.file(
                    `all_screens.js`,
                    combinedDesign
                );

                hasFiles = true;
            }

            if (searchDesign) {

                reactFolder.file(
                    `all_frontend_code.js`,
                    searchDesign
                );

                hasFiles = true;
            }

        } else {

            // =============================================
            // SINGLE SCREEN SAVE
            // =============================================

            if (searchDesign) {

                reactFolder.file(
                    `${reactName}_search.js`,
                    searchDesign
                );

                hasFiles = true;
            }

            if (addDesign) {

                reactFolder.file(
                    `${reactName}_add.js`,
                    addDesign
                );

                hasFiles = true;
            }

            // ADD + GRID
            if (addGridDesign) {

                reactFolder.file(
                    `${reactName}_add_grid.js`,
                    addGridDesign
                );

                hasFiles = true;
            }

            // COMBINED
            if (combinedDesign) {

                reactFolder.file(
                    `${reactName}_combined.js`,
                    combinedDesign
                );

                hasFiles = true;
            }
        }

        // ✅ Final ZIP Download
        if (hasFiles) {
            zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, `${reactName || "generated_files"}.zip`);
            });
        } else {
            alert("No files to generate. Please check your inputs.");
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
            searchCode = getFrontendSearchDesignCode(mainGridRef, objectRowData);
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
                mainGridRef,
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
            (row) =>
                row.dataType?.toUpperCase() === "GRID"
        );

        if (gridFields.length === 0) {
            alert("No GRID fields found");
            return;
        }

        // TAB NAMES = FIELD NAMES
        const tabNames = gridFields.map(
            row => row.fieldName
        );

        setDetailsTabs(tabNames);

        // DEFAULT ACTIVE TAB
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
                    return (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center'
                        }}>
                            <i
                                className="bi bi-trash-fill"
                                style={{ cursor: 'pointer' }}
                                onClick={() =>
                                    handleDetailDeleteRow(
                                        params.node.rowIndex
                                    )
                                }
                            />

                            <i
                                className="bi bi-plus-circle"
                                style={{ cursor: 'pointer' }}
                                onClick={() =>
                                    handleDetailsAdd(
                                        params.node.rowIndex
                                    )
                                }
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
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: [
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
                    ],
                },

                onCellValueChanged: (params) => {

                    const allRows =
                        detailsDataMap?.[activeDetailTab] || [];

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
                field: 'fileType',
                headerName: 'File Type',
                editable: true,
                hide: true,
                minWidth: 140,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: ['Image', 'File', 'Audio', 'Video']
                }
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

            const currentRows =
                detailsDataMap?.[activeDetailTab] || [];

            const showFileType = currentRows.some(
                row =>
                    row.dataType?.toUpperCase() === "VARBINARY"
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

    return (
        <div className="container-fluid py-4 px-4">
            <h2 className="mb-4 text-primary fw-bold">Design Studio</h2>

            {/* Show Tabs Only If Screens Exist */}
            {screens.length > 0 && (
                <div className="mb-3 d-flex gap-2 flex-wrap">
                    {screens.map((screen, index) => (
                        <Button
                            key={index}
                            variant={activeScreen === screen.screenName ? "primary" : "outline-primary"}
                            onClick={() => handleTabClick(screen)}
                        >
                            {screen.screenName}
                        </Button>
                    ))}
                </div>
            )}

            <Row className="g-3 align-items-end mb-4">

                {/* Object Type */}
                <Col md={3}>
                    <Form.Label className="fw-semibold">Object Type</Form.Label>

                    <Form.Select
                        value={objectType}
                        onChange={e => setObjectType(e.target.value)}
                    >
                        <option value="DB">DB Name</option>
                        <option value="Table">Table Name</option>
                        <option value="StoredProcedure">SP Name</option>
                        <option value="React">React Name</option>
                    </Form.Select>
                </Col>

                {/* Object Name */}
                <Col md={4}>
                    <Form.Label className="fw-semibold">Object Name</Form.Label>

                    <Form.Control
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter object name"
                    />
                </Col>

                {/* Details Button */}
                <Col md={1} className="d-grid">
                    <Button
                        variant="secondary"
                        onClick={handleDetailsClick}
                    >
                        Details
                    </Button>
                </Col>

                {/* Screen Type */}
                <Col md={4}>
                    <Form.Label className="fw-semibold">Screen Type</Form.Label>

                    <Form.Select
                        value={screenType}
                        onChange={(e) => setScreenType(e.target.value)}
                    >
                        <option value="search">Search Screen</option>
                        <option value="add">Add Screen</option>
                        <option value="add-grid">Add + Grid Screen</option>
                        <option value="combined">Add + Search + Grid Screen</option>
                    </Form.Select>
                </Col>

                {/* Save / Clear Buttons */}
                <Col md={4}>
                    <div className="d-grid gap-2">
                        <Button
                            variant="success"
                            onClick={handleSaveScreen}
                        >
                            💾 Save Screen
                        </Button>

                        <Button
                            variant="danger"
                            onClick={handleClearScreens}
                        >
                            🗑️ Clear Screens
                        </Button>
                    </div>
                </Col>

                {/* Audit + Excel Actions */}
                <Col md={8}>
                    <div className="d-flex flex-wrap gap-2 align-items-center h-100">

                        <Form.Check
                            type="checkbox"
                            label="Enable Audit Columns"
                            checked={enableAudit}
                            onChange={(e) => setEnableAudit(e.target.checked)}
                        />

                        <Button
                            variant="outline-secondary"
                            onClick={downloadExcelTemplate}
                        >
                            ⬇ Download Template
                        </Button>

                        <input
                            type="file"
                            accept=".xlsx"
                            ref={fileInputRef}
                            onChange={handleExcelUpload}
                            style={{ display: "none" }}
                        />

                        <Button
                            variant="outline-primary"
                            onClick={() => fileInputRef.current.click()}
                        >
                            📤 Upload Excel
                        </Button>
                    </div>
                </Col>

            </Row>

            <div className="card shadow-sm p-3 mb-4">
                <div
                    className="ag-theme-alpine mb-4"
                    style={{
                        height: 200,
                        width: "100%",
                        maxWidth: "600px"
                    }}
                >
                    <AgGridReact
                        ref={objectGridRef}
                        rowData={objectRowData}
                        columnDefs={objectClumnDefs}
                        rowHeight={35}
                        defaultColDef={defaultColDef}
                    />
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-2">

                <h5 className="mb-0 fw-semibold">
                    Main Configuration
                </h5>

                <div className="d-flex gap-2">
                    <Button
                        variant="primary"
                        className="rounded-top"
                        onClick={handleAddRow}
                    >
                        <FaPlus />
                    </Button>

                    <Button
                        variant="danger"
                        className="rounded-top"
                        onClick={handleRemoveRow}
                    >
                        <FaMinus />
                    </Button>
                </div>

            </div>

            <div className="ag-theme-alpine mb-4" style={{ height: 350 }}>
                <AgGridReact
                    ref={mainGridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowHeight={35}
                    stopEditingWhenCellsLoseFocus={true}   // ✅ ADD THIS

                    // ✅ NEW: Runs on initial load (FIX for refresh issue)
                    onGridReady={(params) => {
                        updateColumnVisibility(params.api);
                    }}

                    // ✅ Existing logic (keep it)
                    onCellValueChanged={(params) => {

                        // Remove AI if datatype changed
                        if (
                            params.colDef.field === "dataType" &&
                            !["INT", "BIGINT"].includes(params.newValue?.toUpperCase()) &&
                            params.data.constraints?.includes("AI")
                        ) {
                            params.node.setDataValue(
                                "constraints",
                                params.data.constraints.filter(v => v !== "AI")
                            );
                        }

                        // Auto clear size for non-size datatypes
                        const sizeAllowed = ["VARCHAR", "NVARCHAR", "DECIMAL"];

                        if (
                            params.colDef.field === "dataType" &&
                            !sizeAllowed.includes(params.newValue?.toUpperCase())
                        ) {
                            params.node.setDataValue("size", "");
                        }

                        // Clear fileType if datatype is not VARBINARY
                        if (
                            params.colDef.field === "dataType" &&
                            params.newValue?.toUpperCase() !== "VARBINARY"
                        ) {
                            params.node.setDataValue("fileType", "");
                        }

                        updateColumnVisibility(params.api);
                    }}
                />
            </div>

            {/* DETAILS TABS */}
            {
                detailsTabs.length > 0 && (
                    <div className="mb-3 d-flex gap-2 flex-wrap">

                        {
                            detailsTabs.map((tab, index) => (

                                <Button
                                    key={index}
                                    variant={
                                        activeDetailTab === tab
                                            ? "primary"
                                            : "outline-primary"
                                    }
                                    onClick={() =>
                                        setActiveDetailTab(tab)
                                    }
                                >
                                    {tab}
                                </Button>

                            ))
                        }

                    </div>
                )
            }

            {detailsDefs && (
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <h5 className="mb-0 fw-semibold">
                            Details Grid
                        </h5>

                        <div className="d-flex gap-2">

                            <Button
                                variant="primary"
                                className="rounded-top"
                                onClick={handleDetailsAddRow}
                            >
                                <FaPlus />
                            </Button>

                            <Button
                                variant="danger"
                                className="rounded-top"
                                onClick={handleDetailsRemoveRow}
                            >
                                <FaMinus />
                            </Button>

                        </div>

                    </div>
                    <div className="ag-theme-alpine mt-3" style={{ height: 300 }}>
                        <AgGridReact
                            rowData={detailsDataMap[activeDetailTab] || []}
                            columnDefs={detailsDefs}
                            defaultColDef={defaultColDef}

                            stopEditingWhenCellsLoseFocus={true}

                            onGridReady={(params) => {

                                // STORE DETAILS GRID API
                                window.detailsGridApi = params.api;

                                // UPDATE COLUMN VISIBILITY
                                updateColumnVisibility(params.api);
                            }}

                            onCellValueChanged={(params) => {

                                // REMOVE AI IF DATATYPE INVALID
                                if (
                                    params.colDef.field === "dataType" &&
                                    !["INT", "BIGINT"].includes(params.newValue?.toUpperCase()) &&
                                    params.data.constraints?.includes("AI")
                                ) {
                                    params.node.setDataValue(
                                        "constraints",
                                        params.data.constraints.filter(v => v !== "AI")
                                    );
                                }

                                // CLEAR SIZE IF DATATYPE DOES NOT SUPPORT SIZE
                                const sizeAllowed = ["VARCHAR", "NVARCHAR", "DECIMAL"];

                                if (
                                    params.colDef.field === "dataType" &&
                                    !sizeAllowed.includes(params.newValue?.toUpperCase())
                                ) {
                                    params.node.setDataValue("size", "");
                                }

                                // UPDATE CONDITIONAL COLUMNS
                                updateColumnVisibility(params.api);

                                // UPDATE DETAILS GRID CONDITIONAL COLUMNS
                                if (window.detailsGridApi) {
                                    updateColumnVisibility(window.detailsGridApi);
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="mb-4">

                <div className="d-flex flex-wrap gap-3">

                    <Button
                        variant="success"
                        onClick={generateFiles}
                    >
                        Generate Files
                    </Button>

                    <Button
                        variant="info"
                        onClick={previewTableSQL}
                    >
                        Preview Table SQL
                    </Button>

                    <Button
                        variant="warning"
                        onClick={previewSPCode}
                    >
                        Preview SP Code
                    </Button>

                    <Button
                        variant="dark"
                        onClick={previewNodeSingle}
                    >
                        ⚙️ Node Insert (Single)
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={previewNodeLoop}
                    >
                        🔁 Node Insert (Loop)
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handleGenerateScreen}
                    >
                        🚀 Generate Screen
                    </Button>

                </div>

            </div>

            <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="mb-0">Code Preview:</h4>
                    <Button
                        size="sm"
                        variant={copied ? 'success' : 'outline-secondary'}
                        onClick={handleCopy}
                    >
                        {copied ? <><FaCheckCircle className="me-1" />Copied!</> : <><FaCopy className="me-1" />Copy</>}
                    </Button>
                </div>
                <Form.Control
                    style={{height: "500px"}}
                    as="textarea"
                    value={sqlPreview}
                    rows={10}
                    readOnly
                    ref={previewRef}
                />

                {uiPreviewEnabled && (
                    <div className="mt-5 border rounded bg-light p-3">
                        <h5 className="mb-3">🎨 Live UI Preview:</h5>
                        {uiPreview}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Automation;
