// ================= FRONTEND GENERATION SECTION =================

// Helper
export const getValidRows = (rows) => {
    return rows.filter(row => row.fieldName && row.fieldName.trim() !== '');
};

const BUTTON_CONFIG = {
    Add: { icon: "plus", color: "success" },
    Save: { icon: "check", color: "success" },
    Update: { icon: "pencil", color: "primary" },
    Delete: { icon: "trash", color: "danger" },
    Print: { icon: "printer", color: "dark" },
    Excel: { icon: "file-earmark-excel", color: "success" },
    Search: { icon: "search", color: "primary" },
    Refresh: { icon: "arrow-clockwise", color: "secondary" },
    Close: { icon: "x-circle", color: "secondary", variant: "solid" }
};

const safeFieldName = (name = "") => {
    return name.replace(/[^a-zA-Z0-9_]/g, "");
};

const renderInputControl = (col, type, size = 3) => {

    const fieldName = safeFieldName(col.fieldName);

    const label = `
<label className="form-label fw-semibold">
   ${col.fieldName}
</label>`;

    switch ((type || "").toUpperCase()) {

        case "TEXT":
            return `
<div className="col-md-${size}">
   ${label}

   <input
      className="form-control"
      placeholder="Enter ${col.fieldName}"
   />
</div>`;

        case "DROPDOWN":
            return `
<div className="col-md-${size}">
   ${label}

   <Select
      options={[]}
      placeholder="Select ${col.fieldName}"
   />
</div>`;

        case "DATE":
            return `
<div className="col-md-${size}">
   ${label}

   <input
      type="date"
      className="form-control"
   />
</div>`;

        case "NUMBER":
            return `
<div className="col-md-${size}">
   ${label}

   <input
      type="number"
      className="form-control"
      onKeyDown={(e) => {
         if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
         }
      }}
   />
</div>`;

        case "TEXT AREA":
            return `
<div className="col-md-${size}">
   ${label}

   <textarea className="form-control"></textarea>
</div>`;

        case "TOGGLE":
            return `
<div className="col-md-${size}">
   ${label}

   <div className="form-check form-switch">
      <input
         className="form-check-input"
         type="checkbox"
      />
   </div>
</div>`;

        case "FILE":

    let acceptType = "*";

    switch ((col.fileType || "").toUpperCase()) {

        case "IMAGE":
            acceptType = "image/*";
            break;

        case "VIDEO":
            acceptType = "video/*";
            break;

        case "AUDIO":
            acceptType = "audio/*";
            break;

        case "FILE":
            acceptType =
                ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip";
            break;

        default:
            acceptType = "*";
    }

    return `
<div className="col-md-${size}">
   ${label}

   <input
      type="file"
      className="form-control"
      accept="${acceptType}"
   />
</div>`;
    }
};

const generateButtons = (rows, key) => {

    return rows
        .filter(row => row[key])
        .map(row => {

            const value = row[key]?.toString().trim();

            const btn = BUTTON_CONFIG[value] || {};

            const btnClass = btn.variant === "solid"
                ? `btn btn-${btn.color || "secondary"}`
                : `btn btn-outline-${btn.color || "secondary"}`;

            return `
<button
   type="button"
   className="${btnClass}"
>
   <i className="bi bi-${btn.icon || "circle"}"></i>
</button>`;
        })
        .join("\n");
};

const generateAddButtons = (rows) => {

    return rows
        .filter(row =>
            row.designAddScreenButtons &&
            row.designAddScreenButtons.toString().trim() !== ""
        )
        .map(row => {

            const value =
                row.designAddScreenButtons?.toString().trim();

            const btn = BUTTON_CONFIG[value] || {};

            const btnClass = btn.variant === "solid"
                ? `btn btn-${btn.color || "secondary"}`
                : `btn btn-outline-${btn.color || "secondary"}`;

            return `
<button
   type="button"
   className="${btnClass}"
>
   <i className="bi bi-${btn.icon || "circle"} me-1"></i>
   ${value}
</button>`;
        })
        .join("\n");
};

