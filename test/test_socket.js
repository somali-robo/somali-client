/** Socket.io テスト
*
*/
var App = function(){};
App.prototype.config = require('../config.js');
App.prototype.somaliSocket = require('../somali_socket.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  var _this = this;
  this.somaliSocket.init(this.config,function(data){
    console.log('publish');
    console.log(data);
  });

  setInterval(function(){
    var value = "デバイスからのメッセージ "+Math.floor(Math.random()*100);
    console.log(value);
    //メッセージ送信
    _this.somaliSocket.publish(msg);
  }, 5000);
};

var app = new App();
app.init();
