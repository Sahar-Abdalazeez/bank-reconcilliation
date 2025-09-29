import { useCallback } from 'react'
import * as XLSX from 'xlsx'

const DataTable = ({ 
  data, 
  headers, 
  title, 
  showCheckNumbers = false,
  checkNumberColumnName = 'رقم الشيك المستخرج'
}) => {
  const downloadAsExcel = useCallback((data, headers, filename) => {
    if (!data || data.length === 0) {
      alert('No data to download')
      return
    }

    try {
      const workbook = XLSX.utils.book_new()
      const worksheetData = [headers, ...data]
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      XLSX.writeFile(workbook, filename)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
    }
  }, [])

  if (data.length === 0) return null

  return (
    <div className="data-container">
      <div className="table-header">
        <h3>{title}</h3>
        <button 
          className="download-button"
          onClick={() => downloadAsExcel(data, headers, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`)}
        >
          📥 Download Excel
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className={showCheckNumbers && header === checkNumberColumnName ? 'check-number-header' : ''}
                >
                  {header || `Column ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={showCheckNumbers && header === checkNumberColumnName ? 'check-number-cell' : ''}
                  >
                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="data-note">
        Showing all {data.length} rows of data
      </p>
    </div>
  )
}

export default DataTable
