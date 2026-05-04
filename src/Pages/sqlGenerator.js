// ================= SQL GENERATION SECTION =================

// Helper: Filter valid rows
export const getValidRows = (rows) => {
    return rows.filter(row => row.fieldName && row.fieldName.trim() !== '');
};

// Helper: Generate UDD Statements
export const getUDDStatements = (rows) => {
    let uddScript = '';

    rows.forEach(col => {
        if (!col.fieldName || !col.dataType) return;

        const dataType = col.dataType.toUpperCase();
        let fullType = dataType;

        if (col.size) {
    fullType += `(${col.size})`;
}

        uddScript += `CREATE TYPE [udd_${col.fieldName}] FROM ${fullType};\nGO\n`;
    });

    return uddScript;
};

// ================= TABLE SQL =================
export const getTableSQL = (gridRef, objectRowData, detailsRowData, detailsDefs, enableAudit) => {

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

    if (!dbName || !objectName) {alert('Please provide DB Name, Table Name and at least one column.');
        return '';
    }

    const tableName = `tbl_${objectName}`;
    let script = `USE [${dbName}];\nGO\n\n`;

    // UDD
    script += `-- Create UDD (User Defined Data Type)\n`;
    let uddRows = [...rows];

if (enableAudit) {
    uddRows.push(
        { fieldName: 'company_code', dataType: 'VARCHAR', size: '18' },
        { fieldName: 'created_by', dataType: 'VARCHAR', size: '18' },
        { fieldName: 'created_date', dataType: 'DATETIME' },
        { fieldName: 'modified_by', dataType: 'VARCHAR', size: '18' },
        { fieldName: 'modified_date', dataType: 'DATETIME' }
    );
}

script += getUDDStatements(uddRows);

    script += `\n-- Create Main Table\n`;
    script += `CREATE TABLE [${tableName}] (\n`;

    const lines = [];

    // Columns
    validRows.forEach(col => {
    if (col.dataType === "GRID") {
        lines.push(`  -- [${col.fieldName}] GRID (see details table)`);
    } else {

        let line = `  [${col.fieldName}] [udd_${col.fieldName}]`;

        // Auto Increment
        if (col.constraints?.includes("AI")) {
            line += ' IDENTITY(1,1)';
        }

        // Not Null
        if (col.constraints?.includes("NN")) {
            line += ' NOT NULL';
        }

        // ❌ Remove DEFAULT for audit fields
if (
    col.constraints?.includes("DF") &&
    col.defaultValue &&
    !['created_date', 'modified_date'].includes(col.fieldName.toLowerCase())
) {
    line += ` DEFAULT ${col.defaultValue}`;
}

        lines.push(line);
    }
});

    // Primary Key
    const primaryKeys = rows.filter(col => col.constraints?.includes("PK")).map(col => `[${col.fieldName}]`);
    if (primaryKeys.length > 0) {
        lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    }

    // UNIQUE Constraints (NEW ✅)
const uniqueCols = rows.filter(col => col.constraints?.includes("UQ"));

uniqueCols.forEach(col => {
    lines.push(`  UNIQUE ([${col.fieldName}])`);
});

    // Foreign Keys
    const foreignKeys = rows.filter(col => 
    col.constraints?.includes("FK") && col.referenceTable && col.referenceColumn
);
    foreignKeys.forEach(col => {
        lines.push(
            `  FOREIGN KEY ([${col.fieldName}]) REFERENCES [tbl_${col.referenceTable}]([${col.referenceColumn}])`
        );
    });

    // CHECK Constraints (NEW 🔥)
const checkConstraints = rows.filter(col =>
    col.constraints?.includes("CHK") && col.checkCondition
);

checkConstraints.forEach(col => {
    lines.push(`  CHECK (${col.checkCondition})`);
});

    // ✅ ADD AUDIT COLUMNS BEFORE CLOSING TABLE
if (enableAudit) {
    lines.push(`  [company_code] [udd_company_code]`);
    lines.push(`  [created_by] [udd_created_by]`);
    lines.push(`  [created_date] [udd_created_date]`);
    lines.push(`  [modified_by] [udd_modified_by]`);
    lines.push(`  [modified_date] [udd_modified_date]`);
}

script += lines.join(',\n') + '\n';
script += ');\nGO\n\n';

    // DETAILS TABLE
    const gridFields = rows.filter(col => col.dataType === "GRID");

    if (gridFields.length > 0 && detailsDefs && detailsRowData) {
        gridFields.forEach(gridCol => {

            const detailsTableName = `tbl_${objectName}_${gridCol.fieldName}`;

            script += `USE [${dbName}];\nGO\n\n`;
            script += `-- Create Details Table for GRID field [${gridCol.fieldName}]\n`;

            const detailRows = detailsRowData || [];

            script += getUDDStatements(detailRows);
            script += `\nCREATE TABLE [${detailsTableName}] (\n`;

            const detailLines = [];

            detailRows.forEach(col => {
let line = `  [${col.fieldName}] [udd_${col.fieldName}]`;

if (col.constraints?.includes("AI")) {
    line += ' IDENTITY(1,1)';
}

if (col.constraints?.includes("NN")) {
    line += ' NOT NULL';
}

if (col.constraints?.includes("DF") && col.defaultValue) {
    line += ` DEFAULT ${col.defaultValue}`;
}
                detailLines.push(line);
            });

            const detailPK = detailRows.filter(col => col.constraints?.includes("PK")).map(col => `[${col.fieldName}]`);
            if (detailPK.length > 0) {
                detailLines.push(`  PRIMARY KEY (${detailPK.join(', ')})`);
            }

            const detailFK = detailRows.filter(col => 
    col.constraints?.includes("FK") && col.referenceTable && col.referenceColumn
);
            detailFK.forEach(col => {
                detailLines.push(
                    `  FOREIGN KEY ([${col.fieldName}]) REFERENCES [tbl_${col.referenceTable}]([${col.referenceColumn}])`
                );
            });

            // CHECK Constraints for Details Table (NEW 🔥)
const detailCHK = detailRows.filter(col =>
    col.constraints?.includes("CHK") && col.checkCondition
);

detailCHK.forEach(col => {
    detailLines.push(`  CHECK (${col.checkCondition})`);
});

            // ✅ Audit for Details Table
if (enableAudit) {
    detailLines.push(`  [company_code] [udd_company_code]`);
    detailLines.push(`  [created_by] [udd_created_by]`);
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

// ================= STORED PROCEDURE =================
export const getStoredProcSQL = (gridRef, objectRowData, detailsRowData, detailsDefs, enableAudit) => {

    const rows = [];

    if (!gridRef.current || !gridRef.current.api) {
        alert('Grid is not ready!');
        return '';
    }

    gridRef.current.api.forEachNode(node => {
        if (node && node.data) {
            rows.push(node.data);
        }
    });

    const validRows = getValidRows(rows);

    const dbName = objectRowData.find(row => row.object === 'DB')?.name;
    const spRow = objectRowData.find(row => row.object === 'StoredProcedure');
    const objectName = spRow?.name || '';

    if (!dbName || !objectName) {
        alert('Please provide DB Name, SP Name and at least one column.');
        return '';
    }

    const tableName = `tbl_${objectName}`;
    const procName = `sp_${objectName}`;

    const isStringType = (type) => {
        const strTypes = ['VARCHAR', 'NVARCHAR', 'TEXT', 'CHAR', 'NCHAR'];
        return strTypes.includes(type?.toUpperCase());
    };

    const buildStoredProc = (contentRows, tblName, spName) => {

        const primaryKeyCol = contentRows.find(col => col.constraints?.includes("PK"));

        let paramRows = contentRows.filter(col => col.dataType?.toUpperCase() !== "GRID");


        let inputParams = paramRows
    .filter(col => !['created_date', 'modified_date'].includes(col.fieldName.toLowerCase()))
    .map(col => `    @${col.fieldName} udd_${col.fieldName}`)
    .join(',\n');

        const insertableRows = paramRows.filter(col => {
            if (col.constraints?.includes("AI")) return false;
            const field = col.fieldName.toLowerCase();
            return field !== 'modified_by' && field !== 'modified_date';
        });

        const insertFields = insertableRows.map(col => col.fieldName).join(', ');

        const insertValues = insertableRows.map(col => {
    const field = col.fieldName.toLowerCase();

    if (field === 'created_date') return 'SYSDATETIME()';

    if (field === 'created_by') return '@created_by';

    if (field === 'company_code') return '@company_code';

    return isStringType(col.dataType)
        ? `TRIM(@${col.fieldName})`
        : `@${col.fieldName}`;
}).join(', ');

        const updateAssignments = paramRows
    .filter(col => {
        const field = col.fieldName.toLowerCase();
        return !col.primaryKey && field !== 'created_date' && field !== 'created_by';
    })
    .map(col => {
        const field = col.fieldName.toLowerCase();

        if (field === 'modified_date')
    return `        ${col.fieldName} = SYSDATETIME()`;

if (field === 'modified_by')
    return `        ${col.fieldName} = @modified_by`;

if (field === 'company_code')
    return `        ${col.fieldName} = @company_code`;

        return isStringType(col.dataType)
            ? `        ${col.fieldName} = TRIM(@${col.fieldName})`
            : `        ${col.fieldName} = @${col.fieldName}`;
    })
    .join(',\n');

        const selectFields = contentRows.map(col => col.fieldName).join(', ');

        let script = `USE [${dbName}];\nGO\n\nCREATE PROCEDURE [dbo].[${spName}]\n(\n    @mode udd_mode,\n${inputParams}\n)\nAS\nBEGIN\n`;

        // INSERT
        script += `
    IF @mode = 'I'
    BEGIN
        INSERT INTO ${tblName} (${insertFields})
        VALUES (${insertValues})
    END`;

        // UPDATE
        if (primaryKeyCol) {
            script += `

    ELSE IF @mode = 'U'
    BEGIN
        UPDATE ${tblName}
        SET
${updateAssignments}
        WHERE ${primaryKeyCol.fieldName} = ${isStringType(primaryKeyCol.dataType)
                    ? `TRIM(@${primaryKeyCol.fieldName})`
                    : `@${primaryKeyCol.fieldName}`};
    END`;
        }

        // DELETE
        if (primaryKeyCol) {
            script += `

    ELSE IF @mode = 'D'
    BEGIN
        DELETE FROM ${tblName}
        WHERE ${primaryKeyCol.fieldName} = ${isStringType(primaryKeyCol.dataType)
                    ? `TRIM(@${primaryKeyCol.fieldName})`
                    : `@${primaryKeyCol.fieldName}`};
    END`;
        }

        // SELECT
        script += `

    ELSE IF @mode = 'A'
    BEGIN
        SELECT ${selectFields}
        FROM ${tblName}
    END

    ELSE
    BEGIN
        RAISERROR ('Please select a valid mode' ,16,1)
        RETURN;
    END
END
GO
`;

        return script;
    };

    let spRows = [...validRows];

if (enableAudit) {
    spRows.push(
        { fieldName: 'company_code', dataType: 'VARCHAR' },
        { fieldName: 'created_by', dataType: 'VARCHAR' },
        { fieldName: 'created_date', dataType: 'DATETIME' },
        { fieldName: 'modified_by', dataType: 'VARCHAR' },
        { fieldName: 'modified_date', dataType: 'DATETIME' }
    );
}

let script = buildStoredProc(spRows, tableName, procName);

    if (detailsDefs && detailsRowData && detailsRowData.length > 0) {
        const gridRows = detailsRowData.filter(r => r.fieldName);

        if (gridRows.length > 0) {
            const detailsTableName = `tbl_${objectName}_Details`;
            const detailsProcName = `sp_${objectName}_Details`;

            script += '\n\n' + buildStoredProc(gridRows, detailsTableName, detailsProcName);
        }
    }

    return script;
};