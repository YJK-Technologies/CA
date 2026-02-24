import React from 'react';
import { FaTools } from 'react-icons/fa';

const Sidebar = ({ isOpen }) => {
  return (
    <div className={`sidebar bg-dark text-white ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header p-3 d-flex align-items-center justify-content-center">
        {isOpen ? (
          <h5 className="m-0">YJK Technologies</h5>
        ) : (
          <FaTools size={24} />
        )}
      </div>
      <ul className="list-unstyled ps-0">
        <li className="py-3 d-flex align-items-center ps-3">
          <FaTools className="me-2" />
          {isOpen && <span>Automation</span>}
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
