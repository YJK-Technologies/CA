export const getValidRows = (rows) => {
    return rows.filter(
        row => row.fieldName && row.fieldName.trim() !== ''
    );
};

export const safeFieldName = (name = "") => {
    return name.replace(/[^a-zA-Z0-9_]/g, "");
};

export const hasConstraint = (constraints, values = []) => {

    if (!constraints) return false;

    // Convert constraints safely to string
    const normalizedConstraints = constraints
        .toString()
        .toUpperCase()
        .split(',')
        .map(v => v.trim());

    // Convert values safely
    const checkValues = Array.isArray(values)
        ? values
        : [values];

    return checkValues.some(value =>
        normalizedConstraints.includes(
            value?.toString()?.toUpperCase()
        )
    );
};