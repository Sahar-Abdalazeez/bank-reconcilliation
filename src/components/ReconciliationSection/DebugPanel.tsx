import React, { useState } from "react";
import { useFileUpload } from "../../contexts/FileUploadContext";
import "./debugStyles.css";

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false); // Closed by default
  const {
    companyData,
    bankData,
    companyHeaders,
    bankHeaders,
    selectedClassificationType,
    editableRules,
  } = useFileUpload();

  const currentRules = editableRules?.[selectedClassificationType?.key];

  if (!companyData?.length || !bankData?.length || !selectedClassificationType) {
    return null;
  }

  return (
    <div className="summary-panel">
      <div className="summary-header">
        <div className="summary-header-content">
          <h3 className="summary-title">📊 Reconciliation Summary</h3>
          <p className="summary-subtitle">Overview of data and configuration status</p>
        </div>
        <button 
          className="summary-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Collapse Summary" : "Expand Summary"}
        >
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="summary-content">

          {/* Data Status */}
          <div className="debug-section">
            <h4>📊 Data Status</h4>
            <div className="debug-info-grid">
              <div className="debug-info-item">
                <span>Company Rows:</span>
                <strong>{companyData && Array.isArray(companyData) ? companyData.length : 0}</strong>
              </div>
              <div className="debug-info-item">
                <span>Bank Rows:</span>
                <strong>{bankData && Array.isArray(bankData) ? bankData.length : 0}</strong>
              </div>
              <div className="debug-info-item">
                <span>Company Headers:</span>
                <strong>{companyHeaders && Array.isArray(companyHeaders) ? companyHeaders.length : 0}</strong>
              </div>
              <div className="debug-info-item">
                <span>Bank Headers:</span>
                <strong>{bankHeaders && Array.isArray(bankHeaders) ? bankHeaders.length : 0}</strong>
              </div>
            </div>
          </div>

          {/* Headers */}
          <div className="debug-section">
            <h4>📋 Column Headers</h4>
            <div className="headers-display">
              <div className="header-column">
                <strong>🏢 Company:</strong>
                <div className="header-list">
                  {companyHeaders?.map((header, idx) => (
                    <span key={idx} className="header-tag">
                      {header || `Column ${idx + 1}`}
                    </span>
                  ))}
                </div>
              </div>
              <div className="header-column">
                <strong>🏦 Bank:</strong>
                <div className="header-list">
                  {bankHeaders?.map((header, idx) => (
                    <span key={idx} className="header-tag">
                      {header || `Column ${idx + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Current Configuration */}
          {currentRules && (
            <>
              <div className="debug-section">
                <h4>⚙️ Search Columns</h4>
                <div className="debug-info-grid">
                  <div className="debug-info-item">
                    <span>🏢 Company Search Column:</span>
                    <strong className={currentRules.companySearchColumn ? 'success' : 'error'}>
                      {currentRules.companySearchColumn || '❌ Not Set'}
                    </strong>
                  </div>
                  <div className="debug-info-item">
                    <span>🏦 Bank Search Column:</span>
                    <strong className={currentRules.bankSearchColumn ? 'success' : 'error'}>
                      {currentRules.bankSearchColumn || '❌ Not Set'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="debug-section">
                <h4>🎯 Matching Columns</h4>
                {currentRules.matchingColumns?.length > 0 ? (
                  <div className="matching-columns-debug">
                    {currentRules.matchingColumns.map((col, idx) => (
                      <div key={idx} className="matching-column-debug">
                        <div className="matching-debug-header">
                          <strong>{col.label || `Column ${idx + 1}`}</strong>
                          <span className="match-type-badge">{col.matchType}</span>
                        </div>
                        <div className="matching-debug-body">
                          <div className={`debug-column-mapping ${!col.companyColumn ? 'error' : 'success'}`}>
                            🏢 {col.companyColumn || '❌ Not Set'}
                          </div>
                          <div className="mapping-arrow">⟷</div>
                          <div className={`debug-column-mapping ${!col.bankColumn ? 'error' : 'success'}`}>
                            🏦 {col.bankColumn || '❌ Not Set'}
                          </div>
                        </div>
                        {col.matchType === 'numeric' && (
                          <div className="debug-detail">Tolerance: ±{col.tolerance || 0}</div>
                        )}
                        {col.matchType === 'date' && col.useDateTolerance && (
                          <div className="debug-detail">Date Tolerance: ±{col.dateTolerance || 0} days</div>
                        )}
                        {col.matchType === 'text' && col.normalize && (
                          <div className="debug-detail">✅ Normalization Enabled</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="debug-warning">
                    ❌ No matching columns configured
                  </div>
                )}
              </div>

              {/* Sample Data Preview */}
              <div className="debug-section">
                <h4>👀 Sample Data Preview</h4>
                <div className="sample-data-grid">
                  <div className="sample-data-column">
                    <strong>🏢 Company (First Row):</strong>
                    <div className="sample-row">
                      {companyHeaders?.slice(0, 5).map((header, idx) => (
                        <div key={idx} className="sample-cell">
                          <div className="sample-header">{header}</div>
                          <div className="sample-value">
                            {companyData[0]?.[idx] !== undefined && companyData[0]?.[idx] !== null 
                              ? String(companyData[0][idx]) 
                              : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sample-data-column">
                    <strong>🏦 Bank (First Row):</strong>
                    <div className="sample-row">
                      {bankHeaders?.slice(0, 5).map((header, idx) => (
                        <div key={idx} className="sample-cell">
                          <div className="sample-header">{header}</div>
                          <div className="sample-value">
                            {bankData[0]?.[idx] !== undefined && bankData[0]?.[idx] !== null 
                              ? String(bankData[0][idx]) 
                              : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quick Fixes */}
          <div className="debug-section">
            <h4>🔧 Common Issues</h4>
            <div className="debug-issues">
              {!currentRules?.companySearchColumn && (
                <div className="debug-issue error">
                  ❌ Company search column not set - Click Edit Mode and select a column
                </div>
              )}
              {!currentRules?.bankSearchColumn && (
                <div className="debug-issue error">
                  ❌ Bank search column not set - Click Edit Mode and select a column
                </div>
              )}
              {currentRules?.matchingColumns?.some(col => !col.companyColumn) && (
                <div className="debug-issue error">
                  ❌ Some matching columns missing company column selection
                </div>
              )}
              {currentRules?.matchingColumns?.some(col => !col.bankColumn) && (
                <div className="debug-issue error">
                  ❌ Some matching columns missing bank column selection
                </div>
              )}
              {currentRules?.companySearchColumn && 
               currentRules?.bankSearchColumn && 
               currentRules?.matchingColumns?.every(col => col.companyColumn && col.bankColumn) && (
                <div className="debug-issue success">
                  ✅ Configuration looks good! Check browser console for detailed logs.
                </div>
              )}
            </div>
          </div>

          <div className="summary-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Review this summary to verify your configuration before running reconciliation</span>
          </div>
        </div>
      )}
    </div>
  );
};

