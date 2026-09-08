const sanitizeFieldName = (name) => name ? name.trim().replace(/\s+/g, '_') : '';

export const getOnlyUDDSQL = (
    rows,
    detailsDataMap,
    enableAudit
) => {
    const allRows = [...rows];

    if (detailsDataMap) {
        Object.values(detailsDataMap).forEach(detailRows => {
            if (Array.isArray(detailRows)) {
                allRows.push(...detailRows);
            }
        });
    }

    if (enableAudit) {
        allRows.push(
            { fieldName: "company_code", dataType: "VARCHAR" },
            { fieldName: "location_code", dataType: "VARCHAR" },
            { fieldName: "created_by", dataType: "VARCHAR" },
            { fieldName: "created_date", dataType: "DATETIME" },
            { fieldName: "modified_by", dataType: "VARCHAR" },
            { fieldName: "modified_date", dataType: "DATETIME" }
        );
    }

    const uniqueRows = [];
    const seen = new Set();

    allRows.forEach(row => {
        if (!row.fieldName) return;

        // 1. SKIP Existing UDD
        if (row.existingUDD && row.existingUDD.trim() !== '') return;

        // 2. SKIP GRID Data Type
        if ((row.dataType || '').toUpperCase() === 'GRID') return;

        const key = sanitizeFieldName(row.fieldName).toLowerCase();

        if (!seen.has(key)) {
            seen.add(key);
            uniqueRows.push(row);
        }
    });

    let sql = "";

    uniqueRows.forEach(row => {
        const type = (row.dataType || "VARCHAR").toUpperCase();
        const cleanFieldName = sanitizeFieldName(row.fieldName);

        const length =
            row.size &&
            !["INT","BIGINT","DATE","DATETIME","BIT","FLOAT","TEXT","VARBINARY"].includes(type)
                ? `(${row.size})`
                : "";

        sql += `CREATE TYPE udd_${cleanFieldName} FROM ${type}${length};\nGO\n\n`;
    });

    return sql;
};

export const getUDDSQLForRows = (rows = [], enableAudit = false) => {
    const allRows = [...rows];

    if (enableAudit) {
        allRows.push(
            { fieldName: "company_code", dataType: "VARCHAR" },
            { fieldName: "location_code", dataType: "VARCHAR" },
            { fieldName: "created_by", dataType: "VARCHAR" },
            { fieldName: "created_date", dataType: "DATETIME" },
            { fieldName: "modified_by", dataType: "VARCHAR" },
            { fieldName: "modified_date", dataType: "DATETIME" }
        );
    }

    const uniqueRows = [];
    const seen = new Set();

    allRows.forEach(row => {
        if (!row.fieldName) return;
        if (row.existingUDD && row.existingUDD.trim() !== '') return;
        if ((row.dataType || '').toUpperCase() === 'GRID') return;

        const key = sanitizeFieldName(row.fieldName).toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            uniqueRows.push(row);
        }
    });

    let sql = "";
    uniqueRows.forEach(row => {
        const type = (row.dataType || "VARCHAR").toUpperCase();
        const cleanFieldName = sanitizeFieldName(row.fieldName);

        const length =
            row.size &&
            !["INT","BIGINT","DATE","DATETIME","BIT","FLOAT","TEXT","VARBINARY"].includes(type)
                ? `(${row.size})`
                : "";

        sql += `CREATE TYPE udd_${cleanFieldName} FROM ${type}${length};\nGO\n\n`;
    });

    return sql;
};