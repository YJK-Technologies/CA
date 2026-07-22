import { getValidRows } from "../shared/helpers";

// ================= STORED PROCEDURE =================
export const getStoredProcSQL = (
    gridRef,
    objectRowData,
    detailsDataMap,
    detailsDefs,
    enableAudit
) => {

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
            // .filter(col => !['created_date', 'modified_date'].includes(col.fieldName.toLowerCase()))
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

            if (field === 'location_code') return '@location_code';

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

                if (field === 'location_code')
                    return `        ${col.fieldName} = @location_code`;

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
                    : `@${primaryKeyCol.fieldName}`}
                    AND company_code = @company_code
                    AND location_code = @location_code;
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
                    : `@${primaryKeyCol.fieldName}`}
                    AND company_code = @company_code
                    AND location_code = @location_code;
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
                fieldName: 'location_code',
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

    let script = `
/* =====================================================
   MAIN TABLE STORED PROCEDURE
===================================================== */

`;

    script += buildStoredProc(
        spRows,
        tableName,
        procName
    );

    // =====================================================
    // DETAILS GRID PROCEDURES
    // =====================================================

    const gridFields =
        rows.filter(
            r => r.dataType?.toUpperCase() === "GRID"
        );

    gridFields.forEach(gridCol => {

        const gridFieldName =
            gridCol.fieldName;

        // GET CURRENT GRID ROWS
        const currentDetailRows =
            detailsDataMap?.[gridFieldName] || [];

        // SKIP EMPTY GRID
        if (currentDetailRows.length === 0) {
            return;
        }

        const detailsTableName =
            `tbl_${gridFieldName}`;

        const detailsProcName =
            `sp_${gridFieldName}`;

        // ADD AUDIT FIELDS
        let detailProcRows =
            [...currentDetailRows];

        if (enableAudit) {

            detailProcRows.push(
                {
                    fieldName: 'company_code',
                    dataType: 'VARCHAR',
                    constraints: 'NN'
                },
                {
                    fieldName: 'location_code',
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

        script += `

/* =====================================================
   DETAILS TABLE STORED PROCEDURE
   TABLE : ${detailsTableName}
===================================================== */

`;

        script += buildStoredProc(
            detailProcRows,
            detailsTableName,
            detailsProcName
        );

    });
    return script;
};