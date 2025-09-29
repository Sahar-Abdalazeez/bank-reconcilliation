import DataTable from './DataTable'

const ResultsTable = ({ 
  reconciliationResults, 
  companyHeadersWithChecks, 
  bankHeaders 
}) => {
  if (!reconciliationResults) return null

  const hasResults = reconciliationResults.matchedCompany.length > 0 || 
                    reconciliationResults.unmatchedCompany.length > 0 || 
                    reconciliationResults.matchedBank.length > 0 || 
                    reconciliationResults.unmatchedBank.length > 0

  if (!hasResults) return null

  return (
    <div className="results-tables">
      <h3>Reconciliation Results</h3>
      
      <div className="results-grid">
        {/* Matched Company Data */}
        {reconciliationResults.matchedCompany.length > 0 && (
          <div className="result-table-container">
            <DataTable
              data={reconciliationResults.matchedCompany}
              headers={companyHeadersWithChecks}
              title={`✅ Matched Company Transactions (${reconciliationResults.matchedCompany.length})`}
              showCheckNumbers={true}
            />
          </div>
        )}

        {/* Unmatched Company Data */}
        {reconciliationResults.unmatchedCompany.length > 0 && (
          <div className="result-table-container">
            <DataTable
              data={reconciliationResults.unmatchedCompany}
              headers={companyHeadersWithChecks}
              title={`❌ Unmatched Company Transactions (${reconciliationResults.unmatchedCompany.length})`}
              showCheckNumbers={true}
            />
          </div>
        )}

        {/* Matched Bank Data */}
        {reconciliationResults.matchedBank.length > 0 && (
          <div className="result-table-container">
            <DataTable
              data={reconciliationResults.matchedBank}
              headers={bankHeaders}
              title={`✅ Matched Bank Transactions (${reconciliationResults.matchedBank.length})`}
            />
          </div>
        )}

        {/* Unmatched Bank Data */}
        {reconciliationResults.unmatchedBank.length > 0 && (
          <div className="result-table-container">
            <DataTable
              data={reconciliationResults.unmatchedBank}
              headers={bankHeaders}
              title={`❌ Unmatched Bank Transactions (${reconciliationResults.unmatchedBank.length})`}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultsTable
