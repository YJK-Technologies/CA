export const getOnlyUDDSQL = (
    rows,
    detailsDataMap,
    enableAudit
) => {

    const validRows = rows.filter(
        row => row.fieldName && row.fieldName.trim() !== ""
    );

    let sql = "";

    validRows.forEach(row => {

        const field = row.fieldName;
        const type = row.dataType || "VARCHAR";

        const length =
    row.size &&
    !["INT", "BIGINT", "DATE", "DATETIME", "BIT", "FLOAT", "TEXT"].includes(type.toUpperCase())
        ? `(${row.size})`
        : "";

        sql += `CREATE TYPE udd_${field} FROM ${type}${length};\nGO\n\n`;
    });

    return sql;
};