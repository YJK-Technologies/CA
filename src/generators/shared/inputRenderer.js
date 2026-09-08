import { safeFieldName } from "./helpers";

export const renderInputControl = (col, type, size = 3, indentLevel = 10) => {
   const pad = " ".repeat(indentLevel);
   const label = `<label className="form-label fw-semibold">${col.fieldName}</label>`;

   switch ((type || "").toUpperCase()) {
      case "TEXT":
         return `${pad}<div className="col-md-${size}">\n${pad}  ${label}\n${pad}  <input className="form-control" placeholder="Enter ${col.fieldName}" />\n${pad}</div>`;

      case "DROPDOWN":
         return `${pad}<div className="col-md-${size}">\n${pad}  ${label}\n${pad}  <Select options={[]} placeholder="Select ${col.fieldName}" />\n${pad}</div>`;

      case "DATE":
         return `${pad}<div className="col-md-${size}">\n${pad}  ${label}\n${pad}  <input type="date" className="form-control" />\n${pad}</div>`;

      case "NUMBER":
         return `${pad}<div className="col-md-${size}">\n${pad}  ${label}\n${pad}  <input type="number" className="form-control" onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }} />\n${pad}</div>`;

      case "TEXT AREA":
         return `${pad}<div className="col-md-${size}">\n${pad}  ${label}\n${pad}  <textarea className="form-control"></textarea>\n${pad}</div>`;

      case "TOGGLE":
         return `${pad}<div className="col-md-${size}">\n${pad}  ${label}\n${pad}  <div className="form-check form-switch d-flex align-items-center" style={{ minHeight: "38px" }}>\n${pad}    <input className="form-check-input" type="checkbox" role="switch" />\n${pad}  </div>\n${pad}</div>`;

      case "FILE": {
         let acceptType = "*";
         switch ((col.fileType || "").toUpperCase()) {
            case "IMAGE": acceptType = "image/*"; break;
            case "VIDEO": acceptType = "video/*"; break;
            case "AUDIO": acceptType = "audio/*"; break;
            case "FILE": acceptType = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"; break;
            default: acceptType = "*";
         }
         return `${pad}<div className="col-md-${size}">\n${pad}  ${label}\n${pad}  <input type="file" className="form-control" accept="${acceptType}" />\n${pad}</div>`;
      }

      default:
         return `${pad}<div className="col-md-${size}">\n${pad}  ${label}\n${pad}  <input className="form-control" placeholder="Enter ${col.fieldName}" />\n${pad}</div>`;
   }
};