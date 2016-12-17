const App = function(){};

App.prototype.dgram = require('../somali_dgram.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  //初期化
  this.dgram.init();
/*
  this.dgram.bind(function(msg, remote){
    console.log('onMessage');
    console.log(remote.address + ':' + remote.port +' - ' + message);
    console.log(remote);
    console.log(msg);
  });
*/
  //定期的にメッセージを送信してみる
  const message = new Buffer("nantekottai.");
  this.dgram.send(message,this.dgram.UDP_PORT);
  setInterval(function(){
    _this.dgram.send(message,_this.dgram.UDP_PORT);
  },5*1000);

};

var app = new App();
app.init();
