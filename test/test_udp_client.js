const App = function(){};

App.prototype.dgram = require('../dgram.js');
App.prototype.SomaliGroupJoinMessage = require('../somali_group_join_message.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  //初期化
  this.dgram.init(function(msg, remote){

  });

  const code = "ABCDEFG";
  const msg = this.SomaliGroupJoinMessage.create(code,this.SomaliGroupJoinMessage.MODE_JOIN,"");
  setInterval(function(){
    _this.dgram.broadcast(new Buffer( JSON.stringify(msg) ));
  },5*1000);

/*
  //定期的にメッセージを送信してみる
  const message = new Buffer("nantekottai.");
  this.dgram.broadcast(message);
  setInterval(function(){
    _this.dgram.broadcast(message);
  },5*1000);
*/
};

var app = new App();
app.init();
