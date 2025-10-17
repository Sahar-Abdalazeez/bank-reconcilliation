import "./App.css";
import "./header-accordion.css";
//new import
import { Header } from "./components/header";
import { UploadFilesSection } from "./components/UploadFilesSection";
import { ClassificationTypeSelector } from "./components/ClassificationTypeSelector";
import { EditableRulesAccordion } from "./components/RulesAccordion/EditableRulesAccordion";
import { ReconciliationSection } from "./components/ReconciliationSection/ReconciliationSection";
import { DebugDataTables } from "./components/DebugDataTables";

function App() {
  return (
    <div className="app">
      {/* Header */}
      <Header />
      {/* Upload Files Section */}
      <UploadFilesSection />

      {/* Debug Tables - Show uploaded data */}
      <DebugDataTables />

      {/* Classification Type Selector */}
      <ClassificationTypeSelector />

      {/* Editable Rules Accordion - Shows classification rules */}
      <EditableRulesAccordion />

      {/* Reconciliation Section - Match transactions */}
      <ReconciliationSection />
    </div>
  );
}

export default App;
