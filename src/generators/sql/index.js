export const getOnlyUDDSQL = (
    rows,
    detailsRowData = [],
    enableAudit = false
) => {

    let sql = "";

    const processed = new Set();

    const allRows = [...rows];

    // Add details rows
    if (detailsRowData && detailsRowData.length > 0) {

        detailsRowData.forEach(detail => {

            if (detail.rows) {
                allRows.push(...detail.rows);
            }

        });
    }

    // Add audit fields
    if (enableAudit) {

        allRows.push(
            {
                fieldName: "company_code",
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

    allRows.forEach(col => {

        if (!col.dataType || !col.fieldName) return;

        const type = col.dataType.toUpperCase();

        const uddName = `udd_${col.fieldName}`;

        if (processed.has(uddName)) return;

        processed.add(uddName);

        sql += `
    CREATE TYPE ${uddName} FROM ${type}
`;
    });

    return sql;
};