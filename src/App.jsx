import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

function App() {
  // Company data state
  const [companyData, setCompanyData] = useState([])
  const [companyHeaders, setCompanyHeaders] = useState([])
  const [companyFileName, setCompanyFileName] = useState('')
  const [companyError, setCompanyError] = useState('')
  const [companyLoading, setCompanyLoading] = useState(false)
  
  // Bank data state
  const [bankData, setBankData] = useState([])
  const [bankHeaders, setBankHeaders] = useState([])
  const [bankFileName, setBankFileName] = useState('')
  const [bankError, setBankError] = useState('')
  const [bankLoading, setBankLoading] = useState(false)
  
  // Drag over states
  const [companyDragOver, setCompanyDragOver] = useState(false)
  const [bankDragOver, setBankDragOver] = useState(false)

  const processFile = useCallback((file, type) => {
    const isCompany = type === 'company'
    const isLoading = isCompany ? companyLoading : bankLoading
    
    if (isLoading) return // Prevent multiple uploads
    
    // Set loading state
    if (isCompany) {
      setCompanyError('')
      setCompanyFileName(file.name)
      setCompanyLoading(true)
    } else {
      setBankError('')
      setBankFileName(file.name)
      setBankLoading(true)
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        
        if (jsonData.length === 0) {
          if (isCompany) {
            setCompanyError('The Excel file appears to be empty')
            setCompanyLoading(false)
          } else {
            setBankError('The Excel file appears to be empty')
            setBankLoading(false)
          }
          return
        }
        
        const [headerRow, ...rows] = jsonData
        if (isCompany) {
          setCompanyHeaders(headerRow || [])
          setCompanyData(rows)
          setCompanyLoading(false)
        } else {
          setBankHeaders(headerRow || [])
          setBankData(rows)
          setBankLoading(false)
        }
      } catch (err) {
        const errorMsg = 'Error reading Excel file. Please make sure it\'s a valid Excel file.'
        if (isCompany) {
          setCompanyError(errorMsg)
          setCompanyLoading(false)
        } else {
          setBankError(errorMsg)
          setBankLoading(false)
        }
        console.error('Error processing file:', err)
      }
    }
    
    reader.onerror = () => {
      const errorMsg = 'Error reading the file'
      if (isCompany) {
        setCompanyError(errorMsg)
        setCompanyLoading(false)
      } else {
        setBankError(errorMsg)
        setBankLoading(false)
      }
    }
    
    reader.readAsArrayBuffer(file)
  }, [companyLoading, bankLoading])

  const handleDrop = useCallback((e, type) => {
    e.preventDefault()
    if (type === 'company') {
      setCompanyDragOver(false)
    } else {
      setBankDragOver(false)
    }
    
    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    )
    
    if (excelFile) {
      processFile(excelFile, type)
    } else {
      const errorMsg = 'Please upload a valid Excel file (.xlsx or .xls)'
      if (type === 'company') {
        setCompanyError(errorMsg)
      } else {
        setBankError(errorMsg)
      }
    }
  }, [processFile])

  const handleDragOver = useCallback((e, type) => {
    e.preventDefault()
    if (type === 'company') {
      setCompanyDragOver(true)
    } else {
      setBankDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault()
    if (type === 'company') {
      setCompanyDragOver(false)
    } else {
      setBankDragOver(false)
    }
  }, [])

  const handleFileInput = useCallback((e, type) => {
    const file = e.target.files[0]
    if (file) {
      processFile(file, type)
    }
  }, [processFile])

  const clearData = (type) => {
    if (type === 'company') {
      setCompanyData([])
      setCompanyHeaders([])
      setCompanyFileName('')
      setCompanyError('')
      setCompanyLoading(false)
    } else {
      setBankData([])
      setBankHeaders([])
      setBankFileName('')
      setBankError('')
      setBankLoading(false)
    }
  }

  const clearAllData = () => {
    clearData('company')
    clearData('bank')
  }

  // Format date values
  const formatDateValue = (value) => {
    if (!value) return value
    
    // Check if it's an Excel serial date (number between 1 and 100000)
    if (typeof value === 'number' && value > 1 && value < 100000) {
      try {
        // Excel serial date to JavaScript Date
        const date = new Date((value - 25569) * 86400 * 1000)
        return date.toLocaleDateString('en-GB') // DD/MM/YYYY format
      } catch {
        return value
      }
    }
    
    return value
  }

  // Format company data with proper date formatting
  const formatCompanyData = (data, headers) => {
    // Check for both possible date column names
    const تاريخIndex = headers.findIndex(header => 
      header === 'التاريخ' || header === 'تاريخ الادخال'
    )
    
    if (تاريخIndex === -1) return data
    
    return data.map(row => {
      const newRow = [...row]
      if (newRow[تاريخIndex]) {
        newRow[تاريخIndex] = formatDateValue(newRow[تاريخIndex])
      }
      return newRow
    })
  }

  // Download data as Excel file
  const downloadAsExcel = (data, headers, filename) => {
    if (!data || data.length === 0) {
      alert('No data to download')
      return
    }

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new()
      
      // Convert data to worksheet format
      const worksheetData = [headers, ...data]
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      
      // Generate and download file
      XLSX.writeFile(workbook, filename)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
    }
  }

  // Extract check numbers from البيان column only for "شيك راجع" entries
  const extractCheckNumbers = (data, headers) => {
    const البيانIndex = headers.findIndex(header => header === 'البيان')
    
    if (البيانIndex === -1) return data

    return data.map((row) => {
      const البيانValue = row[البيانIndex]
      let checkNumber = ''

      // Only extract check numbers from entries containing "شيك راجع"
      if (البيانValue && البيانValue.toString().includes('شيك راجع')) {
        // Extract numbers up to 8 digits, excluding dates (no slashes)
        const text = البيانValue.toString()
        const numbers = text.match(/\d{1,8}/g)
        
        if (numbers) {
          // Find the number that's most likely a check number (8 digits or less, no slashes)
          const validCheckNumber = numbers.find(num => 
            num.length <= 8 && 
            !text.includes(`${num}/`) && 
            !text.includes(`/${num}`)
          )
          checkNumber = validCheckNumber || ''
        }
      }

      // Add check number to a new column
      const newRow = [...row]
      newRow.push(checkNumber)
      return newRow
    })
  }

  // Filter bank data for "returned CHEQUE" entries
  const filterReturnedCheques = (data, headers) => {
    const narrativeIndex = headers.findIndex(header => 
      header && header.toString().toLowerCase().includes('narrative')
    )
    
    if (narrativeIndex === -1) return data

    return data.filter(row => {
      const narrativeValue = row[narrativeIndex]
      return narrativeValue && narrativeValue.toString().toLowerCase().includes('returned cheque')
    })
  }

  // Match company and bank data
  const matchReturnedCheques = () => {
    if (companyData.length === 0 || bankData.length === 0) {
      return {
        matchedCompany: [],
        unmatchedCompany: [],
        matchedBank: [],
        unmatchedBank: []
      }
    }

    const companyWithChecks = formatCompanyData(extractCheckNumbers(companyData, companyHeaders), [...companyHeaders, 'رقم الشيك المستخرج'])
    const bankReturnedCheques = filterReturnedCheques(bankData, bankHeaders)
    
    const دائنIndex = companyHeaders.findIndex(header => header === 'دائن')
    const debitIndex = bankHeaders.findIndex(header => 
      header && header.toString().toLowerCase().includes('debit')
    )
    const docNumIndex = bankHeaders.findIndex(header => 
      header && header.toString().toLowerCase().includes('doc-num')
    )

    // Debug: Log the column indices and some sample data
    console.log('Debug Info:')
    console.log('دائن Index:', دائنIndex)
    console.log('Debit Index:', debitIndex)
    console.log('Doc-Num Index:', docNumIndex)
    console.log('Company headers:', companyHeaders)
    console.log('Bank headers:', bankHeaders)
    console.log('Company with checks sample:', companyWithChecks.slice(0, 2))
    console.log('Bank returned cheques sample:', bankReturnedCheques.slice(0, 2))

    const matchedCompany = []
    const unmatchedCompany = []
    const matchedBank = []
    const unmatchedBank = []

    // Check each company returned cheque
    companyWithChecks.forEach((companyRow, index) => {
      const checkNumber = companyRow[companyRow.length - 1] // Last column is extracted check number
      const creditorAmount = companyRow[دائنIndex] // Use دائن (creditor) amount
      
      console.log(`Company row ${index}: checkNumber="${checkNumber}", creditorAmount="${creditorAmount}"`)
      
      if (!checkNumber || !creditorAmount) {
        unmatchedCompany.push(companyRow)
        return
      }

      // Find matching bank entry
      const matchingBank = bankReturnedCheques.find((bankRow, bankIndex) => {
        const bankDebitAmount = bankRow[debitIndex]
        const bankDocNum = bankRow[docNumIndex]
        
        console.log(`  Checking bank row ${bankIndex}: bankDebitAmount="${bankDebitAmount}", bankDocNum="${bankDocNum}"`)
        
        // Match bank debit with company creditor amount
        const amountMatch = bankDebitAmount && creditorAmount && 
               Math.abs(parseFloat(creditorAmount) - parseFloat(bankDebitAmount)) < 0.01
        const checkMatch = bankDocNum && bankDocNum.toString() === checkNumber
        
        console.log(`    Amount match: ${amountMatch} (${creditorAmount} vs ${bankDebitAmount}), Check match: ${checkMatch}`)
        
        return amountMatch && checkMatch
      })

      if (matchingBank) {
        console.log(`  ✅ MATCH FOUND for check ${checkNumber}, creditor amount ${creditorAmount}`)
        matchedCompany.push(companyRow)
        if (!matchedBank.find(row => row === matchingBank)) {
          matchedBank.push(matchingBank)
        }
      } else {
        console.log(`  ❌ NO MATCH for check ${checkNumber}, creditor amount ${creditorAmount}`)
        unmatchedCompany.push(companyRow)
      }
    })

    // Add unmatched bank entries
    bankReturnedCheques.forEach(bankRow => {
      if (!matchedBank.find(row => row === bankRow)) {
        unmatchedBank.push(bankRow)
      }
    })

    console.log('Final Results:', {
      matchedCompany: matchedCompany.length,
      unmatchedCompany: unmatchedCompany.length,
      matchedBank: matchedBank.length,
      unmatchedBank: unmatchedBank.length
    })

    return {
      matchedCompany,
      unmatchedCompany,
      matchedBank,
      unmatchedBank
    }
  }

  // Get reconciliation results
  const reconciliationResults = matchReturnedCheques()

  // Get company data with extracted check numbers and formatted dates
  const companyDataWithChecks = companyData.length > 0 && companyHeaders.length > 0 
    ? formatCompanyData(extractCheckNumbers(companyData, companyHeaders), [...companyHeaders, 'رقم الشيك المستخرج'])
    : []

  // Get headers with check number column
  const companyHeadersWithChecks = companyHeaders.length > 0 
    ? [...companyHeaders, 'رقم الشيك المستخرج']
    : []

  return (
    <div className="app">
      <div className="container">
        <h1>Bank Reconciliation Assistant</h1>
        <p>Upload company and bank Excel files separately (.xlsx, .xls)</p>
        
        {(companyData.length > 0 || bankData.length > 0) && (
          <div className="clear-all-container">
            <button onClick={clearAllData} className="clear-all-button">
              Clear All Data
            </button>
          </div>
        )}
        
        <div className="upload-sections">
          {/* Company Data Section */}
          <div className="upload-section company-section">
            <h2 className="section-title company-title">🏢 Company Data</h2>
            
            <div 
              className={`upload-area company-upload ${companyDragOver ? 'drag-over' : ''} ${companyLoading ? 'loading' : ''}`}
              onDrop={(e) => handleDrop(e, 'company')}
              onDragOver={(e) => handleDragOver(e, 'company')}
              onDragLeave={(e) => handleDragLeave(e, 'company')}
            >
              <div className="upload-content">
                {companyLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <h3>Processing Company Excel file...</h3>
                    <p>Please wait while we read your data</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">🏢</div>
                    <h3>Drop Company Excel file here</h3>
                    <p>or</p>
                    <label htmlFor="company-file-input" className="upload-button company-button">
                      Choose Company File
                    </label>
                    <input
                      id="company-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileInput(e, 'company')}
                      style={{ display: 'none' }}
                      disabled={companyLoading}
                    />
                  </>
                )}
              </div>
            </div>

            {companyError && (
              <div className="error-message">
                {companyError}
              </div>
            )}

            {companyFileName && (
              <div className="file-info company-file-info">
                <span>📄 {companyFileName}</span>
                <button onClick={() => clearData('company')} className="clear-button">
                  Clear
                </button>
              </div>
            )}

            {companyData.length > 0 && (
              <div className="data-container">
                <h3>Company Data Preview (with Check Numbers)</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {companyHeadersWithChecks.map((header, index) => (
                          <th key={index} className={header === 'رقم الشيك المستخرج' ? 'check-number-header' : ''}>
                            {header || `Column ${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {companyDataWithChecks.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {companyHeadersWithChecks.map((header, colIndex) => (
                            <td key={colIndex} className={header === 'رقم الشيك المستخرج' ? 'check-number-cell' : ''}>
                              {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="data-note">
                  Showing all {companyData.length} rows of company data with extracted check numbers
                </p>
              </div>
            )}
          </div>

          {/* Bank Data Section */}
          <div className="upload-section bank-section">
            <h2 className="section-title bank-title">🏦 Bank Data</h2>
            
            <div 
              className={`upload-area bank-upload ${bankDragOver ? 'drag-over' : ''} ${bankLoading ? 'loading' : ''}`}
              onDrop={(e) => handleDrop(e, 'bank')}
              onDragOver={(e) => handleDragOver(e, 'bank')}
              onDragLeave={(e) => handleDragLeave(e, 'bank')}
            >
              <div className="upload-content">
                {bankLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <h3>Processing Bank Excel file...</h3>
                    <p>Please wait while we read your data</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">🏦</div>
                    <h3>Drop Bank Excel file here</h3>
                    <p>or</p>
                    <label htmlFor="bank-file-input" className="upload-button bank-button">
                      Choose Bank File
                    </label>
                    <input
                      id="bank-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileInput(e, 'bank')}
                      style={{ display: 'none' }}
                      disabled={bankLoading}
                    />
                  </>
                )}
              </div>
            </div>

            {bankError && (
              <div className="error-message">
                {bankError}
              </div>
            )}

            {bankFileName && (
              <div className="file-info bank-file-info">
                <span>📄 {bankFileName}</span>
                <button onClick={() => clearData('bank')} className="clear-button">
                  Clear
                </button>
              </div>
            )}

            {bankData.length > 0 && (
              <div className="data-container">
                <h3>Bank Data Preview</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {bankHeaders.map((header, index) => (
                          <th key={index}>{header || `Column ${index + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bankData.map((row, rowIndex) => {
                        return (
                        <tr key={rowIndex}>
                          {bankHeaders.map((_, colIndex) => (
                            <td key={colIndex}>
                              {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                            </td>
                          ))}
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
                <p className="data-note">
                  Showing all {bankData.length} rows of bank data
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bank Reconciliation Section */}
        {(companyData.length > 0 || bankData.length > 0) && (
          <div className="reconciliation-section">
            <h2 className="section-title reconciliation-title">🔄 Bank Reconciliation</h2>
            
            {companyData.length > 0 && bankData.length > 0 ? (
              <div className="reconciliation-content">
                <div className="reconciliation-stats">
                  <div className="stat-card">
                    <h4>Company Returned Cheques</h4>
                    <span className="stat-number">{reconciliationResults.matchedCompany.length + reconciliationResults.unmatchedCompany.length}</span>
                  </div>
                  <div className="stat-card">
                    <h4>Bank Returned Cheques</h4>
                    <span className="stat-number">{reconciliationResults.matchedBank.length + reconciliationResults.unmatchedBank.length}</span>
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
            ) : (
              <div className="reconciliation-placeholder">
                <p>📁 Upload both company and bank data files to start reconciliation</p>
              </div>
            )}

            {/* Results Tables */}
            {(reconciliationResults.matchedCompany.length > 0 || reconciliationResults.unmatchedCompany.length > 0 || 
              reconciliationResults.matchedBank.length > 0 || reconciliationResults.unmatchedBank.length > 0) && (
              <div className="results-tables">
                <h3>Reconciliation Results</h3>
                
                <div className="results-grid">
                  {/* Matched Company Data */}
                  {reconciliationResults.matchedCompany.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>✅ Matched Company Transactions ({reconciliationResults.matchedCompany.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            reconciliationResults.matchedCompany, 
                            companyHeadersWithChecks, 
                            'matched_company_transactions.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {companyHeadersWithChecks.map((header, index) => (
                                <th key={index} className={header === 'رقم الشيك المستخرج' ? 'check-number-header' : ''}>
                                  {header || `Column ${index + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reconciliationResults.matchedCompany.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {companyHeadersWithChecks.map((header, colIndex) => (
                                  <td key={colIndex} className={header === 'رقم الشيك المستخرج' ? 'check-number-cell' : ''}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Unmatched Company Data */}
                  {reconciliationResults.unmatchedCompany.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>❌ Unmatched Company Transactions ({reconciliationResults.unmatchedCompany.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            reconciliationResults.unmatchedCompany, 
                            companyHeadersWithChecks, 
                            'unmatched_company_transactions.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {companyHeadersWithChecks.map((header, index) => (
                                <th key={index} className={header === 'رقم الشيك المستخرج' ? 'check-number-header' : ''}>
                                  {header || `Column ${index + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reconciliationResults.unmatchedCompany.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {companyHeadersWithChecks.map((header, colIndex) => (
                                  <td key={colIndex} className={header === 'رقم الشيك المستخرج' ? 'check-number-cell' : ''}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Matched Bank Data */}
                  {reconciliationResults.matchedBank.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>✅ Matched Bank Transactions ({reconciliationResults.matchedBank.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            reconciliationResults.matchedBank, 
                            bankHeaders, 
                            'matched_bank_transactions.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {bankHeaders.map((header, index) => (
                                <th key={index}>{header || `Column ${index + 1}`}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reconciliationResults.matchedBank.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {bankHeaders.map((_, colIndex) => (
                                  <td key={colIndex}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Unmatched Bank Data */}
                  {reconciliationResults.unmatchedBank.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>❌ Unmatched Bank Transactions ({reconciliationResults.unmatchedBank.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            reconciliationResults.unmatchedBank, 
                            bankHeaders, 
                            'unmatched_bank_transactions.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {bankHeaders.map((header, index) => (
                                <th key={index}>{header || `Column ${index + 1}`}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reconciliationResults.unmatchedBank.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {bankHeaders.map((_, colIndex) => (
                                  <td key={colIndex}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
