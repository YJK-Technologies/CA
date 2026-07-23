import { getValidRows } from "../shared/helpers";
import { getSqlType } from "./sqlTypeHelper";

// Helper function to check numeric data types
const isNumericType = (dataType) => {
    if (!dataType) return false;
    const numTypes = [
        "INT", "BIGINT", "SMALLINT", "TINYINT", 
        "DECIMAL", "NUMERIC", "FLOAT", "REAL", 
        "MONEY", "SMALLMONEY"
    ];
    return numTypes.includes(dataType.toUpperCase());
};

// ================= SINGLE CRUD =================
export const getNodeSingleCrudScript = (
    gridRef,
    objectRowData,
    detailsTables = [],
    enableAudit = false
) => {

    const rows = [];
    if (!gridRef.current || !gridRef.current.api) return "";

    gridRef.current.api.forEachNode(node => rows.push(node.data));

    const name = objectRowData.find(row => row.object === 'React')?.name;

    if (!name || rows.length === 0) return "";

    const validRows = getValidRows(rows);
    const procName = `sp_${name}`;

    const hasConstraint = (constraints, types = []) => {
        if (!constraints) return false;
        const normalized = constraints.toString().toUpperCase().replace(/\s+/g, ' ').trim();
        return types.some(type => normalized.includes(type.toUpperCase()));
    };

    // ---------- COMMON BUILDER ----------
    const buildNodeCrud = (funcName, procName, contentRows) => {

        const paramRows = contentRows.filter(col => {
            if (col.dataType?.toUpperCase() === "GRID") return false;
            return true;
        });

        // Primary Key Detection
        const primaryKeyCol =
            paramRows.find(col => hasConstraint(col.constraints, ["PK", "PRIMARY KEY"])) ||
            paramRows.find(col => hasConstraint(col.constraints, ["AI", "IDENTITY"])) ||
            paramRows[0];

        let code = "";

        ['Insert', 'Update', 'Delete'].forEach(mode => {

            code += `\nconst ${funcName}${mode} = async (req, res) => {\n`;

            // 1. Destructuring: Delete mode gets ONLY PK + Audit Codes
            let reqBodyFields = [];

            if (mode === 'Delete') {
                if (primaryKeyCol) {
                    reqBodyFields.push(primaryKeyCol.fieldName);
                }
                if (enableAudit) {
                    reqBodyFields.push("company_code", "location_code");
                }
            } else {
                const otherFields = paramRows.filter(col => col.dataType.toLowerCase() !== "varbinary");
                reqBodyFields = otherFields.map(col => col.fieldName);

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
                code += `  const {\n    ${reqBodyFields.join(',\n    ')}\n  } = req.body;\n`;
            }

            if (mode !== 'Delete') {
                const binaryFields = paramRows.filter(col => col.dataType.toLowerCase() === "varbinary");
                binaryFields.forEach(col => {
                    code += `  let ${col.fieldName} = null;\n`;
                    code += `  if (req.file) ${col.fieldName} = req.file.buffer;\n`;
                });
            }

            code += `\n  try {\n`;
            code += `    const pool = await sql.connect(dbConfig);\n`;
            code += `    await pool.request()\n`;
            code += `      .input("mode", sql.NVarChar, "${mode[0]}")\n`;

            // 2. Input Bindings: Delete mode ONLY binds PK & Audit Codes
            if (mode === 'Delete') {
                if (primaryKeyCol) {
                    const sqlType = getSqlType(primaryKeyCol);
                    code += `      .input("${primaryKeyCol.fieldName}", ${sqlType}, ${primaryKeyCol.fieldName})\n`;
                }
                if (enableAudit) {
                    code += `      .input("company_code", sql.NVarChar, company_code)\n`;
                    code += `      .input("location_code", sql.NVarChar, location_code)\n`;
                }
            } else {
                paramRows.forEach(col => {
                    const sqlType = getSqlType(col);
                    code += `      .input("${col.fieldName}", ${sqlType}, ${col.fieldName})\n`;
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

            // 3. EXEC Query String Construction (Positional Matching)
            const execParamsList = ["@mode"];

            paramRows.forEach(col => {
                if (mode === 'Delete') {
                    if (col.fieldName === primaryKeyCol?.fieldName) {
                        execParamsList.push(`@${col.fieldName}`);
                    } else {
                        // Integer/Decimal = 0, String/Other = ''
                        execParamsList.push(isNumericType(col.dataType) ? "0" : "''");
                    }
                } else {
                    execParamsList.push(`@${col.fieldName}`);
                }
            });

            if (enableAudit) {
                execParamsList.push("@company_code", "@location_code");

                if (mode === 'Insert') {
                    execParamsList.push("@created_by", "@created_date", "''", "''");
                } else if (mode === 'Update') {
                    execParamsList.push("''", "''", "@modified_by", "@modified_date");
                } else if (mode === 'Delete') {
                    // In delete mode, created & modified fields are passed as blank strings
                    execParamsList.push("''", "''", "''", "''");
                }
            }

            const execParams = execParamsList.join(", ");

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

    // -------- MULTI DETAILS CRUD --------
    let exportFunctions = [
        `${name}Insert`,
        `${name}Update`,
        `${name}Delete`
    ];

    if (detailsTables && detailsTables.length > 0) {

        detailsTables.forEach(detailTable => {

            const gridName = detailTable.gridName;

            const detailRows =
                detailTable.rowData?.filter(r => r.fieldName) || [];

            if (detailRows.length === 0) return;

            const detailsProcName = `sp_${name}_${gridName}`;

            script += `\n\n// ---- ${gridName} DETAILS CRUD ----\n`;

            script += buildNodeCrud(
                `${name}${gridName}`,
                detailsProcName,
                detailRows
            );

            exportFunctions.push(
                `${name}${gridName}Insert`,
                `${name}${gridName}Update`,
                `${name}${gridName}Delete`
            );
        });
    }

    script += `\nmodule.exports = { ${exportFunctions.join(", ")} };`;

    return script;
};