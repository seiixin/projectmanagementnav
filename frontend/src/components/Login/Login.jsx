// LoginForm.js
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../lib/axios.js";
import './Login.css'

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/user/login", form);
      localStorage.setItem("token", res.data.token);
      if(res.data.result === 0) alert(res.data.message);
      navigate("/dashboard");
      window.location = "/dashboard"; 
      console.log('login')
    } catch (err) {
      alert(err.response.data.error);
    }
  };
    


  return (
    <div className="container mt-11 Login" style={{ maxWidth: '400px' }}>
      <h3 className="mb-4 text-center">Login</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Username</label>
          <input
            type="username"
            className="form-control"
            required
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </div>
        
        <button type="submit" className="btn btn-primary w-100">Login</button><br/><br/>
        <p>Not a member yet? Signup 
          <Link to="/signup" >
            &nbsp;here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
