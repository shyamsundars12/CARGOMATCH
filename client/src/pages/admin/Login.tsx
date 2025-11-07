import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../config/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 🚀 Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('adminToken')) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // ✅ Save Admin token for AdminProtectedRoute
      localStorage.setItem('adminToken', data.token);

      // 🚀 Redirect to dashboard
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f6f8',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          width: 350,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Admin Login</h2>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <input
          style={{
            width: '100%',
            marginBottom: 16,
            padding: 12,
            borderRadius: 4,
            border: '1px solid #ddd',
          }}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={{
            width: '100%',
            marginBottom: 24,
            padding: 12,
            borderRadius: 4,
            border: '1px solid #ddd',
          }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          style={{
            width: '100%',
            background: '#2563eb',
            color: '#fff',
            padding: 12,
            borderRadius: 4,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
          type="submit"
        >
          Login
        </button>
      </form>
    </div>
  );
}
