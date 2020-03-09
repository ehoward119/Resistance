
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
        sessionStorage.setItem('hostName', createForm.name.value)
        db.collection('Rooms').doc(code).set({
            isOpen: true,
            numPlayers: 1,
            round: 0,
            downvoteCounter: 0,
            resistanceScore: 0,
            spyScore: 0
        }).then(function() {
        db.collection('Rooms').doc(code).collection("Players").add({
            name: createForm.name.value,
            rotNumber: 0,
            hasVoted: true,
            isMissionMember: false,
            isResistance: true,
            vote: true
        }).then(function() {
            location ="lobby.html";
        })});
    }
});

// joing a room
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let name = joinForm.name.value;
    let roomCode = joinForm.code.value;
    if (roomCode != '' && name != '') {
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
                });
                db.collection("Rooms").doc(roomCode).collection("Players").add({
                    name: joinForm.name.value,
                    rotNumber: (room.data().numPlayers),
                    hasVoted: true,
                    isMissionMember: false,
                    isResistance: true,
                    vote: true
                });
                joinForm.name.value = '';
                joinForm.code.value = '';
            }
        });
    }
});

function idGen (){
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id =""
    for(let i = 0; i < 5; i += 1){
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  return id;
}