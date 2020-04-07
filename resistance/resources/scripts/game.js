// Initial definitions and fetches
const roomId = sessionStorage.getItem('roomID')
const isHost = sessionStorage.getItem('isHost')
const playerName =sessionStorage.getItem('playerName')
const numPlayers = sessionStorage.getItem('numPlayers')
const playersRef = db.collection('Rooms').doc(roomId).collection('Players')
const roomRef =  db.collection('Rooms').doc(roomId)
const identityButton = document.getElementById('identity')
const yesButton = document.getElementById('yes')
const noButton = document.getElementById('no')
const selectionButton = document.getElementById('submit-button')

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
            let status = snapshot.doc(playerName).data().isMissionLeader;
            if (status) {
                document.getElementById('ML_status').innerHTML = "You are now the mission leader.";
            } else {
                document.getElementById('ML_status').innerHTML = "You are not the mission leader.";
            }
        });

    // vote yes button
    yesButton.addEventListener('click', () => {
        setVote(roomId, playerName, true);
        setHasVoted(roomId, playerName, true);
        console.log("YES!");
    });

    // vote no button
    noButton.addEventListener('click', () => {
        setVote(roomId, playerName, false);
        setHasVoted(roomId, playerName, true);
        console.log("NO!");
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
        console.log("The number of mission members in this mission is " 
            + numMissionMembers[resistanceScore + spyScore]);
        
        let status = await getIsMissionLeader(roomId, playerName);
        if (status) {
            document.getElementById('ML_status').innerHTML = "You are now the mission leader.";
        } else {
            document.getElementById('ML_status').innerHTML = "You are not the mission leader.";
        }
        let numMembers = numMissionMembers[resistanceScore+spyScore];
        displayMissionMembers(numMembers);
        // Mission Leader picks team members
        selectionButton.addEventListener('click', () => {
            selectionButton.disabled = true;  //restricts the user from pressing it more than once
            if(status){ //checks if mission leader
                let missionTeam = selectMissionTeam(numMembers);
                console.log(missionTeam);
                displaySelectedTeam(missionTeam);
                //this assumes this is the right number of mission members
                //Concern: If they don't select the right number, it will return nothing 
                //--they could technically never submit again?
            } else {
                alert("You cannot select mission members because you're not the mission leader!");
            }
            
        });

        
        //TODO: Write a display mission members function
                //Should display the selected mission members after they are selected by leader
        // Vote on the mission  members-> restart round with next leader if vote 
        // fails, and increment the downvote counter
        
        let waitingForVotes = true;

        // vote yes button
        yesButton.addEventListener('click', () => {
            setVote(roomId, playerName, true);
            setHasVoted(roomId, playerName, true);
            console.log("YES!");
        });

        // vote no button
        noButton.addEventListener('click', () => {
            setVote(roomId, playerName, false);
            setHasVoted(roomId, playerName, true);
            console.log("NO!");
        });
        
        //console.log("arrived at while loop")
        // wait for everyone to vote
        while (waitingForVotes) {
            //console.log("inside loop")
            waitingForVotes = false;
            await playersRef.get().then(snapshot => {
                snapshot.docs.forEach(doc => {
                    let playerHasVoted = doc.data().hasVoted;
                    if (!playerHasVoted) {
                        waitingForVotes = true;
                    }
                });
            });
        }
        
        // record everyone's vote
        let numYes = 0;
        let numNo = 0;
        await playersRef.get().then(snapshot => {
            snapshot.docs.forEach(doc => {
                let name = doc.id;
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

        let action = "fail";
        if (numYes > numNo) {
            action = "pass";
        }
        
        // Mission Members vote on the Mission
        //------
        // TODO
        //------

        // Mission fails or succeeds
        //------------------------------------------
        // NEEDS WORK - CURRENTLY RANDOM SIMULATION
        //------------------------------------------
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

//Displays Mission members to be selected by the mission leader
//Adds each player to the list and displays it w a checkbox
//IDEA: Add functionality to only display title and list here, starts invisible
async function displayMissionMembers(numMissionMembers){
    document.getElementById("select-msg").innerHTML = "Select " + numMissionMembers + " Mission Members:";
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
        return; 
    }
    return selected;
    //TODO:
        //  Call this not just in the host 
}

//Displays selected team above voting buttons
function displaySelectedTeam(members){
    var team = "";
    for(var i=0; i<members.length; i++){
        var member = members[i] + ", ";
        console.log(member);
        team = team.concat(member);
        console.log(team);
    }
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