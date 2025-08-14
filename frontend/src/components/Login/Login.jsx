// LoginForm.js
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from "react-router";
import './Login.css'

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Replace this with real login logic
    navigate("/dashboard");
  };

  return (
    <div className="container mt-11 Login" style={{ maxWidth: '400px' }}>
      <h3 className="mb-4 text-center">Login</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email address</label>
          <input
            type="email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <p>Not a member yet? Signup 
          <Link to="/signup" >
            &nbsp;here
          </Link>
        </p>
        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>
    </div>
  );
};

export default LoginForm;
