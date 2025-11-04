import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginForm({ onToggleMode, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Navigation handled by auth context
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.form
      className="auth-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2>Welcome Back</h2>
      <p className="auth-subtitle">Sign in to continue your journey</p>

      {error && (
        <Motion.div
          className="auth-error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {error}
        </Motion.div>
      )}

      <div className="auth-input-group">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-input-group">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      <Motion.button
        type="submit"
        className="auth-submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Motion.button>

      <div className="auth-footer">
        <button
          type="button"
          className="auth-link"
          onClick={() => onToggleMode('reset')}
        >
          Forgot password?
        </button>
        <span className="auth-divider">•</span>
        <button
          type="button"
          className="auth-link"
          onClick={() => onToggleMode('signup')}
        >
          Create account
        </button>
      </div>
    </Motion.form>
  );
}

