import React, { useState } from "react";
import { useFileUpload } from "../../contexts/FileUploadContext";
import { reconcileTransactions, validateReconciliationConfig } from "../../utils/reconciliationEngine";
import { downloadExcel } from "../../utils/excelDownload";
import { TabbedResultsView } from "./TabbedResultsView";
import "./reconciliationStyles.css";

export const ReconciliationSection = () => {
  const {
    companyData,
    bankData,
    companyHeaders,
    bankHeaders,
    selectedClassificationType,
    editableRules,
  } = useFileUpload();

  const [reconciliationResults, setReconciliationResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if ready to reconcile
  const currentRules = editableRules?.[selectedClassificationType?.key];
  const isBankOnly = currentRules?.isBankOnly;
  const isSumComparison = currentRules?.isSumComparison;
  const isUnclassified = currentRules?.isUnclassified;
  
  const canReconcile = isBankOnly
    ? bankData?.length > 0 && selectedClassificationType && editableRules
    : companyData?.length > 0 && bankData?.length > 0 && selectedClassificationType && editableRules;

  const handleReconcile = () => {
    if (!canReconcile) {
      setError("Please upload both files and select a classification type");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Get current rules
    const currentRules = editableRules[selectedClassificationType.key];

    // Validate configuration
    const validation = validateReconciliationConfig(currentRules);
    if (!validation.valid) {
      setError(`Configuration errors:\n${validation.errors.join('\n')}`);
      setIsProcessing(false);
      return;
    }

    // Simulate processing delay for UX
    setTimeout(() => {
      try {
        // Add all classification types to rules for unclassified mode
        const rulesWithAllTypes = {
          ...currentRules,
          allClassificationTypes: editableRules  // Pass all types for unclassified checking
        };
        
        const results = reconcileTransactions(
          companyData,
          bankData,
          companyHeaders,
          bankHeaders,
          rulesWithAllTypes
        );

        setReconciliationResults(results);
        setIsProcessing(false);
      } catch (err) {
        setError(`Reconciliation failed: ${err.message}`);
        setIsProcessing(false);
      }
    }, 500);
  };

  const clearResults = () => {
    setReconciliationResults(null);
    setError(null);
  };

  // Download handlers
  const handleDownloadMatchedCompany = () => {
    if (!reconciliationResults?.matchedCompany || reconciliationResults.matchedCompany.length === 0) {
      alert("No matched company data to download");
      return;
    }
    
    const success = downloadExcel(
      reconciliationResults.matchedCompany,
      companyHeaders,
      "Matched_Company_Transactions"
    );
    
    if (!success) {
      alert("Failed to download matched company data");
    }
  };

  const handleDownloadMatchedBank = () => {
    if (!reconciliationResults?.matchedBank || reconciliationResults.matchedBank.length === 0) {
      alert("No matched bank data to download");
      return;
    }
    
    const success = downloadExcel(
      reconciliationResults.matchedBank,
      bankHeaders,
      "Matched_Bank_Transactions"
    );
    
    if (!success) {
      alert("Failed to download matched bank data");
    }
  };

  const handleDownloadUnmatchedCompany = () => {
    if (!reconciliationResults?.unmatchedCompany || reconciliationResults.unmatchedCompany.length === 0) {
      alert("No unmatched company data to download");
      return;
    }
    
    const success = downloadExcel(
      reconciliationResults.unmatchedCompany,
      companyHeaders,
      "Unmatched_Company_Transactions"
    );
    
    if (!success) {
      alert("Failed to download unmatched company data");
    }
  };

  const handleDownloadUnmatchedBank = () => {
    if (!reconciliationResults?.unmatchedBank || reconciliationResults.unmatchedBank.length === 0) {
      alert("No unmatched bank data to download");
      return;
    }
    
    const success = downloadExcel(
      reconciliationResults.unmatchedBank,
      bankHeaders,
      "Unmatched_Bank_Transactions"
    );
    
    if (!success) {
      alert("Failed to download unmatched bank data");
    }
  };

  const handleDownloadClassifiedCharges = () => {
    if (!reconciliationResults?.classifiedBank || reconciliationResults.classifiedBank.length === 0) {
      alert("No classified charges to download");
      return;
    }
    
    const success = downloadExcel(
      reconciliationResults.classifiedBank,
      bankHeaders,
      `${selectedClassificationType?.name}_Classified`
    );
    
    if (!success) {
      alert("Failed to download classified charges");
    }
  };

  const handleDownloadClassifiedCompany = () => {
    if (!reconciliationResults?.classifiedCompanyRaw || reconciliationResults.classifiedCompanyRaw.length === 0) {
      alert("No classified company data to download");
      return;
    }
    
    const success = downloadExcel(
      reconciliationResults.classifiedCompanyRaw,
      companyHeaders,
      `Classified_Company_${selectedClassificationType?.name || 'Data'}`
    );
    
    if (!success) {
      alert("Failed to download classified company data");
    }
  };

  const handleDownloadClassifiedBank = () => {
    if (!reconciliationResults?.classifiedBankRaw || reconciliationResults.classifiedBankRaw.length === 0) {
      alert("No classified bank data to download");
      return;
    }
    
    const success = downloadExcel(
      reconciliationResults.classifiedBankRaw,
      bankHeaders,
      `Classified_Bank_${selectedClassificationType?.name || 'Data'}`
    );
    
    if (!success) {
      alert("Failed to download classified bank data");
    }
  };

  if (!canReconcile) {
    return null;
  }

  return (
    <div className="reconciliation-section">
      <div className="reconciliation-header">
        <div className="header-content">
          <h2 className="reconciliation-title">🔄 Reconciliation</h2>
          <p className="reconciliation-subtitle">
            Match transactions between company and bank data
          </p>
        </div>
        <div className="header-actions">
          {!reconciliationResults ? (
            <button
              className={`reconcile-btn ${isProcessing ? "processing" : ""}`}
              onClick={handleReconcile}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  ▶ Run Reconciliation
                </>
              )}
            </button>
          ) : (
            <>
              <button className="reconcile-btn rerun" onClick={handleReconcile}>
                🔄 Re-run
              </button>
              <button className="clear-btn" onClick={clearResults}>
                🗑️ Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-card">
            <div className="processing-spinner"></div>
            <h3>🔄 Reconciliation in Progress</h3>
            <p>Please wait while we process your data...</p>
            <div className="processing-steps">
              <div className="step-item">
                <span className="step-icon">📋</span>
                <span>Classifying company data</span>
              </div>
              <div className="step-item">
                <span className="step-icon">🏦</span>
                <span>Classifying bank data</span>
              </div>
              <div className="step-item">
                <span className="step-icon">🔗</span>
                <span>Matching transactions</span>
              </div>
              <div className="step-item">
                <span className="step-icon">✅</span>
                <span>Generating results</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-box">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Configuration Error</h4>
            <pre>{error}</pre>
          </div>
        </div>
      )}

      {reconciliationResults && (
        <div className="reconciliation-results">
          {/* Statistics Dashboard */}
          <div className="stats-dashboard">
            <div className="stat-card total">
              <div className="stat-value">
                {reconciliationResults.stats.totalCompanyRows +
                  reconciliationResults.stats.totalBankRows}
              </div>
              <div className="stat-label">Total Rows</div>
              <div className="stat-circle">
                <svg className="stat-circle-svg" viewBox="0 0 100 100">
                  <circle
                    className="stat-circle-bg"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                  />
                  <circle
                    className="stat-circle-fill"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset="0"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="stat-circle-value">
                  {reconciliationResults.stats.totalCompanyRows +
                    reconciliationResults.stats.totalBankRows}
                </div>
              </div>
            </div>

            <div className="stat-card classified">
              <div className="stat-value">
                {reconciliationResults.stats.classifiedCompanyRows +
                  reconciliationResults.stats.classifiedBankRows}
              </div>
              <div className="stat-label">{isBankOnly ? 'Found' : 'Classified'}</div>
              <div className="stat-circle">
                <svg className="stat-circle-svg" viewBox="0 0 100 100">
                  <circle
                    className="stat-circle-bg"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                  />
                  <circle
                    className="stat-circle-fill"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(100, ((reconciliationResults.stats.classifiedCompanyRows + reconciliationResults.stats.classifiedBankRows) / (reconciliationResults.stats.totalCompanyRows + reconciliationResults.stats.totalBankRows)) * 100) / 100)}`}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="stat-circle-value">
                  {reconciliationResults.stats.classifiedCompanyRows +
                    reconciliationResults.stats.classifiedBankRows}
                </div>
              </div>
            </div>

            {!isBankOnly && (
              <>
                <div className="stat-card matched">
                  <div className="stat-value">
                    {reconciliationResults.stats.matchedPairs}
                  </div>
                  <div className="stat-label">Matched Pairs</div>
                  <div className="stat-circle">
                    <svg className="stat-circle-svg" viewBox="0 0 100 100">
                      <circle
                        className="stat-circle-bg"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                      />
                      <circle
                        className="stat-circle-fill"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(100, (reconciliationResults.stats.matchedPairs / (reconciliationResults.stats.classifiedCompanyRows + reconciliationResults.stats.classifiedBankRows)) * 100) / 100)}`}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    </svg>
                    <div className="stat-circle-value">
                      {reconciliationResults.stats.matchedPairs}
                    </div>
                  </div>
                </div>

                <div className="stat-card unmatched">
                  <div className="stat-value">
                    {reconciliationResults.stats.unmatchedCompanyRows +
                      reconciliationResults.stats.unmatchedBankRows}
                  </div>
                  <div className="stat-label">Unmatched</div>
                  <div className="stat-circle">
                    <svg className="stat-circle-svg" viewBox="0 0 100 100">
                      <circle
                        className="stat-circle-bg"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                      />
                      <circle
                        className="stat-circle-fill"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(100, ((reconciliationResults.stats.unmatchedCompanyRows + reconciliationResults.stats.unmatchedBankRows) / (reconciliationResults.stats.classifiedCompanyRows + reconciliationResults.stats.classifiedBankRows)) * 100) / 100)}`}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    </svg>
                    <div className="stat-circle-value">
                      {reconciliationResults.stats.unmatchedCompanyRows +
                        reconciliationResults.stats.unmatchedBankRows}
                    </div>
                  </div>
                </div>

                <div className="stat-card rate">
                  <div className="stat-value">
                    {reconciliationResults.stats.matchRate}%
                  </div>
                  <div className="stat-label">Match Rate</div>
                  <div className="stat-circle">
                    <svg className="stat-circle-svg" viewBox="0 0 100 100">
                      <circle
                        className="stat-circle-bg"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                      />
                      <circle
                        className="stat-circle-fill"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - reconciliationResults.stats.matchRate / 100)}`}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    </svg>
                    <div className="stat-circle-value">
                      {reconciliationResults.stats.matchRate}%
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Unclassified Transactions */}
          {isUnclassified ? (
            <div className="unclassified-section">
              <h3 className="unclassified-title">❓ Other Transactions (Unclassified)</h3>
              <p className="unclassified-subtitle">
                Transactions that don't match any existing classification patterns
              </p>
              
              {/* Info Alert */}
              <div className="info-alert">
                <div className="alert-icon">ℹ️</div>
                <div className="alert-content">
                  <strong>What are these?</strong> These are rows that didn't match any of your configured patterns. 
                  Review these to identify new transaction types or add missing patterns.
                </div>
              </div>
              
              {/* Unclassified Tables - Tabbed View */}
              <div className="results-section">
                <TabbedResultsView
                  tabs={[
                    {
                      id: 'unclassified-company',
                      label: 'Unclassified Company',
                      icon: '❓',
                      data: reconciliationResults.classifiedCompany,
                      headers: companyHeaders,
                      variant: 'unmatched',
                      showDownload: true,
                      downloadHandler: () => {
                        downloadExcel(
                          reconciliationResults.classifiedCompany,
                          companyHeaders,
                          "Unclassified_Company"
                        );
                      },
                      downloadLabel: 'Download Company Unclassified',
                    },
                    {
                      id: 'unclassified-bank',
                      label: 'Unclassified Bank',
                      icon: '❓',
                      data: reconciliationResults.classifiedBank,
                      headers: bankHeaders,
                      variant: 'unmatched',
                      showDownload: true,
                      downloadHandler: () => {
                        downloadExcel(
                          reconciliationResults.classifiedBank,
                          bankHeaders,
                          "Unclassified_Bank"
                        );
                      },
                      downloadLabel: 'Download Bank Unclassified',
                    },
                  ]}
                />
              </div>
            </div>
          ) : isSumComparison ? (
            <div className="sum-comparison-section">
              <h3 className="sum-comparison-title">💰 Salary Sum Comparison</h3>
              <p className="sum-comparison-subtitle">
                Compare total of company salary entries with bank salary transfer
              </p>
              
              {/* Totals Comparison Card */}
              <div className="totals-comparison-card">
                <div className="total-item company-total">
                  <div className="total-label">🏢 Company Total ({reconciliationResults.stats.classifiedCompanyRows} rows)</div>
                  <div className="total-value">
                    {reconciliationResults.stats.companyTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="comparison-arrow">
                  {reconciliationResults.stats.totalsMatch ? '✅' : '⚠️'}
                </div>
                
                <div className="total-item bank-total">
                  <div className="total-label">🏦 Bank Total ({reconciliationResults.stats.classifiedBankRows} rows)</div>
                  <div className="total-value">
                    {reconciliationResults.stats.bankTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              
              {/* Difference Alert */}
              {!reconciliationResults.stats.totalsMatch && (
                <div className="difference-alert">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-content">
                    <strong>Difference Found:</strong>
                    <span className="difference-amount">
                      {reconciliationResults.stats.totalsDifference?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              
              {reconciliationResults.stats.totalsMatch && (
                <div className="match-success-alert">
                  <div className="alert-icon">✅</div>
                  <div className="alert-content">
                    <strong>Perfect Match!</strong> Company and bank totals are equal.
                  </div>
                </div>
              )}
              
              {/* Company Salary Entries - Tabbed View */}
              <div className="results-section">
                <TabbedResultsView
                  tabs={[
                    {
                      id: 'salary-company',
                      label: 'Company Salary Entries',
                      icon: '💰',
                      data: (reconciliationResults.classifiedCompanyRaw || reconciliationResults.classifiedCompany || []),
                      headers: companyHeaders,
                      variant: 'matched',
                      showDownload: true,
                      downloadHandler: () => {
                        downloadExcel(
                          reconciliationResults.classifiedCompanyRaw || reconciliationResults.classifiedCompany,
                          companyHeaders,
                          "Company_Salary_Entries"
                        );
                      },
                      downloadLabel: 'Download Company Entries',
                      totalAmount: reconciliationResults.stats.companyTotal,
                      showTotal: true,
                    },
                    {
                      id: 'salary-bank',
                      label: 'Bank Salary Transfer',
                      icon: '💰',
                      data: (reconciliationResults.classifiedBankRaw || reconciliationResults.classifiedBank || []),
                      headers: bankHeaders,
                      variant: 'matched',
                      showDownload: true,
                      downloadHandler: () => {
                        downloadExcel(
                          reconciliationResults.classifiedBank,
                          bankHeaders,
                          "Bank_Salary_Transfer"
                        );
                      },
                      downloadLabel: 'Download Bank Transfer',
                      totalAmount: reconciliationResults.stats.bankTotal,
                      showTotal: true,
                    },
                  ]}
                />
              </div>
            </div>
          ) : selectedClassificationType?.key === 'fund-account' ? (
            <div className="classified-data-section">
              <h3 className="classified-data-title">🏦 Funding the Account</h3>
              <p className="classified-data-subtitle">
                Rows grouped by their matched pattern for both company and bank
              </p>
              <div className="results-section">
                <TabbedResultsView
                  tabs={[
                    ...(reconciliationResults.groupedCompanyByPattern?.map((group, index) => ({
                      id: `fund-company-${index}`,
                      label: `🏢 ${group.pattern}`,
                      icon: '🏢',
                      data: group.rows,
                      headers: companyHeaders,
                      variant: 'matched' as const,
                      showDownload: true,
                      downloadHandler: () => {
                        downloadExcel(
                          group.rows,
                          companyHeaders,
                          `Funding_Company_${group.pattern.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}`
                        );
                      },
                      downloadLabel: `Download (${group.rows.length})`,
                      totalAmount: group.totalAmount,
                      showTotal: true,
                    })) || []),
                    ...(reconciliationResults.groupedBankByPattern?.map((group, index) => ({
                      id: `fund-bank-${index}`,
                      label: `🏦 ${group.pattern}`,
                      icon: '🏦',
                      data: group.rows,
                      headers: bankHeaders,
                      variant: 'matched' as const,
                      showDownload: true,
                      downloadHandler: () => {
                        downloadExcel(
                          group.rows,
                          bankHeaders,
                          `Funding_Bank_${group.pattern.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}`
                        );
                      },
                      downloadLabel: `Download (${group.rows.length})`,
                      totalAmount: group.totalAmount,
                      showTotal: true,
                    })) || []),
                  ]}
                />
              </div>
            </div>
          ) : isBankOnly ? (
            <div className="classified-data-section">
              <h3 className="classified-data-title">💳 Classified Bank Charges</h3>
              <p className="classified-data-subtitle">
                All bank charges and commissions found in the bank statement, grouped by charge type
              </p>
              
              {/* Download All Charges */}
              <div className="charges-download-section">
                <button 
                  className="download-all-charges-btn"
                  onClick={() => {
                    downloadExcel(
                      reconciliationResults.classifiedBank,
                      bankHeaders,
                      "All_Bank_Charges"
                    );
                  }}
                >
                  📥 Download All Charges ({reconciliationResults.classifiedBank.length} rows)
                </button>
              </div>
              
              {/* Grouped Charges Tables - Tabbed View */}
              <div className="results-section">
                <TabbedResultsView
                  tabs={[
                    ...(reconciliationResults.groupedByPattern?.map((group, index) => ({
                      id: `charges-${index}`,
                      label: group.pattern,
                      icon: '💳',
                      data: group.rows,
                      headers: bankHeaders,
                      variant: 'matched' as const,
                      showDownload: true,
                      downloadHandler: () => {
                        downloadExcel(
                          group.rows,
                          bankHeaders,
                          `Charges_${group.pattern.replace(/[^a-zA-Z0-9]/g, '_')}`
                        );
                      },
                      downloadLabel: `Download (${group.rows.length})`,
                      totalAmount: group.totalAmount,
                      showTotal: true,
                    })) || []),
                  ]}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Tabbed Results View */}
              <div className="results-section">
                <TabbedResultsView
                  tabs={[
                    {
                      id: 'matched-company',
                      label: 'Matched Company',
                      icon: '✅',
                      data: reconciliationResults.matchedCompany,
                      headers: companyHeaders,
                      variant: 'matched',
                      showDownload: true,
                      downloadHandler: () => handleDownloadMatchedCompany(),
                      downloadLabel: 'Download Company Matches',
                    },
                    {
                      id: 'matched-bank',
                      label: 'Matched Bank',
                      icon: '✅',
                      data: reconciliationResults.matchedBank,
                      headers: bankHeaders,
                      variant: 'matched',
                      showDownload: true,
                      downloadHandler: () => handleDownloadMatchedBank(),
                      downloadLabel: 'Download Bank Matches',
                    },
                    {
                      id: 'unmatched-company',
                      label: 'Unmatched Company',
                      icon: '❌',
                      data: reconciliationResults.unmatchedCompany,
                      headers: companyHeaders,
                      variant: 'unmatched',
                      showDownload: true,
                      downloadHandler: () => handleDownloadUnmatchedCompany(),
                      downloadLabel: 'Download Company Unmatched',
                    },
                    {
                      id: 'unmatched-bank',
                      label: 'Unmatched Bank',
                      icon: '❌',
                      data: reconciliationResults.unmatchedBank,
                      headers: bankHeaders,
                      variant: 'unmatched',
                      showDownload: true,
                      downloadHandler: () => handleDownloadUnmatchedBank(),
                      downloadLabel: 'Download Bank Unmatched',
                    },
                    ...(reconciliationResults.classifiedCompanyRaw && reconciliationResults.classifiedCompanyRaw.length > 0 ? [{
                      id: 'classified-company-raw',
                      label: 'Classified Company',
                      icon: '🏢',
                      data: reconciliationResults.classifiedCompanyRaw,
                      headers: companyHeaders,
                      variant: 'matched' as const,
                      showDownload: true,
                      downloadHandler: () => handleDownloadClassifiedCompany(),
                      downloadLabel: 'Download Classified Company',
                    }] : []),
                    ...(reconciliationResults.classifiedBankRaw && reconciliationResults.classifiedBankRaw.length > 0 ? [{
                      id: 'classified-bank-raw',
                      label: 'Classified Bank',
                      icon: '🏦',
                      data: reconciliationResults.classifiedBankRaw,
                      headers: bankHeaders,
                      variant: 'matched' as const,
                      showDownload: true,
                      downloadHandler: () => handleDownloadClassifiedBank(),
                      downloadLabel: 'Download Classified Bank',
                    }] : []),
                  ]}
                />
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

