import React from 'react';
import './resources/css/Header.css';

// Function that creates the header in the landing page
function Header() {
  // Creates a simple header under the "Header Div"
  return (
    <div className="Header"> 
      <header className="landing-header">
        <h1>Secret Sagehen Resistance!</h1>
      </header>
    </div>
  );
}
export default Header;
