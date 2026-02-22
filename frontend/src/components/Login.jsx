import React, { useContext, useState } from 'react'
import Layout from './common/Layout'
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { apiUrl } from './common/http';
import { ToastContainer, toast } from 'react-toastify';
import { AuthContext } from './context/Auth';

const Login = () => {

     const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
      } = useForm();
      
      // Get login function from your AuthContext
      const { login } = useContext(AuthContext);

       const navigate = useNavigate()
       const [isLoading, setIsLoading] = useState(false);
       const [focusedField, setFocusedField] = useState(null);

       const onSubmit = async (data) => {
           setIsLoading(true);
           console.log(data)
           
           try {
               const res = await fetch(`${apiUrl}/login`, {
                   method: 'POST',
                   headers: {
                       'Content-type': 'application/json'
                   },
                   body: JSON.stringify(data)
               });
               
               const result = await res.json();
               console.log(result)
           
               if(result.status == 200) {
                   // Create user info object
                   const userInfo = {
                       token: result.token,
                       id: result.id,
                       name: result.name,
                       email: result.email || data.email
                   }
                   
                   // Save to localStorage
                   localStorage.setItem('userInfo', JSON.stringify(userInfo));
                   
                   // Call login from context to update global state
                   login(userInfo);
                   
                   // Show success message
                   toast.success(result.message || 'Login successful!');
                   
                   // Navigate to dashboard
                   navigate('/account');
               } else {
                   toast.error(result.message || 'Login failed');
               }
           } catch (error) {
               console.error('Login error:', error);
               toast.error('An error occurred during login');
           } finally {
               setIsLoading(false);
           }
       }

  return (
     <Layout>
    <div className="adventure-login-container">
      <ToastContainer />
      
      {/* Animated Background */}
      <div className="adventure-bg">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* Main Content */}
      <div className="login-content">
        
        {/* Glass Card */}
        <div className="glass-card">
          
          {/* Animated Header */}
          <div className="card-header">
            <div className="treasure-icon">
              <svg viewBox="0 0 100 100" width="60" height="60">
                <defs>
                  <linearGradient id="treasureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="50%" stopColor="#764ba2" />
                    <stop offset="100%" stopColor="#f093fb" />
                  </linearGradient>
                </defs>
                {/* Treasure chest */}
                <rect x="25" y="45" width="50" height="35" rx="3" fill="url(#treasureGradient)" opacity="0.3"/>
                <rect x="25" y="50" width="50" height="30" rx="3" fill="none" stroke="url(#treasureGradient)" strokeWidth="2"/>
                {/* Chest lid */}
                <path d="M 25 50 Q 50 30 75 50" fill="none" stroke="url(#treasureGradient)" strokeWidth="2" className="chest-lid"/>
                <path d="M 25 50 Q 50 35 75 50" fill="url(#treasureGradient)" opacity="0.2"/>
                {/* Lock */}
                <circle cx="50" cy="60" r="5" fill="url(#treasureGradient)" className="lock-pulse"/>
                <rect x="48" y="60" width="4" height="8" fill="url(#treasureGradient)"/>
                {/* Sparkles */}
                <circle cx="20" cy="35" r="2" fill="#fff" className="sparkle sparkle-1"/>
                <circle cx="80" cy="40" r="2" fill="#fff" className="sparkle sparkle-2"/>
                <circle cx="50" cy="25" r="1.5" fill="#fff" className="sparkle sparkle-3"/>
              </svg>
            </div>
            <h1 className="title">Welcome Back</h1>
            <p className="subtitle">Continue your adventure where you left off</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="adventure-form">
            
            {/* Email Field */}
            <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${errors.email ? 'error' : ''}`}>
              <label className="form-label">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  {...register('email',{
                      required: "The email field is required",
                      pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                      } 
                  })}
                  type="email"
                  className="glass-input"
                  placeholder="your@email.com"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                <div className="input-glow"></div>
              </div>
              {errors.email && (
                <p className='error-message'>
                  <span>⚠️</span> {errors.email?.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${errors.password ? 'error' : ''}`}>
              <label className="form-label">
                <span className="label-icon">🔐</span>
                Password
              </label>
              <div className="input-wrapper">
                <input
                  {...register("password",{
                      required: "Enter your password"
                  })}
                  type="password"
                  className="glass-input"
                  placeholder="Enter your password"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <div className="input-glow"></div>
              </div>
              {errors.password && (
                <p className='error-message'>
                  <span>⚠️</span> {errors.password?.message}
                </p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" id="remember" />
                <span className="checkmark"></span>
                <span className="checkbox-label">Remember me</span>
              </label>

              <a href="/account/forgot-password" className="forgot-link">
                <span>🔍</span> Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button type="submit" className={`adventure-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
              <span className="button-content">
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Entering...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🗝️</span>
                    Enter
                    <span className="button-arrow">→</span>
                  </>
                )}
              </span>
              <div className="button-particles">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>

            {/* Footer Link */}
            <div className="form-footer">
              <p>Don't have an account? <a href="/account/register" className="register-link">Start Your Journey</a></p>
            </div>

          </form>
        </div>

        {/* Side Decorations */}
        <div className="side-decor left">
          <div className="glow-line"></div>
        </div>
        <div className="side-decor right">
          <div className="glow-line"></div>
        </div>
        
      </div>
    </div>

    <style jsx>{`
      .adventure-login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
        padding: 20px;
      }

      /* Animated Background */
      .adventure-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .floating-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        opacity: 0.3;
        animation: float 20s infinite ease-in-out;
      }

      .orb-1 {
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, #667eea 0%, transparent 70%);
        top: -100px;
        left: -100px;
        animation-delay: 0s;
      }

      .orb-2 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, #764ba2 0%, transparent 70%);
        bottom: -150px;
        right: -150px;
        animation-delay: 5s;
      }

      .orb-3 {
        width: 250px;
        height: 250px;
        background: radial-gradient(circle, #f093fb 0%, transparent 70%);
        top: 50%;
        left: 50%;
        animation-delay: 10s;
      }

      @keyframes float {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(50px, -50px) scale(1.1); }
        50% { transform: translate(-30px, 30px) scale(0.9); }
        75% { transform: translate(30px, 50px) scale(1.05); }
      }

      /* Stars */
      .stars, .stars2, .stars3 {
        position: absolute;
        width: 100%;
        height: 100%;
        background: transparent;
      }

      .stars {
        background-image: 
          radial-gradient(2px 2px at 20px 30px, #eee, transparent),
          radial-gradient(2px 2px at 60px 70px, #fff, transparent),
          radial-gradient(1px 1px at 50px 50px, #ddd, transparent),
          radial-gradient(1px 1px at 130px 80px, #fff, transparent),
          radial-gradient(2px 2px at 90px 10px, #eee, transparent);
        background-size: 200px 200px;
        animation: twinkle 5s infinite;
      }

      .stars2 {
        background-image: 
          radial-gradient(1px 1px at 100px 120px, #fff, transparent),
          radial-gradient(1px 1px at 150px 160px, #ddd, transparent);
        background-size: 250px 250px;
        animation: twinkle 7s infinite;
      }

      .stars3 {
        background-image: 
          radial-gradient(1px 1px at 75px 90px, #eee, transparent),
          radial-gradient(2px 2px at 180px 30px, #fff, transparent);
        background-size: 300px 300px;
        animation: twinkle 9s infinite;
      }

      @keyframes twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }

      /* Main Content */
      .login-content {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 480px;
        animation: slideUp 0.8s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(50px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Glass Card */
      .glass-card {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 40px 35px;
        box-shadow: 
          0 8px 32px 0 rgba(31, 38, 135, 0.37),
          inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
        transition: all 0.4s ease;
      }

      .glass-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        animation: shimmer 3s infinite;
      }

      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }

      /* Header */
      .card-header {
        text-align: center;
        margin-bottom: 35px;
        animation: fadeIn 1s ease-out 0.3s both;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .treasure-icon {
        display: inline-block;
        margin-bottom: 15px;
      }

      .chest-lid {
        animation: chestOpen 3s ease-in-out infinite;
      }

      @keyframes chestOpen {
        0%, 100% { 
          d: path('M 25 50 Q 50 30 75 50');
        }
        50% { 
          d: path('M 25 50 Q 50 25 75 50');
        }
      }

      .lock-pulse {
        animation: lockGlow 2s ease-in-out infinite;
      }

      @keyframes lockGlow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; filter: drop-shadow(0 0 8px #667eea); }
      }

      .sparkle {
        animation: sparkleAnim 2s ease-in-out infinite;
      }

      .sparkle-1 { animation-delay: 0s; }
      .sparkle-2 { animation-delay: 0.6s; }
      .sparkle-3 { animation-delay: 1.2s; }

      @keyframes sparkleAnim {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1.5); }
      }

      .title {
        font-size: 32px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 10px 0;
        letter-spacing: -0.5px;
      }

      .subtitle {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        margin: 0;
      }

      /* Form */
      .adventure-form {
        animation: fadeIn 1s ease-out 0.5s both;
      }

      .form-group {
        margin-bottom: 25px;
        position: relative;
      }

      .form-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 10px;
        transition: all 0.3s ease;
      }

      .label-icon {
        font-size: 18px;
        animation: bounce 2s infinite;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      .form-group.focused .form-label {
        color: #667eea;
      }

      .input-wrapper {
        position: relative;
      }

      .glass-input {
        width: 100%;
        padding: 14px 18px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #fff;
        font-size: 15px;
        transition: all 0.3s ease;
        outline: none;
      }

      .glass-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .glass-input:focus {
        background: rgba(255, 255, 255, 0.08);
        border-color: #667eea;
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
      }

      .input-glow {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 12px;
        opacity: 0;
        background: linear-gradient(135deg, #667eea, #764ba2);
        filter: blur(20px);
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: -1;
      }

      .form-group.focused .input-glow {
        opacity: 0.3;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #ff6b6b;
        font-size: 13px;
        margin-top: 8px;
        animation: shake 0.5s ease;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      .form-group.error .glass-input {
        border-color: #ff6b6b;
      }

      /* Form Options */
      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
      }

      .checkbox-container {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
      }

      .checkbox-container input[type="checkbox"] {
        display: none;
      }

      .checkmark {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        position: relative;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.05);
      }

      .checkbox-container input[type="checkbox"]:checked + .checkmark {
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-color: #667eea;
      }

      .checkbox-container input[type="checkbox"]:checked + .checkmark::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-size: 14px;
        font-weight: bold;
      }

      .checkbox-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
      }

      .forgot-link {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #667eea;
        text-decoration: none;
        font-size: 14px;
        transition: all 0.3s ease;
      }

      .forgot-link:hover {
        color: #764ba2;
        gap: 8px;
      }

      /* Adventure Button */
      .adventure-button {
        width: 100%;
        padding: 16px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 12px;
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      }

      .adventure-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
      }

      .adventure-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .adventure-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .button-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        position: relative;
        z-index: 2;
      }

      .button-icon {
        font-size: 20px;
        animation: keyTurn 2s infinite;
      }

      @keyframes keyTurn {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-15deg); }
        75% { transform: rotate(15deg); }
      }

      .button-arrow {
        transition: transform 0.3s ease;
      }

      .adventure-button:hover .button-arrow {
        transform: translateX(5px);
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .button-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .button-particles span {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        animation: particle 3s infinite;
      }

      .button-particles span:nth-child(1) { left: 10%; animation-delay: 0s; }
      .button-particles span:nth-child(2) { left: 30%; animation-delay: 0.5s; }
      .button-particles span:nth-child(3) { left: 50%; animation-delay: 1s; }
      .button-particles span:nth-child(4) { left: 70%; animation-delay: 1.5s; }

      @keyframes particle {
        0% {
          transform: translateY(100%);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: translateY(-100%);
          opacity: 0;
        }
      }

      /* Form Footer */
      .form-footer {
        text-align: center;
        margin-top: 25px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .form-footer p {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        margin: 0;
      }

      .register-link {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .register-link:hover {
        color: #764ba2;
        text-decoration: underline;
      }

      /* Side Decorations */
      .side-decor {
        position: absolute;
        top: 0;
        height: 100%;
        width: 2px;
        opacity: 0.5;
      }

      .side-decor.left { left: -50px; }
      .side-decor.right { right: -50px; }

      .glow-line {
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, transparent, #667eea, #764ba2, transparent);
        animation: glow 3s ease-in-out infinite;
      }

      @keyframes glow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }

      /* Responsive */
      @media (max-width: 640px) {
        .glass-card {
          padding: 30px 25px;
        }

        .title {
          font-size: 26px;
        }

        .subtitle {
          font-size: 13px;
        }

        .form-options {
          flex-direction: column;
          gap: 15px;
          align-items: flex-start;
        }

        .side-decor {
          display: none;
        }
      }
    `}</style>
    </Layout>
  )
}

export default Login