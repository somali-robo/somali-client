/** Socket.io テスト
*
*/
var App = function(){};
App.prototype.config = require('../config.js');
App.prototype.somaliSocket = require('../somali_socket.js');
App.prototype.hoya = require('../hoya.js');
App.prototype.aplay = require('../aplay.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  var _this = this;
  this.somaliSocket.init(this.config,function(data){
    console.log('publish');
    console.log(data);
    if(data.userId != _this.config.DEVICE_ID){
      //スマートフォンからのメッセージなので音声合成
      _this.textToSpeech(data.value,"bear",function(path, err){
        if (err != null){
          console.log("err");
          return;
        }
        console.log("success");

        //ここで再生
        _this.aplay.play(path,function(err, stdout, stderr){

        });
      });
    }
  });

  setInterval(function(){
    var value = "デバイスからのメッセージ "+Math.floor(Math.random()*100);
    console.log(value);
    //メッセージ送信
    _this.somaliSocket.publish(value);
  }, 5000);
};

App.prototype.textToSpeech = function(text,speaker,callback){
  var apiKey = this.config.DOCOMO_API_KEY;
  var params = {};
  var callbackTextToSpeech = function( err, resp, body ){
    if(!err && resp.statusCode === 200){
      //ファイル書き出し
      var path = './tmp/textToSpeech.wav';
      var fs = require('fs');
      fs.writeFile(path, body, 'binary', function(err){
          callback(path, err);
      });
    }
  };

  this.hoya.textToSpeech(apiKey,text,speaker,params,callbackTextToSpeech);
};

var app = new App();
app.init();
