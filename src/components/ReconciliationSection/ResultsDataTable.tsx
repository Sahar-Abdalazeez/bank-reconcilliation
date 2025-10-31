import React, { useState } from 'react';
import { TableModal } from './TableModal';
import './resultsTableStyles.css';

interface ResultsDataTableProps {
  title: string;
  data: any[][];
  headers: string[];
  variant: 'matched' | 'unmatched';
  icon: string;
  showDownload?: boolean;
  downloadHandler?: () => void;
  downloadLabel?: string;
  totalAmount?: number;
  showTotal?: boolean;
}

export const ResultsDataTable: React.FC<ResultsDataTableProps> = ({
  title,
  data,
  headers,
  variant,
  icon,
  showDownload = false,
  downloadHandler,
  downloadLabel = "Download",
  totalAmount,
  showTotal = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewLimit, setPreviewLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className={`results-data-table ${variant}`}>
      <div className="results-table-header">
        <div className="results-table-title" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="results-icon">{icon}</span>
          <h4>{title}</h4>
          <div className="results-meta">
            <span className="results-count">{data.length} rows</span>
            {showTotal && totalAmount !== undefined && (
              <span className="results-total">
                Total: {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
        <div className="results-table-actions">
          <button
            className="results-fullscreen-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            title="Open in full-screen modal"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M8 21H5a2 2 0 0 1-2-2v-3m18 0v3a2 2 0 0 1-2 2h-3M3 16v-3m18 0v3M3 8V5m18 0v3" />
            </svg>
          </button>
          {showDownload && downloadHandler && (
            <button 
              className="results-download-btn"
              onClick={(e) => {
                e.stopPropagation();
                downloadHandler();
              }}
              title={downloadLabel}
            >
              📥 {downloadLabel}
            </button>
          )}
          <button 
            className="results-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼ Collapse' : '▶ View Data'}
          </button>
        </div>
      </div>

      <TableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        data={data}
        headers={headers}
        icon={icon}
      />

      {isExpanded && (
        <div className="results-table-content">
          <div className="results-table-controls">
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
                <option value={data.length}>All ({data.length})</option>
              </select>
            </label>
          </div>

          <div className="results-table-container">
            <table className="results-table">
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
                {data.slice(0, previewLimit).map((row, rowIndex) => (
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

          {data.length > previewLimit && (
            <div className="results-table-footer">
              Showing {previewLimit} of {data.length} rows
            </div>
          )}
        </div>
      )}
    </div>
  );
};

