import React from 'react';
import ReactDOM from 'react-dom';
import './resources/css/index.css';
import Header from './Header';
import Body from './Body';
import Lobby from './Lobby';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'

class App extends React.Component {
    render(){
        return (
        <Router>
                <Header/>
            <Switch>
                    <Route exact path = "/" component={Body}/>
                    <Route path ="/Lobby" component={Lobby}/>
            </Switch>
        </Router>
        )
    } 
}


ReactDOM.render(<App/>, document.getElementById('root'));

