import { BUTTON_CONFIG } from "./buttonConfig";

export const generateButtons = (rows, key) => {

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

export const generateAddButtons = (rows) => {

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
