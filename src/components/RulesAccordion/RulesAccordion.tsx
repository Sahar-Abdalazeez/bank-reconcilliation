import React from "react";
import { Accordion, AccordionGroup } from "../core";
import { classificationTypes } from "../../constants/classificationTypes";
import "./styles.css";
import { useFileUpload } from "../../contexts/FileUploadContext";

export const RulesAccordion = () => {
    const { selectedClassificationType } = useFileUpload();
  return (
    <AccordionGroup
      title="📋 Classification Rules"
      description="View detailed patterns and rules for each classification type"
    >
      {/* {Object.entries(classificationTypes).map(([key, type]) => ( */}
      { selectedClassificationType && <Accordion
          key={selectedClassificationType?.key}
          title={selectedClassificationType?.name}
          icon={selectedClassificationType?.icon}
          variant={getVariant(selectedClassificationType?.key)}
        >
          <div className="classification-details">
            {/* Company Patterns */}
            <div className="pattern-section">
              <h4 className="pattern-section-title">🏢 Company Patterns</h4>
              <ul className="pattern-list">
                {selectedClassificationType?.companyPatterns.map((pattern, index) => (
                  <li key={index} className="pattern-item">
                    <span className="pattern-text">
                      {typeof pattern === "string" ? pattern : pattern.pattern}
                    </span>
                    <span className="pattern-badge">
                      {typeof pattern === "string"
                        ? "startsWith"
                        : pattern.matchType}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bank Patterns */}
            <div className="pattern-section">
              <h4 className="pattern-section-title">🏦 Bank Patterns</h4>
              <ul className="pattern-list">
                {selectedClassificationType?.bankPatterns.map((pattern, index) => (
                  <li key={index} className="pattern-item">
                    <span className="pattern-text">
                      {typeof pattern === "string" ? pattern : pattern.pattern}
                    </span>
                    <span className="pattern-badge">
                      {typeof pattern === "string"
                        ? "startsWith"
                        : pattern.matchType}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Date Tolerance */}
            <div className="pattern-section">
              <h4 className="pattern-section-title">📅 Date Tolerance</h4>
              <div className="tolerance-info">
                {selectedClassificationType?.useDateTolerance ? (
                  <p className="tolerance-text">
                    ✅ Enabled: <strong>±{selectedClassificationType?.dateTolerance} days</strong>
                  </p>
                ) : (
                  <p className="tolerance-text">❌ Exact date match only</p>
                )}
              </div>
            </div>
          </div>
        </Accordion>}
      {/* ))} */}
    </AccordionGroup>
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
