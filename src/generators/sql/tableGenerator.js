import {
    getValidRows,
    hasConstraint
} from "../shared/helpers";

// Helper: Sanitize field names by replacing spaces with underscores
const sanitizeFieldName = (name) => name ? name.trim().replace(/\s+/g, '_') : '';

// Helper: Generate UDD Statements
export const getUDDStatements = (rows) => {
    let uddScript = '';

    rows.forEach(col => {
        if (!col.fieldName || !col.dataType) return;

        // SKIP generating UDD statement if Existing UDD is specified
        if (col.existingUDD && col.existingUDD.trim() !== '') return;

        const cleanFieldName = sanitizeFieldName(col.fieldName);
        const dataType = col.dataType.toUpperCase();
        let fullType = dataType;

        // Special handling for VARBINARY
        if (dataType === "VARBINARY") {
            fullType = "VARBINARY(MAX)";
        }
        // Normal handling
        else if (col.size) {
            fullType += `(${col.size})`;
        }

        uddScript += `CREATE TYPE [udd_${cleanFieldName}] FROM ${fullType};\nGO\n`;
    });

    return uddScript;
};

// Helper: Get target data type for table column definition
const getColumnType = (col) => {
    if (col.dataType?.toUpperCase() === "VARBINARY") {
        return "VARBINARY(MAX)";
    }
    if (col.existingUDD && col.existingUDD.trim() !== '') {
        return `[${col.existingUDD.trim()}]`;
    }
    const cleanFieldName = sanitizeFieldName(col.fieldName);
    return `[udd_${cleanFieldName}]`;
};

// Helper: Identity column dynamic creation rule check
const shouldCreateAutoIdentity = (rowsList) => {
    return !rowsList.some(col =>
        hasConstraint(col.constraints, [
            "PK", "PRIMARY KEY",
            "FK", "FOREIGN KEY",
            "NN", "NOT NULL",
            "AI", "IDENTITY"
        ])
    );
};

