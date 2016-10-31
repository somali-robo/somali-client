/** Socket.ioの処理実装
*/
var SomaliSocket = function(){};
SomaliSocket.prototype.config = require('./config.js');
SomaliSocket.prototype.client = require('socket.io-client');

SomaliSocket.prototype.init = function(){
  var url = "ws://"+this.config.SOCKET_HOST+":"+this.config.SOCKET_PORT;
  var socket = this.client.connect(url);
  socket.on('connect',function(){
      console.log('connect');
      socket.emit("connected", {userId:this.config.DEVICE_ID,value: ""});
  });
};

SomaliSocket.prototype.publish = function(value){
  socket.emit("publish", {userId:this.config.DEVICE_ID,value:value});
};

module.exports = new SomaliSocket();
