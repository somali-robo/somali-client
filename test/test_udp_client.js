const App = function(){};

App.prototype.dgram = require('../somali_dgram.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  this.dgram.init();
  //定期的にメッセージを送信してみる
  const message = new Buffer("nantekottai.");
  this.dgram.send(message,this.dgram.UDP_PORT,'192.168.1.178');
  setInterval(function(){
    _this.dgram.send(message,_this.dgram.UDP_PORT,'192.168.1.178');
  },5*1000);

};

var app = new App();
app.init();
