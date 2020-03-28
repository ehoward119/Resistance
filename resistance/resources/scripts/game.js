// Initial definitions and fetches
const roomId = sessionStorage.getItem('roomID')
const isHost = sessionStorage.getItem('isHost')
const playerName =sessionStorage.getItem('playerName')
const playersRef = db.collection('Rooms').doc(roomId).collection('Players')
const roomRef =  db.collection('Rooms').doc(roomId)
const identityButton = document.getElementById('identity')
//const roleButton = document.getElementById('randomize')

// assign roles
if (isHost) {
    assignRoles();
}








// -------------------------------------------------------------------------------
// Function getting secret identity
// -------------------------------------------------------------------------------
identityButton.addEventListener('click', () => {
    getSecretIDHelp()
});

// helps get secret id
async function getSecretIDHelp() {
    const isResistance = await getIsResistance(roomId, playerName)
    if (isResistance) alert("You're a resistance member!")
    else alert("You're a spy!")
}

// randomly assign roles
async function assignRoles() {
    const numPlayers = await getNumPlayers(roomId)
    let roles = []
    
    // determine number of spies depending on the number of players
    // *three player case for testing only*
    switch (numPlayers) {
        case 3:
            roles = [true, true, false]; 
            break;

        case 5:
            roles = [true, true, true, false, false]; 
            break;

        case 6:
            roles = [true, true, true, true, false, false]; 
            break;

        case 7:
            roles = [true, true, true, true, false, false, false]; 
            break;
                
        case 8:
            roles = [true, true, true, true, true, false, false, false]; 
            break;
        
        case 9:
            roles = [true, true, true, true, true, true, false, false, false]; 
            break;
                
        case 10:
            roles = [true, true, true, true, true, true, false, false, false, false]; 
            break;
        
        default:
            console.log("Error in assignRoles() - irregular number of players.")
    }

    // randomly distribute the spies
    shuffle(roles);
    console.log(roles);

    // assign each player a role
    let index = 0;
    playersRef.get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            setIsResistance(roomId, name, roles[index]);
            index++;
        });
    });
}

// shuffle array method taking from javascript.info website
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
  
      // swap elements array[i] and array[j]
      // we use "destructuring assignment" syntax to achieve that
      // you'll find more details about that syntax in later chapters
      // same can be written as:
      // let t = array[i]; array[i] = array[j]; array[j] = t
      [array[i], array[j]] = [array[j], array[i]];
    }
  }



// -------------------------------------------------------------------------------
// Getter and Setter Functions
// -------------------------------------------------------------------------------

// returns the desired room - useful for getting data from the room
async function getRoom(roomCode) {
    const doc = await db.collection('Rooms').doc(roomCode).get();
    return doc;
}

// getter for numPlayers
async function getNumPlayers(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().numPlayers;
}

// returns a player with a given name - null if none exists
async function getPlayer(roomCode, name) { 
    const player = await db.collection('Rooms').doc(roomCode).collection('Players').doc(name).get();
    return player;
}

// getter for isResistance
async function getIsResistance(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().isResistance;
}

// setter for isResistance
function setIsResistance(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        isResistance: value
    });
}