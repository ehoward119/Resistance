// Initial definitions and fetches
const roomId = sessionStorage.getItem('roomID')
const isHost = sessionStorage.getItem('isHost')
const playerName =sessionStorage.getItem('playerName')
const numPlayers = sessionStorage.getItem("numPlayers")
const playersRef = db.collection('Rooms').doc(roomId).collection('Players')
const roomRef =  db.collection('Rooms').doc(roomId)
const identityButton = document.getElementById('identity')
const yesButton = document.getElementById('yes')
const noButton = document.getElementById('no')
const selectionButton = document.getElementById('submit-button')
let numMissionMembers = []
let order = []
let missionTeam = []

// -------------------------------------------------------------------------------
// Running the game
//      The host is incharge of running the game
// -------------------------------------------------------------------------------
// Host starts the game with helper function
console.log("Host: " + isHost);
console.log("Name: " + playerName);
if (isHost == "yes") {
    startUp();
} else {
    getNumPlayers(roomId).then((players) =>{assignNumMissionMembers(players);})
    .then(()  => {
    console.log("numMissionMembers: " + numMissionMembers);})
}

let counter =0; 
// Everyone listens for changes in the database
playersRef.onSnapshot(async (snapshot) =>{
    let gameState = await getGameState(roomId);
    console.log("GameState: " + gameState)
    if (gameState== "selecting" && counter == 0){
        counter++;
        let leaderStatus = await getIsMissionLeader(roomId, playerName);
        console.log("leaderStatus: " + leaderStatus);
        // If leader, make them select their team
        if(leaderStatus){
            document.getElementById("ML_status").innerHTML = "You are now the mission leader.";
            let round = await getRound(roomId);
            let numMembers = numMissionMembers[round];
            displayMissionMembers(numMembers);
            // Wait for the player click select team
            selectionButton.addEventListener('click', async () => {
                selectionButton.disabled= true;
                missionTeam = selectMissionTeam(numMembers);
                console.log(missionTeam);
                if (missionTeam.length != 0){
                    await updateMissionTeam(missionTeam);
                    await setAcceptingVotes(roomId, true);
                    await setGameState(roomId, "voting");
                }
                });
        } else {
            document.getElementById("ML_status").innerHTML ="Mission leader is selecting team";
        }
        counter =0; 
    } 
    else if (gameState == "voting" && counter == 0){
        counter ++; 
        document.getElementById("ML_status").innerHTML ="Cast your vote & Wait";
        await getMissionTeam();
        console.log("missionTeam after get: " + missionTeam);
        displaySelectedTeam(missionTeam);
        
        if  (isHost == "yes"){
                // HOST SHOULD CHECK IF ALL VOTES ARE CAST
        }
        // IDEA code below
        // Grab the current team and display it----------------
        // snapshot.docs.forEach(doc => {
        //     const missionTeam = document.getElementById('mission-team')
        //     if (doc.isMissionMember){
        //         var entry = document.createElement("LI");
        //         var text = document.createTextNode(doc.id);
        //         entry.appendChild(text);
        //         missionTeam.appendChild(entry); 
        //     }
        // })
        // ----------------------------------------------------
        
    } 
    else if (getGameState(roomId) == "inMission"){

    }
    
})

// Listener for the ROOM as a whole, can be used to check changes in state
// and trigger certain events
roomRef.onSnapshot((snapshot) =>{
    if (snapshot.data().gameState == "voting"){
        resetLeader(roomId)
    }
})


//Takes in the selected mission team and updates mission team in the database 
async function updateMissionTeam(team){
    console.log("Updating Mission team...")
    playersRef.get().then(docs => { 
        docs.forEach(doc => {
            let name = doc.id;
            if(team.includes(name)){
                setIsMissionMember(roomId, name, true);
            }
        });
    })
}

async function getMissionTeam(){
    missionTeam = [];
    let query = playersRef.where("isMissionMember", "==", true).get()
    .then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id; 
            missionTeam.push(name);
        })
        console.log("missionTeamInGet: " + missionTeam);
    })
}

function resetMissionTeam(){
    missionTeam = [];
    console.log("MissionTeamInReset: " + missionTeam)
    playersRef.get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id; 
            setIsMissionMember(roomId, name, false);
        })
    })
}

// get identity button
identityButton.addEventListener('click', () => {
    getSecretIDHelp()
});


