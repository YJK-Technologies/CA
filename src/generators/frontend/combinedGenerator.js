import {
   generateButtons,
   generateAddButtons
} from "../shared/buttonRenderer";

import {
   renderInputControl
} from "../shared/inputRenderer";

export const getFrontendCombinedDesignCode = (
   gridRef,
   objectRowData,
   detailsTables = [],
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

      const screenColumnDefs = [

         `{
   headerName: "S.No.",
   valueGetter: "node.rowIndex + 1",
   width: 90,
   pinned: "left"
}`,

         `{
   headerName: "Actions",
   field: "actions",
   width: 140,
   pinned: "left",
   cellRenderer: (params) => {

      const cellWidth =
         params.column.getActualWidth();

      const isWideEnough =
         cellWidth > 20;

      const showIcons =
         isWideEnough;

      return (
         <div
            className="position-relative d-flex align-items-center"
            style={{
               minHeight: "100%",
               justifyContent: "center"
            }}
         >

            {showIcons && (
               <>

                  <span
                     className="icon mx-2"
                     style={{ cursor: "pointer" }}
                  >
                     <i className="fa-regular fa-floppy-disk"></i>
                  </span>

                  <span
                     className="icon mx-2"
                     style={{ cursor: "pointer" }}
                  >
                     <i className="fa-solid fa-trash"></i>
                  </span>

               </>
            )}

         </div>
      );
   }
}`,

         ...screenRows
            .filter(col => col.fieldName)
            .map(
               col => `{
   headerName: "${col.fieldName}",
   field: "${col.fieldName}",
   flex: 1
}`
            )

      ];

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
<div className="col-12">

   <div className="card p-2 shadow-sm w-100">

      <div
         className="ag-theme-alpine w-100"
         style={{
            height: 300,
            width: "100%"
         }}
      >
         <AgGridReact
            columnDefs={[
               ${screenColumnDefs}
            ]}
            rowData={rowData}
            pagination={true}
         />
      </div>

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
      ${screenColumnDefs}
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

{
   headerName: "S.No.",
   valueGetter: "node.rowIndex + 1",
   width: 90,
   pinned: "left"
},

{
   headerName: "Actions",
   field: "actions",
   width: 140,
   pinned: "left",
   cellRenderer: (params) => {

      const cellWidth =
         params.column.getActualWidth();

      const isWideEnough =
         cellWidth > 20;

      const showIcons =
         isWideEnough;

      return (
         <div
            className="position-relative d-flex align-items-center"
            style={{
               minHeight: "100%",
               justifyContent: "center"
            }}
         >

            {showIcons && (
               <>

                  <span
                     className="icon mx-2"
                     style={{ cursor: "pointer" }}
                  >
                     <i className="fa-regular fa-floppy-disk"></i>
                  </span>

                  <span
                     className="icon mx-2"
                     style={{ cursor: "pointer" }}
                  >
                     <i className="fa-solid fa-trash"></i>
                  </span>

               </>
            )}

         </div>
      );
   }
},

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