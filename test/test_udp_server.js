const App = function(){};

App.prototype.dgram = require('../dgram.js');
App.prototype.SomaliGroupJoinMessage = require('../somali_group_join_message.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  //初期化
  this.dgram.init(function(message, remote){
    console.log('onMessage');
    console.log(remote.address + ':' + remote.port +' - ' + message);
    console.log(remote);
    console.log(message);
  });

};

var app = new App();
app.init();
