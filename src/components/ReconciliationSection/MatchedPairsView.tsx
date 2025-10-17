import React, { useState } from 'react';
import './matchedPairsStyles.css';

interface MatchedPairsViewProps {
  matchedCompany: any[][];
  matchedBank: any[][];
  companyHeaders: string[];
  bankHeaders: string[];
}

export const MatchedPairsView: React.FC<MatchedPairsViewProps> = ({
  matchedCompany,
  matchedBank,
  companyHeaders,
  bankHeaders
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [previewLimit, setPreviewLimit] = useState(10);

  if (!matchedCompany || matchedCompany.length === 0) {
    return null;
  }

  return (
    <div className="matched-pairs-view">
      <div className="pairs-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="pairs-title">
          <span className="pairs-icon">🔗</span>
          <h3>Matched Pairs - Side by Side Comparison</h3>
          <span className="pairs-count">{matchedCompany.length} pairs</span>
        </div>
        <button className="pairs-toggle">
          {isExpanded ? '▼ Collapse' : '▶ Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="pairs-content">
          <div className="pairs-controls">
            <label>
              Show pairs:
              <select value={previewLimit} onChange={(e) => setPreviewLimit(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={matchedCompany.length}>All ({matchedCompany.length})</option>
              </select>
            </label>
          </div>

          <div className="pairs-list">
            {matchedCompany.slice(0, previewLimit).map((companyRow, pairIndex) => {
              const bankRow = matchedBank[pairIndex];
              
              return (
                <div key={pairIndex} className="pair-card">
                  <div className="pair-number">Pair #{pairIndex + 1}</div>
                  
                  <div className="pair-container">
                    {/* Company Side */}
                    <div className="pair-side company-side">
                      <div className="side-header">
                        <span className="side-icon">🏢</span>
                        <span className="side-label">Company</span>
                      </div>
                      <div className="side-data">
                        {companyHeaders.map((header, idx) => {
                          const value = companyRow[idx];
                          const isHighlight = header === 'دائن' || header === 'مدين' || 
                                             header === 'البيان' || header === 'رقم الشيك المستخرج' || 
                                             header === 'التاريخ المستخرج';
                          
                          if (!value && value !== 0) return null;
                          
                          return (
                            <div key={idx} className={`data-row ${isHighlight ? 'highlight' : ''}`}>
                              <span className="data-label">{header}:</span>
                              <span className="data-value">{String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Matching Arrow */}
                    <div className="pair-arrow">
                      <div className="arrow-line"></div>
                      <div className="arrow-icon">⟷</div>
                      <div className="arrow-line"></div>
                    </div>

                    {/* Bank Side */}
                    <div className="pair-side bank-side">
                      <div className="side-header">
                        <span className="side-icon">🏦</span>
                        <span className="side-label">Bank</span>
                      </div>
                      <div className="side-data">
                        {bankHeaders.map((header, idx) => {
                          const value = bankRow[idx];
                          const isHighlight = header === 'DEBIT' || header === 'CREDIT' || 
                                             header === 'NARRITIVE' || header === 'DOC-NUM' || 
                                             header === 'POST DATE';
                          
                          if (!value && value !== 0) return null;
                          
                          return (
                            <div key={idx} className={`data-row ${isHighlight ? 'highlight' : ''}`}>
                              <span className="data-label">{header}:</span>
                              <span className="data-value">{String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {matchedCompany.length > previewLimit && (
            <div className="pairs-footer">
              Showing {previewLimit} of {matchedCompany.length} pairs
            </div>
          )}
        </div>
      )}
    </div>
  );
};

