import { getValidRows } from "../shared/helpers";
import { getSqlType } from "./sqlTypeHelper";

const isNumericType = (dataType) => {
    if (!dataType) return false;
    const numTypes = [
        "INT", "BIGINT", "SMALLINT", "TINYINT", 
        "DECIMAL", "NUMERIC", "FLOAT", "REAL", 
        "MONEY", "SMALLMONEY"
    ];
    return numTypes.includes(dataType.toUpperCase());
};

const formatIdentifier = (str) => {
    if (!str) return "";
    return str.replace(/[^a-zA-C0-9_$]/gi, "_").replace(/_+/g, "_");
};

const formatProcedureName = (str) => {
    if (!str) return "";
    return str.replace(/\s+/g, "_");
};

export const getNodeLoopCrudScripts = (
    rows,
    objectRowData,
    detailsTables = [],
    enableAudit = false,
    detailsTableTypes = {} // 🔹 Track toggle state: true = Separate Table, false = Part of Main Table
) => {
    const rawName = objectRowData.find(row => row.object === 'React')?.name;

    if (!rawName || rows.length === 0) return "";

    const cleanName = formatIdentifier(rawName);
    const validRows = getValidRows(rows);
    const procName = formatProcedureName(`sp_${rawName}`);
    const arrayName = `${cleanName}Data`;

    const hasConstraint = (constraints, types = []) => {
        if (!constraints) return false;
        const normalized = constraints.toString().toUpperCase().replace(/\s+/g, ' ').trim();
        return types.some(type => normalized.includes(type.toUpperCase()));
    };

    const generateLoopFunction = (funcName, spProcName, loopArrayName, contentRows, mode, successMsg) => {
        const paramRows = contentRows.filter(col => col.dataType?.toUpperCase() !== "GRID");

        // PK detection
        let primaryKeyCol =
            paramRows.find(col => hasConstraint(col.constraints, ["PK", "PRIMARY KEY"])) ||
            paramRows.find(col => hasConstraint(col.constraints, ["AI", "IDENTITY"]));

        if (!primaryKeyCol) {
            const hasFKOrNotNull = paramRows.some(col => 
                hasConstraint(col.constraints, ["FK", "FOREIGN KEY", "NOT NULL"])
            );

            if (!hasFKOrNotNull) {
                const explicitIdCol = paramRows.find(col => (col.fieldName || '').toLowerCase() === 'id');
                primaryKeyCol = explicitIdCol || { fieldName: "id", dataType: "INT", isDefaultFallback: true };
            }
        }

        const deleteKeyCols = paramRows.filter(col => 
            hasConstraint(col.constraints, ["PK", "PRIMARY KEY", "FK", "FOREIGN KEY"]) ||
            col.fieldName === primaryKeyCol?.fieldName
        );

        let script = `// Auto-generated ${funcName} API for ${spProcName}\n`;

        script += `const ${funcName} = async (req, res) => {\n`;
        script += `  const ${loopArrayName} = req.body.${loopArrayName};\n`;

        script += `  if (!${loopArrayName} || !${loopArrayName}.length) {\n`;
        script += `    return res.status(400).json("Invalid or empty ${loopArrayName} array.");\n`;
        script += `  }\n\n`;

        script += `  try {\n`;
        script += `    const pool = await sql.connect(dbConfig);\n`;

        script += `    for (const item of ${loopArrayName}) {\n`;
        script += `      await pool.request()\n`;
        script += `        .input("mode", sql.NVarChar, "${mode}")\n`;

        if (mode === 'D') {
            const deleteColsToInput = deleteKeyCols.length > 0 ? deleteKeyCols : (primaryKeyCol ? [primaryKeyCol] : []);
            deleteColsToInput.forEach(col => {
                const sqlType = getSqlType(col);
                const cleanFieldName = formatIdentifier(col.fieldName);
                script += `        .input("${cleanFieldName}", ${sqlType}, item.${cleanFieldName})\n`;
            });
            if (enableAudit) {
                script += `        .input("company_code", sql.NVarChar, item.company_code)\n`;
                script += `        .input("location_code", sql.NVarChar, item.location_code)\n`;
            }
        } else {
            if (mode === 'U' && primaryKeyCol && primaryKeyCol.isDefaultFallback && !paramRows.some(c => c.fieldName === primaryKeyCol.fieldName)) {
                const sqlType = getSqlType(primaryKeyCol);
                const cleanPkName = formatIdentifier(primaryKeyCol.fieldName);
                script += `        .input("${cleanPkName}", ${sqlType}, item.${cleanPkName})\n`;
            }

            paramRows.forEach((col) => {
                const sqlType = getSqlType(col);
                const cleanFieldName = formatIdentifier(col.fieldName);
                script += `        .input("${cleanFieldName}", ${sqlType}, item.${cleanFieldName})\n`;
            });

            if (enableAudit) {
                script += `        .input("company_code", sql.NVarChar, item.company_code)\n`;
                script += `        .input("location_code", sql.NVarChar, item.location_code)\n`;

                if (mode === 'I') {
                    script += `        .input("created_by", sql.NVarChar, item.created_by)\n`;
                    script += `        .input("created_date", sql.DateTime, item.created_date)\n`;
                } else if (mode === 'U') {
                    script += `        .input("modified_by", sql.NVarChar, item.modified_by)\n`;
                    script += `        .input("modified_date", sql.DateTime, item.modified_date)\n`;
                }
            }
        }

        const execParamsList = ["@mode"];

        if (primaryKeyCol && primaryKeyCol.isDefaultFallback && !paramRows.some(c => c.fieldName === primaryKeyCol.fieldName)) {
            if (mode === 'I') {
                execParamsList.push("0");
            } else {
                execParamsList.push(`@${formatIdentifier(primaryKeyCol.fieldName)}`);
            }
        }

        paramRows.forEach(col => {
            const cleanFieldName = formatIdentifier(col.fieldName);
            if (mode === 'D') {
                const isKeyCol = deleteKeyCols.some(k => k.fieldName === col.fieldName);
                if (isKeyCol) {
                    execParamsList.push(`@${cleanFieldName}`);
                } else {
                    execParamsList.push(isNumericType(col.dataType) ? "0" : "''");
                }
            } else {
                execParamsList.push(`@${cleanFieldName}`);
            }
        });

        if (enableAudit) {
            execParamsList.push("@company_code", "@location_code");

            if (mode === 'I') {
                execParamsList.push("@created_by", "@created_date", "''", "''");
            } else if (mode === 'U') {
                execParamsList.push("''", "''", "@modified_by", "@modified_date");
            } else if (mode === 'D') {
                execParamsList.push("''", "''", "''", "''");
            }
        }

        const execParams = execParamsList.join(", ");

        script += `        .query(\`EXEC ${spProcName} ${execParams}\`);\n`;
        script += `    }\n`;

        script += `    res.status(200).json("${successMsg}");\n`;

        script += `  } catch (err) {\n`;
        script += `    console.error("Error in ${funcName}:", err);\n`;
        script += `    res.status(500).json({ message: err.message || "Internal Server Error" });\n`;
        script += `  }\n`;
        script += `};\n\n`;

        return script;
    };

    // 🔹 Merge Detail fields into Main Table rows if toggle is OFF (false)
    let allMainRows = [];

    validRows.forEach(col => {
        if (col.dataType?.toUpperCase() === "GRID") {
            const rawGridName = col.fieldName;
            const isSeparateTable = detailsTableTypes[rawGridName] === true;

            if (!isSeparateTable) {
                // Find matching details table data and append to main rows
                const matchTable = detailsTables.find(dt => dt.gridName === rawGridName);
                if (matchTable && matchTable.rowData) {
                    const validDetailRows = getValidRows(matchTable.rowData);
                    allMainRows.push(...validDetailRows);
                }
            }
        } else {
            allMainRows.push(col);
        }
    });

    let script = `// ---------- HEADER LOOP CRUD ----------\n`;

    script += generateLoopFunction(`${cleanName}LoopInsert`, procName, arrayName, allMainRows, "I", `${cleanName} data inserted successfully`);
    script += generateLoopFunction(`${cleanName}LoopUpdate`, procName, arrayName, allMainRows, "U", `${cleanName} data updated successfully`);
    script += generateLoopFunction(`${cleanName}LoopDelete`, procName, arrayName, allMainRows, "D", `${cleanName} data deleted successfully`);

    let exportFunctions = [
        `${cleanName}LoopInsert`,
        `${cleanName}LoopUpdate`,
        `${cleanName}LoopDelete`
    ];

    // 🔹 Generate Loop CRUD for separate details tables ONLY if toggle is ON (true)
    if (detailsTables && detailsTables.length > 0) {
        detailsTables.forEach(detailTable => {
            const rawGridName = detailTable.gridName;
            const isSeparateTable = detailsTableTypes[rawGridName] === true;

            // Skip generating separate Loop functions if user chose main table merge
            if (!isSeparateTable) return;

            const cleanGridName = formatIdentifier(rawGridName);
            const detailRows = detailTable.rowData?.filter(r => r.fieldName) || [];

            if (detailRows.length === 0) return;

            const detailsProcName = formatProcedureName(`sp_${rawName}_${rawGridName}`);
            const detailsArrayName = `${cleanName}_${cleanGridName}Data`;
            const baseFuncName = `${cleanName}_${cleanGridName}`;

            script += `\n// ---------- ${rawGridName} DETAILS LOOP CRUD ----------\n`;

            script += generateLoopFunction(
                `${baseFuncName}LoopInsert`,
                detailsProcName,
                detailsArrayName,
                detailRows,
                "I",
                `${rawGridName} inserted successfully`
            );

            script += generateLoopFunction(
                `${baseFuncName}LoopUpdate`,
                detailsProcName,
                detailsArrayName,
                detailRows,
                "U",
                `${rawGridName} updated successfully`
            );

            script += generateLoopFunction(
                `${baseFuncName}LoopDelete`,
                detailsProcName,
                detailsArrayName,
                detailRows,
                "D",
                `${rawGridName} deleted successfully`
            );

            exportFunctions.push(
                `${baseFuncName}LoopInsert`,
                `${baseFuncName}LoopUpdate`,
                `${baseFuncName}LoopDelete`
            );
        });
    }

    script += `module.exports = { ${exportFunctions.join(", ")} };`;

    return script;
};