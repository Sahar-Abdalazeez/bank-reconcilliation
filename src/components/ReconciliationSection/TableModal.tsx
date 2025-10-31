import React from 'react';
import './tableModalStyles.css';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[][];
  headers: string[];
  icon?: string;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  headers,
  icon,
}) => {
  if (!isOpen) return null;

  return (
    <div className="table-modal-overlay" onClick={onClose}>
      <div className="table-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="table-modal-header">
          <div className="modal-header-content">
            {icon && <span className="modal-icon">{icon}</span>}
            <h2 className="modal-title">{title}</h2>
            <span className="modal-row-count">{data.length} rows</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="table-modal-content">
          <div className="modal-table-wrapper">
            <table className="modal-table">
              <thead>
                <tr>
                  <th className="row-number">#</th>
                  {headers.map((header, index) => (
                    <th key={index} title={header}>
                      {header || `Column ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
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
        </div>
      </div>
    </div>
  );
};

