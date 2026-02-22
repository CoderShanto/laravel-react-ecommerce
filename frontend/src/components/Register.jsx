import React, { useState } from 'react'
import Layout from './common/Layout'
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { apiUrl } from './common/http';
import { ToastContainer, toast } from 'react-toastify';

const Register = () => {

     const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
      } = useForm();

       const navigate = useNavigate()
       const [isLoading, setIsLoading] = useState(false);
       const [focusedField, setFocusedField] = useState(null);

       const onSubmit = async (data) => {
           setIsLoading(true);
           console.log(data)
           const res = await fetch(`${apiUrl}/register`,{
           method: 'POST',
           headers:{
               'Content-type' : 'application/json'
           },
           body: JSON.stringify(data)
       
         }).then(res => res.json())
         .then(result => {
           console.log(result)
       
           if(result.status == 200){
               toast.success(result.message)
               navigate('/account/login')
       
           }else{
               //toast.error(result.message)
               Object.keys(result.errors || {}).forEach((key) => {
                         toast.error(result.errors[key][0]);
                       });
           }
           setIsLoading(false);
         })
       }

  return (
     <Layout>
    <div className="adventure-register-container">
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
      <div className="register-content">
        
        {/* Glass Card */}
        <div className="glass-card">
          
          {/* Animated Header */}
          <div className="card-header">
            <div className="compass-icon">
              <svg viewBox="0 0 100 100" width="60" height="60">
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="2"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="url(#gradient)" strokeWidth="1" opacity="0.5"/>
                <polygon points="50,20 55,45 50,50 45,45" fill="url(#gradient)" className="compass-needle"/>
                <circle cx="50" cy="50" r="5" fill="#fff"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="title">Begin Your Journey</h1>
            <p className="subtitle">Create your account and explore the unknown</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="adventure-form">
            
            {/* Name Field */}
            <div className={`form-group ${focusedField === 'name' ? 'focused' : ''} ${errors.name ? 'error' : ''}`}>
              <label className="form-label">
                <span className="label-icon">👤</span>
                Adventurer Name
              </label>
              <div className="input-wrapper">
                <input
                  {...register('name',{
                      required: "Every adventurer needs a name",
                  })}
                  type="text"
                  className="glass-input"
                  placeholder="Enter your name"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
                <div className="input-glow"></div>
              </div>
              {errors.name && (
                <p className='error-message'>
                  <span>⚠️</span> {errors.name?.message}
                </p>
              )}
            </div>

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
                      required: "Create a strong passphrase"
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

              <a href="#" className="forgot-link">
                <span>🔍</span> Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button type="submit" className={`adventure-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
              <span className="button-content">
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Preparing...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    Register
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
              <p>Already have an account? <a href="/account/login" className="login-link">Sign In</a></p>
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
      .adventure-register-container {
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
      .register-content {
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

      .compass-icon {
        display: inline-block;
        margin-bottom: 15px;
        animation: rotate 20s linear infinite;
      }

      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .compass-needle {
        transform-origin: 50% 50%;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
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
        animation: rocket 2s infinite;
      }

      @keyframes rocket {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
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

      .login-link {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .login-link:hover {
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

export default Register