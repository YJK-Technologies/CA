export const getOnlyUDDSQL = (
    rows,
    detailsDataMap,
    enableAudit
) => {

    const allRows = [...rows];

// Add audit fields
if (enableAudit) {

    allRows.push(
        {
            fieldName: "company_code",
            dataType: "VARCHAR"
        },
        {
            fieldName: "location_code",
            dataType: "VARCHAR"
        },
        {
            fieldName: "created_by",
            dataType: "VARCHAR"
        },
        {
            fieldName: "created_date",
            dataType: "DATETIME"
        },
        {
            fieldName: "modified_by",
            dataType: "VARCHAR"
        },
        {
            fieldName: "modified_date",
            dataType: "DATETIME"
        }
    );
}

const validRows = allRows.filter(
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