// Initial definitions and fetches
const roomId = sessionStorage.getItem('roomID')
const isHost = sessionStorage.getItem('isHost')
const playerName =sessionStorage.getItem('playerName')
const playersRef = db.collection('Rooms').doc(roomId).collection('Players')
const roomRef =  db.collection('Rooms').doc(roomId)
const identityButton = document.getElementById('identity')
const yesButton = document.getElementById('yes')
const noButton = document.getElementById('no')

// -------------------------------------------------------------------------------
// Running the game
//      The host is incharge of running the game
// -------------------------------------------------------------------------------
console.log("Host: " + isHost);
if (isHost == "yes") {
    runGame();
} else {
    displayMissionMembers();

    playersRef.onSnapshot((snapshot) =>{
        snapshot.docs.forEach(doc => {
            if (doc.id == playerName) {
                let status = doc.data().isMissionLeader;
                if (status) {
                    document.getElementById('ML_status').innerHTML = "You are now the mission leader.";
                } else {
                    document.getElementById('ML_status').innerHTML = "You are not the mission leader.";
                }
            }
        });
    });

    roomRef.onSnapshot((snapshot) => {
        if (snapshot.data().acceptingVotes) {
            countVotes();
        } else {
            //do nothing
        }
    });
}


// get identity button
identityButton.addEventListener('click', () => {
    getSecretIDHelp()
});


// -------------------------------------------------------------------------------
// Helper Functions for running the game
// -------------------------------------------------------------------------------

async function runGame() {
    displayMissionMembers();
    // get identity button
    identityButton.addEventListener('click', () => {
        getSecretIDHelp()
    });

    // ******** Night Time ********
    
    let order = [];
    numMissionMembers = await nightTime(order);
    console.log("Order: " + order)
    


    // ******** Game Time ********
    
    // Initiate variables
    const numPlayers = await getNumPlayers(roomId);
    await resetRound(roomId);
    await resetResistanceScore(roomId);
    await resetSpyScore(roomId);
    await resetDownvoteCounter(roomId)
    let missionLeaderIndex = 0;
    let resistanceScore = await getResistanceScore(roomId);
    let spyScore = await getSpyScore(roomId);
    let downvoteCounter = await getDownvoteCounter(roomId);

    // each full iteratation is one round
    while (resistanceScore < 3 && spyScore < 3 && downvoteCounter < 5) {
        
        // Initiate new round
        await newRound(roomId, order[(await getRound(roomId))]);
        
        // test console logs
        console.log("Round: " + await getRound(roomId));
        console.log("The Mission Leader is " + order[missionLeaderIndex]);
        console.log("The number of mission members the mission is " 
            + numMissionMembers[resistanceScore + spyScore]);
        
        let status = await getIsMissionLeader(roomId, playerName);
        if (status) {
            document.getElementById('ML_status').innerHTML = "You are now the mission leader.";
        } else {
            document.getElementById('ML_status').innerHTML = "You are not the mission leader.";
        }

        // Mission Leader picks team members
        //------
        // TODO
        //------
        // TEST: Sean and Emily and mission leaders
        setIsMissionMember(roomId, "Sean", true);
        setIsMissionMember(roomId, "Emily", true);
        

        // Vote on the mission members-> restart round with next leader if vote 
        // fails, and increment the downvote counter

        // open up voting 
        setAcceptingVotes(roomId, true);
        console.log("accepting votes: " + await getAcceptingVotes(roomId));
        // DO NOT DELETE THIS LINE ^^^
        // - we must wait until the db has updated before we count the votes

        // get votes
        // count votes
        await countVotes();

        // wait for everyone to vote
        let waiting = true;
        while (waiting) {
            console.log("waiting for votes");
            sleep(5000);
            waiting = false;
            await playersRef.get().then(snapshot =>{
                snapshot.docs.forEach(doc => {
                    console.log(doc.id + ": " + doc.data().hasVoted);
                    if (!doc.data().hasVoted) {
                        waiting = true;
                    }
                });
            });
        }
        
        // close voting
        setAcceptingVotes(roomId, false);

        // record everyone's vote
        let numYes = 0;
        let numNo = 0;
        await playersRef.get().then(snapshot => {
            snapshot.docs.forEach(doc => {
                let playerVote = doc.data().vote;
                if (playerVote) {
                    numYes++;
                } 
                else {
                    numNo++;
                }
            });
        });
        await clearVotes(roomId);

        // determine a result of the vote
        let action = "downvote";
        if (numYes > numNo) {
            action = "pass";
        }

        // Mission Members vote on the Mission
        //------
        // TODO
        //------

        // Mission fails or succeeds

        //action = simulateRound();
        
        // Score is updated
        if (action == "pass") {
            console.log("Mission Succeeded!");
            resetDownvoteCounter(roomId);
            await incrementResistanceScore(roomId);
        } 
        else if (action == "fail") {
            console.log("Mission Failed!");
            resetDownvoteCounter(roomId);
            await incrementSpyScore(roomId);
        }
        else if (action == "downvote") {
            console.log("Mission Downvoted!");
            await incrementDownvoteCounter(roomId);
        } else {
            console.log("Error: invalid action");
        }
        
        // update local variables
        resistanceScore = await getResistanceScore(roomId);
        spyScore = await getSpyScore(roomId);
        downvoteCounter = await getDownvoteCounter(roomId);
        missionLeaderIndex = missionLeaderIndex + 1;
        if (missionLeaderIndex ==  numPlayers) {
            missionLeaderIndex = 0;
        }
        
        // log the score
        console.log("SCORE: Resistance: "+ resistanceScore + 
            ", Spies: " + spyScore +
            ", Downvotes: " + downvoteCounter);
        
    }

    // display game winner
    if (resistanceScore == 3) {
        console.log("The Resistance wins!");
    }
    else {
        console.log("The Spies win!");
    }
}

