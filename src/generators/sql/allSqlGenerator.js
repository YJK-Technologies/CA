import { getTableSQL } from "./tableGenerator";
import { getStoredProcSQL } from "./procedureGenerator";
import { getOnlyUDDSQL } from "./index";

// ================= ALL TABLE SQL =================

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
// ================= PREVIEW TABLE SQL =================

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

// ================= ALL STORED PROCEDURE SQL =================

export const getAllStoredProcSQL = (enableAudit = false) => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let sql = "";

    savedScreens.forEach(screen => {


        sql += `
-- =============================================
-- SCREEN : ${screen.screenName}
-- =============================================
        `;

        sql += getStoredProcSQL(
            {
                current: {
                    api: {
                        forEachNode: (cb) => {
                            (screen.rowData || []).forEach(data =>
                                cb({ data })
                            );
                        }
                    }
                }
            },
            screen.objectRowData,
            screen.detailsRowData,
            screen.detailsDefs,
            enableAudit
        );
    });

    return sql;
};

// ================= ALL SQL SCRIPTS =================

export const getAllSQLScripts = (enableAudit = false) => {

    return `
-------------------------------
-- TABLE SCRIPTS
-------------------------------

${getAllTableSQL(enableAudit)}

-------------------------------
-- STORED PROCEDURES
-------------------------------

${getAllStoredProcSQL(enableAudit)}
`;
};