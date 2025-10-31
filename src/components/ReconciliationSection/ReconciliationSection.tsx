import React, { useState } from "react";
import { useFileUpload } from "../../contexts/FileUploadContext";
import { reconcileTransactions, validateReconciliationConfig } from "../../utils/reconciliationEngine";
import { downloadExcel, downloadReconciliationSummary } from "../../utils/excelDownload";
import { DebugPanel } from "./DebugPanel";
import { ResultsDataTable } from "./ResultsDataTable";
import "./reconciliationStyles.css";
import "./debugStyles.css";

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


  const handleDownloadSummary = () => {
    if (!reconciliationResults?.stats) {
      alert("No reconciliation results to download");
      return;
    }
    
    const success = downloadReconciliationSummary(
      reconciliationResults.stats,
      reconciliationResults,
      "Reconciliation_Summary"
    );
    
    if (!success) {
      alert("Failed to download reconciliation summary");
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

  if (!canReconcile) {
    return (null
      // <div className="reconciliation-section">
      //   <div className="reconciliation-placeholder">
      //     <div className="placeholder-icon">🔄</div>
      //     <h3>Ready to Reconcile?</h3>
      //     <p>Please complete the following steps:</p>
      //     <ul className="checklist">
      //       <li className={companyData?.length > 0 ? "completed" : ""}>
      //         {companyData?.length > 0 ? "✅" : "⏳"} Upload Company Excel file
      //       </li>
      //       <li className={bankData?.length > 0 ? "completed" : ""}>
      //         {bankData?.length > 0 ? "✅" : "⏳"} Upload Bank Excel file
      //       </li>
      //       <li className={selectedClassificationType ? "completed" : ""}>
      //         {selectedClassificationType ? "✅" : "⏳"} Select Classification Type
      //       </li>
      //     </ul>
      //   </div>
      // </div>
    );
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
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Total Rows</div>
                <div className="stat-value">
                  {reconciliationResults.stats.totalCompanyRows +
                    reconciliationResults.stats.totalBankRows}
                </div>
              </div>
            </div>

            <div className="stat-card classified">
              <div className="stat-icon">{isBankOnly ? '💳' : '🏷️'}</div>
              <div className="stat-content">
                <div className="stat-label">{isBankOnly ? 'Found' : 'Classified'}</div>
                <div className="stat-value">
                  {reconciliationResults.stats.classifiedCompanyRows +
                    reconciliationResults.stats.classifiedBankRows}
                </div>
              </div>
            </div>

            {!isBankOnly && (
              <>
                <div className="stat-card matched">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-label">Matched Pairs</div>
                    <div className="stat-value">
                      {reconciliationResults.stats.matchedPairs}
                    </div>
                  </div>
                </div>

                <div className="stat-card unmatched">
                  <div className="stat-icon">❌</div>
                  <div className="stat-content">
                    <div className="stat-label">Unmatched</div>
                    <div className="stat-value">
                      {reconciliationResults.stats.unmatchedCompanyRows +
                        reconciliationResults.stats.unmatchedBankRows}
                    </div>
                  </div>
                </div>

                <div className="stat-card rate">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <div className="stat-label">Match Rate</div>
                    <div className="stat-value">
                      {reconciliationResults.stats.matchRate}%
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detailed Breakdown */}
          {!isBankOnly && (
            <div className="breakdown-section">
              <h3 className="breakdown-title">📋 Detailed Breakdown</h3>
              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <h4>🏢 Company Data</h4>
                  <div className="breakdown-stats">
                    <div className="breakdown-item">
                      <span>Classified:</span>
                      <strong>{reconciliationResults.stats.classifiedCompanyRows}</strong>
                    </div>
                    <div className="breakdown-item">
                      <span>Matched:</span>
                      <strong className="success">{reconciliationResults.matchedCompany.length}</strong>
                    </div>
                    <div className="breakdown-item">
                      <span>Unmatched:</span>
                      <strong className="error">{reconciliationResults.unmatchedCompany.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="breakdown-card">
                  <h4>🏦 Bank Data</h4>
                  <div className="breakdown-stats">
                    <div className="breakdown-item">
                      <span>Classified:</span>
                      <strong>{reconciliationResults.stats.classifiedBankRows}</strong>
                    </div>
                    <div className="breakdown-item">
                      <span>Matched:</span>
                      <strong className="success">{reconciliationResults.matchedBank.length}</strong>
                    </div>
                    <div className="breakdown-item">
                      <span>Unmatched:</span>
                      <strong className="error">{reconciliationResults.unmatchedBank.length}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              
              {/* Unclassified Tables */}
              <div className="unclassified-tables">
                <ResultsDataTable
                  title="Unclassified Company Transactions"
                  data={reconciliationResults.classifiedCompany}
                  headers={companyHeaders}
                  variant="unmatched"
                  icon="🏢"
                  showDownload={true}
                  downloadHandler={() => {
                    downloadExcel(
                      reconciliationResults.classifiedCompany,
                      companyHeaders,
                      "Unclassified_Company"
                    );
                  }}
                  downloadLabel="Download Company Unclassified"
                />
                
                <ResultsDataTable
                  title="Unclassified Bank Transactions"
                  data={reconciliationResults.classifiedBank}
                  headers={bankHeaders}
                  variant="unmatched"
                  icon="🏦"
                  showDownload={true}
                  downloadHandler={() => {
                    downloadExcel(
                      reconciliationResults.classifiedBank,
                      bankHeaders,
                      "Unclassified_Bank"
                    );
                  }}
                  downloadLabel="Download Bank Unclassified"
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
              
              {/* Company Salary Entries */}
              <div className="salary-tables">
                <ResultsDataTable
                  title="Company Salary Entries"
                  data={reconciliationResults.classifiedCompany}
                  headers={companyHeaders}
                  variant="matched"
                  icon="🏢"
                  showDownload={true}
                  downloadHandler={() => {
                    downloadExcel(
                      reconciliationResults.classifiedCompany,
                      companyHeaders,
                      "Company_Salary_Entries"
                    );
                  }}
                  downloadLabel="Download Company Entries"
                  totalAmount={reconciliationResults.stats.companyTotal}
                  showTotal={true}
                />
                
                <ResultsDataTable
                  title="Bank Salary Transfer"
                  data={reconciliationResults.classifiedBank}
                  headers={bankHeaders}
                  variant="matched"
                  icon="🏦"
                  showDownload={true}
                  downloadHandler={() => {
                    downloadExcel(
                      reconciliationResults.classifiedBank,
                      bankHeaders,
                      "Bank_Salary_Transfer"
                    );
                  }}
                  downloadLabel="Download Bank Transfer"
                  totalAmount={reconciliationResults.stats.bankTotal}
                  showTotal={true}
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
              
              {/* Grouped Charges Tables */}
              <div className="grouped-charges-section">
                {reconciliationResults.groupedByPattern?.map((group, index) => (
                  <ResultsDataTable
                    key={index}
                    title={`${group.pattern}`}
                    data={group.rows}
                    headers={bankHeaders}
                    variant="matched"
                    icon="💳"
                    showDownload={true}
                    downloadHandler={() => {
                      downloadExcel(
                        group.rows,
                        bankHeaders,
                        `Charges_${group.pattern.replace(/[^a-zA-Z0-9]/g, '_')}`
                      );
                    }}
                    downloadLabel={`Download (${group.rows.length})`}
                    totalAmount={group.totalAmount}
                    showTotal={true}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Matched Data Tables */}
              <div className="matched-data-section">
                <h3 className="matched-data-title">✅ Matched Transactions</h3>
                <p className="matched-data-subtitle">
                  Successfully matched transactions between company and bank data
                </p>
                
                <div className="matched-tables-grid">
                  <ResultsDataTable
                    title="Matched Company Transactions"
                    data={reconciliationResults.matchedCompany}
                    headers={companyHeaders}
                    variant="matched"
                    icon="🏢"
                    showDownload={true}
                    downloadHandler={() => handleDownloadMatchedCompany()}
                    downloadLabel="Download Company Matches"
                  />
                  
                  <ResultsDataTable
                    title="Matched Bank Transactions"
                    data={reconciliationResults.matchedBank}
                    headers={bankHeaders}
                    variant="matched"
                    icon="🏦"
                    showDownload={true}
                    downloadHandler={() => handleDownloadMatchedBank()}
                    downloadLabel="Download Bank Matches"
                  />
                </div>
              </div>

              {/* Unmatched Data Tables */}
              <div className="unmatched-data-section">
                <h3 className="unmatched-data-title">❌ Unmatched Transactions</h3>
                <p className="unmatched-data-subtitle">
                  Transactions that could not be matched between company and bank data
                </p>
                
                <div className="unmatched-tables-grid">
                  <ResultsDataTable
                    title="Unmatched Company Transactions"
                    data={reconciliationResults.unmatchedCompany}
                    headers={companyHeaders}
                    variant="unmatched"
                    icon="🏢"
                    showDownload={true}
                    downloadHandler={() => handleDownloadUnmatchedCompany()}
                    downloadLabel="Download Company Unmatched"
                  />
                  
                  <ResultsDataTable
                    title="Unmatched Bank Transactions"
                    data={reconciliationResults.unmatchedBank}
                    headers={bankHeaders}
                    variant="unmatched"
                    icon="🏦"
                    showDownload={true}
                    downloadHandler={() => handleDownloadUnmatchedBank()}
                    downloadLabel="Download Bank Unmatched"
                  />
                </div>
              </div>
            </>
          )}

          {/* Download Buttons */}
          {!isBankOnly && (
            <div className="download-section">
              <h3 className="download-title">📥 Download Results</h3>
              <div className="download-buttons">
                <button 
                  className="download-btn matched" 
                  onClick={handleDownloadMatchedCompany}
                  disabled={!reconciliationResults.matchedCompany || reconciliationResults.matchedCompany.length === 0}
                >
                  ✅ Download Matched Company ({reconciliationResults.matchedCompany.length})
                </button>
                <button 
                  className="download-btn matched" 
                  onClick={handleDownloadMatchedBank}
                  disabled={!reconciliationResults.matchedBank || reconciliationResults.matchedBank.length === 0}
                >
                  ✅ Download Matched Bank ({reconciliationResults.matchedBank.length})
                </button>
                <button 
                  className="download-btn unmatched" 
                  onClick={handleDownloadUnmatchedCompany}
                  disabled={!reconciliationResults.unmatchedCompany || reconciliationResults.unmatchedCompany.length === 0}
                >
                  ❌ Download Unmatched Company ({reconciliationResults.unmatchedCompany.length})
                </button>
                <button 
                  className="download-btn unmatched" 
                  onClick={handleDownloadUnmatchedBank}
                  disabled={!reconciliationResults.unmatchedBank || reconciliationResults.unmatchedBank.length === 0}
                >
                  ❌ Download Unmatched Bank ({reconciliationResults.unmatchedBank.length})
                </button>
              </div>
              
              {/* Additional Download Options */}
              <div className="download-buttons additional">
                <button 
                  className="download-btn summary" 
                  onClick={handleDownloadSummary}
                  disabled={!reconciliationResults.stats}
                >
                  📊 Download Complete Summary
                </button>
              </div>
              
              <p className="download-note">✅ Excel files will be downloaded with timestamps</p>
            </div>
          )}

          {/* Bank-Only Classified Data (for Charges, etc.) */}
          {isBankOnly ? (
            <div className="classified-data-section">
              <h3 className="classified-data-title">💳 Classified {selectedClassificationType?.name}</h3>
              <p className="classified-data-subtitle">
                All {selectedClassificationType?.name.toLowerCase()} found in bank data
              </p>
              
              <ResultsDataTable
                title={`Classified ${selectedClassificationType?.name}`}
                data={reconciliationResults.classifiedBank}
                headers={bankHeaders}
                variant="matched"
                icon="💳"
                showDownload={true}
                downloadHandler={() => handleDownloadClassifiedCharges()}
                downloadLabel={`Download ${selectedClassificationType?.name}`}
              />
            </div>
          ) : (
            <>
              {/* Matched Data Tables */}
              <div className="matched-data-section">
                <h3 className="matched-data-title">✅ Matched Transactions</h3>
                <p className="matched-data-subtitle">
                  Successfully matched transactions between company and bank data
                </p>
                
                <div className="matched-tables-grid">
                  <ResultsDataTable
                    title="Matched Company Transactions"
                    data={reconciliationResults.matchedCompany}
                    headers={companyHeaders}
                    variant="matched"
                    icon="🏢"
                    showDownload={true}
                    downloadHandler={() => handleDownloadMatchedCompany()}
                    downloadLabel="Download Company Matches"
                  />
                  
                  <ResultsDataTable
                    title="Matched Bank Transactions"
                    data={reconciliationResults.matchedBank}
                    headers={bankHeaders}
                    variant="matched"
                    icon="🏦"
                    showDownload={true}
                    downloadHandler={() => handleDownloadMatchedBank()}
                    downloadLabel="Download Bank Matches"
                  />
                </div>
              </div>

              {/* Unmatched Data Tables */}
              <div className="unmatched-data-section">
                <h3 className="unmatched-data-title">❌ Unmatched Transactions</h3>
                <p className="unmatched-data-subtitle">
                  Transactions that could not be matched between company and bank data
                </p>
                
                <div className="unmatched-tables-grid">
                  <ResultsDataTable
                    title="Unmatched Company Transactions"
                    data={reconciliationResults.unmatchedCompany}
                    headers={companyHeaders}
                    variant="unmatched"
                    icon="🏢"
                    showDownload={true}
                    downloadHandler={() => handleDownloadUnmatchedCompany()}
                    downloadLabel="Download Company Unmatched"
                  />
                  
                  <ResultsDataTable
                    title="Unmatched Bank Transactions"
                    data={reconciliationResults.unmatchedBank}
                    headers={bankHeaders}
                    variant="unmatched"
                    icon="🏦"
                    showDownload={true}
                    downloadHandler={() => handleDownloadUnmatchedBank()}
                    downloadLabel="Download Bank Unmatched"
                  />
                </div>
              </div>
            </>
          )}

          {/* Debug: Classified Data (Before Filtering) */}
          <div className="debug-classified-section">
            <h3 className="debug-section-title">🐛 Debug: Classified Data (Before Amount Filtering)</h3>
            <p className="debug-section-subtitle">
              These rows matched the text patterns but haven't been filtered by amount columns yet
            </p>
            
            <ResultsDataTable
              title="Classified Company (Raw - Before Filtering)"
              data={reconciliationResults.classifiedCompanyRaw || []}
              headers={companyHeaders}
              variant="matched"
              icon="📋"
            />
            
            <ResultsDataTable
              title="Classified Bank (Raw - Before Filtering)"
              data={reconciliationResults.classifiedBankRaw || []}
              headers={bankHeaders}
              variant="matched"
              icon="🏦"
            />
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
};

