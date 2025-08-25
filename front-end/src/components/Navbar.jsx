import React from "react";
import "../Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">MyApp</div>
      <div className="nav-links">
        <button>Home</button>
        <button>About</button>
      </div>
    </nav>
  );
};

export default Navbar;
