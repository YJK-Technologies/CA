import {
  generateButtons,
  generateAddButtons
} from "../shared/buttonRenderer";
import { renderInputControl } from "../shared/inputRenderer";

export const getFrontendCombinedDesignCode = (
  rows,
  objectRowData,
  detailsTables = [],
  screens = []
) => {
  const name = objectRowData.find(row => row.object === "React")?.name;
  if (!name) return "";

  const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);
  // 🔹 FIX: Remove all spaces to create a valid JavaScript component/identifier name
  const cleanScreenTitle = screenTitle.replace(/\s+/g, "");

  const validRows = rows.filter(r => r.fieldName);
  const buttonRows = rows.filter(r => r.designSCButtons);

  const addButtonRows = rows.filter(
    r =>
      r.designAddScreenButtons &&
      r.designAddScreenButtons.toString().trim() !== ""
  );

  const addTopButtons = generateAddButtons(
    addButtonRows.filter(r =>
      (r.addScreenButtonPosition || "").toLowerCase() === "top"
    ),
    10
  );

  const addBottomButtons = generateAddButtons(
    addButtonRows.filter(r =>
      (r.addScreenButtonPosition || "").toLowerCase() === "bottom"
    ),
    10
  );

  const headerButtons = generateButtons(
    buttonRows.filter(r =>
      ["Add", "Delete", "Update"].includes(r.designSCButtons?.trim())
    ),
    "designSCButtons",
    10
  );

  // ================= COLUMN DEFS =================
  const columnDefs = validRows.map(
    col => `  { headerName: "${col.fieldName}", field: "${col.fieldName}", flex: 1 }`
  );

  // ================= SEARCH INPUTS =================
  const searchInputs = validRows
    .filter(
      col => col.designSCSelect && col.designSCSelect.toString().trim() !== ""
    )
    .map(col => renderInputControl(col, col.designSCSelect, 3, 10))
    .join("\n");

  // ================= ADD INPUTS =================
  const addInputs = validRows
    .filter(
      col =>
        col.designAddScreenSelect &&
        col.designAddScreenSelect.toString().trim() !== "" &&
        col.designAddScreenSelect.toUpperCase() !== "GRID"
    )
    .map(col => {
      const size = col.designAddOrderNo?.split(",")[2] || 3;
      return renderInputControl(col, col.designAddScreenSelect, size, 8);
    })
    .join("\n");

  // ================= SCREEN CASES =================
  const screenCases = screens
    .map(screen => {
      const screenRows = screen.rowData || [];
      const screenRowData = `[]`;

      // Screen buttons
      const screenButtonRows = screenRows
        .filter(r => r.designSCButtons)
        .map(r => ({
          ...r,
          designSCButtons: r.designSCButtons?.toString().trim(),
          designAddScreenButtons: r.designAddScreenButtons?.toString().trim()
        }));

      const screenHeaderButtons = generateButtons(
        screenButtonRows.filter(r =>
          ["Add", "Delete", "Update"].includes(r.designSCButtons?.trim())
        ),
        "designSCButtons",
        14
      );

      const screenSearchButtons = generateButtons(
        screenButtonRows.filter(r =>
          ["Search", "Refresh", "Print", "Excel"].includes(r.designSCButtons?.trim())
        ),
        "designSCButtons",
        18
      );

      // Add screen buttons
      const screenAddButtonRows = screenRows
        .filter(r => r.designAddScreenButtons)
        .map(r => ({
          ...r,
          designAddScreenButtons: r.designAddScreenButtons?.toString().trim(),
          addScreenButtonPosition: r.addScreenButtonPosition?.toString().trim().toLowerCase()
        }));

      const screenAddTopButtons = generateAddButtons(
        screenAddButtonRows.filter(r => r.addScreenButtonPosition === "top"),
        14
      );

      const screenAddBottomButtons = generateAddButtons(
        screenAddButtonRows.filter(r => r.addScreenButtonPosition === "bottom"),
        18
      );

      // Screen Grid Column Defs
      const screenColumnDefs = [
        `{ headerName: "S.No.", valueGetter: "node.rowIndex + 1", width: 90, pinned: "left" }`,
        `{
            headerName: "Actions",
            field: "actions",
            width: 140,
            pinned: "left",
            cellRenderer: (params) => {
              const cellWidth = params.column.getActualWidth();
              return cellWidth > 20 ? (
                <div className="position-relative d-flex align-items-center justify-content-center" style={{ minHeight: "100%" }}>
                  <span className="icon mx-2" style={{ cursor: "pointer" }}><i className="fa-regular fa-floppy-disk"></i></span>
                  <span className="icon mx-2" style={{ cursor: "pointer" }}><i className="fa-solid fa-trash"></i></span>
                </div>
              ) : null;
            }
          }`,
        ...screenRows
          .filter(col => col.fieldName)
          .map(col => `{ headerName: "${col.fieldName}", field: "${col.fieldName}", flex: 1 }`)
      ].join(",\n          ");

      // Screen Search Inputs
      const screenSearchInputs = screenRows
        .filter(col => col.designSCSelect && col.designSCSelect.toString().trim() !== "")
        .map(col => renderInputControl(col, col.designSCSelect, 3, 16))
        .join("\n");

      // Screen Add Inputs
      const screenAddInputs = screenRows
        .filter(col => col.designAddScreenSelect && col.designAddScreenSelect.toString().trim() !== "")
        .map(col => {
          const size = col.designAddOrderNo?.split(",")[2] || 3;
          const type = col.designAddScreenSelect?.toUpperCase();

          if (type === "GRID") {
            return `                <div className="col-12">
                  <div className="card p-2 shadow-sm w-100">
                    <div className="ag-theme-alpine w-100" style={{ height: 300 }}>
                      <AgGridReact
                        columnDefs={[
                          ${screenColumnDefs}
                        ]}
                        rowData={rowData}
                        pagination={true}
                      />
                    </div>
                  </div>
                </div>`;
          }

          return renderInputControl(col, col.designAddScreenSelect, size, 16);
        })
        .join("\n");

      return `    case "${screen.screenName}":
      return (
        <>
          {/* HEADER */}
          <div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
            <h2 className="mb-0">${screen.screenName}</h2>
            <div className="d-flex gap-2">
${screenHeaderButtons}
${screenAddTopButtons}
            </div>
          </div>

          {/* ADD FORM */}
          <div className="card p-3 mb-3">
            <h5>Add ${screen.screenName}</h5>
            <div className="row g-3">
${screenAddInputs}
${
  screenAddBottomButtons
    ? `              <div className="col-12 d-flex gap-2 justify-content-end mt-3">\n${screenAddBottomButtons}\n              </div>`
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
            <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
              <AgGridReact
                columnDefs={[
                  ${screenColumnDefs}
                ]}
                rowData={${screenRowData}}
              />
            </div>
          </div>
        </>
      );`;
    })
    .join("\n\n");

  // ================= FINAL COMPONENT OUTPUT =================
  return `import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const { useState } = React;

const ${cleanScreenTitle}Screen = () => {
  const [activeTab, setActiveTab] = useState(${JSON.stringify(screens[0]?.screenName || "")});

  const columnDefs = [
    { headerName: "S.No.", valueGetter: "node.rowIndex + 1", width: 90, pinned: "left" },
    {
      headerName: "Actions",
      field: "actions",
      width: 140,
      pinned: "left",
      cellRenderer: (params) => {
        const cellWidth = params.column.getActualWidth();
        return cellWidth > 20 ? (
          <div className="position-relative d-flex align-items-center justify-content-center" style={{ minHeight: "100%" }}>
            <span className="icon mx-2" style={{ cursor: "pointer" }}><i className="fa-regular fa-floppy-disk"></i></span>
            <span className="icon mx-2" style={{ cursor: "pointer" }}><i className="fa-solid fa-trash"></i></span>
          </div>
        ) : null;
      }
    },
${columnDefs.join(",\n")}
  ];

  const rowData = [];

  const renderScreen = () => {
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
${
  addBottomButtons
    ? `              <div className="col-12 d-flex gap-2 justify-content-end mt-3">\n${addBottomButtons}\n              </div>`
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
    ["Search", "Refresh", "Print", "Excel"].includes(r.designSCButtons?.trim())
  ),
  "designSCButtons",
  16
)}
              </div>
            </div>
          </div>

          {/* GRID */}
          <div className="card p-2">
            <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
              <AgGridReact columnDefs={columnDefs} rowData={rowData} />
            </div>
          </div>
        </>
      );
    }

    switch (activeTab) {
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
              className={activeTab === tab ? "btn btn-primary" : "btn btn-outline-primary"}
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

export default ${cleanScreenTitle}Screen;`;
};