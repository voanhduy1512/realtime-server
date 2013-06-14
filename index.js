var port = process.env.PORT || 5001;
var io = require('socket.io').listen(port);;
io.configure('production', function () { 
	io.set("transports", ["xhr-polling"]); 
	io.set("polling duration", 10); 
});

var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
var channels = ['post','chat'];
channels.forEach(function(channel){
	redis.subscribe(channel+'-channel');	
	console.log('subscribe to channel ', channel)
});

var clients = {}

io.on('connection', function(socket){
	socket.on('login', function(data){
		console.log('user logged in with data', data);
		if (!clients[data.id])
			clients[data.id] =[];
		clients[data.id].push(socket.id);
		console.log(JSON.stringify(clients));
	});

	socket.on('logout', function(data){
		var index = clients[data.id].indexOf(socket.id);
		detele(clients[data.id][index]);
	});
	socket.on('disconnect', function(){
		//TODO
	});	
});

redis.on('message', function(channel, message){
	message = JSON.parse(message);
	if (message.receivers)
		message.receivers.forEach(function(receiver){
			clients[receiver].forEach(function(socketid){
				io.sockets.socket(socketid).emit(channel, message.data);
			});	
	})
});
