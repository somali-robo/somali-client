const App = function(){};

App.prototype.dgram = require('../somali_dgram.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  //初期化
  this.dgram.init();
  //受信設定
  this.dgram.bind(function(message, remote){
    console.log('onMessage');
    console.log(remote.address + ':' + remote.port +' - ' + message);
    console.log(remote);
    console.log(message);
  });

};

var app = new App();
app.init();
