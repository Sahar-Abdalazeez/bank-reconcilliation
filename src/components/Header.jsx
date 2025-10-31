import logoImage from "../assets/al-mashreq-logo.png";

export const Header = () => {
  return (
      <header className="app-header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-section">
              <img
                src={logoImage}
                alt="AL-MASHREQ INSURANCE CO."
                className="logo-image"
                width={200}
                height={70}
              />
              <div className="logo-text">
                <h1>Bank Reconciliation Assistant</h1>
                <p>Advanced Excel Data Processing & Reconciliation</p>
              </div>
            </div>
            <nav className="header-nav">
              {/* <div className="nav-item">
                <span className="nav-icon">📊</span>
                <span>Data Processing</span>
              </div>
              <div className="nav-item">
                <span className="nav-icon">🔄</span>
                <span>Reconciliation</span>
              </div>
              <div className="nav-item">
                <span className="nav-icon">📈</span>
                <span>Analytics</span>
              </div> */}
            </nav>
          </div>
        </div>
      </header>
    
  );
};
