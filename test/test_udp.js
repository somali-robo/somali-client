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
  setInterval(function(){
    var message = new Buffer("nantekottai.");
    _this.dgram.send(message,_this.dgram.UDP_PORT,'127.0.0.1');
  },5*1000);
};

var app = new App();
app.init();
