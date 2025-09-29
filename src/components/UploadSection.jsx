import { useCallback } from 'react'

const UploadSection = ({ 
  type, 
  title, 
  icon, 
  dragOver, 
  loading, 
  fileName, 
  error, 
  onDrop, 
  onDragOver, 
  onDragLeave, 
  onFileInput, 
  onClear 
}) => {
  const handleDrop = useCallback((e) => {
    onDrop(e, type)
  }, [onDrop, type])

  const handleDragOver = useCallback((e) => {
    onDragOver(e, type)
  }, [onDragOver, type])

  const handleDragLeave = useCallback((e) => {
    onDragLeave(e, type)
  }, [onDragLeave, type])

  const handleFileInput = useCallback((e) => {
    onFileInput(e, type)
  }, [onFileInput, type])

  return (
    <div className="upload-section">
      <h2 className={`section-title ${type}-title`}>{icon} {title}</h2>
      
      <div 
        className={`upload-area ${type}-upload ${dragOver ? 'drag-over' : ''} ${loading ? 'loading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-content">
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              <h3>Processing {title} Excel file...</h3>
              <p>Please wait while we read your data</p>
            </>
          ) : (
            <>
              <div className="upload-icon">{icon}</div>
              <h3>Drop {title} Excel file here</h3>
              <p>or</p>
              <label htmlFor={`${type}-file-input`} className={`upload-button ${type}-button`}>
                Choose {title} File
              </label>
              <input
                id={`${type}-file-input`}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {fileName && (
        <div className={`file-info ${type}-file-info`}>
          <span>📄 {fileName}</span>
          <button onClick={() => onClear(type)} className="clear-button">
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

export default UploadSection
