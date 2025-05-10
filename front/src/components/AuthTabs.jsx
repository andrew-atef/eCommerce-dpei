import React from 'react';

export default function AuthTabs({ isLogin, setIsLogin, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <ul className="nav nav-tabs card-header-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
              type="button"
              aria-pressed={isLogin}
            >
              Login
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
              type="button"
              aria-pressed={!isLogin}
            >
              Register
            </button>
          </li>
        </ul>
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}