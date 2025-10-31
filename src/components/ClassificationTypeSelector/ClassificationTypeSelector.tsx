import React, { useRef, useState, useEffect, useCallback } from "react";
import { classificationTypes } from "../../constants/classificationTypes";
import ClassificatioTypeCard from "../core/ClassificationTypeCrad/ClassificatioTypeCard";
import { useFileUpload } from "../../contexts/FileUploadContext";
import "./ClassificationTypeSelector.css";

export const ClassificationTypeSelector = () => {
  const { selectedClassificationType, setSelectedClassificationType } = useFileUpload();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  const handleSelectType = useCallback((key: string) => {
    // Prevent selecting the same type multiple times rapidly
    if (selectedClassificationType?.key === key) {
      return;
    }
    
    const selectedType = {
      key,
      ...classificationTypes[key]
    };
    setSelectedClassificationType(selectedType);
    // Logging disabled for performance
  }, [selectedClassificationType]);

  // Use refs to store stable function references
  const checkScrollButtonsRef = useRef<(() => void) | null>(null);
  const throttledCheckScrollButtonsRef = useRef<(() => void) | null>(null);

  // Initialize the check function once
  checkScrollButtonsRef.current = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      // Add small threshold to prevent flickering at boundaries
      const threshold = 1;
      const newCanScrollLeft = scrollLeft > threshold;
      const newCanScrollRight = scrollLeft < scrollWidth - clientWidth - threshold;
      
      // Only update state if values actually changed to prevent unnecessary re-renders
      setCanScrollLeft(prev => prev !== newCanScrollLeft ? newCanScrollLeft : prev);
      setCanScrollRight(prev => prev !== newCanScrollRight ? newCanScrollRight : prev);
    }
  };

  // Initialize throttled function
  throttledCheckScrollButtonsRef.current = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      if (checkScrollButtonsRef.current) {
        checkScrollButtonsRef.current();
      }
    }, 150);
  };

  useEffect(() => {
    // Wait for DOM to be ready before checking scroll buttons
    const timer = setTimeout(() => {
      if (checkScrollButtonsRef.current) {
        checkScrollButtonsRef.current();
      }
    }, 200);
    
    const carousel = carouselRef.current;
    const throttledHandler = () => {
      if (throttledCheckScrollButtonsRef.current) {
        throttledCheckScrollButtonsRef.current();
      }
    };
    
    if (carousel) {
      carousel.addEventListener('scroll', throttledHandler, { passive: true });
      window.addEventListener('resize', throttledHandler);
    }
    
    return () => {
      clearTimeout(timer);
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      if (carousel) {
        carousel.removeEventListener('scroll', throttledHandler);
      }
      window.removeEventListener('resize', throttledHandler);
    };
  }, []); // Empty dependency array - only run on mount/unmount

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
