import { getValidRows } from "../shared/helpers";

import { getSqlType } from "./sqlTypeHelper";

// ================= SINGLE CRUD =================
export const getNodeSingleCrudScript = (
    gridRef,
    objectRowData,
    detailsTables = []
) => {

    const rows = [];
    if (!gridRef.current || !gridRef.current.api) return "";

    gridRef.current.api.forEachNode(node => rows.push(node.data));

    const name = objectRowData.find(row => row.object === 'React')?.name;

    if (!name || rows.length === 0) return "";

    const validRows = getValidRows(rows);
    const procName = `sp_${name}`;

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
