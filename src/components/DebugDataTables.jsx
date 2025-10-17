import React, { useState } from 'react';
import { useFileUpload } from '../contexts/FileUploadContext';
import './DebugDataTables.css';

export const DebugDataTables = () => {
  const { companyData, bankData, companyHeaders, bankHeaders } = useFileUpload();
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewLimit, setPreviewLimit] = useState(10);

  if (!companyData?.length && !bankData?.length) {
    return null;
  }

  return (
    <div className="debug-data-tables">
      <div className="debug-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>🐛 Debug: View Tables</h3>
        <button className="debug-toggle">
          {isExpanded ? '▼ Collapse' : '▶ Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="debug-content">
          {/* Company Data Table */}
          {companyData?.length > 0 && (
            <div className="debug-table-section">
              <div className="debug-table-header">
                <h4>🏢 Company Data</h4>
                <span className="debug-row-count">
                  {companyData.length} rows × {companyHeaders?.length || 0} columns
                </span>
              </div>

              <div className="debug-table-controls">
                <label>
                  Show rows:
                  <select 
                    value={previewLimit} 
                    onChange={(e) => setPreviewLimit(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={companyData.length}>All ({companyData.length})</option>
                  </select>
                </label>
              </div>

              <div className="debug-table-container">
                <table className="debug-table">
                  <thead>
                    <tr>
                      <th className="row-number">#</th>
                      {companyHeaders?.map((header, index) => (
                        <th key={index} title={header}>
                          {header || `Column ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companyData.slice(0, previewLimit).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="row-number">{rowIndex + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} title={String(cell || '')}>
                            {cell !== null && cell !== undefined ? String(cell) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {companyData.length > previewLimit && (
                <div className="debug-table-footer">
                  Showing {previewLimit} of {companyData.length} rows
                </div>
              )}
            </div>
          )}

          {/* Bank Data Table */}
          {bankData?.length > 0 && (
            <div className="debug-table-section">
              <div className="debug-table-header">
                <h4>🏦 Bank Data</h4>
                <span className="debug-row-count">
                  {bankData.length} rows × {bankHeaders?.length || 0} columns
                </span>
              </div>

              <div className="debug-table-container">
                <table className="debug-table">
                  <thead>
                    <tr>
                      <th className="row-number">#</th>
                      {bankHeaders?.map((header, index) => (
                        <th key={index} title={header}>
                          {header || `Column ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bankData.slice(0, previewLimit).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="row-number">{rowIndex + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} title={String(cell || '')}>
                            {cell !== null && cell !== undefined ? String(cell) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bankData.length > previewLimit && (
                <div className="debug-table-footer">
                  Showing {previewLimit} of {bankData.length} rows
                </div>
              )}
            </div>
          )}

          {/* Headers Info */}
          <div className="debug-info-section">
            <h4>📋 Column Headers</h4>
            <div className="debug-info-grid">
              {companyHeaders?.length > 0 && (
                <div className="debug-info-card">
                  <strong>🏢 Company Columns:</strong>
                  <div className="debug-headers-list">
                    {companyHeaders.map((header, index) => (
                      <span key={index} className="debug-header-badge">
                        {index + 1}. {header || 'Unnamed'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {bankHeaders?.length > 0 && (
                <div className="debug-info-card">
                  <strong>🏦 Bank Columns:</strong>
                  <div className="debug-headers-list">
                    {bankHeaders.map((header, index) => (
                      <span key={index} className="debug-header-badge">
                        {index + 1}. {header || 'Unnamed'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

