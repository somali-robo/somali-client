/** Somali App
*/
var App = function(){};
App.prototype.uuid = require('node-uuid');
App.prototype.dropbox = require("./dropbox.js");
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
App.prototype.arecord　= require('./arecord.js');
App.prototype.amixer = require('./amixer.js');
App.prototype.mpu6050 = require('./mpu6050.js');

//録音 最小 時間
App.prototype.REC_MINIMUM_SEC = 5;

//録音 時間
App.prototype.REC_SEC = (30 - App.prototype.REC_MINIMUM_SEC);

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
  API_INIT:6,
  MODE_GROUP:7,
  REC_START:8,
  REC_STOP:9,
  ACCELERATION_START:10
};

App.prototype.status = App.STATUS.DEFAULT;
App.prototype.mode = App.MODE.DEFAULT;
App.prototype.lastErr = null;
App.prototype.intonations = null;
App.prototype.chatRoomMessages = {};
App.prototype.broadcastMessages = {};
App.prototype.lastMessage = null;

//録音したファイル
App.prototype.wavFilePath = "./tmp/rec.wav";

//デフォルトのチャット ルーム
App.prototype.device = null;
App.prototype.defaultChatRoom = null;
App.prototype.KEY_STORE = "SOMALI";
App.prototype.KEY_DEVICE_ID = "/device_id";
App.prototype.KEY_DEFAULT_CHAT_ROOM_ID = "/default_chat_room_id";
App.prototype.KEY_CHAT_ROOM_MESSAGES = "/chat_room_messages";
App.prototype.KEY_BROADCAST_MESSAGES = "/broadcast_messages";