// TEST FUNCTIONS
function simulateRound() {
    let actions = ["pass", "fail", "downvote", "downvote"];
    shuffle(actions);
    return actions[0]; 
}

// randomly assign roles
// returns array with the number of mission member indexed by round
async function nightTime(order) {
    const numPlayers = await getNumPlayers(roomId);
    let roles = [];
    let numMissionMembers = [];
    
    // determine number of spies depending on the number of players and 
    // determine the number of mission members per round
    // *three player case for testing only*
    switch (numPlayers) {
        case 3:
            roles = [true, true, false];
            numMissionMembers = [2, 2, 2, 3, 3];
            break;

        case 5:
            roles = [true, true, true, false, false]; 
            numMissionMembers = [2, 3, 2, 3, 3];
            break;

        case 6:
            roles = [true, true, true, true, false, false]; 
            numMissionMembers = [2, 3, 4, 3, 4];
            break;

        case 7:
            roles = [true, true, true, true, false, false, false]; 
            numMissionMembers = [2, 3, 3, 4, 4];
            break;
                
        case 8:
            roles = [true, true, true, true, true, false, false, false]; 
            numMissionMembers = [3, 4, 4, 5, 5];
            break;
        
        case 9:
            roles = [true, true, true, true, true, true, false, false, false]; 
            numMissionMembers = [3, 4, 4, 5, 5];            
            break;
                
        case 10:
            roles = [true, true, true, true, true, true, false, false, false, false];
            numMissionMembers = [3, 4, 4, 5, 5];            
            break;
        
        default:
            console.log("Error in assignRoles() - irregular number of players.")
    }

    // randomly distribute the spies
    shuffle(roles);

    // assign each player a role and gether the names of each player
    let index = 0;
    await playersRef.get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            setIsResistance(roomId, name, roles[index]);
            order.push(name);
            index++;
        });
        // Determine mission leader order
        shuffle(order);
    });

    return numMissionMembers;
        
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

// helps get secret id
async function getSecretIDHelp() {
    const isResistance = await getIsResistance(roomId, playerName)
    if (isResistance) alert("You're a resistance member!")
    else alert("You're a spy!")
}

// incremements the round, reseting all applicable variables
async function newRound(roomCode, leader) {
    await updateIsMissionLeader(roomCode, leader);
    await clearVotes(roomCode);
    await incrementRound(roomCode);
}

