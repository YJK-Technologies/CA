import { getValidRows } from "../shared/helpers";
import { generateButtons } from "../shared/buttonRenderer";
import { renderInputControl } from "../shared/inputRenderer";

// Helper: Sanitize field names by replacing spaces and special characters with underscores
const sanitizeFieldName = (name) => name ? name.trim().replace(/\s+/g, '_') : '';

export const getFrontendSearchDesignCode = (rows, objectRowData) => {
    const name = objectRowData.find(row => row.object === 'React')?.name;
    if (!name || rows.length === 0) return "";

    const screenTitle = name.charAt(0).toUpperCase() + name.slice(1);
    // 🔹 FIX: Remove spaces to form a valid JavaScript component identifier
    const cleanScreenTitle = screenTitle.replace(/\s+/g, '');

    // 1. Grid Table Columns: All valid fields defined in rowData
    const allValidRows = getValidRows(rows);
    
    // 2. Search Criteria Input Fields: Filter ONLY fields where designSCSelect is chosen
    const searchInputRows = rows
        .filter(row => row.designSCSelect && row.designSCSelect.toString().trim() !== "")
        .sort((a, b) => {
            const aOrder = parseInt(a.designSCOrderNo);
            const bOrder = parseInt(b.designSCOrderNo);
            const aValid = !isNaN(aOrder);
            const bValid = !isNaN(bOrder);
            if (aValid && bValid) return aOrder - bOrder;
            if (aValid) return -1;
            if (bValid) return 1;
            return 0;
        });

    // Extract action & header buttons
    const buttonRows = rows.filter(row => row.designSCButtons && row.designSCButtons.toString().trim() !== "");

    const headerButtons = generateButtons(
        buttonRows.filter(r => ["Add", "Delete", "Update", "Print", "Excel"].includes(r.designSCButtons.trim())),
        "designSCButtons",
        10
    );

    const inputActionButtons = generateButtons(
        buttonRows.filter(r => ["Search", "Refresh"].includes(r.designSCButtons.trim())),
        "designSCButtons",
        12
    );

    // AG Grid columns using original fieldName for headerName and sanitized fieldName for field
    // FIX: Filter out rows where dataType is "GRID"
    const columnDefs = allValidRows
        .filter(col => (col.dataType || "").toString().trim().toUpperCase() !== "GRID")
        .map(
            (col) => `    { headerName: "${col.fieldName}", field: "${sanitizeFieldName(col.fieldName)}" }`
        );

    // Input Search Controls using ONLY filtered search input fields
    const inputControls = searchInputRows
        .map((col) => renderInputControl(col, col.designSCSelect, 3, 10))
        .join("\n");

    return `import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ${cleanScreenTitle}Screen = () => {
  const rowData = [];

  const columnDefs = [
${columnDefs.join(",\n")}
  ];

  return (
    <div className="container-fluid p-3">
      {/* Header Bar */}
      <div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
        <h2 className="mb-0">${screenTitle}</h2>
        <div className="d-flex gap-2">
${headerButtons}
        </div>
      </div>

      {/* Filter / Search Controls Section */}
      <div className="card p-3 mb-3 shadow-sm">
        <div className="row g-3">
${inputControls}
          <div className="col-md-3 d-flex align-items-end gap-2">
${inputActionButtons}
          </div>
        </div>
      </div>

      {/* Data Table Section */}
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

export default ${cleanScreenTitle}Screen;`;
};