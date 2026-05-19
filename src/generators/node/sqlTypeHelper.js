export const getSqlType = (col) => {

    const type = col.dataType?.toUpperCase();

    switch (type) {

        case "INT":
            return "sql.Int";

        case "FLOAT":
            return "sql.Float";

        case "BIT":
            return "sql.Bit";

        case "DATE":
            return "sql.Date";

        case "DATETIME":
            return "sql.DateTime";

        case "VARBINARY":
            return "sql.VarBinary";

        case "DECIMAL": {

            const [precision, scale] =
                (col.size || "18,2")
                    .split(',')
                    .map(v => parseInt(v.trim()) || 0);

            return `sql.Decimal(${precision}, ${scale})`;
        }

        default:
            return "sql.NVarChar";
    }
};