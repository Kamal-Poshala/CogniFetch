import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthProvider"; // Import AuthContext
import toast from "react-hot-toast";

function Login() {
  const { login, setUsr, userdata } = useAuth(); // Use login function and state from AuthContext

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Replace with actual login logic using your backend API call
    try {
      const response = await login({ username, password });
      if (response.success) {
        toast.success("Login Successful!");
        setUsr(response.data); // Set user data in AuthContext
        navigate("/profile"); // Redirect to profile page
      } else {
        toast.error(response.message); // Display error message from API
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("An error occurred. Please try again."); // More generic error message for user
    }
  };

  return (
    <div className="container mx-auto mt-10">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </form>
      <p className="mt-3">
        New User? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
}

export default Login;
