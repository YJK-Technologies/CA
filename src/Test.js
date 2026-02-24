import React from "react";
import Select from "react-select";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { provideGlobalGridOptions } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: "legacy" });

const SampleScreen = () => {
  const columnDefs = [
    { headerName: "Header_code", field: "Header_code", flex: 1 },
    { headerName: "Header_name", field: "Header_name", flex: 1 },
    { headerName: "Image", field: "Image", flex: 1 },
    { headerName: "DOB", field: "DOB", flex: 1 }
  ];

  const rowData = [];

  return (
    <div className="container-fluid p-3">
      {/* 🔵 Top Header */}
      <div className="d-flex p-3 rounded-2 border border-black justify-content-between align-items-center mb-3 shadow-sm">
        <h2 className="mb-0">Sample</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success"><i className="bi bi-plus" /></button>
          <button className="btn btn-outline-danger"><i className="bi bi-dash" /></button>
          <button className="btn btn-outline-primary"><i className="bi bi-floppy" /></button>
          <button className="btn btn-outline-dark"><i className="bi bi-printer" /></button>
        </div>
      </div>

      {/* 🟣 Search Filters */}
      <div className="card p-3 mb-3 shadow-sm">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Header_code</label>
            <input className="form-control" placeholder="Enter Header_code" />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Header_name</label>
            <input className="form-control" placeholder="Enter Header_name" />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">DOB</label>
            <input className="form-control" placeholder="Enter DOB" />
          </div>
          <div className="col-md-3 d-flex align-items-end gap-2">
            <button className="btn btn-primary"><i className="bi bi-search" /></button>
            <button className="btn btn-secondary"><i className="bi bi-arrow-clockwise" /></button>
          </div>
        </div>
      </div>

      {/* 🟢 AG Grid */}
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

export default SampleScreen;