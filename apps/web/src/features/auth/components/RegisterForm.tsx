import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../hooks/useAuth';
import { getRoleHomePath } from '../utils/get-role-home-path';

export function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true); setError(null);
    try {
      const user = await register({ fullName, email, password });
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) setError('Email already registered');
      else if (caught instanceof ApiError && caught.status === 400) setError('Invalid data, please check your inputs');
      else setError('Something went wrong, please try again');
    } finally { setIsSubmitting(false); }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="tf">
        <label htmlFor="fullName">Full Name</label>
        <input type="text" id="fullName" placeholder="Ahmed Mohamed" autoComplete="name" required minLength={3}
          value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="tf">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" placeholder="name@example.com" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="tf">
        <label htmlFor="password">Password</label>
        <input type="password" id="password" placeholder="********" autoComplete="new-password" required minLength={8}
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <span className="error-text" role="alert">{error}</span>}
      </div>
      <button className="btn big" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}
