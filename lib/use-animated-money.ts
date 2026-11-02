import React, { useState, useEffect } from 'react';

export const useAnimatedMoney = (targetValue: number, intervalMs: number = 200) => {
  const [currentValue, setCurrentValue] = useState(targetValue);

  useEffect(() => {
    if (targetValue === currentValue) return;

    const diff = targetValue - currentValue;
    const step = Math.sign(diff); // Always one-by-one

    const timer = setTimeout(() => {
      setCurrentValue(prev => prev + step);
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [targetValue, currentValue, intervalMs]);

  return currentValue;
};
