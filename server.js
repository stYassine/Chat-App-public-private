const MongoClient =require('mongodb').MongoClient;
const io =require('socket.io').listen(4000);
const dbUrl ='mongodb://127.0.0.1/socketchat';
/*
    Connect To MongoDb
*/
MongoClient.connect(dbUrl, (err, db) => {

    if(err) throw err;
    console.log('Connect To Db');

    /// set db constants
    const dbChat =db.db('socketchat');
    const users =dbChat.collection('users');
    const messages =dbChat.collection('messages');

    /*
    * Connect To Socket.io
    */
    io.on('connection', function(socket){
    
        console.log('Connected to socket.io ID : '+socket.id);
   
        /*
        * Handle Enter Chat / log on
        */
        socket.on('username', (username) => {
            console.log(username);

            users.insertOne({socketId: socket.id, username: username});

            users.find().toArray(function(err, result){
                if(err) throw err;
                socket.emit('users', result);
            });

            messages.find().toArray(function(err, result){
                if(err) throw err;
                socket.emit('messages', result);
            });

            socket.broadcast.emit('logon', {
                socketId: socket.id,
                username: username
            });
        });

        /*
        * Handle log off
        */
        socket.on('disconnect', function(){
            console.log(`user ${socket.id} Disconnected !`);
            users.deleteOne({socketId: socket.id}, function(){
                socket.broadcast.emit('logoff', socket.id);
            });
        });


        /*
        * Handle Chat Input
        */
        socket.on('input', function(data){
            if(data.publicChat){
                messages.insertOne({ username: data.username, message: data.message, date: data.date});
            }
            io.emit('output', data);
        });

        /*
        * Handle second User trigger
        */
        socket.on('secondUserTrigger', function(data){
            socket.to(data.secondUserId).emit('secondUserChatWindow', data);
        });


    });


});