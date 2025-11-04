import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import TagPreferences from '../components/TagPreferences';

export default function TagSettings({ tasks, tagPrefs, onChange, onBack }) {
  const [toast, setToast] = useState(null);

  const handleSave = useCallback((prefs) => {
    onChange?.(prefs);
    setToast('Tag styles saved');
    setTimeout(() => setToast(null), 2200);
  }, [onChange]);

  return (
    <div className="app">
      <div className="app-content">
        <Motion.div
          className="settings-page"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Motion.button 
            className="back-button" 
            type="button" 
            onClick={() => onBack?.()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </Motion.button>
          <h1 className="settings-title">Tag Settings</h1>
          <p className="settings-subtitle">Customize colors and icons for your tags</p>

          <div className="settings-card">
            <TagPreferences tasks={tasks} value={tagPrefs} onChange={handleSave} alwaysOpen />
          </div>
        </Motion.div>

        {/* Toast */}
        <div className="toast-container">
          <AnimatePresence>
            {toast && (
              <Motion.div
                key="toast"
                className="toast-item"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
              >
                {toast}
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
