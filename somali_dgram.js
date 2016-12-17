/** Somali dgram
*
*/
const SomaliDgram = function(){};

SomaliDgram.prototype.dgram = require('dgram');
SomaliDgram.prototype.socket = null;
SomaliDgram.prototype.UDP_PORT = 8000;

SomaliDgram.prototype.bindCallback = null;


//UDPでのメッセージ受信開始
SomaliDgram.prototype.init = function(){
  const _this = this;
  this.socket = this.dgram.createSocket("udp4", function (msg, rinfo) {
    //UDPで受信したメッセージ
    //console.log('got message from '+ rinfo.address +':'+ rinfo.port);
    //console.log('data len: '+ rinfo.size + " data: "+msg.toString('ascii', 0, rinfo.size));
    if(this.bindCallback){
      this.bindCallback(msg, rinfo);
    }
  });
};

//UDPでの受信開始
SomaliDgram.prototype.bind = function(callback){
  this.bindCallback = callback;
  this.socket.bind(this.UDP_PORT, '0.0.0.0');
};

//UDPでの送信
SomaliDgram.prototype.send = function(buffer, port, address){
  //var message = new Buffer("nantekottai.");
  this.socket.send(buffer, 0, buffer.length, port, address);
};

//UDPでの受信,送信停止
SomaliDgram.prototype.close = function(callback){
  if(this.socket){
    this.socket.close();
    this.socket = null;
  }
};

module.exports = new SomaliDgram();
