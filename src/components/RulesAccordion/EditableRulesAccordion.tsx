import React, { useState } from "react";
import { Accordion, AccordionGroup } from "../core";
import { classificationTypes } from "../../constants/classificationTypes";
import "./editableStyles.css";
import "./matchingStyles.css";
import { useFileUpload } from "../../contexts/FileUploadContext";
import { MatchingColumnsEditor } from "./MatchingColumnsEditor";

export const EditableRulesAccordion = () => {
  const { 
    selectedClassificationType, 
    editableRules, 
    setEditableRules,
    companyHeaders,
    bankHeaders 
  } = useFileUpload();
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize editable rules if not already set
  React.useEffect(() => {
    if (!editableRules) {
      setEditableRules(JSON.parse(JSON.stringify(classificationTypes)));
    }
  }, [editableRules, setEditableRules]);

  if (!selectedClassificationType || !editableRules) {
    return null;
  }

  const currentKey = selectedClassificationType.key;
  const currentRules = editableRules[currentKey];

  // Add new company pattern
  const addCompanyPattern = () => {
    const newRules = { ...editableRules };
    newRules[currentKey].companyPatterns.push({
      pattern: "",
      matchType: "startsWith"
    });
    setEditableRules(newRules);
  };

  // Add new bank pattern
  const addBankPattern = () => {
    const newRules = { ...editableRules };
    newRules[currentKey].bankPatterns.push({
      pattern: "",
      matchType: "startsWith"
    });
    setEditableRules(newRules);
  };

  // Delete company pattern
  const deleteCompanyPattern = (index: number) => {
    const newRules = { ...editableRules };
    newRules[currentKey].companyPatterns.splice(index, 1);
    setEditableRules(newRules);
  };

  // Delete bank pattern
  const deleteBankPattern = (index: number) => {
    const newRules = { ...editableRules };
    newRules[currentKey].bankPatterns.splice(index, 1);
    setEditableRules(newRules);
  };

  // Update company pattern text
  const updateCompanyPattern = (index: number, value: string) => {
    const newRules = { ...editableRules };
    const pattern = newRules[currentKey].companyPatterns[index];
    if (typeof pattern === "string") {
      newRules[currentKey].companyPatterns[index] = {
        pattern: value,
        matchType: "startsWith"
      };
    } else {
      pattern.pattern = value;
    }
    setEditableRules(newRules);
  };

  // Update bank pattern text
  const updateBankPattern = (index: number, value: string) => {
    const newRules = { ...editableRules };
    const pattern = newRules[currentKey].bankPatterns[index];
    if (typeof pattern === "string") {
      newRules[currentKey].bankPatterns[index] = {
        pattern: value,
        matchType: "startsWith"
      };
    } else {
      pattern.pattern = value;
    }
    setEditableRules(newRules);
  };

  // Update company pattern match type
  const updateCompanyMatchType = (index: number, matchType: string) => {
    const newRules = { ...editableRules };
    const pattern = newRules[currentKey].companyPatterns[index];
    if (typeof pattern === "string") {
      newRules[currentKey].companyPatterns[index] = {
        pattern: pattern,
        matchType: matchType
      };
    } else {
      pattern.matchType = matchType;
    }
    setEditableRules(newRules);
  };

  // Update bank pattern match type
  const updateBankMatchType = (index: number, matchType: string) => {
    const newRules = { ...editableRules };
    const pattern = newRules[currentKey].bankPatterns[index];
    if (typeof pattern === "string") {
      newRules[currentKey].bankPatterns[index] = {
        pattern: pattern,
        matchType: matchType
      };
    } else {
      pattern.matchType = matchType;
    }
    setEditableRules(newRules);
  };

  // Update date tolerance
  const updateDateTolerance = (value: number) => {
    const newRules = { ...editableRules };
    newRules[currentKey].dateTolerance = value;
    setEditableRules(newRules);
  };

  // Toggle date tolerance enabled/disabled
  const toggleDateTolerance = () => {
    const newRules = { ...editableRules };
    newRules[currentKey].useDateTolerance = !newRules[currentKey].useDateTolerance;
    setEditableRules(newRules);
  };

  // Update company search column
  const updateCompanySearchColumn = (column: string) => {
    const newRules = { ...editableRules };
    newRules[currentKey].companySearchColumn = column;
    setEditableRules(newRules);
  };

  // Update bank search column
  const updateBankSearchColumn = (column: string) => {
    const newRules = { ...editableRules };
    newRules[currentKey].bankSearchColumn = column;
    setEditableRules(newRules);
  };

  // Update matching columns
  const updateMatchingColumns = (columns: any[]) => {
    const newRules = { ...editableRules };
    newRules[currentKey].matchingColumns = columns;
    setEditableRules(newRules);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset to default rules?")) {
      const newRules = { ...editableRules };
      newRules[currentKey] = JSON.parse(JSON.stringify(classificationTypes[currentKey]));
      setEditableRules(newRules);
    }
  };

  // Save rules (you can add API call here)
  const saveRules = () => {
    console.log("Saving rules:", editableRules);
    // Add your save logic here (e.g., API call, localStorage, etc.)
    alert("Rules saved successfully!");
    setIsEditMode(false);
  };

  return (
    <div className="editable-rules-section">
    <AccordionGroup
      title="📋 Classification Rules"
      description={
        isEditMode 
          ? "Edit patterns, match types, and tolerance settings" 
          : "View detailed patterns and rules for each classification type"
      }
    >
      <div className="rules-toolbar">
        <button 
          className={`toolbar-btn ${isEditMode ? 'edit-active' : ''}`}
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? "👁️ View Mode" : "✏️ Edit Mode"}
        </button>
        
        {isEditMode && (
          <>
            <button className="toolbar-btn save-btn" onClick={saveRules}>
              💾 Save Changes
            </button>
            <button className="toolbar-btn reset-btn" onClick={resetToDefaults}>
              🔄 Reset to Default
            </button>
          </>
        )}
      </div>

      <Accordion
        title={currentRules.name}
        icon={selectedClassificationType.icon}
        // variant={getVariant(currentKey)}
        defaultOpen={false}
      >
        <div className="classification-details">
          {/* Company Patterns */}
          <div className="pattern-section">
            <div className="section-header">
              <h4 className="pattern-section-title">🏢 Company Patterns</h4>
              {isEditMode && (
                <button className="add-pattern-btn" onClick={addCompanyPattern}>
                  ➕ Add Pattern
                </button>
              )}
            </div>
            
            {/* Company Search Column Selector */}
            <div className="column-selector">
              <label className="column-selector-label">
                🔍 Search in Column:
              </label>
              {isEditMode ? (
                <select
                  className="column-selector-dropdown"
                  value={currentRules.companySearchColumn || (companyHeaders && companyHeaders[0])}
                  onChange={(e) => updateCompanySearchColumn(e.target.value)}
                >
                  <option value="">-- Select Column --</option>
                  {companyHeaders && companyHeaders.map((header, index) => (
                    <option key={index} value={header}>
                      {header || `Column ${index + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="column-selector-value">
                  {currentRules.companySearchColumn || "Not selected"}
                </span>
              )}
            </div>
            
            <ul className="pattern-list">
              {currentRules.companyPatterns.map((pattern, index) => {
                const patternText = typeof pattern === "string" ? pattern : pattern.pattern;
                const matchType = typeof pattern === "string" ? "startsWith" : pattern.matchType;
                
                return (
                  <li key={index} className={`pattern-item ${isEditMode ? 'editable' : ''}`}>
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          className="pattern-input"
                          value={patternText}
                          onChange={(e) => updateCompanyPattern(index, e.target.value)}
                          placeholder="Enter pattern..."
                        />
                        <select
                          className="match-type-select"
                          value={matchType}
                          onChange={(e) => updateCompanyMatchType(index, e.target.value)}
                        >
                          <option value="startsWith">Starts With</option>
                          <option value="includes">Includes</option>
                          <option value="both">Both</option>
                        </select>
                        <button
                          className="delete-btn"
                          onClick={() => deleteCompanyPattern(index)}
                          title="Delete pattern"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="pattern-text">{patternText}</span>
                        <span className="pattern-badge">{matchType}</span>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Bank Patterns */}
          <div className="pattern-section">
            <div className="section-header">
              <h4 className="pattern-section-title">🏦 Bank Patterns</h4>
              {isEditMode && (
                <button className="add-pattern-btn" onClick={addBankPattern}>
                  ➕ Add Pattern
                </button>
              )}
            </div>
            
            {/* Bank Search Column Selector */}
            <div className="column-selector">
              <label className="column-selector-label">
                🔍 Search in Column:
              </label>
              {isEditMode ? (
                <select
                  className="column-selector-dropdown"
                  value={currentRules.bankSearchColumn || (bankHeaders && bankHeaders[0])}
                  onChange={(e) => updateBankSearchColumn(e.target.value)}
                >
                  <option value="">-- Select Column --</option>
                  {bankHeaders && bankHeaders.map((header, index) => (
                    <option key={index} value={header}>
                      {header || `Column ${index + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="column-selector-value">
                  {currentRules.bankSearchColumn || "Not selected"}
                </span>
              )}
            </div>
            
            <ul className="pattern-list">
              {currentRules.bankPatterns.map((pattern, index) => {
                const patternText = typeof pattern === "string" ? pattern : pattern.pattern;
                const matchType = typeof pattern === "string" ? "startsWith" : pattern.matchType;
                
                return (
                  <li key={index} className={`pattern-item ${isEditMode ? 'editable' : ''}`}>
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          className="pattern-input"
                          value={patternText}
                          onChange={(e) => updateBankPattern(index, e.target.value)}
                          placeholder="Enter pattern..."
                        />
                        <select
                          className="match-type-select"
                          value={matchType}
                          onChange={(e) => updateBankMatchType(index, e.target.value)}
                        >
                          <option value="startsWith">Starts With</option>
                          <option value="includes">Includes</option>
                          <option value="both">Both</option>
                        </select>
                        <button
                          className="delete-btn"
                          onClick={() => deleteBankPattern(index)}
                          title="Delete pattern"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="pattern-text">{patternText}</span>
                        <span className="pattern-badge">{matchType}</span>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Date Tolerance */}
          <div className="pattern-section">
            <h4 className="pattern-section-title">📅 Date Tolerance</h4>
            
            {isEditMode ? (
              <div className="tolerance-editor">
                <label className="tolerance-toggle">
                  <input
                    type="checkbox"
                    checked={currentRules.useDateTolerance}
                    onChange={toggleDateTolerance}
                  />
                  <span>Enable date tolerance</span>
                </label>
                
                {currentRules.useDateTolerance && (
                  <div className="tolerance-input-group">
                    <label>Tolerance (days):</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={currentRules.dateTolerance}
                      onChange={(e) => updateDateTolerance(parseInt(e.target.value))}
                      className="tolerance-input"
                    />
                    <span className="tolerance-label">days</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="tolerance-info">
                {currentRules.useDateTolerance ? (
                  <p className="tolerance-text">
                    ✅ Enabled: <strong>±{currentRules.dateTolerance} days</strong>
                  </p>
                ) : (
                  <p className="tolerance-text">❌ Exact date match only</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Accordion>
      <Accordion
        title="🎯 Matching Columns"
        icon="🔗"
        defaultOpen={false}
      >
        <div className="matching-columns-intro">
          <p className="matching-columns-description">
            {isEditMode 
              ? "Configure which columns to match and set tolerance values" 
              : "View column mappings and match rules"
            }
          </p>
        </div>
        <MatchingColumnsEditor
          matchingColumns={currentRules.matchingColumns || []}
          companyHeaders={companyHeaders}
          bankHeaders={bankHeaders}
          isEditMode={isEditMode}
          onUpdate={updateMatchingColumns}
        />
      </Accordion>
    </AccordionGroup>

    {/* Matching Columns Configuration - Separate Accordion */}
   
    </div>
  );
};

// Helper function to assign variants
const getVariant = (key: string) => {
  const variants: Record<
    string,
    "default" | "primary" | "success" | "warning" | "info"
  > = {
    "checks-collection": "primary",
    "returned-checks": "warning",
    disbursement: "info",
    "cash-inflow": "success",
    "visa-payment": "primary",
  };
  return variants[key] || "default";
};

