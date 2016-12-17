/** Somali dgram
*
*/
const SomaliDgram = function(){};

SomaliDgram.prototype.dgram = require('dgram');
SomaliDgram.prototype.socket = null;
SomaliDgram.prototype.bindCallback = null;
SomaliDgram.prototype.UDP_PORT = 8000;

//UDPでのメッセージ受信開始
SomaliDgram.prototype.init = function(){
  const _this = this;
  this.socket = this.dgram.createSocket("udp4");

  this.socket.on('listening', function () {
    console.log('UDP Server listening');
  });

  this.socket.on('message', function (message, remote) {
    //console.log(remote.address + ':' + remote.port +' - ' + message);
    if(_this.bindCallback){
      _this.bindCallback(message, remote);
    }
  });

};

//UDPでの受信開始
SomaliDgram.prototype.bind = function(callback){
  const _this = this;
  this.bindCallback = callback;
  this.socket.bind(this.UDP_PORT,'0.0.0.0',function(){
    //_this.socket.setBroadcast(true);
  });
};

//UDPでの送信
SomaliDgram.prototype.send = function(buffer){
  console.log("send");
  //var buffer = new Buffer("nantekottai.");
  //console.log(buffer);
  const _this = this;
  const address = '192.168.1.178';
  this.socket.send(buffer, 0, buffer.length, this.UDP_PORT, address, function(err, bytes) {
    if (err) {
      console.log('err');
      console.log(err);
      return;
    }
    console.log('UDP message sent.');
    //console.log(bytes);
  });
};

//UDPでの受信,送信停止
SomaliDgram.prototype.close = function(callback){
  if(this.socket){
    this.socket.close();
    this.socket = null;
  }
};

module.exports = new SomaliDgram();
