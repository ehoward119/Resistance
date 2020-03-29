// All the helper functions for accessing and manipulating the database

// get and set for  isOpen, numPlayers*, round, downvoteCounter, 
// resistanceScore, spyScore, missionLeaderNum, rotNumber*, hasVoted, 
// isMissionMember, isResistance, and vote
//
// * - indicate only a getter, these variables should not be changed during the game

// returns the desired room - useful for getting data from the room
async function getRoom(roomCode) {
    const doc = await db.collection('Rooms').doc(roomCode).get();
    return doc;
}

// returns a player with a given name - null if none exists
async function getPlayer(roomCode, name) { 
    const player = await db.collection('Rooms').doc(roomCode).collection('Players').doc(name).get();
    return player;
}

// getter for isOpen
async function getIsOpen(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().isOpen;
}

// setter for isOpen
function setIsOpen(roomCode, value) {
    db.collection("Rooms").doc(roomCode).update({
        isOpen: value
    });
}

// getter for numPlayers
async function getNumPlayers(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().numPlayers;
}

// no setter for numPlayers - determined at start of the game

// getter for round
async function getRound(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().round;
}

// reset round number to zero
function resetRound(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        round: 0
    });
}

// increment round by one
async function incrementRound(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        round: (await getRound(roomCode) + 1)
    });
}

// getter for downvoteCounter
async function getDownvoteCounter(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().downvoteCounter;
}

// reset downvoteCounter to zero
function resetDownvoteCounter(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        downvoteCounter: 0
    });
}

// increment downvoteCounter by one
async function incrementDownvoteCounter(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        downvoteCounter: (await getDownvoteCounter(roomCode) + 1)
    });
}

// getter for resistanceScore
async function getResistanceScore(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().resistanceScore;
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
async function getSpyScore(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().spyScore;
}

// reset spyScore to zero
function resetSpyScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        spyScore: 0
    });
}

// increment spyScore by one
async function incrementSpyScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        spyScore: (await getSpyScore(roomCode) + 1)
    });
}

// getter for rotNumber
async function getRotNumber(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().rotNumber;
}

// no rotNumber setter

// getter for hasVoted
async function getHasVoted(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().hasVoted;
}

// setter for hasVoted
function setHasVoted(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        hasVoted: value
    });
}

// getter for isMissionMember
async function getIsMissionMember(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().isMissionMember;
}

// setter for isMissionMember
function setIsMissionMember(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        isMissionMember: value
    });
}

// getter for isMissionLeader
async function getIsMissionLeader(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().isMissionLeader;
}

// setter for isMissionLeader
function setIsMissionLeader(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        isMissionLeader: value
    });
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

// getter for vote
async function getVote(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().vote;
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

// incremements the round, reseting all applicable variables
function newRound(roomCode){
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
async function clearVotes(roomCode) {
    const doc = await getRoom(roomCode);
    doc.collection('Players').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            setHasVoted(roomCode, name, false);
            setVote(roomCode, name, false);
        });
    });
}