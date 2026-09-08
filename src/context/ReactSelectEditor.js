import React, {
    forwardRef,
    useImperativeHandle,
    useState
} from "react";

import Select from "react-select";

const ReactSelectCellEditor = forwardRef((props, ref) => {

    const options = (props.options || []).map(item => ({
        label: item,
        value: item
    }));

    const [selectedValue, setSelectedValue] = useState(
        props.value
            ? {
                label: props.value,
                value: props.value
            }
            : null
    );

    // AG Grid will call this method to get final value
    useImperativeHandle(ref, () => ({
        getValue() {
            return selectedValue?.value || "";
        }
    }));

    const handleChange = (selectedOption) => {

        setSelectedValue(selectedOption);

        // selectedOption will be null when clear button clicked
        if (props.onValueChange) {
            props.onValueChange(
                selectedOption ? selectedOption.value : ""
            );
        }

        // Close AG Grid editor after selection
        setTimeout(() => {
            if (props.stopEditing) {
                props.stopEditing();
            }
        }, 0);
    };

    return (
        <div
            style={{
                width: "100%",
                minWidth: "180px"
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Select
                autoFocus
                value={selectedValue}
                options={options}
                onChange={handleChange}

                // Clearable facility
                isClearable

                // Search inside dropdown
                isSearchable

                placeholder="Select..."

                menuPortalTarget={document.body}

                styles={{
                    container: (base) => ({
                        ...base,
                        width: "100%"
                    }),

                    control: (base) => ({
                        ...base,
                        minHeight: "38px",
                        height: "38px"
                    }),

                    valueContainer: (base) => ({
                        ...base,
                        height: "38px",
                        padding: "0 8px"
                    }),

                    indicatorsContainer: (base) => ({
                        ...base,
                        height: "38px"
                    }),

                    menuPortal: (base) => ({
                        ...base,
                        zIndex: 99999
                    })
                }}
            />
        </div>
    );
});

export default ReactSelectCellEditor;