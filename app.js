/** Somali App
*/
var App = function(){};
App.prototype.config = require('./config.js');
App.prototype.configDevice = require('./config_device.js');
App.prototype.wpi    = require('wiring-pi');
App.prototype.wpa_cli= require('./wpa_cli.js');
App.prototype.empath = require('./empath.js');
App.prototype.hoya = require('./hoya.js');
App.prototype.aplay = require('./aplay.js');
App.prototype.somaliApi = require('./somali_api.js');

App.STATUS = {
  INIT:0
};

//各ステータス遷移
App.prototype.status = function(status){
  if(status == App.STATUS.INIT){
    this.init();
  }
  this.status = status;
};

//初期化
App.prototype.init = function(){
  var _this = this;

  //GPIO初期化
  this.wpi.wiringPiSetupGpio();

  //ステータス用の LED 設定
  this.wpi.pinMode(this.configDevice.STATUS_LED,this.wpi.OUTPUT);
  this.setStatusLed(true);

  //WPS ボタン
  this.wpi.pinMode(this.configDevice.WPS_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.WPS_BUTTON, this.wpi.INT_EDGE_RISING, function(delta) {
    console.log("Hit ! " + delta);
    _this.setStatusLed(true);
    //_this.wpa_cli.execute();

    _this.somaliApi.getMessages(function(err,response){
          var data = response.data;
          //最終メッセージを取得
          var i = data.length-1;
          var body = data[i].body;
          console.log(body);

          //ここで再生
          _this.textToSpeech(body,"bear",function(path, err){
            if (err != null){
              console.log("err");
              return;
            }
            console.log("success");

            //ここで再生
            _this.aplay.play(path,function(err, stdout, stderr){

            });
          });
      });
  });

  /*
  //感情解析
  var wavPath = "./tmp/sample1.wav";
  this.empath.analyzeWav(this.config.EMPATH_API_KEY, wavPath, function(json,err){
    if(err != null){
      console.log({'err':err});
    }
    console.log({'json':json});
  });
  */
};

/** ステータスLEDを操作
*/
App.prototype.setStatusLed = function(isOn){
  if(isOn == true){
    //ON
    this.wpi.digitalWrite(this.configDevice.STATUS_LED,this.wpi.HIGH);
    //一定時間経過後に LEDをOFF
    var _this = this;
    setTimeout(function(){
      _this.wpi.digitalWrite(_this.configDevice.STATUS_LED,_this.wpi.LOW);
    },this.config.STATUS_LED_OFF_SEC);
  }
  else{
    //OFF
    this.wpi.digitalWrite(this.configDevice.STATUS_LED,this.wpi.LOW);
  }
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

//メッセージ一覧を取得
App.prototype.getMessages = function(callback){

};

var app = new App();
app.status(App.STATUS.INIT);
