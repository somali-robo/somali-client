const App = function(){};

App.prototype.serverDgram = require('../somali_dgram.js');
App.prototype.clientDgram = require('../somali_dgram.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  //初期化
  this.serverDgram.init();
  //受信設定
  this.serverDgram.bind(function(msg, rinfo){
    console.log(rinfo);
    console.log(msg);
    //console.log('got message from '+ rinfo.address +':'+ rinfo.port);
    //console.log('data len: '+ rinfo.size + " data: "+msg.toString('ascii', 0, rinfo.size));
  });

  this.clientDgram.init();
  //定期的にメッセージを送信してみる
  const message = new Buffer("nantekottai.");
  this.clientDgram.send(message,this.clientDgram.UDP_PORT,'127.0.0.1');
  setInterval(function(){
    _this.clientDgram.send(message,_this.clientDgram.UDP_PORT,'127.0.0.1');
  },5*1000);
};

var app = new App();
app.init();
