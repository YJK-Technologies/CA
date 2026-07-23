import { getValidRows } from "../shared/helpers";
import { getSqlType } from "./sqlTypeHelper";

// ================= LOOP CRUD =================
export const getNodeLoopCrudScripts = (
    gridRef,
    objectRowData,
    detailsTables = [],
    enableAudit = false
) => {

    const rows = [];
    if (!gridRef.current || !gridRef.current.api) return "";

    gridRef.current.api.forEachNode((node) => rows.push(node.data));

    const name = objectRowData.find(row => row.object === 'React')?.name;

    if (!name || rows.length === 0) return "";

    const validRows = getValidRows(rows);
    const procName = `sp_${name}`;
    const arrayName = `${name}Data`;

    const hasConstraint = (constraints, types = []) => {
        if (!constraints) return false;
        const normalized = constraints.toString().toUpperCase().replace(/\s+/g, ' ').trim();
        return types.some(type => normalized.includes(type.toUpperCase()));
    };

    const generateLoopFunction = (funcName, procName, arrayName, contentRows, mode, successMsg) => {

        const paramRows = contentRows.filter(col => {
            if (col.dataType?.toUpperCase() === "GRID") return false;
            return true;
        });

        // Detect Primary Key (Same as Procedure Logic)
        const primaryKeyCol =
            paramRows.find(col => hasConstraint(col.constraints, ["PK", "PRIMARY KEY"])) ||
            paramRows.find(col => hasConstraint(col.constraints, ["AI", "IDENTITY"])) ||
            paramRows[0];

        // Delete mode-la primary key only, other modes-la all params
        const activeParamRows = (mode === 'D' && primaryKeyCol)
            ? [primaryKeyCol]
            : paramRows;

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

        activeParamRows.forEach((col) => {
            const sqlType = getSqlType(col);
            script += `        .input("${col.fieldName}", ${sqlType}, item.${col.fieldName})\n`;
        });

        // Dynamic Loop Audit Binding based on mode
        const dynamicAuditExecParams = [];

        if (enableAudit) {
            script += `        .input("company_code", sql.NVarChar, item.company_code)\n`;
            script += `        .input("location_code", sql.NVarChar, item.location_code)\n`;
            dynamicAuditExecParams.push("@company_code", "@location_code");

            if (mode === 'I') {
                script += `        .input("created_by", sql.NVarChar, item.created_by)\n`;
                script += `        .input("created_date", sql.DateTime, item.created_date)\n`;

                dynamicAuditExecParams.push("@created_by", "@created_date", "''", "''");
            } else {
                script += `        .input("modified_by", sql.NVarChar, item.modified_by)\n`;
                script += `        .input("modified_date", sql.DateTime, item.modified_date)\n`;

                dynamicAuditExecParams.push("''", "''", "@modified_by", "@modified_date");
            }
        }

        const execParams = ["@mode"]
            .concat(activeParamRows.map(col => `@${col.fieldName}`))
            .concat(dynamicAuditExecParams)
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

    // ---------- MULTI DETAILS LOOP CRUD ----------
    let exportFunctions = [
        `${name}LoopInsert`,
        `${name}LoopUpdate`,
        `${name}LoopDelete`
    ];

    if (detailsTables && detailsTables.length > 0) {

        detailsTables.forEach(detailTable => {

            const gridName = detailTable.gridName;

            const detailRows =
                detailTable.rowData?.filter(r => r.fieldName) || [];

            if (detailRows.length === 0) return;

            const detailsProcName = `sp_${name}_${gridName}`;

            const detailsArrayName = `${name}${gridName}Data`;

            script += `\n// ---------- ${gridName} DETAILS LOOP CRUD ----------\n`;

            script += generateLoopFunction(
                `${name}${gridName}LoopInsert`,
                detailsProcName,
                detailsArrayName,
                detailRows,
                "I",
                `${gridName} inserted successfully`
            );

            script += generateLoopFunction(
                `${name}${gridName}LoopUpdate`,
                detailsProcName,
                detailsArrayName,
                detailRows,
                "U",
                `${gridName} updated successfully`
            );

            script += generateLoopFunction(
                `${name}${gridName}LoopDelete`,
                detailsProcName,
                detailsArrayName,
                detailRows,
                "D",
                `${gridName} deleted successfully`
            );

            exportFunctions.push(
                `${name}${gridName}LoopInsert`,
                `${name}${gridName}LoopUpdate`,
                `${name}${gridName}LoopDelete`
            );
        });
    }

    script += `module.exports = { ${exportFunctions.join(", ")} };`;

    return script;
};