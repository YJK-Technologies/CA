// ================= NODE.JS CRUD GENERATION SECTION =================

// Helper: Filter valid rows
export const getValidRows = (rows) => {
    return rows.filter(row => row.fieldName && row.fieldName.trim() !== '');
};

// ================= SINGLE CRUD =================
export const getNodeSingleCrudScript = (gridRef, objectRowData, detailsDefs, detailsRowData) => {

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

    // ---------- COMMON BUILDER ----------
    const buildNodeCrud = (funcName, procName, contentRows) => {

        const paramRows = contentRows.filter(col => {
    if (col.dataType?.toUpperCase() === "GRID") return false;

    const field = col.fieldName.toLowerCase();

    // ❌ Do not send auto-generated fields
    

    return true;
});

        const binaryFields = paramRows.filter(col => col.dataType.toLowerCase() === "varbinary");
        const otherFields = paramRows.filter(col => col.dataType.toLowerCase() !== "varbinary");

        let code = "";

        ['Insert', 'Update', 'Delete'].forEach(mode => {

            code += `\nconst ${funcName}${mode} = async (req, res) => {\n`;

            if (otherFields.length > 0) {
                code += `  const {
  ${otherFields.map(col => col.fieldName).join(', ')},
  created_date,
  modified_date,
  created_by,
  modified_by,
  company_code
} = req.body;\n`;
            }

            binaryFields.forEach(col => {
                code += `  let ${col.fieldName} = null;\n`;
                code += `  if (req.file) ${col.fieldName} = req.file.buffer;\n`;
            });

            code += `\n  try {\n`;
            code += `    const pool = await sql.connect(dbConfig);\n`;
            code += `    await pool.request()\n`;
            code += `      .input("mode", sql.NVarChar, "${mode[0]}")\n`;

            paramRows.forEach(col => {
    const sqlType = getSqlType(col);
    code += `      .input("${col.fieldName}", ${sqlType}, ${col.fieldName})\n`;
});

// ✅ ALWAYS ADD AUDIT FIELDS
code += `      .input("company_code", sql.NVarChar, company_code)\n`;
code += `      .input("created_by", sql.NVarChar, created_by)\n`;
code += `      .input("created_date", sql.DateTime, created_date)\n`;
code += `      .input("modified_by", sql.NVarChar, modified_by)\n`;
code += `      .input("modified_date", sql.DateTime, modified_date)\n`;


            const execParams = ["@mode"]
    .concat(paramRows.map(col => `@${col.fieldName}`))
    .concat(["@company_code", "@created_by", "@created_date", "@modified_by", "@modified_date"])
    .join(", ");

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

    // -------- HEADER CRUD --------
    let script = `// Auto-generated Node.js CRUD for ${procName}\n`;

    script += buildNodeCrud(name, procName, validRows);

    // -------- DETAILS CRUD --------
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

// ================= LOOP CRUD =================
export const getNodeLoopCrudScripts = (gridRef, objectRowData, detailsDefs, detailsRowData) => {

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

        const paramRows = contentRows.filter(col => {
    if (col.dataType?.toUpperCase() === "GRID") return false;

    const field = col.fieldName.toLowerCase();

    return true;
});

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

// ✅ ADD AUDIT FIELDS FROM item
script += `        .input("company_code", sql.NVarChar, item.company_code)\n`;
script += `        .input("created_by", sql.NVarChar, item.created_by)\n`;
script += `        .input("created_date", sql.DateTime, item.created_date)\n`;
script += `        .input("modified_by", sql.NVarChar, item.modified_by)\n`;
script += `        .input("modified_date", sql.DateTime, item.modified_date)\n`;


        const execParams = ["@mode"]
    .concat(paramRows.map(col => `@${col.fieldName}`))
    .concat([
  "@company_code",
  "@created_by",
  "@created_date",
  "@modified_by",
  "@modified_date"
])
    .join(", ");

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

    // DETAILS LOOP
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

// ================= ALL SINGLE NODE CRUD =================
export const getAllNodeSingleCrudScripts = () => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {
                        (screen.rowData || []).forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        finalScript += `
// =============================================
// SCREEN : ${screen.screenName}
// SINGLE NODE CRUD
// =============================================

`;

        finalScript += getNodeSingleCrudScript(
            fakeGridRef,
            screen.objectRowData,
            null,
            screen.detailsRowData
        );

        finalScript += `\n\n`;
    });

    return finalScript;
};


// ================= ALL LOOP NODE CRUD =================
export const getAllNodeLoopCrudScripts = () => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {
                        (screen.rowData || []).forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        finalScript += `
// =============================================
// SCREEN : ${screen.screenName}
// LOOP NODE CRUD
// =============================================

`;

        finalScript += getNodeLoopCrudScripts(
            fakeGridRef,
            screen.objectRowData,
            null,
            screen.detailsRowData
        );

        finalScript += `\n\n`;
    });

    return finalScript;
};


// ================= ALL NODE CRUD =================
export const getAllNodeCrudScripts = () => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {
                        (screen.rowData || []).forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        finalScript += `
// =============================================
// SCREEN : ${screen.screenName}
// =============================================

`;

        // ================= SINGLE CRUD =================

        finalScript += `
// =============================================
// SINGLE NODE CRUD
// =============================================

`;

        finalScript += getNodeSingleCrudScript(
            fakeGridRef,
            screen.objectRowData,
            null,
            screen.detailsRowData
        );

        finalScript += `\n`;

        // ================= LOOP CRUD =================

        finalScript += `
// =============================================
// LOOP NODE CRUD
// =============================================

`;

        finalScript += getNodeLoopCrudScripts(
            fakeGridRef,
            screen.objectRowData,
            null,
            screen.detailsRowData
        );

        finalScript += `\n\n`;
    });

    return finalScript;
};