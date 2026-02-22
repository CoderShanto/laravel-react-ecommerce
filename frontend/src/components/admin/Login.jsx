import React, { useContext } from "react";
import Layout from "../common/Layout";
import { useForm } from "react-hook-form";
import { apiUrl } from "../common/http";
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import { AdminAuthContext } from "../context/AdminAuth";

const Login = () => {

  const {login} = useContext(AdminAuthContext)

     const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate()

  const onSubmit = async (data) => {
    console.log(data)
    const res = await fetch(`${apiUrl}/admin/login`,{
    method: 'POST',
    headers:{
        'Content-type' : 'application/json'
    },
    body: JSON.stringify(data)

  }).then(res => res.json())
  .then(result => {
    console.log(result)

    if(result.status == 200){
        
        const adminInfo = {
            token: result.token,
            id: result.id,
            name: result.name
        }
        localStorage.setItem('adminInfo',JSON.stringify(adminInfo))
        login(adminInfo)
        navigate('/admin/dashboard')

    }else{
        toast.error(result.message)
    }
  })
}

  return (
    <Layout>
      <div className="admin-login-page">
        <div className="container">
          <div className="row justify-content-center align-items-center min-vh-100">
            <div className="col-md-6 col-lg-5 col-xl-4">
              <div className="login-card shadow-sm">
                {/* Header */}
                <div className="login-header text-center mb-4">
                  <h1>Admin Login</h1>
                  <p>Sign in to manage the store</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label className="form-label">Email address</label>
                    <input
                    {
                        ...register('email',{
                            required: "The email field is required",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address"
                            } 
                        })
                    }
                      type="email"
                      className={`form-control ${errors.email && 'is-invalid'}`}
                      placeholder="admin@example.com"
                      
                    />
                    {
                        errors.email && <p className='invalid-feedback'>{errors.email?.message}</p>
                    }
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                    {
                        ...register("password",{
                            required: "The password field is required"
                        })
                    }
                      type="password"
                      className={`form-control ${errors.password && 'is-invalid'}`}
                      placeholder="Enter password"
                      
                    />
                    {
                        errors.password && <p className='invalid-feedback'>{errors.password?.message}</p>
                    }
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="remember"
                      />
                      <label className="form-check-label" htmlFor="remember">
                        Remember me
                      </label>
                    </div>

                    <a href="#" className="forgot-link">
                      Forgot password?
                    </a>
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    Login
                  </button>
                </form>

                {/* Footer */}
                <div className="login-footer text-center mt-4">
                  <small>Restricted area • Admin only</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
