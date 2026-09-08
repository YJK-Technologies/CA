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

        finalScript += `
// =============================================
// SCREEN : ${screen.screenName}
// SINGLE NODE CRUD
// =============================================

`;

        finalScript += getNodeSingleCrudScript(
            screen.rowData || [],
            screen.objectRowData || [],
            screen.detailsTables || [],
            screen.enableAudit || false
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

        finalScript += `
// =============================================
// SCREEN : ${screen.screenName}
// LOOP NODE CRUD
// =============================================

`;

        finalScript += getNodeLoopCrudScripts(
            screen.rowData || [],
            screen.objectRowData || [],
            screen.detailsTables || [],
            screen.enableAudit || false
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
            screen.rowData || [],
            screen.objectRowData || [],
            screen.detailsTables || [],
            screen.enableAudit || false
        );

        finalScript += `\n`;

        // ================= LOOP CRUD =================

        finalScript += `
// =============================================
// LOOP NODE CRUD
// =============================================

`;

        finalScript += getNodeLoopCrudScripts(
            screen.rowData || [],
            screen.objectRowData || [],
            screen.detailsTables || [],
            screen.enableAudit || false
        );

        finalScript += `\n\n`;
    });

    return finalScript;
};