// reset downvoteCounter to zero
function resetDownvoteCounter(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        downvoteCounter: 0
    });
}

// update for isMissionLeader
async function updateIsMissionLeader(roomCode, leader) {
    db.collection('Rooms').doc(roomCode).collection('Players').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            if (name == leader) {
                setIsMissionLeader(roomCode, name, true);
            } 
            else {
                setIsMissionLeader(roomCode, name, false);
            }
        });
    });
}

// reset all votes, hasVoted
async function clearVotes(roomCode) {
    db.collection('Rooms').doc(roomCode).collection('Players').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            setHasVoted(roomCode, name, false);
            setVote(roomCode, name, false);
        });
    });
}

// increment round by one
async function incrementRound(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        round: (await getRound(roomCode) + 1)
    });
}

// increment downvoteCounter by one
async function incrementDownvoteCounter(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        downvoteCounter: (await getDownvoteCounter(roomCode) + 1)
    });
}

async function displayMissionMembers(){
    await playersRef.get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            let li = document.createElement("li");
            let t = document.createTextNode(name);
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = "pair";
            li.appendChild(checkbox);
            li.appendChild(t);
            document.getElementById("mission-members").appendChild(li);
        });
    });
}

async function countVotes() {
    if (confirm(("Do you approve of the mission? \n 'Cancel' for no, 'Ok' for yes"))) {
        setVote(roomId, playerName, true);
        setHasVoted(roomId, playerName, true);
        console.log("Vote: Yes");
    } else {
        setVote(roomId, playerName, false);
        setHasVoted(roomId, playerName, true);
        console.log("Vote: No");
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}


// -------------------------------------------------------------------------------
// Getter and Setter Functions
// -------------------------------------------------------------------------------

// ROOM METHODS

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

// getter for round
async function getRound(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().round;
}

// reset round number to zero
async function resetRound(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        round: 0
    });
}

// getter for downvoteCounter
async function getDownvoteCounter(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().downvoteCounter;
}

// getter for resistanceScore
async function getResistanceScore(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().resistanceScore;
}

// increment resistanceScore by one
async function incrementResistanceScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        resistanceScore: (await getResistanceScore(roomCode) + 1)
    });
}

// reset resistanceScore to zero
async function resetResistanceScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        resistanceScore: 0
    });
}

// getter for spyScore
async function getSpyScore(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().spyScore;
}

// increment spyScore by one
async function incrementSpyScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        spyScore: (await getSpyScore(roomCode) + 1)
    });
}

// reset spyScore to zero
async function resetSpyScore(roomCode) {
    db.collection("Rooms").doc(roomCode).update({
        spyScore: 0
    });
}

// getter for acceptingVotes
async function getAcceptingVotes(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().acceptingVotes;
}

// setter for acceptingVotes
async function setAcceptingVotes(roomCode, value) {
    db.collection("Rooms").doc(roomCode).update({
        acceptingVotes: value
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



// PLAYER METHODS

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

// setter for hasVoted
function setHasVoted(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        hasVoted: value
    });
}

// setter for vote
function setVote(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        vote: value
    });
}

// setter for isMissionLeader
function setIsMissionLeader(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        isMissionLeader: value
    });
}

// setter for hasVoted
function setHasVoted(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        hasVoted: value
    });
}

// getter for hasVoted
async function getHasVoted(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().hasVoted;
}

// setter for vote
function setVote(roomCode, name, value) {
    db.collection("Rooms").doc(roomCode).collection('Players').doc(name).update({
        vote: value
    });
}

// getter for vote
async function getVote(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().vote;
}

// reset all votes, hasVoted
async function clearVotes(roomCode) {
    db.collection('Rooms').doc(roomCode).collection('Players').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            setHasVoted(roomCode, name, false);
            setVote(roomCode, name, false);
        });
    });
}

// getter for isMissionLeader
async function getIsMissionLeader(roomCode, name) {
    const player = await getPlayer(roomCode, name);
    return player.data().isMissionLeader;
}