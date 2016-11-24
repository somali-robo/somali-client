/** Somali App
*/
var App = function(){};
App.prototype.uuid = require('node-uuid');
App.prototype.dropbox = require("node-dropbox");
App.prototype.wpi = require('wiring-pi');
App.prototype.JsonDB = require('node-json-db');
App.prototype.jsonDB = null;

App.prototype.config = require('./config.js');
App.prototype.configDevice = require('./config_device.js');
App.prototype.wpa_cli= require('./wpa_cli.js');
App.prototype.empath = require('./empath.js');
App.prototype.hoya = require('./hoya.js');
App.prototype.aplay = require('./aplay.js');
App.prototype.somaliApi = require('./somali_api.js');
App.prototype.SomaliMessage = require('./somali_message.js');
App.prototype.somaliSocket = require('./somali_socket.js');
App.prototype.arecord　= require('./arecord.js');
App.prototype.amixer = require('./amixer.js');
App.prototype.mpu6050 = require('./mpu6050.js');

//録音 時間
App.prototype.REC_SEC = 30;

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
  SOCKET_CONNECT:6,
  MODE_GROUP:7,
  REC_START:8,
  ACCELERATION_START:9
};

App.prototype.status = App.STATUS.DEFAULT;
App.prototype.mode = App.MODE.DEFAULT;
App.prototype.lastErr = null;
App.prototype.intonations = null;
App.prototype.serviceInfo = null;

App.prototype.dropboxApi = null;

//録音したファイル
App.prototype.wavFilePath = "./tmp/rec.wav";

//デフォルトのチャット ルーム
App.prototype.device = null;
App.prototype.defaultChatRoom = null;
App.prototype.KEY_STORE = "SOMALI";
App.prototype.KEY_DEVICE_ID = "/device_id";
App.prototype.KEY_DEFAULT_CHAT_ROOM_ID = "/default_chat_room_id";

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
    case App.STATUS.REC_START:
      this.recStart();
      break;
    case App.STATUS.SOCKET_CONNECT:
      this.socketConnecte();
      break;
    case App.STATUS.ACCELERATION_START:
      this.accelerationStart();
      break;
  }
  this.status = status;
};

