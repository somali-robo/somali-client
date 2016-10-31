/** Socket.ioの処理実装
*/
var SomaliSocket = function(){};
SomaliSocket.prototype.config = null;
SomaliSocket.prototype.client = require('socket.io-client');

SomaliSocket.prototype.init = function(config,callback){
  this.config = config;
  var url = "ws://"+this.config.SOCKET_HOST+":"+this.config.SOCKET_PORT;
  var socket = this.client.connect(url);
  socket.on('connect',function(){
      console.log('connect');
      socket.emit("connected", {userId:this.config.DEVICE_ID,value: ""});
  });
  socket.on('disconnect', function() {
    console.log('Client disconnected');
  });
  socket.on('publish', function(data){
      //サーバからデータを受信した時
      //console.log('publish');
      //console.log(data);
      callback(data);
  });
};

SomaliSocket.prototype.publish = function(value){
  socket.emit("publish", {userId:this.config.DEVICE_ID,value:value});
};

module.exports = new SomaliSocket();
