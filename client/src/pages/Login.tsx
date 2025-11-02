import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/lsp/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token); // ✅ Save LSP token
      localStorage.removeItem('adminToken');
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', width: 350 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>LSP Login</h2>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <input
          style={{ width: '100%', marginBottom: 16, padding: 12, borderRadius: 4, border: '1px solid #ddd' }}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          style={{ width: '100%', marginBottom: 24, padding: 12, borderRadius: 4, border: '1px solid #ddd' }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          style={{ width: '100%', background: '#2563eb', color: '#fff', padding: 12, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          type="submit"
        >
          Login
        </button>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          Don't have an account? <span style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => navigate('/register')}>Register</span>
        </div>
      </form>
    </div>
  );
}
