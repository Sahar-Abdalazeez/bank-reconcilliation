import React, { useState } from "react";
import "./styles.css";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  icon,
  defaultOpen = false,
  variant = "default",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`accordion ${variant} ${isOpen ? "open" : ""}`}>
      <div className="accordion-header" onClick={toggleAccordion}>
        <div className="accordion-title-section">
          {icon && <div className="accordion-icon">{icon}</div>}
          <h3 className="accordion-title">{title}</h3>
        </div>
        <div className={`accordion-arrow ${isOpen ? "rotate" : ""}`}>
            {/* //arrow icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      <div className={`accordion-content ${isOpen ? "show" : ""}`}>
        <div className="accordion-content-inner">{children}</div>
      </div>
    </div>
  );
};

export default Accordion;

