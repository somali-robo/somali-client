/** Socket.ioの処理実装
*/
var SomaliSocket = function(){};

//SomaliApi.prototype.SOCKET_HOST = "somali-server.herokuapp.com";
SomaliSocket.prototype.SOCKET_HOST = "192.168.11.82";

SomaliSocket.prototype.roomId = null;
SomaliSocket.prototype.fromId = null;
SomaliSocket.prototype.client = require('socket.io-client');
SomaliSocket.prototype.socket = null;
SomaliSocket.prototype.init = function(roomId,fromId,socketPort,callback){
  var _this = this;
  this.roomId = roomId;
  this.fromId = fromId;
  var url = "ws://"+this.SOCKET_HOST+":"+socketPort;
  this.socket = this.client.connect(url);
  this.socket.on('connect',function(){
      console.log('connect');
      _this.socket.emit("connected", {roomId:_this.roomId,fromId:this.fromId,value: ""});
  });
  this.socket.on('disconnect', function() {
    console.log('Client disconnected');
  });
  this.socket.on('message', function(data){
      //サーバからデータを受信した時
      //console.log('publish');
      //console.log(data);
      callback(data);
  });
};

SomaliSocket.prototype.sendMessage = function(value){
  this.socket.emit("message", {roomId:this.roomId,fromId:this.fromId,value:value});
};

module.exports = new SomaliSocket();
