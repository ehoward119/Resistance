// Initial definitions and fetches
//----------------------------------------------------------------------------
// Local variables brought from session
const roomId = sessionStorage.getItem('roomID')
const isHost = sessionStorage.getItem('isHost')
const playerName =sessionStorage.getItem('playerName')
const numPlayers = sessionStorage.getItem("numPlayers")
//----------------------------------------------------------------------------
// Database references
const playersRef = db.collection('Rooms').doc(roomId).collection('Players')
const roomRef =  db.collection('Rooms').doc(roomId)
//----------------------------------------------------------------------------
// Buttons
const identityButton = document.getElementById('identity')
const yesButton = document.getElementById('yes')
    yesButton.disabled=true 
const noButton = document.getElementById('no')
    noButton.disabled=true
const passButton = document.getElementById('pass')
const failButton = document.getElementById('fail')
const selectionButton = document.getElementById('submit-button')
//----------------------------------------------------------------------------
// Divs
const missionPoll = document.getElementById('passingID')
    missionPoll.style.display = "none"
const missionMembers = document.getElementById('selector')
    missionMembers.style.display = "none"
const selectingMembers = document.getElementById('selectingMembers')
    selectingMembers.style.display = "none"

//----------------------------------------------------------------------------
//Headers & display element
const spyScore = document.getElementById('spyScore')
const resistScore = document.getElementById('resistScore')
//----------------------------------------------------------------------------

let numMissionMembersList = []
let numMissionMembers = 0
let order = []
let missionTeam = []
let leaderIndex =0
let localResScore = 0
let localSpyScore = 0

// -------------------------------------------------------------------------------
// Running the game
//      The host is incharge of running the game
// -------------------------------------------------------------------------------
// Host starts the game with helper function
console.log("Host: " + isHost);
console.log("Name: " + playerName);
missionMembers.style.display = "none"
selectingMembers.style.display = "none"
missionPoll.style.display = "none"
if (isHost == "yes") {
    startUp();
} else {
    getNumPlayers(roomId).then((players) =>{assignNumMissionMembers(players);})
    .then(()  => {
    console.log("numMissionMembersList: " + numMissionMembersList);})
}


// Everyone listens for changes in the database
playersRef.onSnapshot(async (snapshot) =>{
    if(!snapshot.hasPendingWrites){

    let gameState = await getGameState(roomId);
    if (gameState== "selecting"){
        missionMembers.style.display = "none"
        missionPoll.style.display = "none"
        let leaderStatus = await getIsMissionLeader(roomId, playerName);
        console.log("leaderStatus: " + leaderStatus);
        // If leader, make them select their team
        if(leaderStatus){
            document.getElementById("ML_status").innerHTML = "You are now the mission leader.";
            let round = await getRound(roomId);
            console.log("Round: " + round);
            numMissionMembers = numMissionMembersList[round]; 
            console.log("New numMissionMembers = "+ numMissionMembers)
            displayMissionMembers();
            // Wait for the player click select team
        } else {
            document.getElementById("ML_status").innerHTML ="Mission leader is selecting team";
        } 
    } 
    else if (gameState == "voting"){
        // Check the everyone has voted
        missionMembers.style.display = "none"
        missionPoll.style.display = "none"
        getMissionTeam();
        if(isHost== "yes"){
            allVotes = true
            snapshot.docs.forEach( doc =>{
                if (!doc.data().hasVoted){
                    allVotes=false
                }
            })
            if (allVotes){
                setGameState(roomId, "counting")
            }
        }
    } 
    // We're now on  a mission
    else if (gameState == "inMission"){
        // Host listens for any vote, and changes the state if need be
        if (isHost == "yes") {
            console.log("Checking for mission votes")
            allVotes = true
            // First check if all mission members have voted
            snapshot.docs.forEach( doc =>{
                if (doc.data().isMissionMember){
                    if(!doc.data().hasVoted){
                        allVotes=false
                    }
                }
            })
            // If everyone has voted, count the votes
            let spyVote = 0
            if (allVotes){
                console.log("all (mission member) votes are in!")
                snapshot.docs.forEach( doc =>{
                    if (doc.data().isMissionMember){
                        if(!doc.data().vote){ // "True" reprsents a pass here
                            spyVote += 1
                        } 
                    }
                })
                document.getElementById("scoreUpdate").style.display="block"
                let round = await getRound(roomId)
                // Rule of 2 failures in round 4
                if(round != 4){
                    if(spyVote > 0){
                        incrementSpyScore(roomId).then( () => {
                            incrementRound(roomId).then(moveToNewRound())
                        })
                    } else {
                        incrementResistanceScore(roomId).then( () => {
                            incrementRound(roomId).then(moveToNewRound())
                        })
                    }
                } else if(spyVote>1){
                    incrementSpyScore(roomId).then(()=> {
                        incrementRound(roomId).then(moveToNewRound())
                    })
                } else {
                    incrementResistanceScore(roomId).then( () => {
                        incrementRound(roomId).then(moveToNewRound())
                    })
                }
            }
        }
    }
    }   
})

