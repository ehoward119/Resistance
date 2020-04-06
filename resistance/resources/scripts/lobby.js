// Initial definitions and fetches
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
                'Your Room ID: ' + roomId;
document.getElementById('hostName').innerHTML = 
                'Your Name: '+ playerName;

// test for sean and peace of mind
console.log("Host: " + isHost);

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
// Listener to  checks if the room is still open or not
// If the room is not open, this means you should be redirected to the game page
// -------------------------------------------------------------------------------
roomRef.onSnapshot((snapshot) =>{
    if (isHost != "yes"){       // HACK: Dealing with asynchronous update
        if (!snapshot.data().isOpen) {
            location = "game.html"
        }
    }
});

// -------------------------------------------------------------------------------
// Function for starting the game
// -------------------------------------------------------------------------------
startButton.addEventListener('click', () => {
    if (isHost == "yes") startHelp(roomId)
    else alert("You're not the host!")
});


// ///////////////////////////////////////////////////////////////////////////////
//                                                                              //
// Helper functions                                                             //
//                                                                              //
// ///////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------------------------------
// Helper function that updates the player list in the document
// -------------------------------------------------------------------------------
function updatePlayers(names){ 
    const playerList = document.getElementById('playerList')
    // cleans existing list
    clean(playerList);
    names.forEach((name) =>{ // Create the children elements to the list
        var entry = document.createElement("LI");
        var text = document.createTextNode(name);
        entry.appendChild(text);
        playerList.appendChild(entry); 
    })

}

// -------------------------------------------------------------------------------
// Helper function to clean elements
// -------------------------------------------------------------------------------
function clean(node){
    while (node.firstChild) {
        node.removeChild(node.lastChild);
     }
}

// -------------------------------------------------------------------------------
// getter for numPlayers
// -------------------------------------------------------------------------------
async function getNumPlayers(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().numPlayers;
}

// -------------------------------------------------------------------------------
// returns the desired room - useful for getting data from the room
// -------------------------------------------------------------------------------
async function getRoom(roomCode) {
    const doc = await db.collection('Rooms').doc(roomCode).get();
    return doc;
}

// -------------------------------------------------------------------------------
// Helper function for starting a game
// -------------------------------------------------------------------------------
async function startHelp(roomCode) {
    const numPlayers = await getNumPlayers(roomCode);
    sessionStorage.setItem("numPlayers", numPlayers);
    // TEMPORARY CONDITION FOR TESTING, MIN # OF PLAYERS SHOULD BE 5
    // Check if valid number of players is in match, else alert the host
    if (numPlayers >= 3 && numPlayers <= 10) {
        roomRef.update({
            isOpen: false
        }).then( () => {
            location = "game.html"
        });
    }
    else {
        alert("Error: Wrong number of players. Must have between 5 and 10 players.");
    }
}