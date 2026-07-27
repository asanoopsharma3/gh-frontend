"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function CustomerCare() {
  const [username, setusername] = useState("");
  const [password, setpassword] = useState("");
  const navigate = useNavigate();

  const onsubmitHandler = (e) => {
    e.preventDefault();
     if (username === "admin" && password === "MTN@2025") {
      console.log(username, password);
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Customer care access granted.",
        timer: 1400,
        showConfirmButton: false,
      });

      // ✅ Save login status
      sessionStorage.setItem("customerCareAuth", "true");

      setpassword("");
      setusername("");
      navigate("/searchnumber");
    }
     else{
        Swal.fire({
          icon: "error",
          title: "Invalid Login",
          text: "Please enter valid username and password.",
          confirmButtonColor: "#1683f5",
        });
        console.log(username,password);
     }
   
   
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-screen text-center text-white px-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/banner.png')", 
      }}
    >
      
      <div className="absolute inset-0 "></div>

    
      <div className="relative z-10 data-form w-full max-w-xs md:max-w-md bg-gray-800/90 p-6 rounded-xl shadow-lg backdrop-blur-sm">
        
        <h4 className="text-2xl font-semibold mb-4 text-teal-400">SIGN IN</h4>

        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setusername(e.target.value)}
          className="w-full p-3 mb-3 rounded-md outline-none bg-gray-700 text-white placeholder-gray-400 focus:ring-2  "
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setpassword(e.target.value)}
          className="w-full p-3 mb-3 rounded-md outline-none bg-gray-700 text-white placeholder-gray-400 focus:ring-2  transition-all"
        />

        
       
        <button
          className="primary w-full"
         
         onClick={onsubmitHandler}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