// ================= SEARCH SCREEN =================
export const getFrontendSearchDesignCode = (gridRef, objectRowData) => {

    const rows = [];
    if (!gridRef.current || !gridRef.current.api) return "";

    gridRef.current.api.forEachNode(node => {
        if (node && node.data) {
            rows.push(node.data);
        }
    });

    const addButtonRows = rows.filter(
        r =>
            r.designAddScreenButtons &&
            r.designAddScreenButtons.toString().trim() !== ""
    );

    const name = objectRowData.find(row => row.object === 'React')?.name;
    if (!name || rows.length === 0) return "";

    const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);

    const orderedRows = [...rows].sort((a, b) => {
        const aOrder = parseInt(a.designSCOrderNo);
        const bOrder = parseInt(b.designSCOrderNo);

        const aValid = !isNaN(aOrder);
        const bValid = !isNaN(bOrder);

        if (aValid && bValid) return aOrder - bOrder;
        if (aValid) return -1;
        if (bValid) return 1;
        return 0;
    });

    const generateButtons = (rows, key) => {
        return rows
            .filter(row => row[key])
            .map(row => {
                const btn = BUTTON_CONFIG[row[key]] || {};

                const btnClass = `btn btn-outline-${btn.color || "secondary"}`;
                return `
                <button className="btn btn-outline-${btn.color || "secondary"}">
                    <i className="bi bi-${btn.icon || "circle"}"></i>
                </button>
            `;
            })
            .join("\n");
    };

    const generateHeader = (title, buttons) => {
        return `
    <div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
        <h2 className="mb-0">${title}</h2>
        <div className="d-flex gap-2">
            ${buttons}
        </div>
    </div>`;
    };

    const validRows = getValidRows(orderedRows);

    const buttonRows = orderedRows.filter(row =>
        row.designSCButtons &&
        row.designSCButtons.toString().trim() !== ""
    );

    // Header buttons (top right)
    const headerButtons = generateButtons(
        buttonRows.filter(r =>
            ["Add", "Delete", "Update", "Print", "Excel"].includes(r.designSCButtons)
        ),
        "designSCButtons"
    );

    // Search buttons (inside form)
    const inputActionButtons = generateButtons(
        buttonRows.filter(r =>
            ["Search", "Refresh"].includes(r.designSCButtons)
        ),
        "designSCButtons"
    );

    const columnDefs = validRows.map(
        (col) => `    { headerName: "${col.fieldName}", field: "${col.fieldName}", flex: 1 }`
    );


    const inputControls = validRows
        .filter((col) => col.designSCSelect)
        .map((col) =>
            renderInputControl(
                col,
                col.designSCSelect,
                3
            )
        )
        .join("\n");

    return `import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ${screenTitle}Screen = () => {

  const { useState } = React;
  const columnDefs = [
${columnDefs.join(",\n")}
  ];
  const rowData = [];

  return (
    <div className="container-fluid p-3">
      <div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
        <h2 className="mb-0">${screenTitle}</h2>
        <div className="d-flex gap-2">
          ${headerButtons}
        </div>
      </div>

      <div className="card p-3 mb-3 shadow-sm">
        <div className="row g-3">
${inputControls}
          <div className="col-md-3 d-flex align-items-end gap-2">
            ${inputActionButtons}
          </div>
        </div>
      </div>

      <div className="card p-2 shadow-sm">
        <div className="ag-theme-alpine" style={{ height: 300 }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
            pagination={true}
            paginationPageSize={10}
          />
        </div>
      </div>
    </div>
  );
};

export default ${screenTitle}Screen;`;
};

// ================= ADD SCREEN =================
export const getFrontendAddDesignCode = (gridRef, objectRowData, detailsRowData) => {

    const rows = [];
    if (!gridRef.current || !gridRef.current.api) return "";

    gridRef.current.api.forEachNode((node) => {

        const data = node.data;

        if (!data) return;

        const hasAddField =
            data.designAddScreenSelect &&
            data.designAddScreenSelect.toString().trim() !== "";

        const hasAddButton =
            data.designAddScreenButtons &&
            data.designAddScreenButtons.toString().trim() !== "";

        const hasGrid =
            data.designAddScreenSelect &&
            data.designAddScreenSelect.toString().trim().toUpperCase() === "GRID";

        if (hasAddField || hasAddButton || hasGrid) {
            rows.push(data);
        }

    });

    const name = objectRowData.find((row) => row.object === "React")?.name;
    if (!name || rows.length === 0) return "";

    const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);

    const orderedRows = [...rows].sort((a, b) => {
        const parse = (v) =>
            (v || "9999,9999,3")
                .split(",")
                .map((x) => parseInt(x.trim()))
                .filter((n) => !isNaN(n));
        const [ar, ac] = parse(a.designAddOrderNo);
        const [br, bc] = parse(b.designAddOrderNo);
        return ar !== br ? ar - br : ac - bc;
    });

    const buttonRows = rows.filter(
    row =>
        row.designAddScreenButtons &&
        row.designAddScreenButtons.toString().trim() !== ""
);

