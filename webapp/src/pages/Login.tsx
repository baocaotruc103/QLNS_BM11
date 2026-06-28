import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('ten_dang_nhap', username)
        .eq('mat_khau', password)
        .maybeSingle();

      if (error) {
        setError('Có lỗi xảy ra khi kết nối dữ liệu.');
      } else if (data) {
        onLogin(data);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{ marginBottom: '2rem' }}>
          {/* Logo - The user provided this link which seems to be the screenshot itself, but we will use it as requested */}
          <img 
            src="https://i.postimg.cc/kGcDh50v/screenshot-1782573313.png" 
            alt="Logo" 
            style={{ 
              height: '80px', 
              width: '80px', 
              objectFit: 'cover', 
              objectPosition: 'center top',
              borderRadius: '50%',
              marginBottom: '1rem'
            }} 
          />
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '800', 
            color: '#1e293b', 
            textTransform: 'uppercase',
            lineHeight: '1.4',
            margin: '0'
          }}>
            Hệ thống quản lý<br/>Hồ sơ nhân sự
          </h1>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div>
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: '#f1f5f9',
                border: '1px solid transparent',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#334155',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: '#f1f5f9',
                border: '1px solid transparent',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#334155',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.875rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Đang xử lý...' : (
              <>
                <LogIn size={18} />
                Đăng Nhập
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
