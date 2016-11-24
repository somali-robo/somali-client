/** Socket.ioの処理実装
*/
var SomaliSocket = function(){};
SomaliSocket.prototype.config = null;
SomaliSocket.prototype.client = require('socket.io-client');
SomaliSocket.prototype.socket = null;
SomaliSocket.prototype.init = function(config,callback){
  var _this = this;
  this.config = config;
  var url = "ws://"+this.config.SOCKET_HOST+":"+this.config.SOCKET_PORT;
  this.socket = this.client.connect(url);
  this.socket.on('connect',function(){
      console.log('connect');
      _this.socket.emit("connected", {userId:_this.config.SERIAL_CODE,value: ""});
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
  this.socket.emit("publish", {userId:this.config.SERIAL_CODE,value:value});
};

module.exports = new SomaliSocket();
