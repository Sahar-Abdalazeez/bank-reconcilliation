import React, { useCallback } from "react";
import { useFileUpload } from "../../contexts/FileUploadContext";
import "./UploadFilesSection.css";
import CompanyIcon from "../../assets/company.png";
import BankIcon from "../../assets/bank.png";

export const UploadFilesSection = () => {
  const {
    // Company state
    companyData,
    companyDragOver,
    companyLoading,
    companyFileName,
    companyError,

    // Bank state
    bankData,
    bankDragOver,
    bankLoading,
    bankFileName,
    bankError,

    // Actions
    handleFileInput,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    clearData,
  } = useFileUpload();

  // Determine current step
  const currentStep = !companyData?.length
    ? "company"
    : !bankData?.length
    ? "bank"
    : "complete";
  const isComplete = currentStep === "complete";

  // Current upload type and state
  const type = currentStep === "bank" ? "bank" : "company";
  const dragOver = type === "company" ? companyDragOver : bankDragOver;
  const loading = type === "company" ? companyLoading : bankLoading;
  const error = type === "company" ? companyError : bankError;

  const handleContainerClick = useCallback(() => {
    if (!loading && !isComplete) {
      document.getElementById(`${type}-file-input`)?.click();
    }
  }, [loading, type, isComplete]);

  const handleFileInputChange = useCallback(
    (e) => {
      handleFileInput(e, type);
    },
    [handleFileInput, type]
  );

  const handleDropEvent = useCallback(
    (e) => {
      handleDrop(e, type);
    },
    [handleDrop, type]
  );

  const handleDragOverEvent = useCallback(
    (e) => {
      handleDragOver(e, type);
    },
    [handleDragOver, type]
  );

  const handleDragLeaveEvent = useCallback(
    (e) => {
      handleDragLeave(e, type);
    },
    [handleDragLeave, type]
  );

  return (
    <div className="upload-files-container">
      <div className="upload-files-container-inner">
      <div className="upload-header">
        <h2 className="upload-main-title">📂 Upload Your Files</h2>
        <p className="upload-main-subtitle">
          {isComplete
            ? "All files uploaded successfully! Configure rules below to continue."
            : currentStep === "company"
            ? "Step 1: Upload your company Excel file"
            : "Step 2: Upload your bank Excel file"}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="upload-steps">
        <div
          className={`step ${
            companyData?.length
              ? "completed"
              : currentStep === "company"
              ? "active"
              : ""
          }`}
        >
          <div className="step-indicator">
            {companyData?.length ? "✓" : "1"}
          </div>
          <span className="step-label">Company Data</span>
        </div>
        <div className="step-divider"></div>
        <div
          className={`step ${
            bankData?.length
              ? "completed"
              : currentStep === "bank"
              ? "active"
              : ""
          }`}
        >
          <div className="step-indicator">{bankData?.length ? "✓" : "2"}</div>
          <span className="step-label">Bank Data</span>
        </div>
      </div>

      {/* Single Upload Area */}
     
        <div
          className={`upload-area ${type}-upload ${
            dragOver ? "drag-over" : ""
          } ${loading ? "loading" : ""}`}
          onDrop={handleDropEvent}
          onDragOver={handleDragOverEvent}
          onDragLeave={handleDragLeaveEvent}
          onClick={handleContainerClick}
        >
          <div className="upload-content">
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                <h3>
                  Processing {type === "company" ? "Company" : "Bank"} file...
                </h3>
                <p>Please wait</p>
              </>
            ) : (
              <>
                <div className="upload-icon">
                  <img 
                    src={type === "company" ? CompanyIcon : BankIcon} 
                    alt={type === "company" ? "Company" : "Bank"}
                    width={90}
                    height={90}
                  />
                </div>
                <h3>
                  Upload {type === "company" ? "Company" : "Bank"} Excel File
                </h3>
                <p className="upload-hint">
                  Click here or drag and drop your .xlsx or .xls file
                </p>
                <input
                  id={`${type}-file-input`}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                  disabled={loading}
                />
              </>
            )}
          </div>
        </div>
     

      {error && <div className="error-message">{error}</div>}
      </div>
      {/* Uploaded Files Summary */}
      {(companyFileName || bankFileName) && (
        <div className="uploaded-files-summary">
          <h4>Uploaded Files</h4>
          <div className="files-list">
            {companyFileName && (
              <div className="file-item company-file">
                <div className="file-info-content">
                  <span className="file-icon">
                    <img 
                      src={CompanyIcon} 
                      alt="Company"
                      width={30}
                      height={30}
                    />
                  </span>
                  <div className="file-details">
                    <span className="file-label">Company Data</span>
                    <span className="file-name">{companyFileName}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearData("company");
                  }}
                  className="remove-file-btn"
                >
                  ✕
                </button>
              </div>
            )}
            {bankFileName && (
              <div className="file-item bank-file">
                <div className="file-info-content">
                  <span className="file-icon">
                    <img 
                      src={BankIcon} 
                      alt="Bank"
                      width={30}
                      height={30}
                    />
                  </span>
                  <div className="file-details">
                    <span className="file-label">Bank Data</span>
                    <span className="file-name">{bankFileName}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearData("bank");
                  }}
                  className="remove-file-btn"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};