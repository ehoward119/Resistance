import React from 'react';
import ReactDOM from 'react-dom';
import './resources/css/index.css';
import Header from './Header';
import Body from './Body';

class Landing extends React.Component {
    render(){
        return (
            <div className ="landing">
                <Header/>
                <Body/>
            </div>
        )
    } 
}


ReactDOM.render(<Landing/>, document.getElementById('root'));

