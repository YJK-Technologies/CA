// ================= SQL GENERATION SECTION =================

// Helper: Filter valid rows
export const getValidRows = (rows) => {
    return rows.filter(row => row.fieldName && row.fieldName.trim() !== '');
};

// ================= CONSTRAINT HELPER =================

export const hasConstraint = (constraints, types = []) => {

    if (!constraints) return false;

    const normalized = constraints
        .toString()
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim();

    return types.some(type =>
        normalized.includes(type.toUpperCase())
    );
};

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
    lines.push(`  [created_by] [udd_created_by] NOT NULL`);
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

        const hasConstraint = (constraints, types = []) => {

    if (!constraints) return false;

    const normalized = constraints
        .toString()
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim();

    return types.some(type =>
        normalized.includes(type.toUpperCase())
    );
};

const primaryKeyCol =
    contentRows.find(col =>
        hasConstraint(col.constraints, ["PK", "PRIMARY KEY"])
    )
    ||
    contentRows.find(col =>
        hasConstraint(col.constraints, ["AI", "IDENTITY"])
    )
    ||
    contentRows[0];

        // ✅ Get all VARBINARY fields
const varbinaryCols = contentRows.filter(
    col => col.dataType?.toUpperCase() === "VARBINARY"
);

        let paramRows = contentRows.filter(col => col.dataType?.toUpperCase() !== "GRID");


        let inputParams = paramRows
    .filter(col => !['created_date', 'modified_date'].includes(col.fieldName.toLowerCase()))
    .map(col => `    @${col.fieldName} udd_${col.fieldName}`)
    .join(',\n');

        const insertableRows = paramRows.filter(col => {
            if (hasConstraint(col.constraints, ["AI", "IDENTITY"])) return false;
            const field = col.fieldName.toLowerCase();
            return field !== 'modified_by' && field !== 'modified_date';
        });

        const insertFields = insertableRows.map(col => col.fieldName).join(', ');

        const insertValues = insertableRows.map(col => {
    const field = col.fieldName.toLowerCase();

    if (field === 'created_date') return 'SYSDATETIME()';

    if (field === 'created_by') return '@created_by';

    if (field === 'company_code') return '@company_code';

    // ✅ VARBINARY handling
if (col.dataType?.toUpperCase() === "VARBINARY") {
    return `@${col.fieldName}_data`;
}

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

        // ✅ VARBINARY handling
if (col.dataType?.toUpperCase() === "VARBINARY") {
    return `        ${col.fieldName} = @${col.fieldName}_data`;
}

return isStringType(col.dataType)
    ? `        ${col.fieldName} = TRIM(@${col.fieldName})`
    : `        ${col.fieldName} = @${col.fieldName}`;
    })
    .join(',\n');

        const selectFields = contentRows.map(col => col.fieldName).join(', ');

        let script = `USE [${dbName}];\nGO\n\nCREATE PROCEDURE [dbo].[${spName}]\n(\n    @mode udd_mode,\n${inputParams}\n)\nAS\nBEGIN\n`;

// =========================
// NULL HANDLING
// =========================

const nullHandling = paramRows
    .map(col => {

        const field = col.fieldName;

        const datatype = col.dataType?.toUpperCase();

        // NUMBER TYPES
        if (
            [
                "INT",
                "BIGINT",
                "SMALLINT",
                "TINYINT",
                "DECIMAL",
                "NUMERIC",
                "FLOAT",
                "REAL",
                "MONEY",
                "SMALLMONEY"
            ].includes(datatype)
        ) {

            return `    SELECT @${field} = ISNULL(@${field},0)`;
        }

        // TEXT / DATE / OTHER TYPES
        return `    SELECT @${field} = ISNULL(RTRIM(LTRIM(@${field})),'')`;

    })
    .join('\n');

// =========================
// DATE EMPTY TO NULL
// =========================

const dateNullHandling = paramRows
    .filter(col =>
        [
            "DATE",
            "DATETIME",
            "DATETIME2",
            "SMALLDATETIME"
        ].includes(col.dataType?.toUpperCase())
    )
    .map(col => {

        const field = col.fieldName;

        return `
    IF @${field} = ''
        SET @${field} = NULL`;

    })
    .join('\n');

// =========================
// NOT NULL VALIDATIONS
// =========================

const notNullValidation = paramRows
    .filter(col =>
    hasConstraint(col.constraints, [
        "NN",
        "NOT NULL",
        "PK",
        "PRIMARY KEY"
    ])
)
    .map(col => {

        const field = col.fieldName;

        const datatype = col.dataType?.toUpperCase();

// =========================
// NUMBER TYPES
// =========================

if (
    [
        "INT",
        "BIGINT",
        "SMALLINT",
        "TINYINT",
        "DECIMAL",
        "NUMERIC",
        "FLOAT",
        "REAL",
        "MONEY",
        "SMALLMONEY"
    ].includes(datatype)
) {

    return `
    IF ISNULL(@${field}, 0) = 0
        OR @${field} IS NULL
    BEGIN
        RAISERROR('${field} should not be blank',16,3)
        RETURN
    END`;
}

// =========================
// TEXT / DATE TYPES
// =========================

return `
    IF ISNULL(TRIM(@${field}), '') = ''
        OR @${field} IS NULL
    BEGIN
        RAISERROR('${field} should not be blank',16,3)
        RETURN
    END`;

    })
    .join('\n');

