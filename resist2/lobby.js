const id = sessionStorage.getItem('roomID')
const name =sessionStorage.getItem('hostName')

document.getElementById('roomID').innerHTML =
                'Your Room ID: '+id
document.getElementById('hostName').innerHTML = 
                'The host: '+ name