// TOP BUTTONS → TITLE BAR
const headerButtons = generateAddButtons(
    buttonRows.filter(
        row =>
            (row.addScreenButtonPosition || "")
                .toLowerCase() === "top"
    )
);

// BOTTOM BUTTONS → BELOW INPUTS
const bottomButtons = generateAddButtons(
    buttonRows.filter(
        row =>
            (row.addScreenButtonPosition || "")
                .toLowerCase() === "bottom"
    )
);

    const groupedRows = {};
    orderedRows.forEach((col) => {
        const [rowNum, colNum, colSize] = (col.designAddOrderNo || "9999,9999,3")
            .split(",")
            .map((v) => parseInt(v.trim()));
        if (!groupedRows[rowNum]) groupedRows[rowNum] = [];
        groupedRows[rowNum].push({ ...col, colNum, colSize: colSize || 3 });
    });

    let gridColumnDefs = " ";
    if (Array.isArray(detailsRowData) && detailsRowData.length) {
        const withOrder = detailsRowData.filter((r) => r.fieldName && r.gridOrderNo);
        const withoutOrder = detailsRowData.filter((r) => r.fieldName && !r.gridOrderNo);
        const sorted = [
            ...withOrder.sort((a, b) => (parseInt(a.gridOrderNo) || 9999) - (parseInt(b.gridOrderNo) || 9999)),
            ...withoutOrder,
        ];
        gridColumnDefs = sorted
            .map((r) => {
                const tooltip = r.gridTooltip ? `, headerTooltip: "${r.gridTooltip}"` : "";
                return `{ headerName: "${r.fieldName}", field: "${r.fieldName}" ${tooltip} }`;
            })
            .join(",\n            ");
    }

    const isGrid = (c) =>
        c.designAddScreenSelect &&
        c.designAddScreenSelect.toUpperCase() === "GRID";


    const renderInlineGrid = () => {
        return `          <div className="col-md-6">
            <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
              <AgGridReact rowData={[]} columnDefs={[ ${gridColumnDefs} ]} pagination={true} />
            </div>
          </div>`;
    };

    let layout = "";

    Object.keys(groupedRows).forEach((rowKey) => {
        layout += `        <div className="row g-3 mb-2">\n`;

        groupedRows[rowKey].forEach(col => {
            if (isGrid(col)) {
                layout += renderInlineGrid();
            } else {
                layout += renderInputControl(
                    col,
                    col.designAddScreenSelect,
                    col.colSize || 3
                );
            }
            layout += "\n";
        });

        layout += `        </div>\n`;
    });

    return `import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const Add${screenTitle}Screen = () => {

  return (
    <div className="container-fluid p-3">

      {/* HEADER */}
<div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
    <h2 className="mb-0">Add ${screenTitle}</h2>
    <div className="d-flex gap-2">
      ${headerButtons}
    </div>
  </div>

  {/* FORM */}
${layout}

${bottomButtons ? `
<div className="d-flex justify-content-end gap-2 mt-3">
   ${bottomButtons}
</div>
` : ""}

    </div>
  );
};

export default Add${screenTitle}Screen;`;
};


