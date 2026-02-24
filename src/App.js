import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Automation from './Pages/Automation';
import './App.css';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`d-flex ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Sidebar isOpen={isSidebarOpen} />
      <div className="main-content flex-grow-1">
        <Topbar onToggleSidebar={toggleSidebar} />
        <div className="container-fluid mt-4">
          <Routes>
            <Route path="/" element={<Automation />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
