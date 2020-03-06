import React from 'react';
import './resources/css/Body.css';

//Function that will create the body of the landing page
// TODO: styling, pushing data to the DB
function Body(){
    return (
            <div className="body">
              <form id = "create-game-form">
                  <input type="text" name="name" placeholder="Name"/>
                  <button>Create Room</button>
              </form>
              <form id = "join-game-form">
                  <input type="text" name="name" placeholder="Name"/>
                  <input type="text" name="code" placeholder="Room Code"/>
                  <button>Join Game</button>
              </form>
              <ul id="room-list"></ul>
            </div>
    )
}


export default Body