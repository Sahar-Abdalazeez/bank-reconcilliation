import React from "react";
import './styles.css';

interface ClassificationTypeCardProps {
  name: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

const ClassificatioTypeCard: React.FC<ClassificationTypeCardProps> = ({ 
  name, 
  icon, 
  isSelected = false,
  onClick 
}) => {
  return (
    <div 
      className={`classification-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="card-icon">{icon}</div>
      <h3 className="card-title">{name}</h3>
    </div>
  );
};

export default ClassificatioTypeCard;