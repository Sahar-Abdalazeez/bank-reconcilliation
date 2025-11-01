import React, { useState, useRef, useEffect } from "react";
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
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const sectionRef = useRef<HTMLDivElement>(null);

  // Initialize editable rules if not already set
  React.useEffect(() => {
    if (!editableRules) {
      setEditableRules(JSON.parse(JSON.stringify(classificationTypes)));
    }
  }, [editableRules, setEditableRules]);

  // Intersection Observer to detect when section is visible
  useEffect(() => {
    // Only set up observer if we have the necessary data
    if (!selectedClassificationType || !editableRules) {
      setIsSectionVisible(false);
      return;
    }

    let observer: IntersectionObserver | null = null;
    let scrollHandler: (() => void) | null = null;
    let timeoutId: number;
    
    const updateVisibility = () => {
      const currentSection = sectionRef.current;
      if (!currentSection) {
        setIsSectionVisible(false);
        return;
      }
      
      const rect = currentSection.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      
      // Simple check: section is visible if any part of it is in the viewport
      const isVisible = rect.bottom > 0 && rect.top < windowHeight;
      
      setIsSectionVisible(isVisible);
    };

    // Use requestAnimationFrame for more reliable timing
    const setupObserver = () => {
      updateVisibility();

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsSectionVisible(entry.isIntersecting);
          });
        },
        {
          threshold: [0, 0.05, 0.1],
          rootMargin: '0px',
        }
      );

      const currentSection = sectionRef.current;
      if (currentSection) {
        observer.observe(currentSection);
      }

      // Also listen to scroll for real-time updates
      scrollHandler = updateVisibility;
      window.addEventListener('scroll', scrollHandler, { passive: true });
      window.addEventListener('resize', scrollHandler, { passive: true });
    };

    // Try immediately, then with a small delay if ref not ready
    if (sectionRef.current) {
      setupObserver();
    } else {
      timeoutId = setTimeout(() => {
        if (sectionRef.current) {
          setupObserver();
        }
      }, 500);
    }

    return () => {
      clearTimeout(timeoutId);
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('resize', scrollHandler);
      }
      if (observer && sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [selectedClassificationType, editableRules]); // Re-run when these change

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
    setSaveStatus('saving');
    
    // Simulate save operation (replace with actual API call)
    setTimeout(() => {
      // Add your save logic here (e.g., API call, localStorage, etc.)
      setSaveStatus('saved');
      setIsEditMode(false);
      
      // Reset status after showing success message
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500);
  };

  return (
    <div className="editable-rules-section" ref={sectionRef}>
    <AccordionGroup
      title="📋 Classification Rules"
      description={
        isEditMode 
          ? "Edit patterns, match types, and tolerance settings" 
          : "View detailed patterns and rules for each classification type"
      }
    >
      <div className={`rules-toolbar ${isSectionVisible ? 'visible' : ''}`}>
        <div className="toolbar-btn-wrapper">
          <button 
            className={`toolbar-btn ${isEditMode ? 'edit-active' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            )}
          </button>
          <span className="toolbar-tooltip">{isEditMode ? "Switch to View Mode" : "Switch to Edit Mode"}</span>
        </div>
        
        {isEditMode && (
          <>
            <div className="toolbar-btn-wrapper">
              <button 
                className={`toolbar-btn save-btn ${saveStatus === 'saving' ? 'saving' : ''} ${saveStatus === 'saved' ? 'saved' : ''}`}
                onClick={saveRules}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                    <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="40" strokeLinecap="round" />
                  </svg>
                ) : saveStatus === 'saved' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                )}
              </button>
              <span className="toolbar-tooltip">
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved Successfully!' : 'Save All Changes'}
              </span>
            </div>
            <div className="toolbar-btn-wrapper">
              <button 
                className="toolbar-btn reset-btn" 
                onClick={resetToDefaults}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <polyline points="23 20 23 14 17 14"></polyline>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
              </button>
              <span className="toolbar-tooltip">Reset to Default Values</span>
            </div>
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


