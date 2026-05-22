import React, { useState, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Select from 'react-select';
import * as Babel from '@babel/standalone';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Layout from './Layout';
import { provideGlobalGridOptions } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule, _getHeaderCheckbox } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const Automation = () => {
    const [name, setName] = useState('');
    const [objectType, setObjectType] = useState('DB');
    const [sqlPreview, setSqlPreview] = useState('');
    const [rowData, setRowData] = useState([]);
    const gridRef = useRef();
    const previewRef = useRef(null);
    const [uiPreview, setUiPreview] = useState(null);
    const [uiPreviewEnabled, setUiPreviewEnabled] = useState(false);
    const [copied, setCopied] = useState(false);
    const [objectRowData, setObjectRowData] = useState([]);

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
        if (e.key === "Enter" && name.trim() !== "") {
            const newRow = {
                object: objectType,
                name: name.trim(),
                delete: ""
            };
            setObjectRowData((prevData) => [...prevData, newRow]);
            setName("");
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

    const columnDefs = [
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
                values: ['INT', 'VARCHAR', 'TEXT', 'FLOAT', 'DATE', 'DATETIME', 'BIT', 'NVARCHAR', 'VARBINARY'],
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
        // {
        //     field: 'nodeSelect',
        //     headerName: 'Node Select',
        //     cellRenderer: params => (
        //         <input
        //             type="checkbox"
        //             className="form-check-input"
        //             checked={params.value || false}
        //             onChange={e => {
        //                 params.node.setDataValue('nodeSelect', e.target.checked);
        //             }}
        //         />
        //     ),
        // },
        {
            field: 'designSCSelect',
            headerName: 'Design SC Select',
            sortable: false,
            filter: false,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ["Text", "Dropdown", "Date"]
            },
        },
        {
            field: 'designSCOrderNo',
            headerName: 'Design SC order No',
            editable: true
        },
        {
            field: 'designSCButtons',
            headerName: 'Design SC Buttons',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Search', 'Refresh', 'Add', 'Delete', 'Update', 'Print', 'Excel'],
            },
        },
        {
            field: 'designAddScreenSelect',
            headerName: 'Design Add Screen Select',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ["Text", "Dropdown", "Date", "File", "Number"]
            },
        },
        {
            field: 'designAddOrderNo',
            headerName: 'Design Add order No',
            editable: true
        },
        {
            field: 'designAddScreenButtons',
            headerName: 'Design Add Screen Buttons',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Save', 'Update'],
            },
        },
    ];

    const defaultColDef = {
        // flex: 1,
        // resizable: true,
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

    const handleRemoveRow = () => {
        setRowData(prev => {
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
                fullType += `(${col.size})`;
            }

            uddScript += `CREATE TYPE [udd_${col.fieldName}] FROM ${fullType};\n`;
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
        const contentRows = objectRowData.filter(row => row.object !== 'DB' && row.object !== 'Table');
        if (!dbName || !objectName ) {
            alert('Please provide DB Name, Table Name and at least one column.');
            return '';
        }

        const tableName = `tbl_${objectName}`;
        let script = `USE [${dbName}];\nGO\n\n`;

        // UDDs
        script += `-- Create UDD (User Defined Data Type)\n`;
        script += getUDDStatements(rows);
        script += `\n-- Create Table\n`;
        script += `CREATE TABLE [${tableName}] (\n`;

        // Build column + constraint lines into array
        const lines = [];

        // Columns
        validRows.forEach(col => {
            let line = `  [${col.fieldName}] [udd_${col.fieldName}]`;
            if (col.notNull) {
                line += ' NOT NULL';
            }
            lines.push(line);
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
        script += ');\nGO';

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

        const contentRows = validRows.filter(row => row.object !== 'DB' && row.object !== 'StoredProcedure');

        if (!dbName || !objectName || contentRows.length === 0) {
            alert('Please provide DB Name, SP Name and at least one column.');
            return '';
        }

        const tableName = `tbl_${objectName}`;
        const procName = `sp_${objectName}`;

        const primaryKeyCol = contentRows.find(col => col.primaryKey);

        const inputParams = contentRows
            .map(col => `    @${col.fieldName} udd_${col.fieldName}`)
            .join(',\n');

        const insertFields = contentRows.map(col => col.fieldName).join(', ');
        const insertValues = contentRows.map(col => `TRIM(@${col.fieldName})`).join(', ');

        const updateAssignments = contentRows
            .filter(col => !col.primaryKey)
            .map(col => `        ${col.fieldName} = TRIM(@${col.fieldName})`)
            .join(',\n');

        const selectFields = contentRows.map(col => col.fieldName).join(', ');

        let script = `USE [${dbName}];\nGO\n\nCREATE PROCEDURE [dbo].[${procName}]\n(\n    @mode udd_mode,\n${inputParams}\n)\nAS\nBEGIN\n`;

        script += `
    IF @mode = 'I'
    BEGIN
        INSERT INTO ${tableName} (${insertFields})
        VALUES (${insertValues})
    END

    ELSE IF @mode = 'U'
    BEGIN
        UPDATE ${tableName}
        SET
${updateAssignments}
        WHERE ${primaryKeyCol.fieldName} = TRIM(@${primaryKeyCol.fieldName})
    END

    ELSE IF @mode = 'D'
    BEGIN
        DELETE FROM ${tableName}
        WHERE ${primaryKeyCol.fieldName} = TRIM(@${primaryKeyCol.fieldName})
    END

    ELSE IF @mode = 'A'
    BEGIN
        SELECT ${selectFields}
        FROM ${tableName}
    END

    ELSE
        BEGIN
            RAISERROR ('plz select the valid mode' ,16,1)
        RETURN;
        END
END`;

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

        // ✅ SQL Folder
        const sqlFolder = zip.folder("sql");

        const tableSQL = getTableSQL();
        if (tableSQL) {
            sqlFolder.file(`tbl_${tableName}.sql`, tableSQL);
            hasFiles = true;
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
        const binaryFields = validRows.filter(col => col.dataType.toLowerCase() === "varbinary");
        const otherFields = validRows.filter(col => col.dataType.toLowerCase() !== "varbinary");
        const getSqlType = (dataType) => {
            switch (dataType.toUpperCase()) {
                case "INT": return "sql.Int";
                case "FLOAT": return "sql.Float";
                case "BIT": return "sql.Bit";
                case "DATE":
                case "DATETIME": return "sql.DateTime";
                case "VARBINARY": return "sql.VarBinary";
                default: return "sql.NVarChar";
            }
        };

        let script = `// Auto-generated Node.js Insert/Update/Delete API for ${procName}\n`;
        ['Insert', 'Update', 'Delete'].forEach(mode => {
            script += `\nconst ${name}${mode} = async (req, res) => {\n`;

            // 1. Destructure non-binary fields
            if (otherFields.length > 0) {
                script += `  const { ${otherFields.map(col => col.fieldName).join(', ')} } = req.body;\n`;
            }

            // 2. Handle binary fields first
            binaryFields.forEach(col => {
                script += `  let ${col.fieldName} = null;\n`;
            });

            // 3. Handle file uploads
            binaryFields.forEach(col => {
                script += `  if (req.file) ${col.fieldName} = req.file.buffer;\n`;
            });

            // 4. Try-catch & pool
            script += `\n  try {\n`;
            script += `    const pool = await sql.connect(dbConfig);\n`;
            script += `    await pool.request()\n`;
            script += `      .input("mode", sql.NVarChar, "${mode[0]}")\n`;

            // 5. Add inputs
            validRows.forEach(col => {
                const sqlType = getSqlType(col.dataType);
                script += `      .input("${col.fieldName}", ${sqlType}, ${col.fieldName})\n`;
            });

            // 6. EXEC + response
            const execParams = ["@mode"].concat(validRows.map(col => `@${col.fieldName}`)).join(", ");
            script += `      .query(\`EXEC ${procName} ${execParams}\`);\n`;
            script += `\n    res.status(200).json({ success: true, message: "Data ${mode.toLowerCase()}d successfully" });\n`;
            script += `  } catch (err) {\n`;
            script += `    console.error("Error during ${mode.toLowerCase()}:", err);\n`;
            script += `    res.status(500).json({ message: err.message || "Internal Server Error" });\n`;
            script += `  }\n`;
            script += `};\n`;
        });

        script += `\nmodule.exports = { ${name}Insert, ${name}Update, ${name}Delete };`;

        return script;
    };

    const getNodeLoopCrudScripts = () => {
        const rows = [];
        if (!gridRef.current || !gridRef.current.api) return "";
        gridRef.current.api.forEachNode((node) => rows.push(node.data));
        const name = objectRowData.find(row => row.object === 'React')?.name;

        if (!name || rows.length === 0) return "";

        const procName = `sp_${name}`;
        const arrayName = `${name}Data`;

        const validRows = getValidRows(rows);
        const fields = validRows.map((col) => col.fieldName);

        const generateLoopFunction = (operationName, mode, successMsg) => {
            let script = `// Auto-generated ${operationName} API for ${procName}\n`;
            script += `const ${operationName} = async (req, res) => {\n`;
            script += `  const ${arrayName} = req.body.${arrayName};\n`;
            script += `  if (!${arrayName} || !${arrayName}.length) {\n`;
            script += `    return res.status(400).json("Invalid or empty ${arrayName} array.");\n`;
            script += `  }\n\n`;
            script += `  try {\n`;
            script += `    const pool = await sql.connect(dbConfig);\n`;
            script += `    for (const item of ${arrayName}) {\n`;
            script += `      await pool.request()\n`;
            script += `        .input("mode", sql.NVarChar, "${mode}")\n`;

            fields.forEach((field) => {
                script += `        .input("${field}", item.${field})\n`;
            });

            script += `        .query(\`EXEC ${procName} @mode, ${fields.map(f => `@${f}`).join(", ")}\`);\n`;
            script += `    }\n`;
            script += `    res.status(200).json("${successMsg}");\n`;
            script += `  } catch (err) {\n`;
            script += `    console.error("Error in ${operationName}:", err);\n`;
            script += `    res.status(500).json({ message: err.message || "Internal Server Error" });\n`;
            script += `  }\n`;
            script += `};\n\n`;
            return script;
        };

        let fullScript = "";
        fullScript += generateLoopFunction(`${name}LoopInsert`, "I", `${name} data inserted successfully`);
        fullScript += generateLoopFunction(`${name}LoopUpdate`, "U", `${name} data updated successfully`);
        fullScript += generateLoopFunction(`${name}LoopDelete`, "D", `${name} data deleted successfully`);
        fullScript += `module.exports = { ${name}LoopInsert, ${name}LoopUpdate, ${name}LoopDelete };`;

        return fullScript;
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
            if (data && data.designAddScreenSelect && data.designAddScreenSelect.trim() !== '') {
                rows.push(data);
            }
        });

        const name = objectRowData.find(row => row.object === 'React')?.name;
        if (!name || rows.length === 0) return "";

        const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);

        // ✅ Sort rows by designSCOrderNo if it's a number, else maintain current order
        const orderedRows = [...rows].sort((a, b) => {
            const aOrder = parseInt(a.designAddOrderNo);
            const bOrder = parseInt(b.designAddOrderNo);

            const aValid = !isNaN(aOrder);
            const bValid = !isNaN(bOrder);

            if (aValid && bValid) return aOrder - bOrder;
            if (aValid) return -1;
            if (bValid) return 1;
            return 0;
        });

        const validRows = getValidRows(orderedRows);

        const inputControls = validRows
            .filter((col) => col.designAddScreenSelect) // Only generate if designSCSelect is not empty
            .map((col) => {
                const label = `            <label className="form-label fw-semibold">${col.fieldName}</label>`;
                const type = col.designAddScreenSelect;

                if (type === "Text") {
                    return `          <div className="col-md-3">\n${label}\n            <input className="form-control" type="text" placeholder="Enter ${col.fieldName}" />\n          </div>`;
                }

                if (type === "Dropdown") {
                    return `          <div className="col-md-3">\n${label}\n            <Select options={[]} placeholder="Select ${col.fieldName}" />\n          </div>`;
                }

                if (type === "Date") {
                    return `          <div className="col-md-3">\n${label}\n            <input className="form-control" type="date" />\n          </div>`;
                }

                if (type === "Number") {
                    return `          <div className="col-md-3">\n${label}\n            <input className="form-control" type="number" />\n          </div>`;
                }

                if (type === "File") {
                    return `          <div className="col-md-3">\n${label}\n            <input className="form-control" type="file" />\n          </div>`;
                }

                return ""; // fallback for unsupported or empty
            })
            .join("\n");

        const buttonIcons = {
            Save: { icon: "save", color: "success" },
            Update: { icon: "floppy", color: "primary" },
        };

        const buttonRows = orderedRows.filter((row) => row.designAddScreenButtons);
        const inputActionButtons = buttonRows
            .filter((row) =>
                ["Save", "Update"].includes(row.designAddScreenButtons)
            )
            .map(
                (row) =>
                    `            <button className="btn btn-outline-${buttonIcons[row.designAddScreenButtons].color}"><i className="bi bi-${buttonIcons[row.designAddScreenButtons].icon}" /></button>`
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

const Add${screenTitle}Screen = () => {

  return (
    <div className="container-fluid p-3">
      <div className="d-flex justify-content-between border border-black rounded-2 p-3 justify-content-between align-items-center mb-3 shadow-sm">
        <h2 className="mb-0 ms-3">Add ${screenTitle}</h2>
          <button type="button" className="close btn btn-outline-danger" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
      </div>

      <div className="card p-3 mb-3 shadow-sm">
        <div className="row g-3">
${inputControls}
          <div className="col-md-3 d-flex align-items-end gap-2">
            ${inputActionButtons}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ${screenTitle}Screen;`;
    };

    const renderReactCodeFromString = (codeString) => {
        try {

            // 1. Remove import/export/ModuleRegistry lines — critical!
            const cleanedCode = codeString
                .replace(/import .*;?$/gm, '')
                .replace(/ModuleRegistry\.registerModules\(.*\);?/gm, '')
                .replace(/provideGlobalGridOptions\(.*\);?/gm, '')
                .replace(/export default .*;?/gm, '');

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

    return (
        <Layout>
        <div className="container-fluid">
            <h2 className="mb-4">Design Studio</h2>
            <div className="row mb-3">
                <div className="col-md-3">
                    <label className="form-label">Object Type:</label>
                    <select
                        className="form-select"
                        value={objectType}
                        onChange={e => setObjectType(e.target.value)}
                    >
                        <option value="DB">DB Name</option>
                        <option value="Table">Table Name</option>
                        <option value="StoredProcedure">SP Name</option>
                        <option value="React">React Name</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <label className="form-label">Object Name:</label>
                    <input
                        className="form-control"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>
            <>
                <div className='d-flex'>
                    <div className="ag-theme-alpine mb-3 me-5 justify-content-start" style={{ height: 200, width: 500 }}>
                        <AgGridReact
                            ref={gridRef}
                            rowData={objectRowData}
                            columnDefs={objectClumnDefs}
                            rowHeight={35}
                            defaultColDef={defaultColDef}
                        />
                    </div>
                </div>
            </>
            <>
                <div className="d-flex justify-content-end">
                    <button className="btn btn-primary rounded-top" onClick={handleAddRow}>
                        +
                    </button>
                    <button className="btn btn-danger rounded-top ms-2" onClick={handleRemoveRow}>
                        -
                    </button>
                </div>

                <div className="ag-theme-alpine" style={{ height: 200 }}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        rowHeight={35}
                    />
                </div>
            </>
            <div className="mt-3">
                <button className="btn btn-success me-2" onClick={generateFiles}>
                    Generate Files
                </button>
                <button className="btn btn-info me-2" onClick={previewTableSQL}>
                    Preview Table SQL
                </button>
                <button className="btn btn-warning me-2" onClick={previewSPCode}>
                    Preview SP Code
                </button>
                <button className="btn btn-warning me-2" onClick={previewNodeSingle}>
                    ⚙️ Preview Node Insert (Single)
                </button>
                <button className="btn btn-dark me-2" onClick={previewNodeLoop}>
                    🔁 Preview Node Insert (Loop)
                </button>
                <button className="btn btn-primary" onClick={handleGenerateBothDesigns}>
                    🧩 Generate Both Designs
                </button>
            </div>
            <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="mb-0">Code Preview:</h4>
                    <button
                        className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <i className="bi bi-check-circle me-1" /> Copied!
                            </>
                        ) : (
                            <>
                                <i className="bi bi-clipboard me-1" /> Copy
                            </>
                        )}
                    </button>
                </div>
                <textarea
                    className="form-control"
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
        </Layout>
    );
};

export default Automation;
