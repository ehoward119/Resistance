import React from 'react';
import './resources/css/Body.css';
import { Link } from 'react-router-dom'

//Function that will create the body of the landing page
// TODO: styling, pushing data to the DB
function Body(){
    return (
            <div className="body">
                <NameForm/>
                <Link to={{
                    pathname: "/Lobby",
                    state: {
                        roomID: idGen(),
                        playerName: "FIXME, SHOULD GET FROM THE FORM"
                    }
                }}> 
                        <button> Create Game</button> </Link>
                <Link to= "/Game"> <button>Join Game</button> </Link>
            </div>
    )
}

// Dynamic form that's a React Object
class NameForm extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: ''};
      this.handleChange = this.handleChange.bind(this);
    }
  
    handleChange(event) {
      this.setState({value: event.target.value});
    }

    render() {
      return (
        <form>
          <label>
            Name:
            <input type="text" value={this.state.value} onChange={this.handleChange} />
          </label>
        </form>
      );
    }
  }


// Adapted from Spyfall
// https://github.com/adrianocola/spyfall/blob/master/app/services/roomIdGenerator.js
function idGen (){
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id =""
    for(let i = 0; i < 5; i += 1){
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  return id;
}



// Experimental Code, don't use it yet
class Body1 extends React.Component {
    constructor(props){
        super(props)
    }

    render(){
      return (
            <div className="body">
            <NameForm/>
            <Link to={{
                pathname: "/Lobby",
                state: {
                    roomID: idGen(),
                    playerName: "FIXME, SHOULD GET FROM THE FORM"
                }
            }}> 
                    <button> Create Game</button> </Link>
            <Link to= "/Game"> <button>Join Game</button> </Link>
            </div>
      )
    }
}

export default Body