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
import { ModuleRegistry, AllCommunityModule, _getHeaderCheckbox } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const Automation = () => {
    const [name, setName] = useState('');
    const [objectType, setObjectType] = useState('DB');
    const [sqlPreview, setSqlPreview] = useState('');
    const [rowData, setRowData] = useState([]);
    const [detailsRowData, setDetailsRowData] = useState([]);
    const gridRef = useRef();
    const previewRef = useRef(null);
    const [uiPreview, setUiPreview] = useState(null);
    const [uiPreviewEnabled, setUiPreviewEnabled] = useState(false);
    const [copied, setCopied] = useState(false);
    const [objectRowData, setObjectRowData] = useState([]);
    const [detailsDefs, setDetailsDefs] = useState(null);

    useEffect(() => {
        const existingLink = document.querySelector("link[href*='bootstrap-icons']");
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css';
            document.head.appendChild(link);
        }
    }, []);

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
            designAddOrderNo: ''
        };

        const updatedRows = [...rowData];

        updatedRows.splice(rowIndex + 1, 0, newRow);

        setRowData(updatedRows);
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
                values: ['INT', 'VARCHAR', 'TEXT', 'FLOAT', 'DATE', 'DATETIME', 'BIT', 'NVARCHAR', 'VARBINARY', 'DECIMAL', 'GRID'],
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
            // maxWidth: 100,
            minWidth: 100,
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
            // maxWidth: 120,
            minWidth: 120,
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
            // maxWidth: 120,
            minWidth: 120,
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
            field: 'designSCSelect',
            headerName: 'Design SC Select',
            sortable: false,
            filter: false,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ["Text", "Dropdown", "Date"]
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
                values: ["Text", "Dropdown", "Date", "File", "Number", "Text Area", "Grid"]
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
                designAddOrderNo: ''
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

    const getUDDStatements = (rows) => {
        let uddScript = '';
        rows.forEach(col => {
            if (!col.fieldName || !col.dataType) return;

            const dataType = col.dataType.toUpperCase();
            let fullType = dataType;

            if (col.size && !['INT', 'BIT', 'FLOAT', 'DATE', 'DATETIME', 'TEXT'].includes(dataType)) {
                if (dataType === 'DECIMAL') {
                    fullType += `(${col.size})`;
                } else {
                    fullType += `(${col.size})`;
                }
            }

            uddScript += `CREATE TYPE [udd_${col.fieldName}] FROM ${fullType};\nGO\n`;
        });

        return uddScript;
    };

    const getValidRows = (rows) => {
        return rows.filter(row => row.fieldName && row.fieldName.trim() !== '');
    };

    const getTableSQL = () => {
        const rows = [];

        if (!gridRef.current || !gridRef.current.api) {
            alert('Grid is not ready yet!');
            return '';
        }

        gridRef.current.api.forEachNode(node => {
            if (node && node.data) {
                rows.push(node.data);
            }
        });

        const validRows = getValidRows(rows);

        // Get dbName and objectName from grid
        const dbName = objectRowData.find(row => row.object === 'DB')?.name;
        const tableRow = objectRowData.find(row => row.object === 'Table');
        const objectName = tableRow?.name || '';
        if (!dbName || !objectName) {
            alert('Please provide DB Name, Table Name and at least one column.');
            return '';
        }

        const tableName = `tbl_${objectName}`;
        let script = `USE [${dbName}];\nGO\n\n`;

        // UDDs for main table
        script += `-- Create UDD (User Defined Data Type)\n`;
        script += getUDDStatements(rows);
        script += `\n-- Create Main Table\n`;
        script += `CREATE TABLE [${tableName}] (\n`;

        // Build column + constraint lines into array
        const lines = [];

        // Columns
        validRows.forEach(col => {
            if (col.dataType === "GRID") {
                // GRID is reference to details table
                // Only add as a pseudo-column in main table
                lines.push(`  -- [${col.fieldName}] GRID (see details table)`);
            } else {
                let line = `  [${col.fieldName}] [udd_${col.fieldName}]`;
                if (col.notNull) {
                    line += ' NOT NULL';
                }
                lines.push(line);
            }
        });

        // Primary Key
        const primaryKeys = rows.filter(col => col.primaryKey).map(col => `[${col.fieldName}]`);
        if (primaryKeys.length > 0) {
            lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
        }

        // Foreign Keys
        const foreignKeys = rows.filter(col => col.isForeignKey && col.referenceTable && col.referenceColumn);
        foreignKeys.forEach(col => {
            lines.push(
                `  FOREIGN KEY ([${col.fieldName}]) REFERENCES [tbl_${col.referenceTable}]([${col.referenceColumn}])`
            );
        });

        // Join all with comma
        script += lines.join(',\n') + '\n';
        script += ');\nGO\n\n';

        // ⚡ Handle Details Table(s) if GRID exists
        const gridFields = rows.filter(col => col.dataType === "GRID");
        if (gridFields.length > 0 && detailsDefs && detailsRowData) {
            gridFields.forEach(gridCol => {
                const detailsTableName = `tbl_${objectName}_${gridCol.fieldName}`;

                // ✅ Add USE for details table too
                script += `USE [${dbName}];\nGO\n\n`;

                script += `-- Create Details Table for GRID field [${gridCol.fieldName}]\n`;

                // collect rows from details grid
                const detailRows = detailsRowData || [];
                script += getUDDStatements(detailRows);
                script += `\nCREATE TABLE [${detailsTableName}] (\n`;

                const detailLines = [];

                detailRows.forEach(col => {
                    let line = `  [${col.fieldName}] [udd_${col.fieldName}]`;
                    if (col.notNull) {
                        line += ' NOT NULL';
                    }
                    detailLines.push(line);
                });

                const detailPK = detailRows.filter(col => col.primaryKey).map(col => `[${col.fieldName}]`);
                if (detailPK.length > 0) {
                    detailLines.push(`  PRIMARY KEY (${detailPK.join(', ')})`);
                }

                const detailFK = detailRows.filter(col => col.isForeignKey && col.referenceTable && col.referenceColumn);
                detailFK.forEach(col => {
                    detailLines.push(
                        `  FOREIGN KEY ([${col.fieldName}]) REFERENCES [tbl_${col.referenceTable}]([${col.referenceColumn}])`
                    );
                });

                script += detailLines.join(',\n') + '\n';
                script += ');\nGO\n\n';
            });
        }
        console.log(script)
        return script;
    };

    const getStoredProcSQL = () => {
        const rows = [];

        if (!gridRef.current || !gridRef.current.api) {
            alert('Grid is not ready!');
            return '';
        }

        gridRef.current.api.forEachNode(node => {
            if (node && node.data) {
                rows.push(node.data);
            }
        });

        const validRows = getValidRows(rows);

        const dbName = objectRowData.find(row => row.object === 'DB')?.name;
        const spRow = objectRowData.find(row => row.object === 'StoredProcedure');
        const objectName = spRow?.name || '';

        if (!dbName || !objectName) {
            alert('Please provide DB Name, SP Name and at least one column.');
            return '';
        }

        const tableName = `tbl_${objectName}`;
        const procName = `sp_${objectName}`;

        const isStringType = (type) => {
            const strTypes = ['VARCHAR', 'NVARCHAR', 'TEXT', 'CHAR', 'NCHAR'];
            return strTypes.includes(type?.toUpperCase());
        };

        // ---------- COMMON HELPER ----------
        const buildStoredProc = (contentRows, tblName, spName) => {
            const primaryKeyCol = contentRows.find(col => col.primaryKey);

            // exclude GRID fields in parameters
            const paramRows = contentRows.filter(col => col.dataType?.toUpperCase() !== "GRID");

            const inputParams = paramRows
                .map(col => `    @${col.fieldName} udd_${col.fieldName}`)
                .join(',\n');

            const insertableRows = paramRows.filter(col => {
                const field = col.fieldName.toLowerCase();
                return field !== 'modified_by' && field !== 'modified_date';
            });

            const insertFields = insertableRows.map(col => col.fieldName).join(', ');

            const insertValues = insertableRows.map(col => {
                const field = col.fieldName.toLowerCase();
                if (field === 'created_date') return 'SYSDATETIME()';
                return isStringType(col.dataType)
                    ? `TRIM(@${col.fieldName})`
                    : `@${col.fieldName}`;
            }).join(', ');

            const updateAssignments = paramRows
                .filter(col => {
                    const field = col.fieldName.toLowerCase();
                    return !col.primaryKey && field !== 'created_date' && field !== 'created_by';
                })
                .map(col => {
                    const field = col.fieldName.toLowerCase();
                    if (field === 'modified_date') return `        ${col.fieldName} = SYSDATETIME()`;
                    return isStringType(col.dataType)
                        ? `        ${col.fieldName} = TRIM(@${col.fieldName})`
                        : `        ${col.fieldName} = @${col.fieldName}`;
                })
                .join(',\n');

            const selectFields = contentRows.map(col => col.fieldName).join(', ');

            let script = `USE [${dbName}];\nGO\n\nCREATE PROCEDURE [dbo].[${spName}]\n(\n    @mode udd_mode,\n${inputParams}\n)\nAS\nBEGIN\n`;

            // INSERT
            script += `
    IF @mode = 'I'
    BEGIN
        INSERT INTO ${tblName} (${insertFields})
        VALUES (${insertValues})
    END`;

            // UPDATE
            if (primaryKeyCol) {
                script += `

    ELSE IF @mode = 'U'
    BEGIN
        UPDATE ${tblName}
        SET
${updateAssignments}
        WHERE ${primaryKeyCol.fieldName} = ${isStringType(primaryKeyCol.dataType)
                        ? `TRIM(@${primaryKeyCol.fieldName})`
                        : `@${primaryKeyCol.fieldName}`};
    END`;
            }

            // DELETE
            if (primaryKeyCol) {
                script += `

    ELSE IF @mode = 'D'
    BEGIN
        DELETE FROM ${tblName}
        WHERE ${primaryKeyCol.fieldName} = ${isStringType(primaryKeyCol.dataType)
                        ? `TRIM(@${primaryKeyCol.fieldName})`
                        : `@${primaryKeyCol.fieldName}`};
    END`;
            }

            // SELECT
            script += `

    ELSE IF @mode = 'A'
    BEGIN
        SELECT ${selectFields}
        FROM ${tblName}
    END

    ELSE
    BEGIN
        RAISERROR ('Please select a valid mode' ,16,1)
        RETURN;
    END
END
GO
`;
            return script;
        };

        // ----------- MAIN HEADER PROCEDURE -----------
        let script = buildStoredProc(validRows, tableName, procName);

        // ----------- DETAILS PROCEDURES -----------
        if (detailsDefs && detailsRowData && detailsRowData.length > 0) {
            const gridRows = detailsRowData.filter(r => r.fieldName); // only valid rows
            if (gridRows.length > 0) {
                const detailsTableName = `tbl_${objectName}_Details`;
                const detailsProcName = `sp_${objectName}_Details`;
                script += '\n\n' + buildStoredProc(gridRows, detailsTableName, detailsProcName);
            }
        }

        return script;
    };

    const previewTableSQL = () => {
        const tableScript = getTableSQL();
        if (tableScript) setSqlPreview(tableScript);
    };

    const previewSPCode = () => {
        const spScript = getStoredProcSQL();
        if (spScript) setSqlPreview(spScript);
    };

    const previewNodeSingle = () => {
        const singleNodeScript = getNodeSingleCrudScript();
        if (singleNodeScript) setSqlPreview(singleNodeScript);
    };

    const previewNodeLoop = () => {
        const loopNodeScript = getNodeLoopCrudScripts();
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

        const tableSQL = getTableSQL();
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

        const spSQL = getStoredProcSQL();
        if (spSQL) {
            sqlFolder.file(`sp_${spName}.sql`, spSQL);
            hasFiles = true;
        }

        // ✅ Node Folder
        const nodeFolder = zip.folder("node");

        const nodeSingle = getNodeSingleCrudScript();
        if (nodeSingle) {
            nodeFolder.file(`${reactName}_single.js`, nodeSingle);
            hasFiles = true;
        }

        const nodeLoop = getNodeLoopCrudScripts();
        if (nodeLoop) {
            nodeFolder.file(`${reactName}_loop.js`, nodeLoop);
            hasFiles = true;
        }

        // ✅ React Folder
        const reactFolder = zip.folder("react");

        const searchDesign = getFrontendSearchDesignCode();
        const addDesign = getFrontendAddDesignCode();

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

    const getNodeSingleCrudScript = () => {
        const rows = [];
        if (!gridRef.current || !gridRef.current.api) return "";
        gridRef.current.api.forEachNode(node => rows.push(node.data));
        const name = objectRowData.find(row => row.object === 'React')?.name;

        if (!name || rows.length === 0) return "";

        const validRows = getValidRows(rows);
        const procName = `sp_${name}`;

        const getSqlType = (col) => {
            const type = col.dataType?.toUpperCase();
            switch (type) {
                case "INT": return "sql.Int";
                case "FLOAT": return "sql.Float";
                case "BIT": return "sql.Bit";
                case "DATE": return "sql.Date";
                case "DATETIME": return "sql.DateTime";
                case "VARBINARY": return "sql.VarBinary";
                case "DECIMAL": {
                    const [precision, scale] = (col.size || "18,2").split(',').map(v => parseInt(v.trim()) || 0);
                    return `sql.Decimal(${precision}, ${scale})`;
                }
                default: return "sql.NVarChar";
            }
        };

        // ---------- COMMON FUNCTION BUILDER ----------
        const buildNodeCrud = (funcName, procName, contentRows) => {
            // Exclude GRID fields
            const paramRows = contentRows.filter(col => col.dataType?.toUpperCase() !== "GRID");

            const binaryFields = paramRows.filter(col => col.dataType.toLowerCase() === "varbinary");
            const otherFields = paramRows.filter(col => col.dataType.toLowerCase() !== "varbinary");

            let code = "";

            ['Insert', 'Update', 'Delete'].forEach(mode => {
                code += `\nconst ${funcName}${mode} = async (req, res) => {\n`;

                if (otherFields.length > 0) {
                    code += `  const { ${otherFields.map(col => col.fieldName).join(', ')} } = req.body;\n`;
                }

                binaryFields.forEach(col => {
                    code += `  let ${col.fieldName} = null;\n`;
                    code += `  if (req.file) ${col.fieldName} = req.file.buffer;\n`;
                });

                code += `\n  try {\n`;
                code += `    const pool = await sql.connect(dbConfig);\n`;
                code += `    await pool.request()\n`;
                code += `      .input("mode", sql.NVarChar, "${mode[0]}")\n`;

                // only paramRows, not GRID
                paramRows.forEach(col => {
                    const sqlType = getSqlType(col);
                    code += `      .input("${col.fieldName}", ${sqlType}, ${col.fieldName})\n`;
                });

                const execParams = ["@mode"].concat(paramRows.map(col => `@${col.fieldName}`)).join(", ");
                code += `      .query(\`EXEC ${procName} ${execParams}\`);\n`;

                code += `\n    res.status(200).json({ success: true, message: "${funcName} ${mode.toLowerCase()}d successfully" });\n`;
                code += `  } catch (err) {\n`;
                code += `    console.error("Error during ${funcName} ${mode.toLowerCase()}:", err);\n`;
                code += `    res.status(500).json({ message: err.message || "Internal Server Error" });\n`;
                code += `  }\n`;
                code += `};\n`;
            });

            return code;
        };

        // -------- HEADER NODE CRUD --------
        let script = `// Auto-generated Node.js CRUD for ${procName}\n`;
        script += buildNodeCrud(name, procName, validRows);

        // -------- DETAILS NODE CRUD --------
        if (detailsDefs && detailsRowData && detailsRowData.length > 0) {
            const gridRows = detailsRowData.filter(r => r.fieldName);
            if (gridRows.length > 0) {
                const detailsProcName = `sp_${name}_Details`;
                script += "\n\n// ---- Details CRUD ----\n";
                script += buildNodeCrud(`${name}Details`, detailsProcName, gridRows);

                script += `\nmodule.exports = { ${name}Insert, ${name}Update, ${name}Delete, ${name}DetailsInsert, ${name}DetailsUpdate, ${name}DetailsDelete };`;
                return script;
            }
        }

        // only header
        script += `\nmodule.exports = { ${name}Insert, ${name}Update, ${name}Delete };`;
        return script;
    };

    const getNodeLoopCrudScripts = () => {
        const rows = [];
        if (!gridRef.current || !gridRef.current.api) return "";
        gridRef.current.api.forEachNode((node) => rows.push(node.data));

        const name = objectRowData.find(row => row.object === 'React')?.name;
        if (!name || rows.length === 0) return "";

        const validRows = getValidRows(rows);
        const procName = `sp_${name}`;
        const arrayName = `${name}Data`;

        const getSqlType = (col) => {
            const type = col.dataType?.toUpperCase();
            switch (type) {
                case "INT": return "sql.Int";
                case "FLOAT": return "sql.Float";
                case "BIT": return "sql.Bit";
                case "DATE": return "sql.Date";
                case "DATETIME": return "sql.DateTime";
                case "VARBINARY": return "sql.VarBinary";
                case "DECIMAL": {
                    const [precision, scale] = (col.size || "18,2").split(',').map(v => parseInt(v.trim()) || 0);
                    return `sql.Decimal(${precision}, ${scale})`;
                }
                default: return "sql.NVarChar";
            }
        };

        const generateLoopFunction = (funcName, procName, arrayName, contentRows, mode, successMsg) => {
            // Exclude GRID fields
            const paramRows = contentRows.filter(col => col.dataType?.toUpperCase() !== "GRID");

            let script = `// Auto-generated ${funcName} API for ${procName}\n`;
            script += `const ${funcName} = async (req, res) => {\n`;
            script += `  const ${arrayName} = req.body.${arrayName};\n`;
            script += `  if (!${arrayName} || !${arrayName}.length) {\n`;
            script += `    return res.status(400).json("Invalid or empty ${arrayName} array.");\n`;
            script += `  }\n\n`;
            script += `  try {\n`;
            script += `    const pool = await sql.connect(dbConfig);\n`;
            script += `    for (const item of ${arrayName}) {\n`;
            script += `      await pool.request()\n`;
            script += `        .input("mode", sql.NVarChar, "${mode}")\n`;

            paramRows.forEach((col) => {
                const sqlType = getSqlType(col);
                script += `        .input("${col.fieldName}", ${sqlType}, item.${col.fieldName})\n`;
            });

            const execParams = ["@mode"].concat(paramRows.map(col => `@${col.fieldName}`)).join(", ");
            script += `        .query(\`EXEC ${procName} ${execParams}\`);\n`;
            script += `    }\n`;
            script += `    res.status(200).json("${successMsg}");\n`;
            script += `  } catch (err) {\n`;
            script += `    console.error("Error in ${funcName}:", err);\n`;
            script += `    res.status(500).json({ message: err.message || "Internal Server Error" });\n`;
            script += `  }\n`;
            script += `};\n\n`;
            return script;
        };

        let script = `// ---------- HEADER LOOP CRUD ----------\n`;
        script += generateLoopFunction(`${name}LoopInsert`, procName, arrayName, validRows, "I", `${name} data inserted successfully`);
        script += generateLoopFunction(`${name}LoopUpdate`, procName, arrayName, validRows, "U", `${name} data updated successfully`);
        script += generateLoopFunction(`${name}LoopDelete`, procName, arrayName, validRows, "D", `${name} data deleted successfully`);

        // ---------- DETAILS LOOP CRUD ----------
        if (detailsDefs && detailsRowData && detailsRowData.length > 0) {
            const gridRows = detailsRowData.filter(r => r.fieldName);
            if (gridRows.length > 0) {
                const detailsProcName = `sp_${name}_Details`;
                const detailsArrayName = `${name}DetailsData`;

                script += `\n// ---------- DETAILS LOOP CRUD ----------\n`;
                script += generateLoopFunction(`${name}DetailsLoopInsert`, detailsProcName, detailsArrayName, gridRows, "I", `${name} details inserted successfully`);
                script += generateLoopFunction(`${name}DetailsLoopUpdate`, detailsProcName, detailsArrayName, gridRows, "U", `${name} details updated successfully`);
                script += generateLoopFunction(`${name}DetailsLoopDelete`, detailsProcName, detailsArrayName, gridRows, "D", `${name} details deleted successfully`);

                script += `module.exports = { ${name}LoopInsert, ${name}LoopUpdate, ${name}LoopDelete, ${name}DetailsLoopInsert, ${name}DetailsLoopUpdate, ${name}DetailsLoopDelete };`;
                return script;
            }
        }

        // only header
        script += `module.exports = { ${name}LoopInsert, ${name}LoopUpdate, ${name}LoopDelete };`;
        return script;
    };

    const getFrontendSearchDesignCode = () => {
        const rows = [];
        if (!gridRef.current || !gridRef.current.api) return "";

        // gridRef.current.api.forEachNode((node) => {
        //     const data = node.data;
        //     if (data && data.designSCSelect && data.designSCSelect.trim() !== '') {
        //         rows.push(data);
        //     }
        // });

        gridRef.current.api.forEachNode(node => {
            if (node && node.data) {
                rows.push(node.data);
            }
        });

        const name = objectRowData.find(row => row.object === 'React')?.name;
        if (!name || rows.length === 0) return "";

        const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);

        // ✅ Sort rows by designSCOrderNo if it's a number, else maintain current order
        const orderedRows = [...rows].sort((a, b) => {
            const aOrder = parseInt(a.designSCOrderNo);
            const bOrder = parseInt(b.designSCOrderNo);

            const aValid = !isNaN(aOrder);
            const bValid = !isNaN(bOrder);

            if (aValid && bValid) return aOrder - bOrder;
            if (aValid) return -1;
            if (bValid) return 1;
            return 0;
        });

        const validRows = getValidRows(orderedRows);

        const columnDefs = validRows.map(
            (col) => `    { headerName: "${col.fieldName}", field: "${col.fieldName}", flex: 1 }`
        );

        const inputControls = validRows
            .filter((col) => col.designSCSelect) // Only generate if designSCSelect is not empty
            .map((col) => {
                const label = `            <label className="form-label fw-semibold">${col.fieldName}</label>`;
                const type = col.designSCSelect;

                if (type === "Text") {
                    return `          <div className="col-md-3">\n${label}\n            <input className="form-control" type="text" placeholder="Enter ${col.fieldName}" />\n          </div>`;
                }

                if (type === "Dropdown") {
                    return `          <div className="col-md-3">\n${label}\n            <Select options={[]} placeholder="Select ${col.fieldName}" />\n          </div>`;
                }

                if (type === "Date") {
                    return `          <div className="col-md-3">\n${label}\n            <input className="form-control" type="date" />\n          </div>`;
                }

                return ""; // fallback for unsupported or empty
            })
            .join("\n");

        const buttonIcons = {
            Add: { icon: "plus", color: "success" },
            Delete: { icon: "dash", color: "danger" },
            Update: { icon: "floppy", color: "primary" },
            Print: { icon: "printer", color: "dark" },
            Excel: { icon: "file-earmark-excel", color: "success" },
            Search: { icon: "search", color: "primary" },
            Refresh: { icon: "arrow-clockwise", color: "secondary" },
        };

        const buttonRows = orderedRows.filter((row) => row.designSCButtons);
        const headerButtons = buttonRows
            .filter((row) =>
                ["Add", "Delete", "Update", "Print", "Excel"].includes(row.designSCButtons)
            )
            .map(
                (row) =>
                    `          <button className="btn btn-outline-${buttonIcons[row.designSCButtons].color}"><i className="bi bi-${buttonIcons[row.designSCButtons].icon}" /></button>`
            )
            .join("\n");

        const inputActionButtons = buttonRows
            .filter((row) =>
                ["Search", "Refresh"].includes(row.designSCButtons)
            )
            .map(
                (row) =>
                    `            <button className="btn btn-outline-${buttonIcons[row.designSCButtons].color}"><i className="bi bi-${buttonIcons[row.designSCButtons].icon}" /></button>`
            )
            .join("\n");

        return `import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { provideGlobalGridOptions } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const ${screenTitle}Screen = () => {
  const columnDefs = [
${columnDefs.join(",\n")}
  ];
  const rowData = [];

  return (
    <div className="container-fluid p-3">
      <div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
        <h2 className="mb-0">${screenTitle}</h2>
        <div className="d-flex gap-2">
          ${headerButtons}
        </div>
      </div>

      <div className="card p-3 mb-3 shadow-sm">
        <div className="row g-3">
${inputControls}
          <div className="col-md-3 d-flex align-items-end gap-2">
            ${inputActionButtons}
          </div>
        </div>
      </div>

      <div className="card p-2 shadow-sm">
        <div className="ag-theme-alpine" style={{ height: 300 }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
            pagination={true}
            paginationPageSize={10}
          />
        </div>
      </div>
    </div>
  );
};

export default ${screenTitle}Screen;`;
    };

    const getFrontendAddDesignCode = () => {
        const rows = [];
        if (!gridRef.current || !gridRef.current.api) return "";

        gridRef.current.api.forEachNode((node) => {
            const data = node.data;
            if (data && data.designAddScreenSelect && data.designAddScreenSelect.trim() !== "") {
                rows.push(data);
            }
        });

        const name = objectRowData.find((row) => row.object === "React")?.name;
        if (!name || rows.length === 0) return "";
        const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);

        // ---- ORDERED ROWS (by row, col) ----
        const orderedRows = [...rows].sort((a, b) => {
            const parse = (v) =>
                (v || "9999,9999,3")
                    .split(",")
                    .map((x) => parseInt(x.trim()))
                    .filter((n) => !isNaN(n));
            const [ar, ac] = parse(a.designAddOrderNo);
            const [br, bc] = parse(b.designAddOrderNo);
            return ar !== br ? ar - br : ac - bc;
        });

        // ---- GROUP BY ROW ----
        const groupedRows = {};
        orderedRows.forEach((col) => {
            const [rowNum, colNum, colSize] = (col.designAddOrderNo || "9999,9999,3")
                .split(",")
                .map((v) => parseInt(v.trim()));
            if (!groupedRows[rowNum]) groupedRows[rowNum] = [];
            groupedRows[rowNum].push({ ...col, colNum, colSize: colSize || 3 });
        });

        // ---- GRID COLUMN DEFS ----
        let gridColumnDefs = " ";
        if (Array.isArray(detailsRowData) && detailsRowData.length) {
            const withOrder = detailsRowData.filter((r) => r.fieldName && r.gridOrderNo);
            const withoutOrder = detailsRowData.filter((r) => r.fieldName && !r.gridOrderNo);
            const sorted = [
                ...withOrder.sort((a, b) => (parseInt(a.gridOrderNo) || 9999) - (parseInt(b.gridOrderNo) || 9999)),
                ...withoutOrder,
            ];
            gridColumnDefs = sorted
                .map((r) => {
                    const tooltip = r.gridTooltip ? `, headerTooltip: "${r.gridTooltip}"` : "";
                    return `{ headerName: "${r.fieldName}", field: "${r.fieldName}" ${tooltip} }`;
                })
                .join(",\n            ");
        }

        // utils
        const isGrid = (c) => c.designAddScreenSelect === "Grid";
        const rowHasOnlyGrid = (rowCols) => rowCols.length > 0 && rowCols.every(isGrid);

        // ---- RENDERERS ----
        const renderInputField = (col) => {
            const tooltipAttr = col.addScreenTooltip ? ` title="${col.addScreenTooltip}"` : "";
            const label = `            <label className="form-label fw-semibold">${col.fieldName}</label>`;
            const size = col.colSize || 3; // ✅ always respect colSize
            const wrap = (inner) =>
                `          <div className="col-md-${size}">\n${label}\n${inner}\n          </div>`;
            switch (col.designAddScreenSelect) {
                case "Text":
                    return wrap(`            <input className="form-control" type="text" ${tooltipAttr} placeholder="Enter ${col.fieldName}" />`);
                case "Dropdown":
                    return wrap(`            <Select options={[]} placeholder="Select ${col.fieldName}" ${tooltipAttr} />`);
                case "Date":
                    return wrap(`            <input className="form-control" type="date" ${tooltipAttr}/>`);
                case "Number":
                    return wrap(`            <input className="form-control" type="number" ${tooltipAttr}/>`);
                case "File":
                    return wrap(`            <input className="form-control" type="file" ${tooltipAttr}/>`);
                case "Text Area":
                    return wrap(`            <textarea className="form-control" ${tooltipAttr}></textarea>`);
                default:
                    return "";
            }
        };

        const renderInlineGrid = (col) => {
            const size = col.colSize || 6;
            return `          <div className="col-md-${size}">
            <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
              <AgGridReact rowData={[]} columnDefs={[ ${gridColumnDefs} ]} pagination={true} />
            </div>
          </div>`;
        };

        const renderGridCard = (title = "Details") => {
            return `
    <div className="card p-3 shadow-sm mb-3">
      <h5 className="mb-3">${title}</h5>
      <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
        <AgGridReact rowData={[]} columnDefs={[ ${gridColumnDefs} ]} pagination={true} />
      </div>
    </div>`;
        };

        // ---- BUILD MAIN (inputs + any inline grids) and BELOW (grid-only rows as cards) ----
        const rowKeys = Object.keys(groupedRows).map((n) => parseInt(n)).sort((a, b) => a - b);

        let mainRowsHtml = "";
        let belowCardsHtml = "";

        rowKeys.forEach((rk) => {
            const rowCols = groupedRows[rk].sort((a, b) => a.colNum - b.colNum);

            if (rowHasOnlyGrid(rowCols)) {
                rowCols.forEach((col) => {
                    belowCardsHtml += renderGridCard(col.fieldName || "Details");
                });
                return;
            }

            const fields = rowCols
                .map((col) => {
                    if (isGrid(col)) return renderInlineGrid(col);
                    return renderInputField(col);
                })
                .join("\n");

            mainRowsHtml += `        <div className="row g-3 mb-2">\n${fields}\n        </div>\n`;
        });

        // ---- Buttons ----
        const buttonIcons = {
            Save: { icon: "save", color: "success" },
            Update: { icon: "floppy", color: "primary" },
            Print: { icon: "printer", color: "secondary" },
            Excel: { icon: "file-earmark-excel", color: "success" },
            Refresh: { icon: "arrow-clockwise", color: "warning" },
            Close: { icon: "x-circle", color: "danger" },
        };

        const buttonRows = rowData.filter((row) => row.designAddScreenButtons);

        // helper → generate button HTML with special handling for Refresh
        const renderButton = (row, position) => {
            const { icon, color } = buttonIcons[row.designAddScreenButtons] || {};
            const extra =
                row.designAddScreenButtons === "Refresh"
                    ? ` onClick={() => window.location.reload()}`
                    : "";

            return `<button className="btn btn-outline-${color} ${position === "Top" ? "ms-2" : ""
                }"${extra}>
                <i className="bi bi-${icon}" />
            </button>`;
        };

        const topButtons = buttonRows
            .filter((row) => row.addScreenButtonPosition === "Top")
            .map((row) => renderButton(row, "Top"))
            .join("\n");

        const bottomButtons = buttonRows
            .filter((row) => row.addScreenButtonPosition === "Bottom")
            .map((row) => renderButton(row, "Bottom"))
            .join("\n");

        // ---- Layout ----
        let layoutCode = "";
        if (mainRowsHtml.trim()) {
            layoutCode += `
    <div className="card p-3 shadow-sm mb-3">
${mainRowsHtml}
      <div className="d-flex align-items-end gap-2">
${bottomButtons || ""}
      </div>
    </div>`;
        }
        layoutCode += belowCardsHtml;

        // ---- Final Code ----
        return `import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { provideGlobalGridOptions } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const Add${screenTitle}Screen = () => {
  return (
    <div className="container-fluid p-3">
      <div className="d-flex justify-content-between border border-black rounded-2 p-3 align-items-center mb-3 shadow-sm">
        <h2 className="mb-0 ms-3">Add ${screenTitle}</h2>
        <div className="d-flex">
          ${topButtons || ""}
        </div>
      </div>

${layoutCode}
    </div>
  );
};

export default Add${screenTitle}Screen;`;
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
            searchCode = getFrontendSearchDesignCode();
        }

        // Check if add form design fields have values safely
        const hasAddData = rowData.some(row =>
            (row.designAddScreenSelect && row.designAddScreenSelect.length > 0) ||
            (row.designAddScreenButtons && row.designAddScreenButtons.length > 0)
        );

        if (hasAddData) {
            addCode = getFrontendAddDesignCode();
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
            </Row>

            <div className="d-flex">
                <div className="ag-theme-alpine mb-3 me-5" style={{ height: 200, width: 500 }}>
                    <AgGridReact
                        ref={gridRef}
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
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowHeight={35}
                    onCellValueChanged={(params) => {
                        const updatedData = [];
                        params.api.forEachNode(node => updatedData.push(node.data));
                        setRowData(updatedData);
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
                <Button variant="primary" onClick={handleGenerateBothDesigns}>🧩 Generate Both Designs</Button>
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
