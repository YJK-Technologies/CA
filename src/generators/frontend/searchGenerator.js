import { getValidRows } from "../shared/helpers";

import {
    generateButtons
} from "../shared/buttonRenderer";

import {
    renderInputControl
} from "../shared/inputRenderer";


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

    console.log("SEARCH VALID ROWS => ", validRows);


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