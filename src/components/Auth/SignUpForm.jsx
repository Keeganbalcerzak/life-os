import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpForm({ onToggleMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        className="auth-success"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2>Check your email!</h2>
        <p>We've sent a confirmation link to {email}</p>
        <p className="auth-success-note">
          Click the link to verify your account, then come back to sign in.
        </p>
        <button
          className="auth-link-button"
          onClick={() => onToggleMode('login')}
        >
          Back to Sign In
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      className="auth-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2>Start Your Journey</h2>
      <p className="auth-subtitle">Create your Life OS account</p>

      {error && (
        <motion.div
          className="auth-error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {error}
        </motion.div>
      )}

      <div className="auth-input-group">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-input-group">
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
          autoComplete="new-password"
          minLength={6}
        />
      </div>

      <div className="auth-input-group">
        <label htmlFor="signup-confirm">Confirm Password</label>
        <input
          id="signup-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
          autoComplete="new-password"
          minLength={6}
        />
      </div>

      <motion.button
        type="submit"
        className="auth-submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </motion.button>

      <div className="auth-footer">
        <button
          type="button"
          className="auth-link"
          onClick={() => onToggleMode('login')}
        >
          Already have an account? Sign in
        </button>
      </div>
    </motion.form>
  );
}

