import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    axios.post('http://localhost:3500/login', {email, password})
    .then(result=> {console.log(result)
      if(result.data === "Success"){
        navigate('/scrape')
      }
    })
    .catch(err=> console.log(err))

    // Replace with your actual login logic (e.g., API call)
    
  };

  return (
    <div className="flex flex-col h-screen items-center justify-center flex-nowrap bgimg z-50">
      <h2 className="xl:text-4xl lg:text-3xl text-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 bg-clip-text text-transparent font-michroma font-bold mb-10 -mt-5 mx-2 z-50 ">Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Email
          </label>
          <input
            type="text"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-skyblue">
          Login
        </button>
      </form>
      <p className="mt-3">
        New user? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;
