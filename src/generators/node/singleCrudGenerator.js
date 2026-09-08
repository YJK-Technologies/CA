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

export const getNodeSingleCrudScript = (
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

    const hasConstraint = (constraints, types = []) => {
        if (!constraints) return false;
        const normalized = constraints.toString().toUpperCase().replace(/\s+/g, ' ').trim();
        return types.some(type => normalized.includes(type.toUpperCase()));
    };

    const buildNodeCrud = (funcName, spProcName, contentRows) => {
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

        let code = "";

        ['Insert', 'Update', 'Delete'].forEach(mode => {
            const modePastTense = mode === 'Insert' ? 'inserted' : mode === 'Update' ? 'updated' : 'deleted';

            code += `\nconst ${funcName}${mode} = async (req, res) => {\n`;

            let reqBodyFields = [];

            if (mode === 'Delete') {
                if (deleteKeyCols.length > 0) {
                    reqBodyFields = deleteKeyCols.map(c => formatIdentifier(c.fieldName));
                } else if (primaryKeyCol) {
                    reqBodyFields.push(formatIdentifier(primaryKeyCol.fieldName));
                }
                if (enableAudit) {
                    reqBodyFields.push("company_code", "location_code");
                }
            } else {
                const otherFields = paramRows.filter(col => (col.dataType || '').toLowerCase() !== "varbinary");
                reqBodyFields = otherFields.map(col => formatIdentifier(col.fieldName));

                const cleanPkName = primaryKeyCol ? formatIdentifier(primaryKeyCol.fieldName) : '';
                if (mode === 'Update' && primaryKeyCol && !reqBodyFields.includes(cleanPkName)) {
                    reqBodyFields.unshift(cleanPkName);
                }

                if (enableAudit) {
                    reqBodyFields.push("company_code", "location_code");
                    if (mode === 'Insert') {
                        reqBodyFields.push("created_by", "created_date");
                    } else {
                        reqBodyFields.push("modified_by", "modified_date");
                    }
                }
            }

            if (reqBodyFields.length > 0) {
                code += `  const { ${reqBodyFields.join(', ')} } = req.body;\n`;
            }

            if (mode !== 'Delete') {
                const binaryFields = paramRows.filter(col => (col.dataType || '').toLowerCase() === "varbinary");
                binaryFields.forEach(col => {
                    const cleanFieldName = formatIdentifier(col.fieldName);
                    code += `  let ${cleanFieldName} = null;\n`;
                    code += `  if (req.file) ${cleanFieldName} = req.file.buffer;\n`;
                });
            }

            code += `\n  try {\n`;
            code += `    const pool = await sql.connect(dbConfig);\n`;
            code += `    await pool.request()\n`;
            code += `      .input("mode", sql.NVarChar, "${mode[0]}")\n`;

            if (mode === 'Delete') {
                const deleteColsToInput = deleteKeyCols.length > 0 ? deleteKeyCols : (primaryKeyCol ? [primaryKeyCol] : []);
                deleteColsToInput.forEach(col => {
                    const sqlType = getSqlType(col);
                    const cleanFieldName = formatIdentifier(col.fieldName);
                    code += `      .input("${cleanFieldName}", ${sqlType}, ${cleanFieldName})\n`;
                });
                if (enableAudit) {
                    code += `      .input("company_code", sql.NVarChar, company_code)\n`;
                    code += `      .input("location_code", sql.NVarChar, location_code)\n`;
                }
            } else {
                if (mode === 'Update' && primaryKeyCol && !paramRows.some(c => c.fieldName === primaryKeyCol.fieldName)) {
                    const sqlType = getSqlType(primaryKeyCol);
                    const cleanPkName = formatIdentifier(primaryKeyCol.fieldName);
                    code += `      .input("${cleanPkName}", ${sqlType}, ${cleanPkName})\n`;
                }

                paramRows.forEach(col => {
                    const sqlType = getSqlType(col);
                    const cleanFieldName = formatIdentifier(col.fieldName);
                    code += `      .input("${cleanFieldName}", ${sqlType}, ${cleanFieldName})\n`;
                });

                if (enableAudit) {
                    code += `      .input("company_code", sql.NVarChar, company_code)\n`;
                    code += `      .input("location_code", sql.NVarChar, location_code)\n`;

                    if (mode === 'Insert') {
                        code += `      .input("created_by", sql.NVarChar, created_by)\n`;
                        code += `      .input("created_date", sql.DateTime, created_date)\n`;
                    } else {
                        code += `      .input("modified_by", sql.NVarChar, modified_by)\n`;
                        code += `      .input("modified_date", sql.DateTime, modified_date)\n`;
                    }
                }
            }

            const execParamsList = ["@mode"];

            if (primaryKeyCol && primaryKeyCol.isDefaultFallback && !paramRows.some(c => c.fieldName === primaryKeyCol.fieldName)) {
                if (mode === 'Insert') {
                    execParamsList.push("0");
                } else {
                    execParamsList.push(`@${formatIdentifier(primaryKeyCol.fieldName)}`);
                }
            }

            paramRows.forEach(col => {
                const cleanFieldName = formatIdentifier(col.fieldName);
                if (mode === 'Delete') {
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

                if (mode === 'Insert') {
                    execParamsList.push("@created_by", "@created_date", "''", "''");
                } else if (mode === 'Update') {
                    execParamsList.push("''", "''", "@modified_by", "@modified_date");
                } else if (mode === 'Delete') {
                    execParamsList.push("''", "''", "''", "''");
                }
            }

            const execParams = execParamsList.join(", ");

            code += `      .query(\`EXEC ${spProcName} ${execParams}\`);\n`;
            code += `\n    res.status(200).json({ success: true, message: "${funcName.replace(/_/g, ' ')} ${modePastTense} successfully" });\n`;
            code += `  } catch (err) {\n`;
            code += `    console.error("Error during ${funcName.replace(/_/g, ' ')} ${mode.toLowerCase()}:", err);\n`;
            code += `    res.status(500).json({ message: err.message || "Internal Server Error" });\n`;
            code += `  }\n`;
            code += `};\n`;
        });

        return code;
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

    let script = `// Auto-generated Node.js CRUD for ${procName}\n`;
    script += buildNodeCrud(cleanName, procName, allMainRows);

    let exportFunctions = [
        `${cleanName}Insert`,
        `${cleanName}Update`,
        `${cleanName}Delete`
    ];

    // 🔹 Generate CRUD for separate details tables ONLY if toggle is ON (true)
    if (detailsTables && detailsTables.length > 0) {
        detailsTables.forEach(detailTable => {
            const rawGridName = detailTable.gridName;
            const isSeparateTable = detailsTableTypes[rawGridName] === true;

            // Skip generating separate CRUD functions if user chose main table merge
            if (!isSeparateTable) return;

            const cleanGridName = formatIdentifier(rawGridName);
            const detailRows = detailTable.rowData?.filter(r => r.fieldName) || [];

            if (detailRows.length === 0) return;

            const detailsProcName = formatProcedureName(`sp_${rawName}_${rawGridName}`);
            const detailFuncName = `${cleanName}_${cleanGridName}`;

            script += `\n\n// ---- ${rawGridName} DETAILS CRUD ----\n`;

            script += buildNodeCrud(
                detailFuncName,
                detailsProcName,
                detailRows
            );

            exportFunctions.push(
                `${detailFuncName}Insert`,
                `${detailFuncName}Update`,
                `${detailFuncName}Delete`
            );
        });
    }

    script += `\nmodule.exports = { ${exportFunctions.join(", ")} };`;

    return script;
};