import React, { useRef, useState, useEffect } from "react";
import { classificationTypes } from "../../constants/classificationTypes";
import ClassificatioTypeCard from "../core/ClassificationTypeCrad/ClassificatioTypeCard";
import { useFileUpload } from "../../contexts/FileUploadContext";
import "./ClassificationTypeSelector.css";

export const ClassificationTypeSelector = () => {
  const { selectedClassificationType, setSelectedClassificationType } = useFileUpload();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleSelectType = (key: string) => {
    const selectedType = {
      key,
      ...classificationTypes[key]
    };
    setSelectedClassificationType(selectedType);
    console.log('Selected classification type:', key, selectedType);
  };

  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    // Wait for DOM to be ready before checking scroll buttons
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);
    
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
    }
    return () => {
      clearTimeout(timer);
      if (carousel) {
        carousel.removeEventListener('scroll', checkScrollButtons);
      }
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.classification-card')?.clientWidth || 280;
      const gap = 20;
      const scrollAmount = (cardWidth + gap) * 2; // Scroll 2 cards at a time
      
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="classification-selector-container">
      <div className="classification-header">
        <h2 className="classification-title">🎯 Select Classification Type</h2>
        <p className="classification-description">
          Choose how to classify transactions in your data for reconciliation
        </p>
      </div>
      
      <div className="classification-carousel-wrapper">
        <button 
          className={`carousel-arrow carousel-arrow-left ${!canScrollLeft ? 'disabled' : ''}`}
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          disabled={!canScrollLeft}
        >
          <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div className="classification-cards-carousel" ref={carouselRef}>
          {Object.entries(classificationTypes).map(([key, type]) => (
            <ClassificatioTypeCard 
              key={key} 
              name={type.name}
              icon={type.icon}
              isSelected={selectedClassificationType?.key === key}
              onClick={() => handleSelectType(key)}
            />
          ))}
        </div>

        <button 
          className={`carousel-arrow carousel-arrow-right ${!canScrollRight ? 'disabled' : ''}`}
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          disabled={!canScrollRight}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
};
