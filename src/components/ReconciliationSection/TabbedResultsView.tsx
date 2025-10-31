import React, { useState } from 'react';
import { ResultsDataTable } from './ResultsDataTable';
import './tabbedResultsViewStyles.css';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  data: any[][];
  headers: string[];
  variant: 'matched' | 'unmatched';
  showDownload?: boolean;
  downloadHandler?: () => void;
  downloadLabel?: string;
  totalAmount?: number;
  showTotal?: boolean;
}

interface TabbedResultsViewProps {
  tabs: TabItem[];
}

export const TabbedResultsView: React.FC<TabbedResultsViewProps> = ({ tabs }) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    // Find first tab with data
    const firstTabWithData = tabs.find(tab => tab.data && tab.data.length > 0);
    return firstTabWithData?.id || tabs[0]?.id || null;
  });

  // Filter tabs that have data
  const availableTabs = tabs.filter(tab => tab.data && tab.data.length > 0);

  if (availableTabs.length === 0) {
    return null;
  }

  const activeTab = availableTabs.find(tab => tab.id === activeTabId) || availableTabs[0];

  return (
    <div className="tabbed-results-view">
      {/* Left Sidebar - Tabs */}
      <div className="results-tabs-sidebar">
        <div className="tabs-header">
          <h3 className="tabs-title">Results</h3>
        </div>
        <div className="tabs-list">
          {availableTabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                className={`results-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <div className="tab-content">
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-count">{tab.data.length} rows</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content - Active Table */}
      <div className="results-tab-content">
        {activeTab && (
          <ResultsDataTable
            title={activeTab.label}
            data={activeTab.data}
            headers={activeTab.headers}
            variant={activeTab.variant}
            icon={activeTab.icon}
            showDownload={activeTab.showDownload}
            downloadHandler={activeTab.downloadHandler}
            downloadLabel={activeTab.downloadLabel}
            totalAmount={activeTab.totalAmount}
            showTotal={activeTab.showTotal}
          />
        )}
      </div>
    </div>
  );
};