//初期化
App.prototype.init = function(){
  console.log("init");
  var _this = this;

  //const message = _this.SomaliMessage.create(_this.config.SERIAL_CODE,_this.SomaliMessage.TYPE_WAV,"remotePath");

  this.jsonDB = new this.JsonDB(this.KEY_STORE,true,false);

  //GPIO初期化
  this.wpi.wiringPiSetupGpio();

  //ステータス用の LED 設定
  this.wpi.pinMode(this.configDevice.STATUS_LED,this.wpi.OUTPUT);
  this.setStatusLed(true);

  //スピーカー・アンプ
  this.wpi.pinMode(this.configDevice.SPEAKER_AMP_POWER,this.wpi.OUTPUT);
  //this.speakerAmpPower(this.wpi.HIGH);

  //音量変更
  this.amixer.pcmVolume(100);

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
    //録音開始
    _this.setStatus(App.STATUS.REC_START);
  });

  //モード スイッチ INT_EDGE_BOTH 両方
  this.wpi.pinMode(this.configDevice.MODE_SWITCH,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.MODE_SWITCH, this.wpi.INT_EDGE_BOTH, function(v) {
    var value = _this.wpi.digitalRead(_this.configDevice.MODE_SWITCH);
    //console.log("MODE_SWITCH " + value);
    //通常モード,グループモード トグル切り替え
    _this.mode = (value == _this.wpi.HIGH)?App.MODE.DEFAULT:App.MODE.GROUP;
    console.log((_this.mode == App.MODE.GROUP)?"GROUP":"DEFAULT");
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

  //Dropbox APIへのアクセスの為 初期化
  this.dropboxApi = new this.dropbox({token:this.config.DROPBOX_ACCESS_TOKEN});

  //デバイス登録処理
  this.setStatus(App.STATUS.REGISTER);
};

//シリアルコードをサーバに登録する
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

      if(exists == false){
        //未登録なら追加
        var name = _this.uuid.v4();
        _this.somaliApi.postDevice(_this.config.SERIAL_CODE,name,function(err,response){
          if(err){
            console.log("err postDevice");
            _this.lastErr = err;
            _this.setStatus(App.STATUS.ERROR);
            return;
          }
          //デバイス登録に成功
          //console.log(response);
          _this.device = response.data;

          //device.idを保存する
          _this.jsonDB.push(_this.KEY_DEVICE_ID,_this.device._id);

          //チャットルーム作成
          _this.somaliApi.postChatRoom(_this.config.SERIAL_CODE,function(err,response){
            if(err){
              console.log("err postChatRoom");
              _this.lastErr = err;
              _this.setStatus(App.STATUS.ERROR);
              return;
            }
            //console.log("postChatRoom");
            //console.log(response);
            _this.defaultChatRoom = response.data;
            const defaultChatRoomId = _this.defaultChatRoom._id;
            //ローカルストア に デフォルトルームIDを保存
            _this.jsonDB.push(_this.KEY_DEFAULT_CHAT_ROOM_ID,defaultChatRoomId);

            const name = _this.defaultChatRoom.name;
            const members = [_this.device];
            _this.somaliApi.putChatRoom(defaultChatRoomId,name,members,[],function(err,response){
              if(err){
                console.log("err putChatRoom");
                _this.lastErr = err;
                _this.setStatus(App.STATUS.ERROR);
                return;
              }
              //console.log(response);

              //デフォルトルームが決定したので ソケット接続をする
              _this.setStatus(App.STATUS.SOCKET_CONNECT);

            });
          });

          //モードスイッチ状態 グループモードの場合
          //同じルータにあるロボットにシリアルコードを通知する
          if(_this.mode == App.MODE.GROUP){
            _this.setStatus(App.STATUS.MODE_GROUP);
          }
        });
      }
      else{
          //登録済み
          //device情報を取得する
          const deviceId = _this.jsonDB.getData(_this.KEY_DEVICE_ID);
          console.log("deviceId "+deviceId);
          _this.somaliApi.getDevice(deviceId,function(err,response){
            if(err){
              console.log("err getDevice");
              _this.lastErr = err;
              _this.setStatus(App.STATUS.ERROR);
              return;
            }
            console.log("device");
            _this.device = response.data;
            console.log(_this.device);
          });

          //defaultChatRoom を探して設定
          var defaultChatRoomId = _this.jsonDB.getData(_this.KEY_DEFAULT_CHAT_ROOM_ID);
          _this.somaliApi.getChatRoom(defaultChatRoomId,function(err,response){
            if(err){
              console.log("err getChatRoom");
              _this.lastErr = err;
              _this.setStatus(App.STATUS.ERROR);
              return;
            }
            //console.log("getChatRoom");
            //console.log(response);

            _this.defaultChatRoom = response.data;

            //デフォルトルームが決定したので ソケット接続をする
            _this.setStatus(App.STATUS.SOCKET_CONNECT);
          });

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
  var _this = this;
  console.log("modeGroup");
  //TODO: シリアルコードをUDPブロードキャストする
  //TODO: UDPからシリアルコードを受け取る
  //TODO: 共通のチャットルーム作成
};

//録音開始
App.prototype.recStart = function(){
  var _this = this;
  console.log("recStart");
  //録音する
  this.arecord.record(this.wavFilePath,this.REC_SEC,function(err, stdout, stderr){
    if (err != null){
      console.log("err");
      return;
    }
    console.log("success");

    //録音内容をDropboxに送信
    var localPath = _this.wavFilePath;
    var remotePath = _this.uuid.v4()+".wav";
    console.log("localPath "+localPath);
    console.log("remotePath "+remotePath);
    _this.dropboxApi.upload("/"+remotePath, localPath, function(err, resp, body) {
      if(err){
        _this.lastErr = err;
        _this.setStatus(App.STATUS.ERROR);
        return;
      }
      //console.log(resp);
      //console.log(body);

      console.log("device");
      console.log(_this.device);
      const message = _this.SomaliMessage.create(_this.device._id,_this.SomaliMessage.TYPE_WAV,remotePath);
      console.log("message");
      console.log(message);
      var value = JSON.stringify(message);
      console.log("value");
      console.log(value);

      //TODO: モードスイッチ状態によって事前に取得したチャットルームを切り替える
      //_this.mode
      _this.somaliSocket.sendMessage(''+value);
    });
  });
};

//ソケット接続等を開始しする
App.prototype.socketConnecte = function(){
  var _this = this;
  console.log("socketConnecte");
  console.log("serviceInfo");
  console.log(this.serviceInfo);
  console.log("defaultChatRoom");
  console.log(this.defaultChatRoom);

  //サービス情報のソケットに接続する
  const roomId = this.defaultChatRoom._id;
  const fromId = this.device._id;
  const socketPort = this.serviceInfo.socketPort;
  this.somaliSocket.init(roomId,fromId,socketPort,function(data){
    console.log('onMessage');
    console.log(data);
    if(data.fromId != _this.device._id){
      //スマートフォンからのメッセージなので音声合成
      const json = JSON.parse(data.value);
      //TODO: json.type 別で処理を変更する
      console.log("value");
      console.log(json.value);
      _this.textToSpeech(json.value,_this.hoya.SPEAKER_HIKARI,function(path, err){
        if (err != null){
          console.log("err");
          return;
        }
        console.log("success");
        //スピーカーアンプをONにする
        _this.speakerAmpPower(_this.wpi.HIGH);
        //再生
        _this.aplay.play(path,function(err, stdout, stderr){
          //アンプをOFFにする
          _this.speakerAmpPower(_this.wpi.LOW);
          if (err != null){
            console.log("err");
            return;
          }
          console.log("success");
        });
      });
    }
  });

  //加速度センサの監視を開始する
  _this.setStatus(App.STATUS.ACCELERATION_START);
};

//スピーカー・アンプ ON,OFF
App.prototype.speakerAmpPower = function(v){
  this.wpi.digitalWrite(this.configDevice.SPEAKER_AMP_POWER,v);
};

//ステータスLEDを点灯 一定時間後に消灯
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

//テキスト音声合成
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

//加速度センサの監視を開始
App.prototype.accelerationStart = function(){
  this.mpu6050.subscribe(100,function(data){
      //console.log("MPU6050");
      console.log(data);
      const v = Math.abs(data.accelY);
      if(1500 > v){
        console.log("isShaken");
      }

      //TODO: ベクトル計算
      //TODO: 閾値を超えたら固定メッセージを送信
  });
};

var app = new App();
app.setStatus(App.STATUS.INIT);
