import React from "react";
import "./styles.css";

interface AccordionGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const AccordionGroup: React.FC<AccordionGroupProps> = ({
  children,
  title,
  description,
}) => {
  return (
    <div className="accordion-group">
      {(title || description) && (
        <div className="accordion-group-header">
          {title && <h2 className="accordion-group-title">{title}</h2>}
          {description && (
            <p className="accordion-group-description">{description}</p>
          )}
        </div>
      )}
      <div className="accordion-group-content">{children}</div>
    </div>
  );
};

export default AccordionGroup;

