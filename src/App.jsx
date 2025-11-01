import "./App.css";
import "./header-accordion.css";
import { Header } from "./components/header";
import { UploadFilesSection } from "./components/UploadFilesSection";
import { ClassificationTypeSelector } from "./components/ClassificationTypeSelector";
import { EditableRulesAccordion } from "./components/RulesAccordion/EditableRulesAccordion";
import { ReconciliationSection } from "./components/ReconciliationSection/ReconciliationSection";

function App() {
  return (
    <div className="app">
      <Header />
      <UploadFilesSection />
      <ClassificationTypeSelector />
      <EditableRulesAccordion />
      <ReconciliationSection />
    </div>
  );
}

export default App;
