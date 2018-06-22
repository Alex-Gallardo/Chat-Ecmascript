const Chat = require('./models/chat');
module.exports = io =>{

    let users = {  };

    io.on('connection', async socket =>{
        console.log('New user connected');

        let messages = await Chat.find({}).limit(8);
        socket.emit('load old msgs', messages);

        socket.on('new user', (data, cb) => {
            console.log(data);
            if(data in users){
                cb(false);
            } else {
                cb(true);
                socket.nickname = data;
                users[socket.nickname] = socket;
                //io.sockets.emit('usernames', nicknames);
                updateNicknames();
            };
        });

        socket.on('send message', async (data,cb) => {
            
            var msg = data.trim();

            if(msg.substr(0,3) === '/p '){
                msg = msg.substr(3);
                const index = msg.indexOf(' ');
                if(index !== -1){
                    var name = msg.substring(0, index);
                    var msg = msg.substring(index + 1);
                    if (name in users){
                        users[name].emit('whisper', {
                            msg,
                            nick: socket.nickname
                        });
                    } else {
                        cb('Error! Please enter a Valid User');
                    }
                } else {
                    cb('Error! Please enter your message');
                }
            } else {
                var newMsg = new Chat({
                    msg: msg,
                    nick: socket.nickname
                });
                await newMsg.save();

                io.sockets.emit('new message', {
                    msg: data,
                    nick: socket.nickname
                });
            }
        });

        socket.on('disconnect', data => {
            if(!socket.nickname) return;
            delete users[socket.nickname];
            updateNicknames();
        });

        function updateNicknames(){
            io.sockets.emit('usernames', Object.keys(users));
        }

    });
}
