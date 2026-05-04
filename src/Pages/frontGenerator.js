// ================= FRONTEND GENERATION SECTION =================

// Helper
export const getValidRows = (rows) => {
    return rows.filter(row => row.fieldName && row.fieldName.trim() !== '');
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

    const BUTTON_CONFIG = {
    Add: { icon: "plus", color: "success" },
    Save: { icon: "check", color: "success" },
    Update: { icon: "pencil", color: "primary" },
    Delete: { icon: "trash", color: "danger" },
    Print: { icon: "printer", color: "dark" },
    Excel: { icon: "file-earmark-excel", color: "success" },
    Search: { icon: "search", color: "primary" },
    Refresh: { icon: "arrow-clockwise", color: "secondary" },
    Close: { icon: "x-lg", color: "secondary", label: "Close" }
};

const addButtonRows = rows.filter(r => r.designAddScreenButtons);

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

    const btnClass = btn.variant === "solid"
        ? `btn btn-${btn.color || "secondary"}`
        : `btn btn-outline-${btn.color || "secondary"}`;
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

    const buttonRows = orderedRows.filter(row => row.designSCButtons);

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
        .map((col) => {

            const label = `            <label className="form-label fw-semibold">${col.fieldName}</label>`;
            const type = col.designSCSelect;

            if (type === "Text") {
                return `          <div className="col-md-3">\n${label}\n            <input className="form-control" type="text" placeholder="Enter ${col.fieldName}" />\n          </div>`;
            }

            if (type === "Dropdown") {
                return `          <div className="col-md-3">\n${label}\n            <Select options={[]} placeholder="Select ${col.fieldName}" />\n          </div>`;
            }

            if (type === "Date") {
                return `          <div className="col-md-3">\n${label}\n            <input className="form-control" type="date" />\n          </div>`;
            }

            if (type === "Toggle") {
                return `          <div className="col-md-3">\n${label}\n            <div className="form-check form-switch">
                <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    />
                    </div>\n
                </div>`;
            }

            if (type === "Number") {
                return `          <div className="col-md-3">\n${label}\n
                    <input 
                        className="form-control" 
                        type="number" 
                        placeholder="Enter ${col.fieldName}"
                        onKeyDown={(e) => {
                            if (["e", "E", "+", "-"].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                    />\n
                </div>`;
            }

            return "";
        })
        .join("\n");

    return `import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { provideGlobalGridOptions } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const ${screenTitle}Screen = () => {
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
        if (data && data.designAddScreenSelect && data.designAddScreenSelect.trim() !== "") {
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

    const buttonIcons = {
    Save: { icon: "check", color: "success" },
    Update: { icon: "pencil", color: "primary" },
    Delete: { icon: "trash", color: "danger" },
    Print: { icon: "printer", color: "dark" },
    Excel: { icon: "file-earmark-excel", color: "success" },
    Refresh: { icon: "arrow-clockwise", color: "secondary" }
};

const buttonRows = rows.filter(row => row.designAddScreenButtons);

const generateButtons = (rows, key) => {
    const buttonIcons = {
        Add: { icon: "plus", color: "success" },
        Save: { icon: "check", color: "success" },
        Update: { icon: "pencil", color: "primary" },
        Delete: { icon: "trash", color: "danger" },
        Print: { icon: "printer", color: "dark" },
        Excel: { icon: "file-earmark-excel", color: "success" },
        Refresh: { icon: "arrow-clockwise", color: "secondary" }
    };

    return rows
        .filter(row => row[key])
        .map(row =>
            `<button className="btn btn-outline-${buttonIcons[row[key]]?.color || "secondary"}">
                <i className="bi bi-${buttonIcons[row[key]]?.icon || "circle"}"></i>
            </button>`
        ).join("\n");
};

const headerButtons = generateButtons(buttonRows, "designAddScreenButtons");

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

    const isGrid = (c) => c.designAddScreenSelect === "Grid";

    const renderInputField = (col) => {
        const tooltipAttr = col.addScreenTooltip ? ` title="${col.addScreenTooltip}"` : "";
        const label = `            <label className="form-label fw-semibold">${col.fieldName}</label>`;
        const size = col.colSize || 3;

        const wrap = (inner) =>
            `          <div className="col-md-${size}">\n${label}\n${inner}\n          </div>`;

        switch (col.designAddScreenSelect) {
            case "Text":
                return wrap(`            <input className="form-control" type="text" ${tooltipAttr} placeholder="Enter ${col.fieldName}" />`);
            case "Dropdown":
                return wrap(`            <Select options={[]} placeholder="Select ${col.fieldName}" ${tooltipAttr} />`);
            case "Date":
                return wrap(`            <input className="form-control" type="date" ${tooltipAttr}/>`);
            case "Number":
                return wrap(`            <input className="form-control" type="number" ${tooltipAttr}/>`);
            case "File":
                return wrap(`            <input className="form-control" type="file" ${tooltipAttr}/>`);
            case "Text Area":
                return wrap(`            <textarea className="form-control" ${tooltipAttr}></textarea>`);
            case "Toggle":
                return wrap(`
                <div className="form-check form-switch">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        role="switch" 
                        ${tooltipAttr}
                    />
                </div>
                `);
            default:
                return "";
        }
    };

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
                layout += renderInputField(col);
            }
            layout += "\n";
        });

        layout += `        </div>\n`;
    });

    return `import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";

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

</div>
  );
};