//Handles moving to a new round
//clears votes, resets mission team and switches the gamestate
async function moveToNewRound(){
    clearVotes(roomId).then(() => {
        resetMissionTeam()
        setGameState(roomId, "selecting")
    })
}

selectionButton.addEventListener('click', () => {
    selectionButton.disabled= true;
    missionTeam = selectMissionTeam();
    console.log(missionTeam);
    if (missionTeam.length != 0){
        updateMissionTeam(missionTeam).then( () =>{
            setGameState(roomId, "voting")
            setAcceptingVotes(roomId, true)
        })        
    }
});

// Listener for the ROOM as a whole, can be used to check changes in state
// and trigger certain events
roomRef.onSnapshot((snapshot) =>{
document.getElementById('order').innerHTML = "The rotation order is: " + snapshot.data().order
if(!snapshot.hasPendingWrites){
    console.log("GameState: " + snapshot.data().gameState)
    updateScores(snapshot)
    if(checkWin(snapshot)) {return}
    if (snapshot.data().gameState == "selecting"){
        selectingMembers.style.display = "none"
    }
    if (snapshot.data().gameState == "voting"){
        // Reset parameters and allow for voting
        clearVotes(roomId)
        //getMissionTeam();
        resetLeader(roomId)
        
        document.getElementById("scoreUpdate").style.display = "none"
        selectingMembers.style.display = "block"
        document.getElementById("ML_status").innerHTML ="Cast your vote & Wait";
        
        yesButton.disabled= false
        noButton.disabled=false
    }
    else if(snapshot.data().gameState == "counting"){
        yesButton.disabled= true
        noButton.disabled=true
        if(isHost =="yes"){
            let numYes = 0;
            let numNo = 0;
            playersRef.get().then(docs => { 
                docs.forEach(doc => {
                let playerVote = doc.data().vote;
                if (playerVote) {numYes++;} 
                else {numNo++; }
                })
                if (numYes>numNo){
                    clearVotes(roomId).then(() => {
                    setGameState(roomId, "inMission")
                    resetDownvoteCounter(roomId)
                    leaderIndex +=1
                    leaderIndex = leaderIndex % numPlayers
                    updateIsMissionLeader(roomId, order[leaderIndex])
                    })
                    
                } else{
                    // -- Can be helper function ------------------------
                    clearVotes(roomId).then( () =>{
                    resetMissionTeam()
                    leaderIndex +=1
                    leaderIndex = leaderIndex % numPlayers
                    updateIsMissionLeader(roomId, order[leaderIndex])
                    setGameState(roomId, "selecting")
                    // --------------------------------------------------
                    incrementDownvoteCounter(roomId)
                    })
                    console.log("Mission did not pass")
                }
            })
        }
    }
    else if(snapshot.data().gameState == "inMission") {
        missionMembers.style.display = "none"
        selectingMembers.style.display = "none"
        document.getElementById("ML_status").innerHTML ="Vote Passed! Waiting for mission member decision";
        // Check if we belong to the mission, and display the necessary stuff
        getIsMissionMember(roomId, playerName).then((result) =>{
           if(result){
                missionPoll.style.display = "block"
           }
        }) 
    }
}
})

yesButton.addEventListener('click', () =>{
    setVote(roomId,playerName,true)
    setHasVoted(roomId, playerName, true)
})

noButton.addEventListener('click', () =>{
    setVote(roomId,playerName,false)
    setHasVoted(roomId, playerName, true)
})

passButton.addEventListener('click', () =>{
    setVote(roomId,playerName,true)
    setHasVoted(roomId, playerName, true)
})

