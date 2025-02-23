const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');

const port = process.env.PORT || 3000;

// PeerJS sunucusu
const peerServer = ExpressPeerServer(server, {
    debug: true,
    allow_discovery: true,
    path: '/',
    proxied: true
});

// CORS ayarları
app.use(cors());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/room/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

app.get('/:room', (req, res) => {
    res.redirect('/');
});

// Oda oluşturma endpoint'i
app.post('/create-room', (req, res) => {
    const roomId = uuidV4();
    res.json({ roomId });
});

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        });
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 