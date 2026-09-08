import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaPen } from 'react-icons/fa';
import { useAutomation } from '../context/AutomationContext';

// Read-only recap of the data entered on the Dashboard. Pure display —
// pulls straight from AutomationContext, never asks the user to re-enter it.
const SummaryBar = () => {
    const { objectRowData, rowData, detailsTabs, enableAudit, screens } = useAutomation();
    const navigate = useNavigate();

    const getName = (type) => objectRowData.find(r => r.object === type)?.name;

    const chips = [
        { label: 'DB', value: getName('DB') },
        { label: 'Table', value: getName('Table') },
        { label: 'Stored Procedure', value: getName('StoredProcedure') },
        { label: 'React Screen', value: getName('React') },
        { label: 'Fields', value: rowData?.length ? `${rowData.length} field(s)` : null },
        { label: 'Details Tables', value: detailsTabs?.length ? `${detailsTabs.length}` : null },
        { label: 'Audit Columns', value: enableAudit ? 'Enabled' : null },
        { label: 'Saved Screens', value: screens?.length ? `${screens.length}` : null },
    ].filter(c => c.value);

    return (
        <motion.div
            className="summary-bar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="summary-bar-chips">
                {chips.length === 0 && (
                    <span className="text-secondary">No dashboard data entered yet.</span>
                )}
                {chips.map(c => (
                    <span className="summary-chip" key={c.label}>
                        <strong>{c.label}:</strong>&nbsp;{c.value}
                    </span>
                ))}
            </div>
            <button className="summary-bar-edit" onClick={() => navigate('/')}>
                <FaPen /> Edit on Dashboard
            </button>
        </motion.div>
    );
};

export default SummaryBar;
