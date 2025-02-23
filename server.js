const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true // Engine.IO v3 desteği ekle
});
const { ExpressPeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');

const port = process.env.PORT || 3000;

// PeerJS sunucusu
const peerServer = ExpressPeerServer(server, {
    debug: true,
    allow_discovery: true,
    path: '/',
    proxied: true,
    ssl: process.env.NODE_ENV === 'production'
});

// CORS ayarları
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());

app.use('/peerjs', peerServer);

// WebSocket health check
app.get('/health', (req, res) => {
    res.send('OK');
});

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

// Socket.IO bağlantıları
io.on('connection', socket => {
    console.log('Yeni bağlantı:', socket.id);
    
    socket.on('join-room', (roomId, userId) => {
        console.log(`Kullanıcı ${userId} odaya katıldı: ${roomId}`);
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            console.log(`Kullanıcı ${userId} ayrıldı`);
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });

    socket.on('error', (error) => {
        console.error('Socket hatası:', error);
    });
});

// Error handling
server.on('error', (error) => {
    console.error('Server hatası:', error);
});

server.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM sinyali alındı. Server kapatılıyor...');
    server.close(() => {
        console.log('Server kapatıldı');
        process.exit(0);
    });
}); 