// -------------------------------------------------------------------------------
// Helper Functions for running the game
// -------------------------------------------------------------------------------
async function startUp() {
    // NEEDS TO BE DONE ONCE
    // ******** Night Time ********
    numMissionMembers = await nightTime(order);
    console.log("Order: " + order)
    // This works ^_^
    // numMissionMembers = People needed per mission
    // order= mission member order

    // Resets all things just to make sure its fine
    await resetRound(roomId);
    await resetResistanceScore(roomId);
    await resetSpyScore(roomId);
    await resetDownvoteCounter(roomId)
    await updateIsMissionLeader(roomId, order[0])
    await setGameState(roomId, "selecting")
    await resetMissionTeam()
    console.log("First leader: " + order[0])
    console.log("NumMissionMembers: " + numMissionMembers)
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
    let roles = assignNumMissionMembers(await getNumPlayers(roomId));
   
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

// Creates basic rules for the game
function assignNumMissionMembers(players){
// determine number of spies depending on the number of players and 
    // determine the number of mission members per round
    // *three player case for testing only*
    let roles = []

    switch (players) {
        case 3:
            roles = [true, true, false];
            numMissionMembers = [2, 2, 2, 3, 3];
            break;

        case 5:
            roles = [true, true, true, false, false]; 
            numMissionMembers = [2, 3, 2,  3, 3];
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
    return roles;
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

async function resetLeader(roomCode) {
    db.collection('Rooms').doc(roomCode).collection('Players').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id;
            setIsMissionLeader(roomCode, name, false);
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

//Displays Mission members to be selected by the mission leader
//Adds each player to the list and displays it w a checkbox
//IDEA: Add functionality to only display title and list here, starts invisible
async function displayMissionMembers(numMissionMembers){
    document.getElementById("select-msg").innerHTML = "Select " + numMissionMembers + " Mission Members:";
    let list = document.getElementById("mission-members")
    await playersRef.get().then(snapshot => {
        while (list.firstChild) {
            list.removeChild(list.lastChild);
        }
        snapshot.docs.forEach(doc => {
            // TODO: not make a list every 5 seconds
            // TODO: display this information only to the host
            let name = doc.id;
            let li = document.createElement("li");
            let t = document.createTextNode(name);
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = "pair";
            li.appendChild(checkbox);
            li.appendChild(t);
            list.appendChild(li);
        });
    });
}

// prompt the player to vote
async function countVotes() {
    // TODO: Change the way that the voting works in here
    //       Not use a confirm box. Use buttons instead
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

// tallies the votes and returns a result - pass or downvote
async function vote() {
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

    return action;
}

// prompt the player to play a mission
async function countMission() {
    const isMissionMember = await getIsMissionMember(roomId, playerName);
    if (isMissionMember) {
        if (confirm(("Pass or fail this mission? \n 'Cancel' for no, 'Ok' for yes"))) {
            setVote(roomId, playerName, true);
            setHasVoted(roomId, playerName, true);
            console.log("Vote: Yes");
        } else {
            setVote(roomId, playerName, false);
            setHasVoted(roomId, playerName, true);
            console.log("Vote: No");
        }
    }
}

// tallies the mission votes and returns a result - pass or fail
async function runMission() {
    
    // open up voting
    setMissionTime(roomId, true);
    console.log("mission time: " + await getMissionTime(roomId));
    // DO NOT DELETE THIS LINE ^^^
    // - we must wait until the db has updated before we count the votes

    // count votes
    await countMission();

    // wait for everyone to vote
    let waiting = true;
    while (waiting) {
        console.log("waiting for mission votes");
        sleep(5000);
        waiting = false;
        await playersRef.get().then(snapshot =>{
            snapshot.docs.forEach(doc => {
                if (!doc.data().hasVoted && doc.data().isMissionMember) {
                    waiting = true;
                }
            });
        });
    }
    
    // close voting
    setMissionTime(roomId, false);

    // record everyone's vote
    let numYes = 0;
    let numNo = 0;
    await playersRef.get().then(snapshot => {
        snapshot.docs.forEach(doc => {
            let playerVote = doc.data().vote;
            if (playerVote && doc.data().isMissionMember) {
                numYes++;
            } 
            else if (doc.data().isMissionMember){
                numNo++;
            }
        });
    });
    await clearVotes(roomId);

    // determine a result of the vote
    let action = "fail";
    if (numYes > numNo) {
        action = "pass";
    }

    return action;
}

// halts the execution of the script for the given amount of milliseconds
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

//Selects mission members from checkbox list and returns the list of members
//if there are the correct number selected. 
function selectMissionTeam(numMissionMembers){
    let count = 0; 
    let list = document.getElementById("mission-members");
    let members = list.getElementsByTagName("li");
    let selected = new Array();
    for(var i=0; i<members.length; i++){ 
        var checkbox = members[i].getElementsByTagName("input");
        var name = members[i].textContent; 
        if(checkbox[0].checked){
            count++;
            selected.push(name);
        }
    }
    console.log("Selected " + count + " members for this mission!");
    if (count != numMissionMembers){
        alert("Must have " + numMissionMembers + " members selected!");
        selectionButton.disabled = false; //resets button to allow them to select again
        return []; 
    }
    return selected;
}

//Displays selected team above voting buttons
function displaySelectedTeam(members){
    var team = members[0];
    for(var i=1; i<members.length; i++){
        var member = "," + members[i];
        console.log(member);
        team = team.concat(member);
    }
    console.log("MissionTeamInDisplay: " + team);
    document.getElementById("mission-team").innerHTML = "Mission Members: " + team;
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

// getter for missionTime
async function getGameState(roomCode) {
    const doc = await getRoom(roomCode);
    return doc.data().gameState;
}

// setter for missionTime
function setGameState(roomCode, value) {
    db.collection("Rooms").doc(roomCode).update({
        gameState: value
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