export default Add${screenTitle}Screen;`;
};


export const getFrontendCombinedDesignCode = (gridRef, objectRowData, detailsRowData) => {

    if (!gridRef.current || !gridRef.current.api) return "";

    const rows = [];
    gridRef.current.api.forEachNode(node => {
        if (node?.data) rows.push(node.data);
    });

    const name = objectRowData.find(row => row.object === "React")?.name;
    if (!name) return "";

    const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);

    const validRows = rows.filter(r => r.fieldName);

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

const generateButtons = (rows, key) => {
    return rows
        .filter(row => row[key])
        .map(row => {
            const btn = BUTTON_CONFIG[row[key]] || {};

            const btnClass = btn.variant === "solid"
                ? `btn btn-${btn.color || "secondary"}`
                : `btn btn-outline-${btn.color || "secondary"}`;

            return `
                <button className="${btnClass}">
                    <i className="bi bi-${btn.icon || "circle"}"></i>
                </button>
            `;
        })
        .join("\n");
};

const generateAddButtons = (rows) => {
    return rows
        .filter(row => row.designAddScreenButtons)
        .map(row => {
            const btn = BUTTON_CONFIG[row.designAddScreenButtons] || {};

            const btnClass = btn.variant === "solid"
                ? `btn btn-${btn.color || "secondary"}`
                : `btn btn-outline-${btn.color || "secondary"}`;

            return `
                <button className="${btnClass}">
                    <i className="bi bi-${btn.icon || "circle"} me-1"></i>
                    ${row.designAddScreenButtons}
                </button>
            `;
        })
        .join("\n");
};

const buttonRows = rows.filter(r => r.designSCButtons);

// ✅ MOVE THIS UP
const addButtonRows = rows.filter(r => r.designAddScreenButtons);

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
        ["Add", "Delete", "Update", "Print", "Excel"].includes(r.designSCButtons)
    ),
    "designSCButtons"
);

    // ================= COLUMN DEFS =================
    const columnDefs = validRows.map(
        col => `{ headerName: "${col.fieldName}", field: "${col.fieldName}", flex: 1 }`
    );

    // ================= SEARCH INPUTS =================
    const searchInputs = validRows
        .filter(col => col.designSCSelect)
        .map(col => {
            const type = col.designSCSelect;

            const base = `className="form-control" placeholder="Enter ${col.fieldName}"`;

            switch (type) {
                case "Text":
                    return `<div className="col-md-3">
                        <input ${base} />
                    </div>`;

                case "Dropdown":
                    return `<div className="col-md-3">
                        <Select options={[]} placeholder="Select ${col.fieldName}" />
                    </div>`;

                case "Date":
                    return `<div className="col-md-3">
                        <input type="date" className="form-control" />
                    </div>`;

                default:
                    return "";
            }
        }).join("\n");

    // ================= ADD INPUTS =================
    const addInputs = validRows
        .filter(col => col.designAddScreenSelect)
        .map(col => {
            const size = col.designAddOrderNo?.split(",")[2] || 3;

            switch (col.designAddScreenSelect) {
                case "Text":
                    return `<div className="col-md-${size}">
                        <input className="form-control" placeholder="Enter ${col.fieldName}" />
                    </div>`;

                case "Dropdown":
                    return `<div className="col-md-${size}">
                        <Select options={[]} placeholder="Select ${col.fieldName}" />
                    </div>`;

                case "Date":
                    return `<div className="col-md-${size}">
                        <input type="date" className="form-control" />
                    </div>`;

                default:
                    return "";
            }
        }).join("\n");

    // ================= BUTTONS =================


    // ================= FINAL =================
    return `
import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ${screenTitle}Screen = () => {

  const columnDefs = [
    ${columnDefs.join(",")}
  ];

  const rowData = [];

  return (
    <div className="container-fluid p-3">

    {/* HEADER */}
<div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
  <h2 className="mb-0">${screenTitle}</h2>
  <div className="d-flex gap-2">
    ${headerButtons}
  </div>
</div>

      {/* ADD FORM */}
<div className="card p-3 mb-3">

  {/* TOP BUTTONS */}
  <div className="d-flex justify-content-end mb-2 gap-2">
    ${addTopButtons}
  </div>

  <h5>Add ${screenTitle}</h5>

  <div className="row g-3">
  ${addInputs}
</div>

{/* BOTTOM BUTTONS */}
<div className="d-flex justify-content-end gap-2 mt-3 border-top pt-3">
  ${addBottomButtons}
</div>

</div>

      {/* SEARCH */}
      <div className="card p-3 mb-3">
        <h5>Search Criteria</h5>
        <div className="row g-3">
          ${searchInputs}
          <div className="col-md-3 d-flex align-items-end gap-2">
  ${generateButtons(
      buttonRows.filter(r =>
          ["Search", "Refresh"].includes(r.designSCButtons)
      ),
      "designSCButtons"
  )}
</div>
        </div>
      </div>

      {/* GRID */}
      <div className="card p-2">
        <div className="ag-theme-alpine" style={{ height: 300 }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
          />
        </div>
      </div>

    </div>
  );
};

export default ${screenTitle}Screen;
`;
};

