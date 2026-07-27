import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedCustomerRoute({ children }) {
  const [authorized, setAuthorized] = useState(null); // null = loading

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("customerCareAuth");
    setAuthorized(!!isLoggedIn);
  }, []);

  if (authorized === null) {
    // Wait until we check sessionStorage
    return <div>Loading...</div>;
  }

  if (!authorized) {
    // ❌ Not logged in → redirect
    return <Navigate to="/customercare" replace />;
  }

  // ✅ Logged in → show page
  return children;
}
