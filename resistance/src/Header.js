import React from 'react';
import './resources/css/Header.css';
import { Link } from 'react-router-dom';

// Function that creates the header in the landing page
function Header() {
  // Creates a simple header under the "Header Div"
  return (
    <div className="Header"> 
      <Link to ="/">
      <header className="landing-header">
          <h1>Secret Sagehen Resistance!</h1>
      </header>
      </Link>
    </div>
  );
}
export default Header;