// ================= TABLE SQL =================
export const getTableSQL = (
    rows,
    objectRowData,
    detailsDataMap = {},
    detailsDefs,
    enableAudit = false,
    detailsTableTypes = {} // 🔹 Track: true = Separate Table, false = Part of Main Table
) => {
    const validRows = getValidRows(rows);

    const dbName = objectRowData.find(row => row.object === 'DB')?.name;
    const tableRow = objectRowData.find(row => row.object === 'Table');
    const objectName = tableRow?.name || '';

    if (!dbName || !objectName) {
        alert('Please provide DB Name, Table Name and at least one column.');
        return '';
    }

    const tableName = `tbl_${sanitizeFieldName(objectName)}`;
    let script = `-- =============================================\n`;
    script += `-- TABLE NAME: ${tableName}\n`;
    script += `-- =============================================\n\n`;
    script += `USE [${dbName}];\nGO\n\n`;

    // 🔹 Generate UDD Types required for Main Table + Merged Detail Fields
    let allMainRowsForUDD = [...validRows];

    validRows.forEach(col => {
        if (col.dataType?.toUpperCase() === "GRID") {
            const rawFieldName = col.fieldName;
            const isSeparateTable = detailsTableTypes[rawFieldName] === true;
            
            // If NOT separate table, merge detail fields into main UDD list
            if (!isSeparateTable) {
                const detailRows = detailsDataMap?.[rawFieldName] || [];
                allMainRowsForUDD.push(...getValidRows(detailRows));
            }
        }
    });

    const uddTypesScript = getOnlyUDDSQL(allMainRowsForUDD, {}, enableAudit);
    if (uddTypesScript && uddTypesScript.trim() !== '') {
        script += `-- =============================================\n`;
        script += `-- UDD Types for ${tableName}\n`;
        script += `-- =============================================\n`;
        script += `${uddTypesScript.trim()}\n\n`;
    }

    // 🔹 Start Main Table Definition
    script += `CREATE TABLE [${tableName}] (\n`;

    const lines = [];

    // Check if auto-identity column is required
    const needsAutoIdentity = shouldCreateAutoIdentity(validRows);

    if (needsAutoIdentity) {
        lines.push(`  [id] INT IDENTITY(1,1) NOT NULL`);
    }

    // Process Main Table Columns
    validRows.forEach(col => {
        const cleanColName = sanitizeFieldName(col.fieldName);
        
        if (col.dataType?.toUpperCase() === "GRID") {
            const isSeparateTable = detailsTableTypes[col.fieldName] === true;

            if (!isSeparateTable) {
                // 🔹 MERGE DETAIL FIELDS DIRECTLY INTO MAIN TABLE
                const detailRows = detailsDataMap?.[col.fieldName] || [];
                const validDetailRows = getValidRows(detailRows);

                validDetailRows.forEach(detailCol => {
                    const cleanDetailColName = sanitizeFieldName(detailCol.fieldName);
                    let line = `  [${cleanDetailColName}] ${getColumnType(detailCol)}`;

                    if (hasConstraint(detailCol.constraints, ["AI", "IDENTITY"])) {
                        line += ' IDENTITY(1,1)';
                    }
                    if (hasConstraint(detailCol.constraints, ["NN", "NOT NULL"])) {
                        line += ' NOT NULL';
                    }
                    if (
                        hasConstraint(detailCol.constraints, ["DF", "DEFAULT"]) &&
                        detailCol.defaultValue
                    ) {
                        line += ` DEFAULT ${detailCol.defaultValue}`;
                    }

                    lines.push(line);
                });
            } else {
                lines.push(`  -- [${cleanColName}] GRID (see details table)`);
            }
        } else {
            let line = `  [${cleanColName}] ${getColumnType(col)}`;

            if (hasConstraint(col.constraints, ["AI", "IDENTITY"])) {
                line += ' IDENTITY(1,1)';
            }

            if (hasConstraint(col.constraints, ["NN", "NOT NULL"])) {
                line += ' NOT NULL';
            }

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

    // Primary Keys
    const primaryKeys = validRows
        .filter(col => hasConstraint(col.constraints, ["PK", "PRIMARY KEY"]))
        .map(col => `[${sanitizeFieldName(col.fieldName)}]`);

    if (primaryKeys.length > 0) {
        lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    } else if (needsAutoIdentity) {
        lines.push(`  PRIMARY KEY ([id])`);
    }

    // Unique constraints
    const uniqueCols = validRows.filter(col => hasConstraint(col.constraints, ["UQ", "UNIQUE"]));
    uniqueCols.forEach(col => {
        lines.push(`  UNIQUE ([${sanitizeFieldName(col.fieldName)}])`);
    });

    // Foreign Keys
    const foreignKeys = validRows.filter(col =>
        hasConstraint(col.constraints, ["FK", "FOREIGN KEY"]) && col.referenceTable && col.referenceColumn
    );
    foreignKeys.forEach(col => {
        lines.push(
            `  FOREIGN KEY ([${sanitizeFieldName(col.fieldName)}]) REFERENCES [tbl_${sanitizeFieldName(col.referenceTable)}]([${sanitizeFieldName(col.referenceColumn)}])`
        );
    });

    // Check constraints
    const checkConstraints = validRows.filter(col =>
        hasConstraint(col.constraints, ["CHK", "CHECK"]) && col.checkCondition
    );
    checkConstraints.forEach(col => {
        lines.push(`  CHECK (${col.checkCondition})`);
    });

    // Audit Columns
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

    // 🔹 SEPARATE DETAILS TABLES (Only executed if user checked "Treat as Separate Table")
    const gridFields = validRows.filter(col => col.dataType?.toUpperCase() === "GRID");

    if (gridFields.length > 0 && detailsDefs) {
        gridFields.forEach(gridCol => {
            const rawFieldName = gridCol.fieldName;
            const isSeparateTable = detailsTableTypes[rawFieldName] === true;

            // Skip if user wants it inside the Main Table
            if (!isSeparateTable) return;

            const detailRows = detailsDataMap?.[rawFieldName] || [];
            if (detailRows.length === 0) return;

            const cleanGridName = sanitizeFieldName(rawFieldName);
            const detailsTableName = `tbl_${cleanGridName}`;

            script += `-- =============================================\n`;
            script += `-- SEPARATE DETAILS TABLE : ${cleanGridName}\n`;
            script += `-- =============================================\n\n`;
            script += `CREATE TABLE [${detailsTableName}] (\n`;

            const detailLines = [];
            const validDetailRows = getValidRows(detailRows);
            const needsDetailAutoIdentity = shouldCreateAutoIdentity(validDetailRows);

            if (needsDetailAutoIdentity) {
                detailLines.push(`  [id] INT IDENTITY(1,1) NOT NULL`);
            }

            validDetailRows.forEach(col => {
                const cleanDetailColName = sanitizeFieldName(col.fieldName);
                let line = `  [${cleanDetailColName}] ${getColumnType(col)}`;

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

            const detailPK = validDetailRows
                .filter(col => hasConstraint(col.constraints, ["PK", "PRIMARY KEY"]))
                .map(col => `[${sanitizeFieldName(col.fieldName)}]`);

            if (detailPK.length > 0) {
                detailLines.push(`  PRIMARY KEY (${detailPK.join(', ')})`);
            } else if (needsDetailAutoIdentity) {
                detailLines.push(`  PRIMARY KEY ([id])`);
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

    Object.values(detailsDataMap || {}).forEach(detailRows => {
        if (Array.isArray(detailRows) && detailRows.length > 0) {
            uddRows.push(...detailRows);
        }
    });

    const uniqueRows = [];
    const map = new Map();

    uddRows.forEach(row => {
        if (!row || !row.fieldName) return;
        if (row.existingUDD && row.existingUDD.trim() !== '') return;

        const cleanKey = sanitizeFieldName(row.fieldName).toLowerCase();

        if (!map.has(cleanKey)) {
            map.set(cleanKey, true);
            uniqueRows.push(row);
        }
    });

    return getUDDStatements(uniqueRows);
};