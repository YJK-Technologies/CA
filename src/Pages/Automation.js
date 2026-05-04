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
import { getTableSQL, getStoredProcSQL } from './sqlGenerator';
import { getNodeSingleCrudScript, getNodeLoopCrudScripts } from './nodeGenerator';
import { getFrontendSearchDesignCode, getFrontendAddDesignCode } from './frontGenerator';
import * as XLSX from "xlsx";
import { getFrontendCombinedDesignCode } from './frontGenerator';

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const Automation = () => {
    const [name, setName] = useState('');
    const [objectType, setObjectType] = useState('DB');
    const [sqlPreview, setSqlPreview] = useState('');
    const [rowData, setRowData] = useState([]);
    const [detailsRowData, setDetailsRowData] = useState([]);
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
    const [test, setTest] = useState('')

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
            "fieldName",
            "dataType",
            "size",
            "constraints",
            "referenceTable",
            "referenceColumn",
            "defaultValue",
            "checkCondition",
            "designSCSelect",
            "designSCOrderNo",
            "designSCButtons",
            "designAddScreenSelect",
            "designAddOrderNo",
            "addScreenTooltip",
            "designAddScreenButtons",
            "addScreenButtonPosition"
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
            }
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
        code = getFrontendAddDesignCode(mainGridRef, objectRowData, detailsRowData);
    }

    else if (screenType === "add-grid") {
        // Same add function, but GRID fields will render automatically
        code = getFrontendAddDesignCode(mainGridRef, objectRowData, detailsRowData);
    }

    else if (screenType === "combined") {
        code = getFrontendCombinedDesignCode(
            mainGridRef,
            objectRowData,
            detailsRowData
        );
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
};

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (evt) => {
            const binaryStr = evt.target.result;
            const workbook = XLSX.read(binaryStr, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            validateAndLoadData(data);
        };

        reader.readAsBinaryString(file);
    };

    const validateAndLoadData = (data) => {
        const errors = [];

        const formattedData = data.map((row, index) => {
            const rowNum = index + 2; // Excel row (header = row 1)

            if (!row.fieldName) {
                errors.push(`Row ${rowNum}: fieldName is required`);
            }

            const dataType = row.dataType?.toUpperCase();

            if (!validDataTypes.includes(dataType)) {
                errors.push(`Row ${rowNum}: Invalid dataType`);
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
    dataType,
    constraints: constraintsArray,

    // ✅ FIX: map correct field
    addScreenButtonPosition: row.addScreenButtonPosition || row.designAddScreenButtonPosition || ""
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

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            const trimmedName = name.trim();

            if (!trimmedName) {
                alert("⚠️ Object name cannot be empty!");
                return;
            }

            const isDuplicate = objectRowData.some(
                (row) =>
                    row.object.toLowerCase() === objectType.toLowerCase()
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
            size: '',
            notNull: false,
            primaryKey: false,
            isForeignKey: false,
            referenceTable: '',
            referenceColumn: '',
            tableFieldSelect: false,
            nodeSelect: false,
            designSCSelect: '',
            designSCOrderNo: '',
            designAddScreenSelect: '',
            designAddOrderNo: '',
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

        const updatedData = [];
        api.forEachNodeAfterFilterAndSort(node => updatedData.push(node.data));

        const showFK = updatedData.some(row => row.constraints?.includes("FK"));
        const showDF = updatedData.some(row => row.constraints?.includes("DF"));
        const showCHK = updatedData.some(row => row.constraints?.includes("CHK"));

        api.setColumnsVisible(["referenceTable", "referenceColumn"], showFK);
        api.setColumnsVisible(["defaultValue"], showDF);
        api.setColumnsVisible(["checkCondition"], showCHK);
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
                values: ['INT', 'BIGINT', 'VARCHAR', 'TEXT', 'FLOAT', 'DATE', 'DATETIME', 'BIT', 'NVARCHAR', 'VARBINARY', 'DECIMAL', 'GRID'],
            },
            minWidth: 100,
        },
        {
            field: 'size',
            headerName: 'Size',
            editable: true,
            // maxWidth: 80,
            minWidth: 80,
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
                size: '',
                notNull: false,
                primaryKey: false,
                isForeignKey: false,
                referenceTable: '',
                referenceColumn: '',
                tableFieldSelect: false,
                nodeSelect: false,
                designSCSelect: '',
                designSCOrderNo: '',
                designAddScreenSelect: '',
                designAddOrderNo: '',
                constraints: [],
                defaultValue: '',
                checkCondition: '',
            },
        ]);
    };

    const handleDetailsAddRow = () => {
        setDetailsRowData(prev => [
            ...prev,
            {
                fieldName: '',
                dataType: 'VARCHAR',
                size: '',
                notNull: false,
                primaryKey: false,
                isForeignKey: false,
                referenceTable: '',
                referenceColumn: '',
                tableFieldSelect: false,
                nodeSelect: false,
                designSCSelect: '',
                designSCOrderNo: '',
                designAddScreenSelect: '',
                designAddOrderNo: ''
            },
        ]);
    };

    const handleRemoveRow = () => {
        setRowData(prev => {
            if (prev.length === 0) return prev;
            return prev.slice(0, prev.length - 1); // remove last row
        });
    };

    const handleDetailsRemoveRow = () => {
        setDetailsRowData(prev => {
            if (prev.length === 0) return prev;
            return prev.slice(0, prev.length - 1); // remove last row
        });
    };

    const previewTableSQL = () => {
        const tableScript = getTableSQL(
            mainGridRef,
            objectRowData,
            detailsRowData,
            detailsDefs,
            enableAudit   // ✅ NEW
        );
        if (tableScript) setSqlPreview(tableScript);
    };

    const previewSPCode = () => {
        const spScript = getStoredProcSQL(
            mainGridRef,
            objectRowData,
            detailsRowData,
            detailsDefs,
            enableAudit   // ✅ NEW
        );
        if (spScript) setSqlPreview(spScript);
    };

    const previewNodeSingle = () => {
        const singleNodeScript = getNodeSingleCrudScript(mainGridRef, objectRowData, detailsRowData, detailsDefs);
        if (singleNodeScript) setSqlPreview(singleNodeScript);
    };

    const previewNodeLoop = () => {
        const loopNodeScript = getNodeLoopCrudScripts(mainGridRef, objectRowData, detailsRowData, detailsDefs);
        if (loopNodeScript) setSqlPreview(loopNodeScript);
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

        const tableSQL = getTableSQL(
            mainGridRef,
            objectRowData,
            detailsRowData,
            detailsDefs,
            enableAudit   // ✅ NEW
        );
        if (tableSQL) {
            // Extract DB name from USE statement
            const dbMatch = tableSQL.match(/USE\s+\[(.*?)\];/i);
            const dbName = dbMatch ? dbMatch[1] : "unknownDB";

            // Split by Details marker
            const [headerPart, ...detailsParts] = tableSQL.split(/-- Create Details Table/i);

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

        const spSQL = getStoredProcSQL(
            mainGridRef,
            objectRowData,
            detailsRowData,
            detailsDefs,
            enableAudit   // ✅ NEW
        );
        if (spSQL) {
            sqlFolder.file(`sp_${spName}.sql`, spSQL);
            hasFiles = true;
        }

        // ✅ Node Folder
        const nodeFolder = zip.folder("node");

        const nodeSingle = getNodeSingleCrudScript(mainGridRef, objectRowData, detailsRowData, detailsDefs);
        if (nodeSingle) {
            nodeFolder.file(`${reactName}_single.js`, nodeSingle);
            hasFiles = true;
        }

        const nodeLoop = getNodeLoopCrudScripts(mainGridRef, objectRowData, detailsRowData, detailsDefs);
        if (nodeLoop) {
            nodeFolder.file(`${reactName}_loop.js`, nodeLoop);
            hasFiles = true;
        }

        // ✅ React Folder
        const reactFolder = zip.folder("react");

        const searchDesign = getFrontendSearchDesignCode(mainGridRef, objectRowData);
        const addDesign = getFrontendAddDesignCode(mainGridRef, objectRowData, rowData, detailsRowData);

        if (searchDesign) {
            reactFolder.file(`${reactName}_search.js`, searchDesign);
            hasFiles = true;
        }

        if (addDesign) {
            reactFolder.file(`${reactName}_add.js`, addDesign);
            hasFiles = true;
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

            // 1. Remove import/export/ModuleRegistry lines — critical!
            const cleanedCode = codeString
                .replace(/import .*;?$/gm, '')
                .replace(/ModuleRegistry\.registerModules\(.*\);?/gm, '')
                .replace(/provideGlobalGridOptions\(.*\);?/gm, '')
                .replace(/export default .*;?/gm, '');

            // console.log(cleanedCode)

            // 2. Extract component name (e.g., CustomerScreen)
            const match = cleanedCode.match(/const (\w+)Screen/);
            if (!match) return <div className="text-danger">❌ Component not found in code</div>;
            const componentName = match[1];

            // 3. Compile JSX
            const compiled = Babel.transform(cleanedCode, {
                presets: ['react'],
            }).code;

            // 4. Evaluate and render
            const Component = new Function('React', 'Select', 'AgGridReact', `${compiled}; return ${componentName}Screen;`)(
                React,
                Select,
                AgGridReact
            );

            return <Component />;
        } catch (err) {
            return <div className="text-danger">❌ Error in preview: ${err.message}</div>;
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
            addCode = getFrontendAddDesignCode(mainGridRef, objectRowData, rowData, detailsRowData);
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
        setDetailsRowData((prevData) => prevData.filter((_, i) => i !== index));
    };

    const handleDetailsAdd = (rowIndex) => {
        const newRow = {
            fieldName: '',
            dataType: 'VARCHAR',
            size: '',
            notNull: false,
            primaryKey: false,
            isForeignKey: false,
            referenceTable: '',
            referenceColumn: '',
            tableFieldSelect: false,
            nodeSelect: false,
            designSCSelect: '',
            designSCOrderNo: '',
            designAddScreenSelect: '',
            designAddOrderNo: ''
        };

        const updatedRows = [...rowData];

        updatedRows.splice(rowIndex + 1, 0, newRow);

        setDetailsRowData(updatedRows);
    };

    const handleDetailsClick = () => {
        // filter rows where dataType = GRID
        const gridFields = rowData.filter((row) => row.dataType === "GRID");

        if (gridFields.length === 0) {
            alert("No GRID fields found");
            return;
        }

        // build a new columnDefs for details grid
        const newDetailsDefs = [
            {
                field: 'Action',
                headerName: 'Action',
                cellRenderer: (params) => {
                    return (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <i
                                className="bi bi-trash-fill"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleDetailDeleteRow(params.node.rowIndex)}
                            />
                            <i
                                className="bi bi-plus-circle"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleDetailsAdd(params.node.rowIndex)}
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
                    values: ['INT', 'VARCHAR', 'TEXT', 'FLOAT', 'DATE', 'DATETIME', 'BIT', 'NVARCHAR', 'VARBINARY', 'DECIMAL', 'GRID'],
                },
                onCellValueChanged: (params) => {
                    if (params.newValue === "BIT") {
                        params.node.setDataValue('designAddScreenSelect', 'Toggle');
                    }
                }
            },
            {
                field: 'size',
                headerName: 'Size',
                editable: true
            },
            {
                field: 'notNull',
                headerName: 'NOT NULL',
                cellRenderer: params => (
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={params.value || false}
                        onChange={e => {
                            params.node.setDataValue('notNull', e.target.checked);
                        }}
                    />
                ),
            },
            {
                field: 'primaryKey',
                headerName: 'Primary Key',
                cellRenderer: params => (
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={params.value || false}
                        onChange={e => {
                            params.node.setDataValue('primaryKey', e.target.checked);
                        }}
                    />
                ),
            },
            {
                field: 'isForeignKey',
                headerName: 'Foreign Key',
                cellRenderer: params => (
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={params.value || false}
                        onChange={e => {
                            params.node.setDataValue('isForeignKey', e.target.checked);
                        }}
                    />
                ),
            },
            {
                field: 'referenceTable',
                headerName: 'Ref Table',
                editable: true
            },
            {
                field: 'referenceColumn',
                headerName: 'Ref Column',
                editable: true
            },
            {
                field: 'gridOrderNo',
                headerName: 'Grid order No',
                editable: true
            },
            {
                field: 'gridTooltip',
                headerName: 'Grid Tooltip',
                editable: true
            },
        ];

        setDetailsDefs(newDetailsDefs);
    };

    return (
        <div className="container-fluid">
            <h2 className="mb-4 text-primary fw-bold">Design Studio</h2>

            <Row className="mb-3">
                <Col md={3}>
                    <Form.Label>Object Type:</Form.Label>
                    <Form.Select value={objectType} onChange={e => setObjectType(e.target.value)}>
                        <option value="DB">DB Name</option>
                        <option value="Table">Table Name</option>
                        <option value="StoredProcedure">SP Name</option>
                        <option value="React">React Name</option>
                    </Form.Select>
                </Col>
                <Col md={3}>
                    <Form.Label>Object Name:</Form.Label>
                    <Form.Control
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter object name"
                    />
                </Col>
                <Col md={3} className="d-flex justify-content-start gap-2 mb-2 mt-4">
                    <Button variant="secondary" onClick={handleDetailsClick}>
                        Details
                    </Button>
                </Col>

                <Col md={6} className="d-flex align-items-center justify-content-end mt-4">
                    <div className="d-flex align-items-center gap-3">

                        {/* Checkbox */}
                        <Form.Check
                            type="checkbox"
                            label="Enable Audit Columns"
                            checked={enableAudit}
                            onChange={(e) => setEnableAudit(e.target.checked)}
                        />

                        {/* Download Button */}
                        <Button variant="secondary" onClick={downloadExcelTemplate}>
                            ⬇️ Download
                        </Button>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            accept=".xlsx"
                            ref={fileInputRef}
                            onChange={handleExcelUpload}
                            style={{ display: "none" }}
                        />

                        {/* Upload Button */}
                        <Button
                            variant="primary"
                            onClick={() => fileInputRef.current.click()}
                        >
                            📤 Upload Excel
                        </Button>

                    </div>
                </Col>

                <Col md={3}>
    <Form.Label>Screen Type:</Form.Label>
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
            </Row>

            <div className="d-flex">
                <div className="ag-theme-alpine mb-3 me-5" style={{ height: 200, width: 500 }}>
                    <AgGridReact
                        ref={objectGridRef}
                        rowData={objectRowData}
                        columnDefs={objectClumnDefs}
                        rowHeight={35}
                        defaultColDef={defaultColDef}
                    />
                </div>
            </div>

            <div className="d-flex justify-content-end mb-2">
                <Button variant="primary" className="rounded-top" onClick={handleAddRow}><FaPlus /></Button>
                <Button variant="danger" className="rounded-top ms-2" onClick={handleRemoveRow}><FaMinus /></Button>
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

                        updateColumnVisibility(params.api);
                    }}
                />
            </div>

            {detailsDefs && (
                <div className="mb-3">
                    <div className="d-flex justify-content-end mb-3">
                        <Button variant="primary" className="rounded-top" onClick={handleDetailsAddRow}><FaPlus /></Button>
                        <Button variant="danger" className="rounded-top ms-2" onClick={handleDetailsRemoveRow}><FaMinus /></Button>
                    </div>
                    <div className="ag-theme-alpine mt-3" style={{ height: 300 }}>
                        <AgGridReact rowData={detailsRowData} columnDefs={detailsDefs} />
                    </div>
                </div>
            )}

            <div className="mb-4">
                <Button variant="success" className="me-2" onClick={generateFiles}>Generate Files</Button>
                <Button variant="info" className="me-2" onClick={previewTableSQL}>Preview Table SQL</Button>
                <Button variant="warning" className="me-2" onClick={previewSPCode}>Preview SP Code</Button>
                <Button variant="warning" className="me-2" onClick={previewNodeSingle}>⚙️ Preview Node Insert (Single)</Button>
                <Button variant="dark" className="me-2" onClick={previewNodeLoop}>🔁 Preview Node Insert (Loop)</Button>
                {/* <Button variant="primary" className="me-2" onClick={handleGenerateBothDesigns}>🧩 Debug Both Designs</Button> */}

                {/* ✅ ADD THIS */}
                <Button
    variant="success"
    className="ms-2"
    onClick={handleGenerateScreen}
>
    🚀 Generate Screen
</Button>
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
