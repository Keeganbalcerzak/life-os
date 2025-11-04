import { useState } from 'react';

/**
 * Custom hook for localStorage persistence
 * Automatically saves and loads data from localStorage
 * Handles Date objects by converting to ISO strings
 */
export function useLocalStorage(key, initialValue) {
  // Helper function to convert date strings back to Date objects
  const reviveDates = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => reviveDates(item));
    }
    
    const revived = {};
    for (const [k, v] of Object.entries(obj)) {
      // Check if this looks like a date field and is an ISO string
      if ((k === 'createdAt' || k === 'completedAt') && typeof v === 'string') {
        const date = new Date(v);
        revived[k] = isNaN(date.getTime()) ? v : date;
      } else if (typeof v === 'object' && v !== null) {
        revived[k] = reviveDates(v);
      } else {
        revived[k] = v;
      }
    }
    return revived;
  };

  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsed = JSON.parse(item);
      // Revive date objects
      return reviveDates(parsed);
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      // If corrupted, clear it and return initial value
      try {
        window.localStorage.removeItem(key);
      } catch (removeError) {
        console.error(`Error clearing corrupted localStorage key ${key}:`, removeError);
      }
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (valueOrUpdater) => {
    setStoredValue((previousValue) => {
      const nextValue = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(previousValue)
        : valueOrUpdater;

      try {
        const serialized = JSON.stringify(nextValue, (k, val) => {
          if (val instanceof Date) {
            return val.toISOString();
          }
          return val;
        });
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialized);
        }
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }

      return nextValue;
    });
  };

  return [storedValue, setValue];
}
