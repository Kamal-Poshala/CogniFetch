import React from "react";
import { useState, useRef, useEffect, useContext} from "react";
import 'bootstrap/dist/css/bootstrap.min.css'
//import Login from "./Components/Loginx";
import Footer from "./Components/Footer";
import Header from "./Components/Header";
import Profile from "./Components/Profile"; 
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Layout from "./Components/Layout";
import Scrape from "./Components/Scrape";
import Invalid from "./Components/Invalid";
import Home from "./Components/Home";
import ResultsX from "./Components/ResultsX";
import Loading from "./Components/Loading";
import Instruct from "./Components/Instruct";
import Login from "./Components/Login";
import Register from "./Components/Register"; // Import your register component

function App() {
  const [resdata, setResdata] = useState(null);

  return (
    <>
      <Header />
      <React.Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="instructions" element={<Instruct />} />
            <Route path="profile" element={<Profile />} />
            <Route 
              path="scrape"
              element={<Scrape setResdata={setResdata} resdata={resdata} />}
            />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="results/:subject" element={<ResultsX list={resdata} />} />
          </Route>
          <Route path="*" element={<Invalid />} />
        </Routes>
      </React.Suspense>
      <Footer />
    </>
  );
}

export default App;

/*import React, { useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import Login from "./Login"; // Import your Login component
import Header from "./Header"; // Import your Header component
import Profile from "./Profile"; // Import your Profile component (assuming you have one)
import { useAuth } from "../Context/AuthProvider"; // Import your authentication context

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem("user")); // Check initial login state
  const { usr } = useContext(useAuth); // Access user information from context

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <>
      <Header /> {/* Render the header component *//*} 
      {isLoggedIn ? (
        <Profile username={usr} /> // Display Profile component if logged in
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} /> // Render Login component if not logged in
      )}
    </>
  );
}

export default App;  

*/
