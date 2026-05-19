export const getOnlyUDDSQL = (
    gridRef,
    objectRowData,
    detailsRowData,
    detailsDefs,
    enableAudit
) => {

    const rows = [];

    gridRef?.current?.api?.forEachNode(node => {
        rows.push(node.data);
    });

    const validRows = rows.filter(
        row => row.fieldName && row.fieldName.trim() !== ""
    );

    let sql = "";

    validRows.forEach(row => {

        const field = row.fieldName;
        const type = row.dataType || "VARCHAR";
        const length = row.length ? `(${row.length})` : "";

        sql += `CREATE TYPE udd_${field} FROM ${type}${length};\nGO\n\n`;
    });

    return sql;
};