failButton.addEventListener('click', () =>{
    setVote(roomId,playerName,false)
    setHasVoted(roomId, playerName, true)
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

function getMissionTeam(){
    missionTeam = [];
    playersRef.where("isMissionMember", "==", true).get()
    .then(snapshot => {
        snapshot.docs.forEach(doc => {
            let name = doc.id; 
            missionTeam.push(name);
        })
        document.getElementById('mission-team').innerHTML = "Mission Members: " + [...new Set(missionTeam)]
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
    // ******** Night Time ********
    numMissionMembersList = await nightTime(order);
    setOrder(roomId, order)
    // This works
    // numMissionMembersList = People needed per mission
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
    console.log("NumMissionMembersList: " + numMissionMembersList)
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
    return numMissionMembersList;
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
            numMissionMembersList = [1, 2, 3, 3, 2]; //weird numbers for testing
            numMissionMembers = 1;
            break;

        case 5:
            roles = [true, true, true, false, false]; 
            numMissionMembersList = [2, 3, 2,  3, 3];
            numMissionMembers = 2; 
            break;

        case 6:
            roles = [true, true, true, true, false, false]; 
            numMissionMembersList = [2, 3, 4, 3, 4];
            numMissionMembers = 2; 
            break;

        case 7:
            roles = [true, true, true, true, false, false, false]; 
            numMissionMembersList = [2, 3, 3, 4, 4];
            numMissionMembers = 2; 
            break;
                
        case 8:
            roles = [true, true, true, true, true, false, false, false]; 
            numMissionMembersList = [3, 4, 4, 5, 5];
            numMissionMembers=3;
            break;
        
        case 9:
            roles = [true, true, true, true, true, true, false, false, false]; 
            numMissionMembers = [3, 4, 4, 5, 5];   
            numMissionMembers = 3;         
            break;
                
        case 10:
            roles = [true, true, true, true, true, true, false, false, false, false];
            numMissionMembersList = [3, 4, 4, 5, 5];    
            numMissionMembers = 3;         
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
      [array[i], array[j]] = [array[j], array[i]];
    }
}

// helps get secret id
async function getSecretIDHelp() {
    const isResistance = await getIsResistance(roomId, playerName)
    if (isResistance) alert("You're a stagthena!")
    else alert("You're a sagehen!")
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

function updateScores(snapshot){
    resistScore.innerHTML="Stagthenas: " + snapshot.data().resistanceScore
    spyScore.innerHTML="Sagehens: " + snapshot.data().spyScore
    if(snapshot.data().spyScore > localSpyScore) {
        document.getElementById("scoreUpdate").style.display="block"
        document.getElementById("scoreUpdate").innerHTML = "Sagehens win this round!"
        localSpyScore += 1
    }
    if(snapshot.data().resistanceScore > localResScore){
        document.getElementById("scoreUpdate").style.display="block"
        document.getElementById("scoreUpdate").innerHTML = "Stagthenas wins this round!"
        localResScore += 1
    }
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
function displayMissionMembers(){
    missionMembers.style.display = "block"
    selectionButton.disabled = false;
    document.getElementById("select-msg").innerHTML = "Select " + numMissionMembers + " Mission Members:";
    let list = document.getElementById("mission-members")
    playersRef.get().then(snapshot => {
        while (list.firstChild) {
            list.removeChild(list.lastChild);
        }
        snapshot.docs.forEach(doc => {
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

//Selects mission members from checkbox list and returns the list of members
//if there are the correct number selected. 
function selectMissionTeam(){
    let count = 0; 
    let list = document.getElementById("mission-members");
    let members = list.getElementsByTagName("li");
    let selected = new Array();
    for(var i=0; i<members.length; i++){ 
        var checkbox = members[i].getElementsByTagName("input");
        var name = members[i].textContent; 
        if(checkbox[0].checked){
            count += 1;
            selected.push(name);
        }
    }
    console.log("Selected " + count + " members for this mission!");
    if (count != numMissionMembers){
        alert("Must have " + numMissionMembers + " members selected!");
        selectionButton.disabled = false; //resets button to allow them to select again
        for(var i=0; i<members.length; i++){ 
            var checkbox = members[i].getElementsByTagName("input");
            if(checkbox[0].checked){
                checkbox[0].checked = false;
            }
        }
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

// Simple function to check for win condition
function checkWin(snapshot){
    if(snapshot.data().resistanceScore == 3 || snapshot.data().spyScore == 3 ){
        missionPoll.remove()
        missionMembers.remove()
        selectingMembers.remove()
        if (snapshot.data().resistanceScore == 3 ){
            document.getElementById("ML_status").innerHTML ="Stagthenas win! Refresh page to play again";
        } else {
            document.getElementById("ML_status").innerHTML ="Sagehens win! Refresh page to play again";
        }
        setGameState(roomId, "over")
        return true
    } else {
        return false
    }
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

function setOrder(roomCode, newOrder){ 
    stringOrd =""
    for (let i =0; i < newOrder.length; i++){
        if ( i ==  newOrder.length -1){
            stringOrd += newOrder[i]+" "
        } else {
            stringOrd += newOrder[i]+", "
        }
    }
    db.collection("Rooms").doc(roomCode).update({
        order: stringOrd
    });
}

function getOrder(roomCode){
    getRoom(roomCode).then(doc =>{
        return doc.data().order;
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

