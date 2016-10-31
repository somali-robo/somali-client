/** Socket.io テスト
*
*/
var App = function(){};
App.prototype.wpi          = require('wiring-pi');
App.prototype.config       = require('../config.js');
App.prototype.configDevice = require('../config_device.js');
App.prototype.somaliSocket = require('../somali_socket.js');
App.prototype.hoya         = require('../hoya.js');
App.prototype.aplay        = require('../aplay.js');

App.prototype.SPEAKER_POWER_ON = true;
App.prototype.SPEAKER_POWER_OFF = false;
App.prototype.wavFilePath = "../tmp/test.wav";

//初期化
App.prototype.init = function(){
  console.log("init");

  //GPIO初期化
  this.wpi.wiringPiSetupGpio();

  //スピーカー・アンプ
  this.wpi.pinMode(this.configDevice.SPEAKER_AMP_POWER,this.wpi.OUTPUT);
  this.speakerAmpPower(this.SPEAKER_POWER_ON);

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
  }, 10*1000);
};

//スピーカー・アンプ ON,OFF
App.prototype.speakerAmpPower = function(isOn){
  if(isOn == true){
    //ON
    this.wpi.digitalWrite(this.configDevice.SPEAKER_AMP_POWER,this.wpi.HIGH);
  }
  else{
    //OFF
    this.wpi.digitalWrite(this.configDevice.SPEAKER_AMP_POWER,this.wpi.LOW);
  }
};

//音声合成
App.prototype.textToSpeech = function(text,speaker,callback){
  var _this = this;
  var apiKey = this.config.DOCOMO_API_KEY;
  var params = {};
  var callbackTextToSpeech = function( err, resp, body ){
    if(!err && resp.statusCode === 200){
      //ファイル書き出し
      var fs = require('fs');
      fs.writeFile(_this.wavFilePath, body, 'binary', function(err){
          callback(_this.wavFilePath, err);
      });
    }
  };

  this.hoya.textToSpeech(apiKey,text,speaker,params,callbackTextToSpeech);
};

var app = new App();
app.init();