export const getFrontendCombinedDesignCode = (
    gridRef,
    objectRowData,
    detailsRowData,
    screens = []
) => {

    if (!gridRef.current || !gridRef.current.api) return "";

    const rows = [];
    gridRef.current.api.forEachNode(node => {
        if (node?.data) rows.push(node.data);
    });

    const name = objectRowData.find(row => row.object === "React")?.name;
    if (!name) return "";

    const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);

    const validRows = rows.filter(r => r.fieldName);

    const buttonRows = rows.filter(r => r.designSCButtons);

    // ✅ MOVE THIS UP
    const addButtonRows = rows.filter(
        r =>
            r.designAddScreenButtons &&
            r.designAddScreenButtons.toString().trim() !== ""
    );

    // ✅ THEN USE IT
    const addTopButtons = generateAddButtons(
        addButtonRows.filter(r =>
            (r.addScreenButtonPosition || "").toLowerCase() === "top"
        )
    );

    const addBottomButtons = generateAddButtons(
        addButtonRows.filter(r =>
            (r.addScreenButtonPosition || "").toLowerCase() === "bottom"
        )
    );

    const headerButtons = generateButtons(
        buttonRows.filter(r =>
            ["Add", "Delete", "Update"]
                .includes(r.designSCButtons?.trim())
        ),
        "designSCButtons"
    );

    // ================= COLUMN DEFS =================
    const columnDefs = validRows.map(
        col => `{ headerName: "${col.fieldName}", field: "${col.fieldName}", flex: 1 }`
    );

    // ================= SEARCH INPUTS =================
    const searchInputs = validRows
        .filter(col =>
            col.designSCSelect &&
            col.designSCSelect.toString().trim() !== ""
        )
        .map(col => {
            const type = col.designSCSelect?.toUpperCase();

            const base = `className="form-control" placeholder="Enter ${col.fieldName}"`;

            switch (type) {
                case "TEXT":
    return `
<div className="col-md-3">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      ${base}
   />
</div>`;

                case "DROPDOWN":
    return `
<div className="col-md-3">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <Select
      options={[]}
      placeholder="Select ${col.fieldName}"
   />
</div>`;

                case "DATE":
    return `
<div className="col-md-3">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      type="date"
      className="form-control"
   />
</div>`;

                default:
                    return "";
            }
        }).join("\n");

    // ================= ADD INPUTS =================
    const addInputs = validRows
        .filter(col =>
            col.designAddScreenSelect &&
            col.designAddScreenSelect.toString().trim() !== "" &&
            col.designAddScreenSelect.toUpperCase() !== "GRID"
        )
        .map(col => {
            const size = col.designAddOrderNo?.split(",")[2] || 3;
            const type = col.designAddScreenSelect?.toUpperCase();

            switch (type) {
                case "TEXT":
                    return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      className="form-control"
      placeholder="Enter ${col.fieldName}"
   />
</div>`;

                case "DROPDOWN":
                    return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <Select
      options={[]}
      placeholder="Select ${col.fieldName}"
   />
</div>
   `;

                case "DATE":
                    return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      type="date"
      className="form-control"
   />
</div>`;

                case "NUMBER":
                    return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      type="number"
      className="form-control"
   />
</div>`;

                case "TEXT AREA":
                    return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <textarea className="form-control"></textarea>
</div>`;

                case "TOGGLE":
                    return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <div className="form-check form-switch">
      <input
         className="form-check-input"
         type="checkbox"
      />
   </div>
</div>`;

case "FILE":

    let acceptType = "*";

    switch ((col.fileType || "").toUpperCase()) {

        case "IMAGE":
            acceptType = "image/*";
            break;

        case "VIDEO":
            acceptType = "video/*";
            break;

        case "AUDIO":
            acceptType = "audio/*";
            break;

        case "FILE":
            acceptType =
                ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip";
            break;

        default:
            acceptType = "*";
    }

    return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      type="file"
      className="form-control"
      accept="${acceptType}"
   />
</div>
`;

                default:
                    return "";
            }
        }).join("\n");

    const screenCases = screens.map(screen => {


        console.log("SCREENS => ", screens);
        console.log("ROWS => ", rows);

        const screenRows = screen.rowData || [];

        const screenRowData = `[]`;

        // ================= SCREEN BUTTONS =================

        const screenButtonRows = screenRows
            .filter(r => r.designSCButtons)
            .map(r => ({
                ...r,
                designSCButtons: r.designSCButtons?.toString().trim(),
                designAddScreenButtons: r.designAddScreenButtons?.toString().trim()
            }));

        const screenHeaderButtons = generateButtons(
            screenButtonRows.filter(r =>
                ["Add", "Delete", "Update"]
                    .includes(r.designSCButtons?.trim())
            ),
            "designSCButtons"
        );

        const screenSearchButtons = generateButtons(
            screenButtonRows.filter(r =>
                ["Search", "Refresh", "Print", "Excel"]
                    .includes(r.designSCButtons?.trim())
            ),
            "designSCButtons"
        );

        // ================= ADD SCREEN BUTTONS =================

        const screenAddButtonRows = screenRows
            .filter(r => r.designAddScreenButtons)
            .map(r => ({
                ...r,
                designAddScreenButtons:
                    r.designAddScreenButtons?.toString().trim(),
                addScreenButtonPosition:
                    r.addScreenButtonPosition?.toString().trim().toLowerCase()
            }));

        const screenAddTopButtons = generateAddButtons(
            screenAddButtonRows.filter(
                r => r.addScreenButtonPosition === "top"
            )
        );

        const screenAddBottomButtons = generateAddButtons(
            screenAddButtonRows.filter(
                r => r.addScreenButtonPosition === "bottom"
            )
        );

        // ================= SCREEN GRID =================

        const screenColumnDefs = screenRows
            .filter(col => col.fieldName)
            .map(
                col => `{
   headerName: "${col.fieldName}",
   field: "${col.fieldName}",
   flex: 1
}`
            );

        // ================= SEARCH INPUTS =================

        const screenSearchInputs = screenRows
            .filter(col =>
                col.designSCSelect &&
                col.designSCSelect.toString().trim() !== ""
            )
            .map(col => {

                const type = col.designSCSelect?.toUpperCase();

                switch (type) {

                    case "TEXT":
                        return `
<div className="col-md-3">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      className="form-control"
      placeholder="Enter ${col.fieldName}"
   />
</div>
               `;

                    case "DROPDOWN":
                        return `
               <div className="col-md-3">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <Select
      options={[]}
      placeholder="Select ${col.fieldName}"
   />
</div>
               `;

                    case "DATE":
                        return `
<div className="col-md-3">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      type="date"
      className="form-control"
   />
</div>
   `;

                    default:
                        return "";
                }

            }).join("\n");

        // ================= ADD INPUTS =================

        const screenAddInputs = screenRows
            .filter(col =>
                col.designAddScreenSelect &&
                col.designAddScreenSelect.toString().trim() !== ""
            )
            .map(col => {

                const size =
                    col.designAddOrderNo?.split(",")[2] || 3;

                const type =
                    col.designAddScreenSelect?.toUpperCase();

                // ================= GRID =================

                if (type === "GRID") {

                    return `
<div className="col-md-${size}">
   <div
      className="ag-theme-alpine"
      style={{
         height: 300,
         width: "100%"
      }}
   >
      <AgGridReact
         columnDefs={[
            ${screenColumnDefs.join(",")}
         ]}
         rowData={rowData}
         pagination={true}
      />
   </div>
</div>
`;
                }

                // ================= NORMAL INPUTS =================

                switch (type) {

                    case "TEXT":
                        return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      className="form-control"
      placeholder="Enter ${col.fieldName}"
   />
</div>
`;

                    case "DROPDOWN":
                        return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <Select
      options={[]}
      placeholder="Select ${col.fieldName}"
   />
</div>
`;

                    case "DATE":
                        return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      type="date"
      className="form-control"
   />
</div>
`;

                    case "NUMBER":
                        return `
<div className="col-md-${size}">
   <input
      type="number"
      className="form-control"
   />
</div>
`;

                    case "TEXT AREA":
                        return `
<div className="col-md-${size}">
   <textarea className="form-control"></textarea>
</div>
`;

                    case "TOGGLE":
                        return `
<div className="col-md-${size}">
   <div className="form-check form-switch">
      <input
         className="form-check-input"
         type="checkbox"
      />
   </div>
</div>
`;

                    case "FILE":

    let acceptType = "*";

    switch ((col.fileType || "").toUpperCase()) {

        case "IMAGE":
            acceptType = "image/*";
            break;

        case "VIDEO":
            acceptType = "video/*";
            break;

        case "AUDIO":
            acceptType = "audio/*";
            break;

        case "FILE":
            acceptType =
                ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip";
            break;

        default:
            acceptType = "*";
    }

    return `
<div className="col-md-${size}">
   <label className="form-label fw-semibold">
      ${col.fieldName}
   </label>

   <input
      type="file"
      className="form-control"
      accept="${acceptType}"
   />
</div>
`;

                    default:
                        return "";
                }

            }).join("\n");

        // ================= FINAL SCREEN =================

        return `

/* =============================================
   SCREEN : ${screen.screenName}
============================================= */

   case "${screen.screenName}":
      return (

         <>

            {/* HEADER */}
            <div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
               <h2 className="mb-0">${screen.screenName}</h2>

               <div className="d-flex gap-2">
   ${screenHeaderButtons || ""}
   ${screenAddTopButtons || ""}
</div>
            </div>

            {/* ADD FORM */}
            <div className="card p-3 mb-3">
               <h5>Add ${screen.screenName}</h5>

               <div className="row g-3">
   ${screenAddInputs}

   ${screenAddBottomButtons
                ? `
   <div className="col-12 d-flex gap-2 justify-content-end mt-3">
      ${screenAddBottomButtons}
   </div>
   `
                : ""
            }
</div>
            </div>

            {/* SEARCH */}
            <div className="card p-3 mb-3">
               <h5>Search Criteria</h5>

               <div className="row g-3">

                  ${screenSearchInputs}

                  <div className="col-md-3 d-flex align-items-end gap-2">
                     ${screenSearchButtons}
                  </div>

               </div>
            </div>

            {/* GRID */}
            <div className="card p-2">

               <div
   className="ag-theme-alpine"
   style={{
      height: 300,
      width: "100%"
   }}
>

                  <AgGridReact
   columnDefs={[
      ${screenColumnDefs.join(",")}
   ]}
   rowData={${screenRowData}}
/>

               </div>

            </div>

         </>
      );
   `;

    }).join("\n");


    // ================= BUTTONS =================


    // ================= FINAL =================

