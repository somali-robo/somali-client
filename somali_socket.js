/** Socket.ioの処理実装
*/
var SomaliSocket = function(){};

//SomaliApi.prototype.SOCKET_HOST = "somali-server.herokuapp.com";
SomaliSocket.prototype.SOCKET_HOST = "192.168.11.64";

SomaliSocket.prototype.serialCode = null;
SomaliSocket.prototype.client = require('socket.io-client');
SomaliSocket.prototype.socket = null;
SomaliSocket.prototype.init = function(serialCode,socketPort,callback){
  var _this = this;
  this.serialCode = serialCode;
  var url = "ws://"+this.SOCKET_HOST+":"+socketPort;
  this.socket = this.client.connect(url);
  this.socket.on('connect',function(){
      console.log('connect');
      _this.socket.emit("connected", {userId:_this.serialCode,value: ""});
  });
  this.socket.on('disconnect', function() {
    console.log('Client disconnected');
  });
  this.socket.on('publish', function(data){
      //サーバからデータを受信した時
      //console.log('publish');
      //console.log(data);
      callback(data);
  });
};

SomaliSocket.prototype.publish = function(value){
  this.socket.emit("publish", {userId:this.serialCode,value:value});
};

module.exports = new SomaliSocket();
