import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import * as firebase from 'firebase';

var firebaseConfig = {
    apiKey: "AIzaSyA2yzKvuuqK32rY5zqPpjbs1z-GLcIZFiw",
    authDomain: "resistance-121.firebaseapp.com",
    databaseURL: "https://resistance-121.firebaseio.com",
    projectId: "resistance-121",
    storageBucket: "resistance-121.appspot.com",
    messagingSenderId: "122327094674",
    appId: "1:122327094674:web:50eff2cdb5b92d73079d4b",
    measurementId: "G-CTHR3HSL01"
  };
  
firebase.initializeApp(firebaseConfig)

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
