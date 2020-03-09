
const roomList = document.querySelector('#room-list');
const createForm = document.querySelector('#create-game-form');
const joinForm = document.querySelector('#join-game-form');

// creating a room
createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log(createForm.name.value);
    if (createForm.name.value != '') {
        code = idGen()
        sessionStorage.setItem('roomID', code)
        sessionStorage.setItem('playerName', createForm.name.value)
        sessionStorage.setItem('isHost', "yes")
        db.collection('Rooms').doc(code).set({
            isOpen: true,
            numPlayers: 1,
            round: 0,
            downvoteCounter: 0,
            resistanceScore: 0,
            spyScore: 0
        }).then(() =>{
        db.collection('Rooms').doc(code).collection("Players").doc( createForm.name.value).set({
            rotNumber: 0,
            hasVoted: true,
            isMissionMember: false,
            isResistance: true,
            vote: true
        }).then(() => {
            location ="lobby.html";
            })
        });
    }
});

// Helper to join a room
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = joinForm.name.value;
    const roomCode = joinForm.code.value;
    joinHelp(roomCode, name);
    joinForm.name.value = '';
    joinForm.code.value = '';
});

// helper method for join room
async function joinHelp(roomCode, name) {
    if (roomCode != '' && name != '') {
        const open = await getIsOpen(roomCode);
        const numPlayers = await getNumPlayers(roomCode);
        if (roomCode != '' && name != '' && open && numPlayers < 10) {
            let room = null;
            db.collection('Rooms').get().then(snapshot => {
                snapshot.docs.forEach(doc => {
                    if(doc.id == roomCode) {
                        room = doc;
                    }
                });
            
                if(room == null) {
                    console.log("Invalid Room Code");
                }
                else {
                    db.collection("Rooms").doc(roomCode).update({
                        numPlayers: (room.data().numPlayers + 1),
                    }).then(() => {
                    db.collection('Rooms').doc(roomCode).collection("Players").doc(name).set({
                        rotNumber: (room.data().numPlayers),
                        hasVoted: false,
                        isMissionMember: false,
                        isResistance: true,
                        vote: true
                    }).then( () => {
                        sessionStorage.setItem('roomID', roomCode)
                        sessionStorage.setItem('playerName', name)
                        sessionStorage.setItem('isHost', "no")
                        location ="lobby.html"
                    })
                    });
                }
            });
        } 
        else {
            if (numPlayers == 10) {
                console.log("Too many players!");
            }
            else if (!open) {
                console.log("The game already started!");
            }
        } 
    }
    else {
        console.log("Must enter a valid username and room code!");
    }
}



// returns the desired room - useful for getting data from the room
async function getRoom(roomCode) {
    const doc = await db.collection('Rooms').doc(roomCode).get();
    return doc;
}


// getter for isOpen
async function getIsOpen(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().isOpen;
}

// getter for numPlayers
async function getNumPlayers(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().numPlayers;
}

function idGen (){
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id =""
    for(let i = 0; i < 5; i += 1){
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  return id;
}