import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

const DEMO_ACCOUNTS = [
  { role: 'Sales Executive', name: 'Arjun Shah', email: 'arjun.shah@thinqloud.demo', pass: 'Exec@2026' },
  { role: 'Sales Manager', name: 'Priya Mehta', email: 'priya.mehta@thinqloud.demo', pass: 'Manager@2026' },
  { role: 'Administrator', name: 'Admin User', email: 'admin@thinqloud.demo', pass: 'Admin@2026' },
];

export function Login() {
  const [email, setEmail] = useState('arjun.shah@thinqloud.demo');
  const [password, setPassword] = useState('Exec@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#2B5FAD] text-white rounded-[8px] flex items-center justify-center mx-auto text-xl font-bold mb-3">
            TQ
          </div>
          <h2 className="text-xl font-bold text-[#1A2E4A]">Small Business Sales Manager</h2>
          <p className="text-xs text-[#6B7C93] mt-1">Thinqloud Campus Assessment · Topic #2</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] text-xs text-[#EF4444] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" isLoading={loading}>
            Sign In to CRM
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#D1D9E6]">
          <p className="text-xs font-semibold text-[#1F2937] mb-2">1-Click Demo Accounts:</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => selectDemoAccount(acc)}
                className={`w-full text-left p-2 rounded-[6px] border text-xs flex justify-between items-center transition-colors ${
                  email === acc.email
                    ? 'border-[#2B5FAD] bg-[#EFF6FF]'
                    : 'border-[#D1D9E6] hover:bg-[#EEF2F7]'
                }`}
              >
                <div>
                  <span className="font-semibold text-[#1A2E4A]">{acc.name}</span>
                  <span className="text-[#6B7C93] ml-1.5">({acc.role})</span>
                </div>
                <span className="text-[10px] font-mono text-[#2B5FAD]">Select</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
