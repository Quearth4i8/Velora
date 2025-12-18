'use client';

import { useState, useEffect, useRef } from 'react';

const BLUR_STORAGE_KEY = 'blurNSFW';

export function useBlurNSFW() {
  const [blurNSFW, setBlurNSFW] = useState<boolean>(false);
  const isFirstEffectRun = useRef(true);

  // Initialize from localStorage on client side
  useEffect(() => {
    const savedBlurNSFW = localStorage.getItem(BLUR_STORAGE_KEY);
    if (savedBlurNSFW !== null) {
      try {
        setBlurNSFW(JSON.parse(savedBlurNSFW));
      } catch {
        setBlurNSFW(false);
      }
    }
  }, []);

  // Save to localStorage whenever blurNSFW changes
  useEffect(() => {
    if (isFirstEffectRun.current) {
      isFirstEffectRun.current = false;
      return;
    }

    localStorage.setItem(BLUR_STORAGE_KEY, JSON.stringify(blurNSFW));
  }, [blurNSFW]);

  const toggleBlurNSFW = () => {
    setBlurNSFW(prev => !prev);
  };

  return {
    blurNSFW,
    setBlurNSFW,
    toggleBlurNSFW
  };
}
