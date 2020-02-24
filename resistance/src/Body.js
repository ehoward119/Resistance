import React from 'react';
import './resources/css/Body.css';

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
            <button>Create Game</button>
            <button>Join Game</button>

        </div>
    )
}

export default Body