//揺らされた
App.prototype.isShaken = false;

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
    case App.STATUS.API_INIT:
        this.apiInit();
        break;
    case App.STATUS.MODE_GROUP:
      this.modeGroup();
      break;
    case App.STATUS.REC_START:
      this.recStart();
      break;
    case App.STATUS.REC_STOP:
      this.recStop();
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
  this.wpi.wiringPiISR(this.configDevice.REC_BUTTON, this.wpi.INT_EDGE_BOTH, function(v) {
    var value = _this.wpi.digitalRead(_this.configDevice.REC_BUTTON);
    console.log("REC_BUTTON " + value);
    //_this.setStatusLed(true);
    if(value == _this.wpi.HIGH){
      //録音 開始
      _this.setStatus(App.STATUS.REC_START);
    }
    else{
      //録音 停止
      _this.setStatus(App.STATUS.REC_STOP);
    }
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
  this.somaliApi.getIntonations(function(err,response){
      if(err){
        //未接続
        //TODO: 失敗時に何か鳴らす？
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
  this.dropbox.init(this.config.DROPBOX_ACCESS_TOKEN);

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
          //console.log("postDevice");
          //console.log(response);
          _this.device = response.data;

          //device.idを保存する
          _this.jsonDB.push(_this.KEY_DEVICE_ID,_this.device._id);

          //チャットルーム作成
          const chatRoomName = "PRIVATE";
          const members = [_this.device];
          _this.somaliApi.postChatRoom(chatRoomName,members,[],function(err,response){
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

            //APIへの接続をして初期設定等を読み出す
            _this.setStatus(App.STATUS.API_INIT);
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
            //console.log(_this.device);
          });

          //アクティブなチャットルームを探して設定
          const roomId = _this.getActiveRoomId();
          _this.somaliApi.getChatRoom(roomId,function(err,response){
            if(err){
              console.log("err getChatRoom");
              _this.lastErr = err;
              _this.setStatus(App.STATUS.ERROR);
              return;
            }
            //console.log("getChatRoom");
            //console.log(response);

            _this.defaultChatRoom = response.data;

            //APIへの接続をして初期設定等を読み出す
            _this.setStatus(App.STATUS.API_INIT);
          });

          //モードスイッチ状態 グループモードの場合
          //同じルータにあるロボットにシリアルコードを通知する
          if(_this.mode == App.MODE.GROUP){
            _this.setStatus(App.STATUS.MODE_GROUP);
          }
      }
    });
};

//新規メッセージか確認
App.prototype.isNewMessage = function(messages,lastMessage){
  //console.log("isNewMessage");
  //console.log(lastMessage);
  //console.log(messages);
  var result = true;
  messages.forEach(function(element, index, array){
      //console.log("element "+element.from.serialCode);
      if(element._id == lastMessage._id){
        result = false;
      }
  });
  return result;
};


App.prototype.runNewMessage = function(roomId,message){
  const _this = this;
  if (message.type == this.SomaliMessage.TYPE_TEXT){
    //新規追加されたメッセージを読み上げる
    this.textToSpeech(message.value,_this.hoya.SPEAKER_HIKARI,function(path, err){
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
  else if (message.type == this.SomaliMessage.TYPE_TEXT){
    //TODO: WAV の場合 Downloadして再生
  }

  //最後に再生したメッセージを保存する
  this.lastMessage = message;
};

//感情にあわせて返事を再生する
App.prototype.runEmpath = function(message){
  console.log("empath");
  const _this = this;
  const empath = message.empath;
  var selectKey = null;
  if(empath["error"] == 0){
    var max = 0;
    for(key in empath){
      if(max < empath[key]){
        selectKey = key;
        max = empath[key];
      }
    }
  }

  if(selectKey != null){
    //console.log("selectKey "+selectKey);
    const i = Math.floor( Math.random() * this.intonations.length );
    const value = this.intonations[i][selectKey];
    console.log(value);

    //再生させる
    _this.textToSpeech(value,_this.hoya.SPEAKER_HIKARI,function(path, err){
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
};

//チャットルームの新規メッセージを監視する
App.prototype.monitoringChatroomMessages = function(){
  const _this = this;
  //チャットルームのメッセージを監視
  setInterval(function(){
    //アクテイブルームIDを取得する
    const roomId = _this.getActiveRoomId();
    _this.somaliApi.getChatroomMessages(roomId,function(err,response){
      if(err){
        console.log("err getChatroomMessages");
        _this.lastErr = err;
        _this.setStatus(App.STATUS.ERROR);
        return;
      }
      //console.log("getChatroomMessages");
      //console.log(response.data.messages);
      try{
        //最新メッセージを取得する
        const message = response.data.messages[response.data.messages.length-1];
        //console.log("lastMessage");
        //console.log(_this.lastMessage);
        if(!_this.chatRoomMessages[roomId]) _this.chatRoomMessages[roomId] = [];
        if(_this.isNewMessage(_this.chatRoomMessages[roomId],message)){
          console.log("isNewMessage true");
          //console.log(message);

          //前回値として保存
          _this.chatRoomMessages[roomId] = response.data.messages;
          _this.jsonDB.push(_this.KEY_CHAT_ROOM_MESSAGES,_this.chatRoomMessages);

          if((message.from.serialCode)&&(message.from.serialCode == _this.config.SERIAL_CODE)){
            //シリアルコードを確認して自分だった場合
            //感情にあわせて返事を再生する
            _this.runEmpath(message);
          }
          else{
            //それ以外
            _this.runNewMessage(roomId,message);
          }
        }
      }
      catch(e){
        console.log("getChatroomMessages err");
        console.log(e);
      }
    });
  },1*1000);
};

//一斉送信メッセージの監視
App.prototype.monitoringBroadcastMessages = function(){
  const _this = this;
  setInterval(function(){
    _this.somaliApi.getBroadcastMessages(function(err,response){
      if (err != null){
        console.log("err");
        return;
      }
      const last = response.data[response.data.length-1];
      //console.log("last");
      //console.log(last);
      //console.log(_this.broadcastMessages);
      if(_this.broadcastMessages[last._id] == undefined){
        //新規一斉送信メッセージなので再生
        _this.broadcastMessages[last._id] = last;
        //console.log(_this.broadcastMessages);

        //保存
        _this.jsonDB.push(_this.KEY_BROADCAST_MESSAGES,_this.broadcastMessages);

        _this.textToSpeech(last.value,_this.hoya.SPEAKER_HIKARI,function(path, err){
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
  },1*1000);
};

//APIへの接続をして初期設定等を読み出す
App.prototype.apiInit = function(){
  console.log("apiInit");
  var _this = this;

  try{
    //保存済みのメッセージ一覧を取得
    this.chatRoomMessages = this.jsonDB.getData(this.KEY_CHAT_ROOM_MESSAGES);
  }
  catch(e){
  }
  try{
    //保存済み 一斉送信一覧を取得
    this.broadcastMessages = this.jsonDB.getData(this.KEY_BROADCAST_MESSAGES);
  }
  catch(e){
  }

  //console.log("this.chatRoomMessages");
  //console.log(this.chatRoomMessages);

  //チャットルームの新規メッセージを監視する
  this.monitoringChatroomMessages();

  //一斉送信メッセージの監視
  this.monitoringBroadcastMessages();

  //加速度センサの監視を開始する
  this.setStatus(App.STATUS.ACCELERATION_START);
};

//同じルータにあるロボットにシリアルコードを通知する
App.prototype.modeGroup = function(){
  var _this = this;
  console.log("modeGroup");
  //TODO: シリアルコードをUDPブロードキャストする
  //TODO: UDPからシリアルコードを受け取る
  //TODO: 共通のチャットルーム作成
};

//アクテイブなルームのIDを取得する
App.prototype.getActiveRoomId = function(){
  //TODO: モードスイッチ状態によって事前に取得したチャットルームを切り替える
  var roomId = this.jsonDB.getData(this.KEY_DEFAULT_CHAT_ROOM_ID);
  return roomId;
};
//録音開始
App.prototype.recStart = function(){
  var _this = this;
  console.log("recStart");

  //録音タイムアウトタイマーを開始
  setTimeout(function(){
    if(_this.status != App.STATUS.REC_START) return;
    //REC_SEC秒 ステータスが変更されていなかった場合,録音停止
    _this.setStatus(App.STATUS.REC_STOP);
  },this.REC_SEC*1000);

  //録音する
  this.arecord.start(this.wavFilePath,function(err, stdout, stderr){
    if (err != null){
      console.log("arecord err");
      return;
    }
    console.log("arecord success");

    //録音内容をDropboxに送信
    var localPath = _this.wavFilePath;
    var remotePath = _this.uuid.v4()+".wav";
    //console.log("localPath "+localPath);
    //console.log("remotePath "+remotePath);
    _this.dropbox.upload(remotePath, localPath, function(err, resp, body) {
      if(err){
        _this.lastErr = err;
        _this.setStatus(App.STATUS.ERROR);
        return;
      }
      //console.log("device");
      //console.log(_this.device);
      const message = _this.SomaliMessage.create(_this.device,_this.SomaliMessage.TYPE_WAV,remotePath);
      message._id = _this.uuid.v4();

      //アクテイブルームIDを取得する
      const roomId = _this.getActiveRoomId();
      //メッセージを送信
      _this.somaliApi.putChatroomMessage(roomId,message,function(err,result){
        if(err){
          _this.lastErr = err;
          _this.setStatus(App.STATUS.ERROR);
          return;
        }
        //console.log("success");
        //console.log(result);
      });
    });
  });
};

//録音停止
App.prototype.recStop = function(){
  var _this = this;
  console.log("recStop");
  setTimeout(function(){
    _this.arecord.stop();
  },this.REC_MINIMUM_SEC*1000);
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

//揺らされた場合
App.prototype.runShaken = function(data){
  var result = false;
  const _this = this;
  const v = Math.abs(data.angY);
  if(25000 < v){
    console.log("MPU6050 runShaken");
    console.log(data);

    if(this.isShaken == true) return;
    console.log("isShaken v:"+v);
    this.isShaken = true;
    //閾値を超えたら固定メッセージを再生
    var msg = "ゆらさないで";
    this.textToSpeech(msg,this.hoya.SPEAKER_HIKARI,function(path, err){
      if (err != null){
        console.log("err");
        //シェイクステータスをリセット
        _this.isShaken = false;
        return;
      }
      console.log("success");
      //スピーカーアンプをONにする
      _this.speakerAmpPower(_this.wpi.HIGH);
      //再生
      _this.aplay.play(path,function(err, stdout, stderr){
        //アンプをOFFにする
        _this.speakerAmpPower(_this.wpi.LOW);
        //シェイクステータスをリセット
        _this.isShaken = false;
        if (err != null){
          console.log("err");
          return;
        }
        console.log("success");
      });
    });
    result = true;
  }
  return result;
};

//持ち上げ判定
App.prototype.runLift = function(data){
  var result = false;
  const _this = this;
  const v = Math.abs(data.accelY);
  if(1000 < v){
    console.log("MPU6050 runLift");
    console.log(data);
    //最後に受信したメッセージを再生する
    console.log(this.lastMessage);
    result = true;
  }
  return result;
  /*
  {
  accelX: -312,
  accelY: 8740,
  accelZ: 4464,
  angX: -5488,
  angY: 26199,
  angZ: 4144
  }
  */
};

//加速度センサの監視を開始
App.prototype.accelerationStart = function(){
  const _this = this;
  this.mpu6050.subscribe(100,function(data){
    var result = false;
    //持ち上げられた時
    result = _this.runLift(data);
    if(result == true) return;
    //揺らされた時の処理
    result = _this.runShaken(data);
  });
};

var app = new App();
app.setStatus(App.STATUS.INIT);
