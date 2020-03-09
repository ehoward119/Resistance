const roomId = sessionStorage.getItem('roomID')
const isHost = sessionStorage.getItem('isHost')
const playerName =sessionStorage.getItem('playerName')
const playersRef = db.collection('Rooms').doc(roomId).collection('Players')
const roomRef =  db.collection('Rooms').doc(roomId)
const startButton = document.getElementById('start')

// -------------------------------------------------------------------------------
// Simple code that provides the room info
// Can be deleted if you want, but its useful for debugging
// -------------------------------------------------------------------------------
document.getElementById('roomID').innerHTML =
                'Your Room ID: '+roomId
document.getElementById('hostName').innerHTML = 
                'Your Name: '+ playerName 

                
// -------------------------------------------------------------------------------
// Listener for any change on the database (adding players)
// IDK if this function could be turned into a helper and placed into the function below
// -------------------------------------------------------------------------------
playersRef.onSnapshot((snapshot) =>{
    let playerNames = [];
    snapshot.docs.forEach(doc => {
        playerNames.push(doc.id)
    });
    updatePlayers(playerNames)
});

// -------------------------------------------------------------------------------
// Function that checks if the room is still open or not
// If the room is not open, this means you should be redirected to the game page
// -------------------------------------------------------------------------------
roomRef.onSnapshot((snapshot) =>{
    if (!snapshot.data().isOpen) {
        location = "game.html"
    }
});

// -------------------------------------------------------------------------------
// Function for starting the game
// -------------------------------------------------------------------------------
startButton.addEventListener('click', () => {
    // This check might seem dumb but HTML and JavaScript were acting up alll weird
    if (isHost == "yes") startHelp(roomId)
    else alert("You're not the host!")
});

// helper function for starting a game
async function startHelp(roomCode) {
    const numPlayers = await getNumPlayers(roomCode);
    // TEMPORARY CONDITION FOR TESTING, NUMBER OF PLAYERS SHOULD BE 5
    if (numPlayers >= 2 && numPlayers <= 10) {
        await roomRef.update({isOpen: false});
        location = "game.html"
    }
    else {
        alert("Error: Wrong number of players. Must have between 5 and 10 players.");
    }
}






// Helper function that updates the player list
function updatePlayers(names){ 
    const playerList = document.getElementById('playerList')
    clean(playerList);
    names.forEach((name) =>{
        var entry = document.createElement("LI");
        var text = document.createTextNode(name);
        entry.appendChild(text);
        playerList.appendChild(entry); 
    })

}

// Helper function to clean elements
function clean(node){
    while (node.firstChild) {
        node.removeChild(node.lastChild);
     }
}

// getter for numPlayers
async function getNumPlayers(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().numPlayers;
}

// returns the desired room - useful for getting data from the room
async function getRoom(roomCode) {
    const doc = await db.collection('Rooms').doc(roomCode).get();
    return doc;
}