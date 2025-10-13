import React, { useState, useEffect } from "react"; // Use useEffect for fetching data

function Profilex() {
  const [userData, setUserData] = useState({}); // State to store user data
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // Track login status

  useEffect(() => {
    // Check if user is logged in (replace with your logic)
    const isLoggedInFromStorage = localStorage.getItem("isLoggedIn"); // Example using localStorage
    setIsLoggedIn(isLoggedInFromStorage === "true");

    // Fetch user data based on login status (optional)
    if (isLoggedIn) {
      // Replace with your logic to fetch user data (e.g., API call)
      setUserData({ username: "Example User", email: "example@email.com" });
    }
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className="container mx-auto mt-10">
      {isLoggedIn ? (
        <>
          <h2>Profile</h2>
          <p>Username: {userData.username}</p>
          <p>Email: {userData.email}</p>
          {/* Add other profile details if needed */}
        </>
      ) : (
        <p>Please log in to access your profile.</p>
      )}
    </div>
  );
}

export default Profilex;