return `

import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const { useState } = React;

const ${screenTitle}Screen = () => {

  const [activeTab, setActiveTab] = useState(
  ${JSON.stringify(screens[0]?.screenName || "")}
);

  const columnDefs = [
    ${columnDefs.join(",")}
  ];

  const rowData = [];

  const renderScreen = () => {

  // IF NO SCREENS CONFIGURED
if (${screens.length} <= 0) {
   return (
      <>

         {/* HEADER */}
<div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">

   <h2 className="mb-0">${screenTitle}</h2>

   <div className="d-flex gap-2">
      ${headerButtons}
      ${addTopButtons}
   </div>

</div>

         {/* ADD FORM */}
<div className="card p-3 mb-3">

   <div className="row g-3">

      ${addInputs}

      ${addBottomButtons
            ? `
      <div className="col-12 d-flex gap-2 justify-content-end mt-3">
         ${addBottomButtons}
      </div>
      `
            : ""
        }

   </div>
</div>

         {/* SEARCH */}
         <div className="card p-3 mb-3">
            <div className="row g-3">

               ${searchInputs}

               <div className="col-md-3 d-flex align-items-end gap-2">
                  ${generateButtons(
            buttonRows.filter(r =>
                ["Search", "Refresh", "Print", "Excel"]
                    .includes(r.designSCButtons?.trim())
            ),
            "designSCButtons"
        )}
               </div>

            </div>
         </div>

         {/* GRID */}
         <div className="card p-2">
            <div
               className="ag-theme-alpine"
               style={{
                  height: 300,
                  width: "100%"
               }}
            >
               <AgGridReact
   columnDefs={columnDefs}
   rowData={rowData}
/>
            </div>
         </div>

      </>
   );
}

switch(activeTab){

   ${screenCases}

   default:
      return null;
}
};

return (
    <div className="container-fluid p-3">

{/* SCREEN NAVIGATION TABS */}
{${screens.length} > 0 && (
  <div className="d-flex gap-2 flex-wrap mb-3">
    {${JSON.stringify(screens.map(s => s.screenName))}.map((tab, index) => (
      <button
        key={index}
        className={
          activeTab === tab
            ? "btn btn-primary"
            : "btn btn-outline-primary"
        }
        onClick={() => setActiveTab(tab)}
      >
        {tab}
      </button>
    ))}
  </div>
)}

{renderScreen()}

    </div>
  );
};

export default ${screenTitle}Screen;
`;
};

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
        firstScreen.detailsRowData,
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
            screen.detailsRowData
        );

        finalCode += `\n\n`;
    });

    return finalCode;
};