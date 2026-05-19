import {
    generateAddButtons
} from "../shared/buttonRenderer";

import {
    renderInputControl
} from "../shared/inputRenderer";

// ================= ADD SCREEN =================
export const getFrontendAddDesignCode = (
    gridRef,
    objectRowData,
    detailsTables = []
) => {

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

    const isGrid = (c) =>
        c.designAddScreenSelect &&
        c.designAddScreenSelect.toUpperCase() === "GRID";


    const renderInlineGrid = (col) => {

    const size = col.colSize || 12;

    // FIND MATCHING DETAILS TABLE
    const detailsTable = detailsTables.find(
        dt =>
            dt.gridName?.toLowerCase() ===
            col.fieldName?.toLowerCase()
    );

    const detailRows = detailsTable?.rowData || [];

    // SORT GRID COLUMNS
    const withOrder = detailRows.filter(
        r => r.fieldName && r.gridOrderNo
    );

    const withoutOrder = detailRows.filter(
        r => r.fieldName && !r.gridOrderNo
    );

    const sorted = [
        ...withOrder.sort(
            (a, b) =>
                (parseInt(a.gridOrderNo) || 9999) -
                (parseInt(b.gridOrderNo) || 9999)
        ),
        ...withoutOrder
    ];

    const gridColumnDefs = sorted
        .map((r) => {

            const tooltip = r.gridTooltip
                ? `, headerTooltip: "${r.gridTooltip}"`
                : "";

            return `
{
   headerName: "${r.fieldName}",
   field: "${r.fieldName}"
   ${tooltip}
}
`;
        })
        .join(",");

    return `
<div className="col-md-${size}">

   <div className="card shadow-sm p-2">

      <h6 className="mb-2">
         ${col.fieldName}
      </h6>

      <div
         className="ag-theme-alpine"
         style={{
            height: 300,
            width: "100%"
         }}
      >

         <AgGridReact
            rowData={[]}
            columnDefs={[
               ${gridColumnDefs}
            ]}
            pagination={true}
         />

      </div>

   </div>

</div>
`;
};

    let layout = "";

    Object.keys(groupedRows).forEach((rowKey) => {
        layout += `        <div className="row g-3 mb-2">\n`;

        groupedRows[rowKey].forEach(col => {
            if (isGrid(col)) {
                layout += renderInlineGrid(col);
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