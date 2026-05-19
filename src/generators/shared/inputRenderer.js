import { safeFieldName } from "./helpers";

export const renderInputControl = (col, type, size = 3) => {

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

   <div
      className="form-check form-switch d-flex align-items-center"
      style={{ minHeight: "38px" }}
   >
      <input
         className="form-check-input"
         type="checkbox"
         role="switch"
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