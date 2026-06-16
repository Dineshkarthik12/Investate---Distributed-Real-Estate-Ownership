import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { UserRole } from '@landconnect/shared';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get('role') as UserRole) || 'investor';
  
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/auth/register', { 
        email, 
        password, 
        full_name: fullName, 
        role 
      });
      
      if (data.success) {
        setAuth(data.data.user, data.data.accessToken);
        // Direct new users to dashboard to complete KYC
        navigate('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full space-y-8 glass p-10 rounded-2xl relative z-10">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-dark-900">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-dark-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          {/* Role Selection */}
          <div>
            <label className="label mb-2">I want to...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('investor')}
                className={`py-3 px-4 rounded-lg border font-medium text-sm transition-all ${
                  role === 'investor' 
                    ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' 
                    : 'bg-white border-gray-200 text-dark-600 hover:border-primary-300'
                }`}
              >
                Invest Capital
              </button>
              <button
                type="button"
                onClick={() => setRole('landowner')}
                className={`py-3 px-4 rounded-lg border font-medium text-sm transition-all ${
                  role === 'landowner' 
                    ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' 
                    : 'bg-white border-gray-200 text-dark-600 hover:border-primary-300'
                }`}
              >
                List Property
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="input-field"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input-field"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center py-3 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Create Account <ArrowRight className="ml-2" size={20} /></>}
            </button>
          </div>
          <p className="text-xs text-center text-dark-500 mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
};
