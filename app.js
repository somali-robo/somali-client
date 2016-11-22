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
App.prototype.uuid = require('node-uuid');

App.prototype.lastErr = null;
App.prototype.intonations = null;

App.STATUS = {
  ERROR:0,
  INIT:1,
  REGISTER:2,
};

//各ステータス遷移
App.prototype.status = function(status){
  switch(){
    case App.STATUS.ERROR:
      //TODO: エラーの時の処理
      console.log(this.lastErr);
      break;
    case App.STATUS.INIT:
      this.init();
      break;
    case App.STATUS.REGISTER:
      this.register();
      break;
  }
  this.status = status;
};

//初期化
App.prototype.init = function(){
  console.log("init");
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
  });

  //抑揚認識発話 データ取得
  this.somaliApi.getIntonations(function(err,response){
    if(err){
      console.log("err getDevices");
      _this.lastErr = err;
      _this.status(App.STATUS.ERROR);
      return;
    }
    _this.intonations = response.data;
  });
  //登録処理
  this.status(App.STATUS.REGISTER);
};

//デバイス IDをサーバに登録する
App.prototype.register = function(){
    console.log("register");
    var _this = this;
    //シリアルコードが登録済みか確認する
    this.somaliApi.getDevices(function(err,response){
      if(err){
        console.log("err getDevices");
        _this.lastErr = err;
        _this.status(App.STATUS.ERROR);
        return;
      }
      var data = response.data;
      var exists = data.some(function(d){
          return (_this.config.SERIAL_CODE == d["serialCode"]);
      });

      //未登録なら追加する
      if(exists == false){
        var name = _this.uuid.v4();
        _this.somaliApi.postDevice(_this.config.SERIAL_CODE,name,function(err,response){
          if(err){
            console.log("err postDevice");
            _this.lastErr = err;
            _this.status(App.STATUS.ERROR);
            return;
          }
          //console.log(response);
          //var data = response.data;
        });
      }

    });
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

var app = new App();
app.status(App.STATUS.INIT);
