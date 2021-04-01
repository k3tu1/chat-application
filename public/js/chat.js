const socket = io()

const $messageForm = document.getElementById('msgForm')
const $messageFormInput = document.getElementById('msgBox')
const $messageFormButton = document.getElementById('msgSubmit')
const $locationButton = document.getElementById('send-location')
const $messages = document.getElementById('messages')


const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild

    //Height of new/last message
    const newMessageStyles = getComputedStyle($newMessage)
    const $newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + $newMessageMargin
    //visible height
    const visibleHeight = $messages.offsetHeight
    //Height of messages container
    const containerHeight = $messages.scrollHeight
    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight - 5 <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm A')//hour minutes AM/PM

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (mapUrl) => {
    console.log(mapUrl)
    const html = Mustache.render(locationTemplate, {
        username: mapUrl.username,
        url: mapUrl.url,
        createdAt: moment(mapUrl.createdAt).format('h:mm A')//hour minutes AM/PM
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const msg = $messageFormInput.value
    socket.emit('sendMessage', msg, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
    })
})

$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { latitude: position.coords.latitude, longitude: position.coords.longitude }, () => {
            $locationButton.removeAttribute('disabled')
        })
    }, (err) => {
        $locationButton.removeAttribute('disabled')
        console.log(err.message)
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})