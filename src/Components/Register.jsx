import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    axios.post('http://localhost:3500/register', { username, email, password }).then(result => console.log(result))
      .catch(err => console.log(err))
    // Replace with your actual registration logic (e.g., API call)
    if (username && email && password) {
      // Registration successful, redirect to login page
      alert("Registration successful! Please log in.");
      navigate("/login");
    } else {
      alert("Please fill in all required fields.");
    }
  };

  return (
    /*  <div className="container mx-auto mt-10">
      <h2 className="text-orange-600 font-bold">Register</h2> 
      <form onSubmit={handleSubmit} className="bg-pink-200 rounded-lg p-4">  */
    <div className="flex flex-col h-screen items-center justify-center flex-nowrap bgimg z-50">
      <h2 className="xl:text-4xl lg:text-3xl text-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 bg-clip-text text-transparent font-michroma font-bold mb-10 -mt-5 mx-2 z-50 "> Register </h2>
      <form onSubmit={handleSubmit} className="bg-pink-200 rounded-lg p-4">
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
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
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600">
        Already have an account? <Link to="/login" className="text-orange-600 hover:underline">Login</Link>
      </p>
    </div>
  );
}

export default Register;
