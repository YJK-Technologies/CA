import {
    getNodeSingleCrudScript
} from "./singleCrudGenerator";

import {
    getNodeLoopCrudScripts
} from "./loopCrudGenerator";

// ================= ALL SINGLE NODE CRUD =================
export const getAllNodeSingleCrudScripts = () => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {
                        (screen.rowData || []).forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        finalScript += `
// =============================================
// SCREEN : ${screen.screenName}
// SINGLE NODE CRUD
// =============================================

`;

        finalScript += getNodeSingleCrudScript(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsTables || []
);

        finalScript += `\n\n`;
    });

    return finalScript;
};

// ================= ALL LOOP NODE CRUD =================
export const getAllNodeLoopCrudScripts = () => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {
                        (screen.rowData || []).forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        finalScript += `
// =============================================
// SCREEN : ${screen.screenName}
// LOOP NODE CRUD
// =============================================

`;

        finalScript += getNodeLoopCrudScripts(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsTables || []
);

        finalScript += `\n\n`;
    });

    return finalScript;
};

// ================= ALL NODE CRUD =================
export const getAllNodeCrudScripts = () => {

    const savedScreens =
        JSON.parse(localStorage.getItem("savedScreens")) || [];

    let finalScript = "";

    savedScreens.forEach(screen => {

        const fakeGridRef = {
            current: {
                api: {
                    forEachNode: (callback) => {
                        (screen.rowData || []).forEach(row => {
                            callback({ data: row });
                        });
                    }
                }
            }
        };

        finalScript += `
// =============================================
// SCREEN : ${screen.screenName}
// =============================================

`;

        // ================= SINGLE CRUD =================

        finalScript += `
// =============================================
// SINGLE NODE CRUD
// =============================================

`;

        finalScript += getNodeSingleCrudScript(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsTables || []
);

        finalScript += `\n`;

        // ================= LOOP CRUD =================

        finalScript += `
// =============================================
// LOOP NODE CRUD
// =============================================

`;

        finalScript += getNodeLoopCrudScripts(
    fakeGridRef,
    screen.objectRowData,
    screen.detailsTables || []
);

        finalScript += `\n\n`;
    });

    return finalScript;
};