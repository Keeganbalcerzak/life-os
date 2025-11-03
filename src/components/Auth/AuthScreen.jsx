import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset'

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {/* Left side - Branding */}
        <motion.div
          className="auth-branding"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <motion.h1
            className="auth-logo"
            animate={{
              textShadow: [
                '0 0 20px rgba(147, 51, 234, 0.5)',
                '0 0 30px rgba(6, 182, 212, 0.7)',
                '0 0 20px rgba(147, 51, 234, 0.5)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Life OS
          </motion.h1>
          <p className="auth-tagline">Your all-in-one life management platform</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">✓</span>
              <span>Organize your tasks with magic</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">✓</span>
              <span>Track your progress & achievements</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">✓</span>
              <span>Sync across all your devices</span>
            </div>
          </div>
        </motion.div>

        {/* Right side - Auth forms */}
        <motion.div
          className="auth-forms-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <LoginForm
                key="login"
                onToggleMode={setMode}
              />
            )}
            {mode === 'signup' && (
              <SignUpForm
                key="signup"
                onToggleMode={setMode}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

