const App = function(){};

App.prototype.dgram = require('../somali_dgram.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  //初期化
  this.dgram.init();
  //受信設定
  this.dgram.bind(function(msg, rinfo){
    console.log(rinfo);
    console.log(msg);
    //console.log('got message from '+ rinfo.address +':'+ rinfo.port);
    //console.log('data len: '+ rinfo.size + " data: "+msg.toString('ascii', 0, rinfo.size));
  });

  //定期的にメッセージを送信してみる
  const message = new Buffer("nantekottai.");
  this.dgram.send(message,this.dgram.UDP_PORT,'255.255.255.255');
  setInterval(function(){
    _this.dgram.send(message,_this.dgram.UDP_PORT,'255.255.255.255');
  },5*1000);
};

var app = new App();
app.init();
