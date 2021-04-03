const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom, getPublicRoomList } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

//making directory to public to serve to client
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    //emit:send data between client and server

    //send msg for first time user
    // socket.emit('message', generateMessage(msg))//send message to this perticular connection

    //send when some new user has joined chat
    // socket.broadcast.emit('message', generateMessage('A new user has joined!'))// send message to everyone except that connection

    //io.to.emit -> to send everyone for spcefic room
    socket.on('join', ({ username, room, private }, cb) => {
        const { error, user } = addUser({ id: socket.id, username, room, private })

        if (error) {
            return cb(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'welcome to chat application!'))
        socket.broadcast.to(room).emit('message', generateMessage(user.username, `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        cb()
    })
    //send msg to everyone from client
    socket.on('sendMessage', (msg, cb) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(msg)) {
            return cb('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, msg))//send message to everyone
        cb()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })
    socket.on('sendLocation', (coords, cb) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        cb()
    })
    socket.on('roomList', (msg, cb) => {
        cb(getPublicRoomList())
    })
})

server.listen(port, () => {
    console.log(`server is running on port ${port}`)
})