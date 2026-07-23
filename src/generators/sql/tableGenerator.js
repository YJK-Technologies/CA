import {
    getValidRows,
    hasConstraint
} from "../shared/helpers";

// Helper: Generate UDD Statements
export const getUDDStatements = (rows) => {
    let uddScript = '';

    rows.forEach(col => {
        if (!col.fieldName || !col.dataType) return;

        const dataType = col.dataType.toUpperCase();
        let fullType = dataType;

        // ✅ Special handling for VARBINARY
        if (dataType === "VARBINARY") {
            fullType = "VARBINARY(MAX)";
        }
        // Normal handling
        else if (col.size) {
            fullType += `(${col.size})`;
        }

        uddScript += `CREATE TYPE [udd_${col.fieldName}] FROM ${fullType};\nGO\n`;
    });

    return uddScript;
};

// ================= TABLE SQL =================
export const getTableSQL = (
    gridRef,
    objectRowData,
    detailsDataMap,
    detailsDefs,
    enableAudit
) => {

    const rows = [];

    if (!gridRef.current || !gridRef.current.api) {
        alert('Grid is not ready yet!');
        return '';
    }

    gridRef.current.api.forEachNode(node => {
        if (node && node.data) {
            rows.push(node.data);
        }
    });

    const validRows = getValidRows(rows);

    const dbName = objectRowData.find(row => row.object === 'DB')?.name;
    const tableRow = objectRowData.find(row => row.object === 'Table');
    const objectName = tableRow?.name || '';

    if (!dbName || !objectName) {
        alert('Please provide DB Name, Table Name and at least one column.');
        return '';
    }

    const tableName = `tbl_${objectName}`;
    let script = `USE [${dbName}];\nGO\n\n`;

    script += `\n-- Create Main Table\n`;
    script += `CREATE TABLE [${tableName}] (\n`;

    const lines = [];

    // Columns
    validRows.forEach(col => {
        if (col.dataType === "GRID") {
            lines.push(`  -- [${col.fieldName}] GRID (see details table)`);
        } else {

            let line = '';

            if (col.dataType?.toUpperCase() === "VARBINARY") {
                line = `  [${col.fieldName}] VARBINARY(MAX)`;
            } else {
                line = `  [${col.fieldName}] [udd_${col.fieldName}]`;
            }

            // Auto Increment
            if (hasConstraint(col.constraints, ["AI", "IDENTITY"])) {
                line += ' IDENTITY(1,1)';
            }

            // Not Null
            if (hasConstraint(col.constraints, ["NN", "NOT NULL"])) {
                line += ' NOT NULL';
            }

            // ❌ Remove DEFAULT for audit fields
            if (
                hasConstraint(col.constraints, ["DF", "DEFAULT"]) &&
                col.defaultValue &&
                !['created_date', 'modified_date'].includes(col.fieldName.toLowerCase())
            ) {
                line += ` DEFAULT ${col.defaultValue}`;
            }

            lines.push(line);
        }
    });

    // Primary Key
    const primaryKeys = rows.filter(col => hasConstraint(col.constraints, ["PK", "PRIMARY KEY"])).map(col => `[${col.fieldName}]`);
    if (primaryKeys.length > 0) {
        lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    }

    // UNIQUE Constraints (NEW ✅)
    const uniqueCols = rows.filter(col => hasConstraint(col.constraints, ["UQ", "UNIQUE"]));

    uniqueCols.forEach(col => {
        lines.push(`  UNIQUE ([${col.fieldName}])`);
    });

    // Foreign Keys
    const foreignKeys = rows.filter(col =>
        hasConstraint(col.constraints, ["FK", "FOREIGN KEY"]) && col.referenceTable && col.referenceColumn
    );
    foreignKeys.forEach(col => {
        lines.push(
            `  FOREIGN KEY ([${col.fieldName}]) REFERENCES [tbl_${col.referenceTable}]([${col.referenceColumn}])`
        );
    });

    // CHECK Constraints (NEW 🔥)
    const checkConstraints = rows.filter(col =>
        hasConstraint(col.constraints, ["CHK", "CHECK"]) && col.checkCondition
    );

    checkConstraints.forEach(col => {
        lines.push(`  CHECK (${col.checkCondition})`);
    });

    // ✅ ADD AUDIT COLUMNS BEFORE CLOSING TABLE
    if (enableAudit) {
        lines.push(`  [company_code] [udd_company_code] NOT NULL`);
        lines.push(`  [location_code] [udd_location_no] NOT NULL`);
        lines.push(`  [created_by] [udd_created_by] NOT NULL`);
        lines.push(`  [created_date] [udd_created_date]`);
        lines.push(`  [modified_by] [udd_modified_by]`);
        lines.push(`  [modified_date] [udd_modified_date]`);
    }

    script += lines.join(',\n') + '\n';
    script += ');\nGO\n\n';

    // DETAILS TABLE
    // DETAILS TABLES
const gridFields =
    rows.filter(col =>
        col.dataType?.toUpperCase() === "GRID"
    );

if (gridFields.length > 0 && detailsDefs) {

    gridFields.forEach(gridCol => {

        // GET DETAILS OF CURRENT GRID
        const detailRows =
            detailsDataMap?.[gridCol.fieldName] || [];

        // SKIP EMPTY GRID
        if (detailRows.length === 0) {
            return;
        }

        // TABLE NAME
        const detailsTableName =
            `tbl_${gridCol.fieldName}`;

        script += `USE [${dbName}];\nGO\n\n`;

        script +=
`-- =============================================
-- DETAILS TABLE : ${gridCol.fieldName}
-- =============================================

`;

        // CREATE TABLE
        script += `CREATE TABLE [${detailsTableName}] (\n`;

        const detailLines = [];

        detailRows.forEach(col => {
                let line = '';

                if (col.dataType?.toUpperCase() === "VARBINARY") {
                    line = `  [${col.fieldName}] VARBINARY(MAX)`;
                } else {
                    line = `  [${col.fieldName}] [udd_${col.fieldName}]`;
                }

                if (hasConstraint(col.constraints, ["AI", "IDENTITY"])) {
                    line += ' IDENTITY(1,1)';
                }

                if (hasConstraint(col.constraints, ["NN", "NOT NULL"])) {
                    line += ' NOT NULL';
                }

                if (hasConstraint(col.constraints, ["DF", "DEFAULT"]) && col.defaultValue) {
                    line += ` DEFAULT ${col.defaultValue}`;
                }
                detailLines.push(line);
            });

            const detailPK = detailRows.filter(col => hasConstraint(col.constraints, ["PK", "PRIMARY KEY"])).map(col => `[${col.fieldName}]`);
            if (detailPK.length > 0) {
                detailLines.push(`  PRIMARY KEY (${detailPK.join(', ')})`);
            }

            const detailFK = detailRows.filter(col =>
                hasConstraint(col.constraints, ["FK", "FOREIGN KEY"]) && col.referenceTable && col.referenceColumn
            );
            detailFK.forEach(col => {
                detailLines.push(
                    `  FOREIGN KEY ([${col.fieldName}]) REFERENCES [tbl_${col.referenceTable}]([${col.referenceColumn}])`
                );
            });

            // CHECK Constraints for Details Table (NEW 🔥)
            const detailCHK = detailRows.filter(col =>
                hasConstraint(col.constraints, ["CHK", "CHECK"]) && col.checkCondition
            );

            detailCHK.forEach(col => {
                detailLines.push(`  CHECK (${col.checkCondition})`);
            });

            // ✅ Audit for Details Table
            if (enableAudit) {
                detailLines.push(`  [company_code] [udd_company_code] NOT NULL`);
                detailLines.push(`  [location_code] [udd_location_no] NOT NULL`);
                detailLines.push(`  [created_by] [udd_created_by] NOT NULL`);
                detailLines.push(`  [created_date] [udd_created_date]`);
                detailLines.push(`  [modified_by] [udd_modified_by]`);
                detailLines.push(`  [modified_date] [udd_modified_date]`);
            }

            script += detailLines.join(',\n') + '\n';
            script += ');\nGO\n\n';
        });
    }

    return script;
};

export const getOnlyUDDSQL = (
    rows,
    detailsDataMap = {},
    enableAudit = false
) => {

    let uddRows = [...rows];

    // Audit fields
    if (enableAudit) {
        uddRows.push(
            { fieldName: 'company_code', dataType: 'VARCHAR', size: '18' },
            { fieldName: 'location_code', dataType: 'VARCHAR', size: '18' },
            { fieldName: 'created_by', dataType: 'VARCHAR', size: '18' },
            { fieldName: 'created_date', dataType: 'DATETIME' },
            { fieldName: 'modified_by', dataType: 'VARCHAR', size: '18' },
            { fieldName: 'modified_date', dataType: 'DATETIME' }
        );
    }

    // ALL DETAILS ROWS
Object.values(detailsDataMap || {}).forEach(detailRows => {

    if (detailRows?.length > 0) {
        uddRows.push(...detailRows);
    }

});

    // Remove duplicates
    const uniqueRows = [];

    const map = new Map();

    uddRows.forEach(row => {

        if (!row.fieldName) return;

        const key = row.fieldName.toLowerCase();

        if (!map.has(key)) {
            map.set(key, true);
            uniqueRows.push(row);
        }
    });

    return getUDDStatements(uniqueRows);
};