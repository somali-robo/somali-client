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

App.MODE = {
  DEFAULT:0,
  GROUP:1
};

App.STATUS = {
  DEFAULT:0,
  ERROR:1,
  INIT:2,
  WPS_INIT:3,
  CONNECTED:4,
  REGISTER:5,
  MODE_GROUP:6,
};

App.prototype.status = App.STATUS.DEFAULT;
App.prototype.mode = App.MODE.DEFAULT;
App.prototype.lastErr = null;
App.prototype.intonations = null;
App.prototype.serviceInfo = null;

//各ステータス遷移
App.prototype.setStatus = function(status){
  switch(status){
    case App.STATUS.ERROR:
      //TODO: エラーの時の処理
      console.log(this.lastErr);
      break;
    case App.STATUS.INIT:
      this.init();
      break;
    case App.STATUS.WPS_INIT:
      this.wps();
      break;
    case App.STATUS.CONNECTED:
      this.connected();
      break;
    case App.STATUS.REGISTER:
      this.register();
      break;
    case App.STATUS.MODE_GROUP:
        this.modeGroup();
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

  //WPS ボタン (青色)
  this.wpi.pinMode(this.configDevice.WPS_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.WPS_BUTTON, this.wpi.INT_EDGE_RISING, function(v) {
    console.log("WPS_BUTTON " + v);
    //console.log("_this " + _this);
    if(_this.status == App.STATUS.WPS_INIT) return;
    _this.setStatus(App.STATUS.WPS_INIT);
  });

  //REC ボタン (赤色)
  this.wpi.pinMode(this.configDevice.REC_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.REC_BUTTON, this.wpi.INT_EDGE_RISING, function(v) {
    console.log("REC_BUTTON " + v);
    _this.setStatusLed(true);
    //TODO: モードスイッチ状態によって送信パラメータを変更
    //_this.mode
    //TODO: 録音して内容をサーバに送信
  });

  //モード スイッチ INT_EDGE_BOTH 両方
  this.wpi.pinMode(this.configDevice.MODE_SWITCH,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.MODE_SWITCH, this.wpi.INT_EDGE_BOTH, function(v) {
    console.log("MODE_SWITCH " + v);
    if(v < 100){
      //通常モード
      _this.mode = App.MODE.DEFAULT;
    }
    else{
      //グループモード
      _this.mode = App.MODE.GROUP;
    }
    console.log("mode "+(_this.mode == App.MODE.GROUP)?"GROUP":"DEFAULT");
  });

  //ネットワークが繋がっているか確認する
  this.somaliApi.getServiceInfos(function(err,response){
      if(err){
        //未接続
        return;
      }
      //接続されていたので App.STATUS.CONNECTED の処理をする
      _this.setStatus(App.STATUS.CONNECTED);
  });
};

//WPS処理
App.prototype.wps = function(){
  var _this = this;
  this.setStatusLed(true);
  //WPSしてからネットワークに接続
  this.wpa_cli.execute(function(err, stdout, stderr){
    if (err) {
        console.log("err wpa_cli");
        _this.lastErr = err;
        _this.setStatus(App.STATUS.ERROR);
        return;
    }
    if (stderr) {
        _this.lastErr = stderr;
        _this.setStatus(App.STATUS.ERROR);
        return;
    }
    //console.log('stdout '+stdout);
    _this.setStatusLed(true);

    //接続されたら、App.STATUS.CONNECTED の処理をする
    _this.setStatus(App.STATUS.CONNECTED);
  });
};

//ネット接続の確認ができた
App.prototype.connected = function(){
  console.log("connected");
  var _this = this;

  //サービス情報を取得
  this.somaliApi.getServiceInfos(function(err,response){
    if(err){
      console.log("err getIntonations");
      _this.lastErr = err;
      _this.setStatus(App.STATUS.ERROR);
      return;
    }
    _this.serviceInfo = response.data[0];
  });

  //抑揚認識発話 データ取得
  this.somaliApi.getIntonations(function(err,response){
    if(err){
      console.log("err getIntonations");
      _this.lastErr = err;
      _this.setStatus(App.STATUS.ERROR);
      return;
    }
    _this.intonations = response.data;
    //console.log("getIntonations");
    //console.log(_this.intonations);
  });

  //デバイス登録処理
  this.setStatus(App.STATUS.REGISTER);
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
        _this.setStatus(App.STATUS.ERROR);
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
            _this.setStatus(App.STATUS.ERROR);
            return;
          }
          //console.log(response);
          //var data = response.data;

          //モードスイッチ状態 グループモードの場合
          //同じルータにあるロボットにシリアルコードを通知する
          if(_this.mode == App.MODE.GROUP){
            _this.setStatus(App.STATUS.MODE_GROUP);
          }
        });
      }
      else{
          //モードスイッチ状態 グループモードの場合
          //同じルータにあるロボットにシリアルコードを通知する
          if(_this.mode == App.MODE.GROUP){
            _this.setStatus(App.STATUS.MODE_GROUP);
          }
      }
    });
};

//同じルータにあるロボットにシリアルコードを通知する
App.prototype.modeGroup = function(){
  console.log("modeGroup");
  //TODO: シリアルコードをUDPブロードキャストする
  //TODO: UDPからシリアルコードを受け取る
  //TODO: 共通のチャットルーム作成
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
app.setStatus(App.STATUS.INIT);
