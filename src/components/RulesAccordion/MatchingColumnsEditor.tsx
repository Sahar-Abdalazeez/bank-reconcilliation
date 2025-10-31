import React from "react";
import "./matchingStyles.css";

interface MatchingColumn {
  id: string;
  label: string;
  companyColumn: string;
  bankColumn: string;
  matchType: "exact" | "numeric" | "date" | "text";
  normalize?: boolean;
}

interface MatchingColumnsEditorProps {
  matchingColumns: MatchingColumn[];
  companyHeaders: string[];
  bankHeaders: string[];
  isEditMode: boolean;
  onUpdate: (columns: MatchingColumn[]) => void;
}

export const MatchingColumnsEditor: React.FC<MatchingColumnsEditorProps> = ({
  matchingColumns,
  companyHeaders,
  bankHeaders,
  isEditMode,
  onUpdate,
}) => {
  // Add new matching column
  const addMatchingColumn = () => {
    const newColumn: MatchingColumn = {
      id: `match_${Date.now()}`,
      label: "",
      companyColumn: "",
      bankColumn: "",
      matchType: "exact",
      normalize: false,
    };
    onUpdate([...matchingColumns, newColumn]);
  };

  // Delete matching column
  const deleteMatchingColumn = (id: string) => {
    onUpdate(matchingColumns.filter((col) => col.id !== id));
  };

  // Update column field
  const updateColumn = (id: string, field: string, value: any) => {
    const updated = matchingColumns.map((col) =>
      col.id === id ? { ...col, [field]: value } : col
    );
    onUpdate(updated);
  };

  // Get icon for match type
  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case "exact":
        return "🎯";
      case "numeric":
        return "💰";
      case "date":
        return "📅";
      case "text":
        return "📝";
      default:
        return "🔗";
    }
  };

  return (
    <div className="matching-columns-section">
      <div className="matching-columns-list">
        {matchingColumns.length === 0 ? (
          <div className="empty-matching-state">
            <p>📋 No matching columns defined yet.</p>
            <p className="empty-state-hint">
              Click "Add Matching Column" to create your first matching rule.
            </p>
          </div>
        ) : (
          matchingColumns.map((column, index) => (
            <div key={column.id} className="matching-column-card">
              <div className="matching-card-header">
                <div className="matching-card-title">
                  <span className="match-type-icon">
                    {getMatchTypeIcon(column.matchType)}
                  </span>
                  {isEditMode ? (
                    <input
                      type="text"
                      className="column-label-input"
                      value={column.label}
                      onChange={(e) =>
                        updateColumn(column.id, "label", e.target.value)
                      }
                      placeholder="e.g., Amount, Date, Check Number..."
                    />
                  ) : (
                    <span className="column-label-text">
                      {column.label || `Matching Column ${index + 1}`}
                    </span>
                  )}
                </div>
                {isEditMode && (
                  <button
                    className="delete-matching-btn"
                    onClick={() => deleteMatchingColumn(column.id)}
                    title="Delete this matching column"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <div className="matching-card-body">
                {/* Column Mapping */}
                <div className="column-mapping-row">
                  <div className="column-dropdown-wrapper">
                    <label className="column-dropdown-label">🏢 Company</label>
                    {isEditMode ? (
                      <select
                        className="column-mapping-select"
                        value={column.companyColumn}
                        onChange={(e) =>
                          updateColumn(
                            column.id,
                            "companyColumn",
                            e.target.value
                          )
                        }
                      >
                        <option value="">-- Select Column --</option>
                        {companyHeaders &&
                          companyHeaders.map((header, idx) => (
                            <option key={idx} value={header}>
                              {header || `Column ${idx + 1}`}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span className="column-value-display">
                        {column.companyColumn || "Not selected"}
                      </span>
                    )}
                  </div>

                  <div className="mapping-arrow">⟷</div>

                  <div className="column-dropdown-wrapper">
                    <label className="column-dropdown-label">🏦 Bank</label>
                    {isEditMode ? (
                      <select
                        className="column-mapping-select"
                        value={column.bankColumn}
                        onChange={(e) =>
                          updateColumn(column.id, "bankColumn", e.target.value)
                        }
                      >
                        <option value="">-- Select Column --</option>
                        {bankHeaders &&
                          bankHeaders.map((header, idx) => (
                            <option key={idx} value={header}>
                              {header || `Column ${idx + 1}`}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span className="column-value-display">
                        {column.bankColumn || "Not selected"}
                      </span>
                    )}
                  </div>
                </div>

                {column.matchType === "text" && isEditMode && (
                  <div className="normalize-row">
                    <label className="normalize-label">
                      <input
                        type="checkbox"
                        checked={column.normalize || false}
                        onChange={(e) =>
                          updateColumn(column.id, "normalize", e.target.checked)
                        }
                      />
                      <span>
                        Normalize (trim spaces, ignore case, remove leading
                        zeros)
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isEditMode && (
        <button className="add-matching-column-btn" onClick={addMatchingColumn}>
          ➕ Add Matching Column
        </button>
      )}
    </div>
  );
};
