import React from "react";
import { classificationTypes } from "../constants/classificationTypes";
import ClassificatioTypeCard from "./core/ClassificationTypeCrad/ClassificatioTypeCard";
import { useFileUpload } from "../contexts/FileUploadContext";
import "./ClassificationTypeSelector.css";

export const ClassificationTypeSelector = () => {
  const { selectedClassificationType, setSelectedClassificationType } = useFileUpload();

  const handleSelectType = (key: string) => {
    const selectedType = {
      key,
      ...classificationTypes[key]
    };
    setSelectedClassificationType(selectedType);
    console.log('Selected classification type:', key, selectedType);
  };

  return (
    <div className="classification-selector-container">
      <div className="classification-header">
        <h2 className="classification-title">🎯 Select Classification Type</h2>
        <p className="classification-description">
          Choose how to classify transactions in your data for reconciliation
        </p>
      </div>
      
      <div className="classification-cards-grid">
        {Object.entries(classificationTypes).map(([key, type]) => (
          <ClassificatioTypeCard 
            key={key} 
            name={type.name}
            icon={type.icon}
            isSelected={selectedClassificationType?.key === key}
            onClick={() => handleSelectType(key)}
          />
        ))}
      </div>

    </div>
  );
};
