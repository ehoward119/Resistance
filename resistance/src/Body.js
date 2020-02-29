import React from 'react';
import './resources/css/Body.css';
import { Link } from 'react-router-dom'

//Function that will create the body of the landing page
// STILL UNDER CONSTRUCTION
function Body(){
    return (
            <div className="body">
                <form>
                    <label>
                        Name:
                        <input type="text" name="name" />
                    </label>
                </form>
                <Link to= "/Lobby"> <button> Create Game</button> </Link>
                <Link to= "/Game"> <button>Join Game</button> </Link>
            </div>
    )
}

export default Body