import {
    getFrontendSearchDesignCode
} from "./searchGenerator";

import {
    getFrontendAddDesignCode
} from "./addGenerator";

import {
    getFrontendCombinedDesignCode
} from "./combinedGenerator";

export const getAllFrontendScreens = () => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    if (savedScreens.length === 0) {
        return "";
    }

    // ✅ Pass full screen objects
    const screens = savedScreens.map(screen => ({
        screenName: screen.screenName,
        rowData: screen.rowData || screen.gridData || [],
        objectRowData: screen.objectRowData || [],
        detailsRowData: screen.detailsRowData || [],
        detailsTables: screen.detailsTables || [],
        detailsDefs: screen.detailsDefs || []
    }));

    // ✅ Use first screen only for base structure
    const firstScreen = savedScreens[0];

    const fakeGridRef = {
        current: {
            api: {
                forEachNode: (callback) => {

                    const rows =
                        firstScreen.rowData ||
                        firstScreen.gridData ||
                        [];

                    rows.forEach(row => {
                        callback({ data: row });
                    });
                }
            }
        }
    };

    return getFrontendCombinedDesignCode(
    fakeGridRef,
    firstScreen.objectRowData,
    firstScreen.detailsTables || [],
    screens
);
};

export const getAllFrontendCode = () => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalCode = "";

    savedScreens.forEach(screen => {

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {

                        const rows =
                            screen.rowData ||
                            screen.gridData ||
                            [];

                        rows.forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        finalCode += `
/* =====================================================
   SCREEN : ${screen.screenName}
===================================================== */
`;

        // ================= SEARCH SCREEN =================

        finalCode += `

/* =====================================================
   SEARCH SCREEN
===================================================== */

`;

        finalCode += getFrontendSearchDesignCode(
            fakeGridRef,
            screen.objectRowData
        );

        finalCode += `\n\n`;

        // ================= ADD SCREEN =================

        finalCode += `

/* =====================================================
   ADD SCREEN
===================================================== */

`;

        finalCode += getFrontendAddDesignCode(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsTables || []
);

        finalCode += `\n\n`;
    });

    return finalCode;
};