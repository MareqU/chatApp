const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { getUser, getUsersInRoom, addUser, removeUser } = require('./utils/users');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error)
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome'));
        
        // Send message about new joined user
        socket.broadcast.to(user.room).emit('message', 
            generateMessage('Admin', `${user.username} has joined!`)
        )
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // Send message from user
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter();
        const userData = getUser(socket.id)
        
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(userData.room).emit('message', 
            generateMessage(userData.username, message)
        )
        
        callback()
    })

    // Send message when user disconnect
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', 
                generateMessage('Admin', `${user.username} has left!`)
            )
            
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    //
    socket.on('sendLocation', (coords, callback) => {
        const userData = getUser(socket.id)

        io.to(userData.room).emit('locationMessage', generateLocationMessage(
            userData.username,
            `${coords.latitude},${coords.longitude}`
        ))
        
        callback()
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})