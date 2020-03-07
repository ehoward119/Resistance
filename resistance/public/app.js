const roomList = document.querySelector('#room-list');
const createForm = document.querySelector('#create-game-form');
const joinForm = document.querySelector('#join-game-form');
const startForm = document.querySelector('#start-game-form');

// create element & render cafe
function renderRoom(doc){
    let li = document.createElement('li');
    let roomCode = document.createElement('span');

    li.setAttribute('data-id', doc.id);
    roomCode.textContent = doc.id;

    li.appendChild(roomCode);

    roomList.appendChild(li);
}

// getting data
db.collection('Rooms').get().then(snapshot => {
    snapshot.docs.forEach(doc => {
        renderRoom(doc);
    });
});

// creating a room
createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (createForm.name.value != '') {
        // random room code generator goes here
        db.collection('Rooms').doc("RoomCode").set({
            isOpen: true,
            numPlayers: 1,
            round: 0,
            downvoteCounter: 0,
            resistanceScore: 0,
            spyScore: 0,
            missionLeaderNum: 0
        });
        db.collection('Rooms').doc("RoomCode").collection("Players").add({
            name: createForm.name.value,
            rotNumber: 0,
            hasVoted: false,
            isMissionMember: false,
            isResistance: true,
            vote: true
        });
        createForm.name.value = '';
    }
});

// starting a game
startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let roomCode = "RoomCode";
    let numPlayers = getNumPlayers(roomCode);
    console.log(numPlayers);
    if (numPlayers >= 5 || numPlayers <= 10) {
        startGame(roomCode);
    }
    else {
        console.log("Error: Wrong number of players. Must have between 5 and 10 players.");
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
                    hasVoted: false,
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

///////////////////////////////////////////////////////////////////////////////
// NOT TESTED
///////////////////////////////////////////////////////////////////////////////

// get and set for  isOpen, numPlayers*, round, downvoteCounter, 
// resistanceScore, spyScore, missionLeaderNum, rotNumber*, hasVoted, 
// isMissionMember, isResistance, and vote
//
// * - indicate only a getter, these variables should not be changed during the game

// returns the desired room - useful for getting data from the room
function getRoom(roomCode) {
    db.collection('Rooms').doc(roomCode).get().then(doc => {
        console.log(doc);
        return doc;
    });
}

// returns a player with a given name - null if none exists
function getPlayer(roomCode, name) { 
    room = getRoom(roomCode);
    room.collection('Players').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            if(doc.id == name) {
                return doc;
            }
        });
    });
    return null;
}

// getter for isOpen
function getIsOpen(roomCode) {
    db.collection('Rooms').doc(roomCode).get().then(doc => {
        return doc.data().numPlayers;
    });
}

// setter for isOpen
function setIsOpen(roomCode, value) {
    db.collection("Rooms").doc(roomCode).update({
        isOpen: value
    });
}

// getter for numPlayers
function getNumPlayers(roomCode) {
    numPlayers = 0;
    db.collection('Rooms').doc(roomCode).get().then(doc => {
        console.log(doc.data().numPlayers);
        numPlayers = doc.data().numPlayers;
        return numPlayers;
    });
    
}

// no setter for numPlayers - determined at start of the game

// getter for round
function getRound(roomCode) {
    return getRoom(roomCode).data().round;
}

// reset round number to zero
function resetRound(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        round: 0
    });
}

// increment round by one
function incrementRound(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        round: (getRound(roomCode) + 1)
    });
}

// getter for downvoteCounter
function getDownvoteCounter(roomCode) {
    return getRoom(roomCode).data().downvoteCounter;
}

// reset downvoteCounter to zero
function resetDownvoteCounter(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        downvoteCounter: 0
    });
}

// increment downvoteCounter by one
function incrementDownvoteCounter(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        downvoteCounter: (getDownvoteCounter(roomCode) + 1)
    });
}

// getter for resistanceScore
function getResistanceScore(roomCode) {
    return getRoom(roomCode).data().resistanceScore;
}

// reset resistanceScore to zero
function resetResistanceScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        resistanceScore: 0
    });
}

// increment resistanceScore by one
function incrementResistanceScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        resistanceScore: (getResistanceScore(roomCode) + 1)
    });
}

// getter for spyScore
function getSpyScore(roomCode) {
    return getRoom(roomCode).data().spyScore;
}

// reset spyScore to zero
function resetSpyScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        spyScore: 0
    });
}

// increment spyScore by one
function incrementSpyScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        spyScore: (getSpyScore(roomCode) + 1)
    });
}

// getter for missionLeaderNum
function getMissionLeaderNum(roomCode) {
    return getRoom(roomCode).data().missionLeaderNum;
}

// setter for missionLeaderNum
function setMissionLeaderNum(roomCode, value) {
    db.collection("Rooms").doc(roomCode).update({
        missionLeaderNum: value
    });
}

// getter for rotNumber
function getRotNumber(roomCode, name) {
    return getPlayer(roomCode, name).data().rotNumber;
}

// no rotNumber setter

// getter for hasVoted
function getHasVoted(roomCode, name) {
    return getPlayer(roomCode, name).data().hasVoted;
}

// setter for hasVoted
function setHasVoted(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        hasVoted: value
    });
}

// getter for isMissionMember
function getIsMissionMember(roomCode, name) {
    return getPlayer(roomCode, name).data().isMissionMember;
}

// setter for isMissionMember
function setIsMissionMember(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        isMissionMember: value
    });
}

// getter for isResistance
function getIsResistance(roomCode, name) {
    return getPlayer(roomCode, name).data().isResistance;
}

// setter for isResistance
function setIsResistance(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        isResistance: value
    });
}

// getter for vote
function getVote(roomCode, name) {
    return getPlayer(roomCode, name).data().vote;
}

// setter for vote
function setVote(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        vote: value
    });
}

// GAME FUNCTIONS:

// start game by closing the room
// might be !!! INCOMPLETE !!!
function startGame(roomCode) {
    setIsOpen(roomCode, false);
}

// incremements the mission leader number
function newLeader(roomCode) {
    let ml_Num = getMissionLeaderNum(roomCode) + 1;
    if(ml_Num >= getNumPlayers(roomCode)) {
        ml_Num = 0;
    }
    setMissionLeaderNum(roomCode, ml_Num);
}

// incremements the round, reseting all applicable variables
function newRound(roomCode){
    newLeader(roomCode);
    resetDownvoteCounter(roomCode);
    clearVotes(roomCode);
    incrementRound(roomCode);
}

// casts the vote for a player
function castVote(roomCode, name, value) {
    setVote(roomCode, name, value);
    setHasVoted(roomCode, name, true);
}

// reset all votes, hasVoted
function clearVotes(roomCode) {
    getRoom(roomCode).collection('Players').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            setHasVoted(roomCode, name, false);
            setVote(roomCode, name, false);
        });
    });
}