// ✅ VARBINARY conversion block
if (varbinaryCols.length > 0) {
    script += '\n    -- VARBINARY conversion\n';

    varbinaryCols.forEach(col => {
        script += `    DECLARE @${col.fieldName}_data VARBINARY(MAX)\n`;
        script += `    SET @${col.fieldName}_data = CAST(@${col.fieldName} AS VARBINARY(MAX))\n\n`;
    });
}

// INSERT
script += `
    IF @mode = 'I'
    BEGIN

${nullHandling}

${dateNullHandling}

${notNullValidation}

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
        {
            fieldName: 'company_code',
            dataType: 'VARCHAR',
            constraints: 'NN'
        },
        {
            fieldName: 'created_by',
            dataType: 'VARCHAR',
            constraints: 'NN'
        },
        {
            fieldName: 'created_date',
            dataType: 'DATETIME'
        },
        {
            fieldName: 'modified_by',
            dataType: 'VARCHAR'
        },
        {
            fieldName: 'modified_date',
            dataType: 'DATETIME'
        }
    );
}

let script = buildStoredProc(spRows, tableName, procName);

    if (detailsDefs && detailsDefs.length > 0) {

    detailsDefs.forEach(detail => {

        const gridFieldName = detail.gridFieldName;

        const gridRows = detail.rows || [];

        if (gridRows.length > 0) {

            const detailsTableName =
                `tbl_${objectName}_${gridFieldName}`;

            const detailsProcName =
                `sp_${objectName}_${gridFieldName}`;

            script += '\n\n' +
                buildStoredProc(
                    gridRows,
                    detailsTableName,
                    detailsProcName
                );
        }
    });
}

    return script;
};

export const getAllTableSQL = (enableAudit) => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const rows = screen.rowData || screen.gridData || [];

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {

                        rows.forEach(row => {
                            callback({ data: row });
                        });

                    }
                }
            }
        };

        finalScript += `
-- =============================================
-- SCREEN : ${screen.screenName}
-- =============================================


-- =============================================
-- UDD
-- =============================================

`;

        finalScript += getOnlyUDDSQL(
            rows,
            screen.detailsRowData,
            enableAudit
        );

        finalScript += `

-- =============================================
-- TABLE
-- =============================================

`;

        finalScript += getTableSQL(
            fakeGridRef,
            screen.objectRowData,
            screen.detailsRowData,
            screen.detailsDefs,
            enableAudit
        );

        finalScript += `\n\n`;

    });

    return finalScript;
};

export const getAllStoredProcSQL = (enableAudit) => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {
                        const rows = screen.rowData || screen.gridData || [];

rows.forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        finalScript += `
-- =============================================
-- SCREEN : ${screen.screenName}
-- =============================================

`;

        finalScript += getStoredProcSQL(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsRowData,
    screen.detailsDefs,
    enableAudit
);
        finalScript += `\n\n`;
    });

    return finalScript;
};

export const getAllSQLScripts = (enableAudit) => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const rows = screen.rowData || screen.gridData || [];

const fakeGridRef = {
    current: {
        api: {
            forEachNode: (callback) => {
                rows.forEach(row => {
                    callback({ data: row });
                });
            }
        }
    }
};

        finalScript += `
-- =============================================
-- SCREEN : ${screen.screenName}
-- =============================================

`;

        // ================= UDD + TABLE =================

        finalScript += `
-- =============================================
-- UDD + TABLE
-- =============================================

`;

        finalScript += getTableSQL(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsRowData,
    screen.detailsDefs,
    enableAudit
);

        finalScript += `\n`;

        // ================= STORED PROCEDURE =================

        finalScript += `
-- =============================================
-- STORED PROCEDURE
-- =============================================

`;

        finalScript += getStoredProcSQL(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsRowData,
    screen.detailsDefs,
    enableAudit
);

        finalScript += `\n\n`;
    });

    return finalScript;
};

export const getOnlyUDDSQL = (
    rows,
    detailsRowData = [],
    enableAudit = false
) => {

    let uddRows = [...rows];

    // Audit fields
    if (enableAudit) {
        uddRows.push(
            { fieldName: 'company_code', dataType: 'VARCHAR', size: '18' },
            { fieldName: 'created_by', dataType: 'VARCHAR', size: '18' },
            { fieldName: 'created_date', dataType: 'DATETIME' },
            { fieldName: 'modified_by', dataType: 'VARCHAR', size: '18' },
            { fieldName: 'modified_date', dataType: 'DATETIME' }
        );
    }

    // Details rows
    if (detailsRowData?.length > 0) {
        uddRows.push(...detailsRowData);
    }

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

export const getPreviewTableSQL = (enableAudit = false) => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const rows = screen.rowData || [];

        // Fake GridRef
        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {
                        rows.forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        const tableName =
            screen.objectRowData.find(
                r => r.object === "Table"
            )?.name || "";

        finalScript += `
-- =============================================
-- SCREEN : ${screen.screenName}
-- =============================================


-- =============================================
-- UDD
-- =============================================

`;

        finalScript += getOnlyUDDSQL(
            rows,
            screen.detailsRowData,
            enableAudit
        );

        finalScript += `

-- =============================================
-- TABLE
-- =============================================

`;

        finalScript += getTableSQL(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsRowData,
    screen.detailsDefs,
    enableAudit
);

        finalScript += `


`;
    });

    return finalScript;
};