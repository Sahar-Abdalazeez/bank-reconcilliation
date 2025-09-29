const ReconciliationSection = ({ reconciliationResults }) => {
  if (!reconciliationResults) return null

  const hasResults = reconciliationResults.matchedCompany.length > 0 || 
                    reconciliationResults.unmatchedCompany.length > 0 || 
                    reconciliationResults.matchedBank.length > 0 || 
                    reconciliationResults.unmatchedBank.length > 0

  return (
    <div className="reconciliation-section">
      <h2 className="section-title reconciliation-title">🔄 Bank Reconciliation</h2>
      
      <div className="reconciliation-content">
        <div className="reconciliation-stats">
          <div className="stat-card">
            <h4>Company Returned Cheques</h4>
            <span className="stat-number">
              {reconciliationResults.matchedCompany.length + reconciliationResults.unmatchedCompany.length}
            </span>
          </div>
          <div className="stat-card">
            <h4>Bank Returned Cheques</h4>
            <span className="stat-number">
              {reconciliationResults.matchedBank.length + reconciliationResults.unmatchedBank.length}
            </span>
          </div>
          <div className="stat-card">
            <h4>Matched Transactions</h4>
            <span className="stat-number">{reconciliationResults.matchedCompany.length}</span>
          </div>
          <div className="stat-card">
            <h4>Unmatched Company</h4>
            <span className="stat-number">{reconciliationResults.unmatchedCompany.length}</span>
          </div>
          <div className="stat-card">
            <h4>Unmatched Bank</h4>
            <span className="stat-number">{reconciliationResults.unmatchedBank.length}</span>
          </div>
        </div>
        
        <div className="reconciliation-note">
          <p>✅ Check numbers extracted from "شيك راجع" entries in company data.</p>
          <p>✅ Bank data filtered for "returned CHEQUE" entries.</p>
          <p>✅ Matching completed based on amounts and check numbers.</p>
        </div>
      </div>
    </div>
  )
}

export default ReconciliationSection
