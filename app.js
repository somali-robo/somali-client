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
App.prototype.arecord　= require('./arecord.js');
App.prototype.amixer = require('./amixer.js');
App.prototype.mpu6050 = require('./mpu6050.js');
App.prototype.voiceMagic   = require('./voice_magic.js');
App.prototype.dgram = require('./dgram.js');

App.prototype.SomaliMessage = require('./somali_message.js');
App.prototype.somaliApi = require('./somali_api.js');
App.prototype.somaliOta = require('./somali_ota.js');

//録音 最小 時間
App.prototype.REC_MINIMUM_SEC = 5;

//録音 時間
App.prototype.REC_SEC = (30 - App.prototype.REC_MINIMUM_SEC);

App.MODE = {
  SINGLE:0,
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
  ACCELERATION_START:10,
  VOICE_MAGIC_START:11,
  OTA:12,
  GROUP_INIT:13,
  GROUP_JOIN:14,
  SINGLE_INIT:15
};

App.prototype.status = App.STATUS.DEFAULT;
App.prototype.mode = App.MODE.SINGLE;
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
//持ち上げた時
App.prototype.isLift = false;

//OTA開始,終了時に再生するファイル
App.prototype.otaWavFilePath = "./resources/1up.wav";

//ERROR時に再生する音
App.prototype.errWavFilePath = "./resources/error.wav";

//警報音
App.prototype.helpWavFilePath = "./resources/help.wav";

//error発生時の処理
App.prototype.onError = function(){
  const _this = this;
  console.log(this.lastErr);
  try{
    console.log("play start.");
    this.wavPlay(this.errWavFilePath);
  }
  catch(e){
    console.log(e);
  }
};

//各ステータス遷移
App.prototype.setStatus = function(status){
  switch(status){
    case App.STATUS.ERROR:
      //エラーの時の処理
      this.onError();
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
    case App.STATUS.VOICE_MAGIC_START:
      this.voiceMagicStart();
      break;
    case App.STATUS.OTA:
      this.ota();
      break;
    case App.STATUS.GROUP_INIT:
      this.groupInit();
      break;
    case App.STATUS.GROUP_JOIN:
      this.groupJoin();
      break;
    case App.STATUS.SINGLE_INIT:
      this.singleInit();
      break;
  }
  this.status = status;
};

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  this.jsonDB = new this.JsonDB(this.KEY_STORE,true,false);

  //GPIO初期化
  this.wpi.wiringPiSetupGpio();

  //voiceMagic 初期化
  this.voiceMagic.init(this.configDevice);

  //ステータス用の LED 設定
  this.wpi.pinMode(this.configDevice.STATUS_LED,this.wpi.OUTPUT);
  this.setStatusLed(true);

  //スピーカー・アンプ
  this.wpi.pinMode(this.configDevice.SPEAKER_AMP_POWER,this.wpi.OUTPUT);
  //this.speakerAmpPower(this.wpi.HIGH);

  //音量変更
  this.amixer.pcmVolume(100);

  //OTAモードに入るかの確認
  this.wpi.pinMode(this.configDevice.WPS_BUTTON,this.wpi.INPUT);
  var value = _this.wpi.digitalRead(_this.configDevice.WPS_BUTTON);
  if(value == _this.wpi.HIGH){
    //WPSボタン押したまま起動した場合 OTAを実行する
    if(_this.status == App.STATUS.DEFAULT){
      console.log("ota mode.");
      _this.setStatus(App.STATUS.OTA);
      return;
    }
  }

  //WPS ボタン (青色)
  this.wpi.pinMode(this.configDevice.WPS_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.WPS_BUTTON, this.wpi.INT_EDGE_RISING, function(v) {
    console.log("WPS_BUTTON " + v);
    var value = _this.wpi.digitalRead(_this.configDevice.WPS_BUTTON);
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
    //通常モード,グループモード トグル切り替え
    _this.setModeSwitch();
  });
  //通常モード,グループモード の初期値を設定
  _this.setModeSwitch();

  //ネットワークが繋がっているか確認する
  this.somaliApi.getIntonations(function(err,response){
      if(err){
        //未接続
        _this.lastErr = err;
        _this.setStatus(App.STATUS.ERROR);
        return;
      }
      //接続されていたので App.STATUS.CONNECTED の処理をする
      _this.setStatus(App.STATUS.CONNECTED);
  });
};

//通常モード,グループモード トグル切り替え
App.prototype.setModeSwitch = function(){
  const _this = this;
  var value = this.wpi.digitalRead(this.configDevice.MODE_SWITCH);
  console.log("MODE_SWITCH " + value);
  //通常モード,グループモード トグル切り替え
  this.mode = (value == this.wpi.HIGH)?App.MODE.SINGLE:App.MODE.GROUP;
  console.log((this.mode == App.MODE.GROUP)?"GROUP":"SINGLE");
  if(this.mode == App.MODE.SINGLE){
    //通常モード
    this.setStatus(App.STATUS.SINGLE_INIT);
  }
  else{
    //グループ初期設定を開始
    this.setStatus(App.STATUS.GROUP_INIT);
  }
};

//WPS処理
App.prototype.wps = function(){
  const _this = this;
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
      _this.wavPlay(path);
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
      //再生
      _this.wavPlay(path);
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
      //console.log(response.data);
      try{
        //最新メッセージを取得する
        const message = response.data.messages[response.data.messages.length-1];
        //console.log("lastMessage");
        //console.log(_this.lastMessage);
        if(!_this.chatRoomMessages[roomId]) _this.chatRoomMessages[roomId] = [];
        if(_this.isNewMessage(_this.chatRoomMessages[roomId],message)){
          //console.log("isNewMessage true");
          //console.log(message);

          //前回値として保存
          _this.chatRoomMessages[roomId] = response.data.messages;
          _this.jsonDB.push(_this.KEY_CHAT_ROOM_MESSAGES,_this.chatRoomMessages);

          if((message.from.serialCode)&&(message.from.serialCode == _this.config.SERIAL_CODE)){
            //シングルモード時 シリアルコードを確認して自分だった場合
            if(_this.mode == App.MODE.SINGLE){
              //感情にあわせて返事を再生する
              _this.runEmpath(message);
            }
          }
          else{
            //それ以外
            _this.runNewMessage(roomId,message);
          }
        }
      }
      catch(e){
        //console.log("getChatroomMessages err");
        //console.log(e);
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
      if(last == undefined){
        //console.log("last is null");
        return;
      }
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
          _this.wavPlay(path);
        });
      }
    });
  },1*1000);
};

//APIへの接続をして初期設定等を読み出す
App.prototype.apiInit = function(){
  console.log("apiInit");
  const _this = this;

  //Voice Magic 認識を開始する
  if(this.mode == App.MODE.GROUP){
    //グループへ追加する処理を実行する
    this.setStatus(App.STATUS.GROUP_JOIN);
  }

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

  //Voice Magic 認識を開始する
  this.setStatus(App.STATUS.VOICE_MAGIC_START);
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
  const x = Math.abs(data.angX);
  const z = Math.abs(data.angZ);
  const t = 30000;
  if((t < x)||(t < z)){
    console.log("MPU6050 runShaken");
    console.log(data);
    if(this.isShaken == true) return;
    console.log("isShaken");
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
      _this.wavPlay(path,function(){
        //シェイクステータスをリセット
        _this.isShaken = false;
      });
    });
    result = true;
  }
  return result;
};

//最終メッセージがあった場合再生
App.prototype.playLastMessage = function(){
  const _this = this;
  //console.log(this.lastMessage);
  if(!this.lastMessage){
    return;
  }

  const value = this.lastMessage.value;
  //再生対象にしたので破棄
  this.lastMessage = null;
  this.textToSpeech(value,this.hoya.SPEAKER_HIKARI,function(path, err){
    if (err != null){
      console.log("err");
      return;
    }
    console.log("success");
    _this.wavPlay(path);
  });
};

//wavファイル再生
App.prototype.wavPlay = function(path,callback){
  const _this = this;
  //スピーカーアンプをONにする
  this.speakerAmpPower(this.wpi.HIGH);
  //再生
  this.aplay.play(path,function(err, stdout, stderr){
    //アンプをOFFにする
    _this.speakerAmpPower(_this.wpi.LOW);
    if(callback){
      callback();
    }
    if (err != null){
      console.log("err");
      return;
    }
    console.log("success");
  });
};

//よろこぶ
App.prototype.playPleased = function(){
  const _this = this;
  const value = "遊ぼう！";
  this.textToSpeech(value,this.hoya.SPEAKER_HIKARI,function(path, err){
    if (err != null){
      console.log("err");
      return;
    }
    console.log("success");
    //再生
    _this.wavPlay(path);
  });
};

//持ち上げ判定
App.prototype.runLift = function(data){
  var result = false;
  const _this = this;
  const v = Math.abs(data.angY);
  if(1000 < v){
    if(this.isLift == true) return;
    this.isLift = true;
    console.log("MPU6050 runLift");
    console.log(data);

    var resetDelay = 5;

    if(this.mode == App.MODE.SINGLE){
      //シングルモードの場合 よろこぶ
      this.playPleased();
      //持ち上げ判定をresetするまでの時間を長くする。
      resetDelay = 120;
    }
    else{
      //最終メッセージがあった場合再生
      this.playLastMessage();
    }
    //持ち上げステータスをリセット
    setTimeout(function(){
      //持ち上げステータスをリセット
      _this.isLift = false;
    },resetDelay*1000);

    result = true;
  }
  return result;
};

//加速度センサの監視を開始
App.prototype.accelerationStart = function(){
  const _this = this;
  this.mpu6050.subscribe(100,function(data){
    //console.log("MPU6050");
    //console.log(data);

    var result = false;
    //持ち上げられた時
    result = _this.runLift(data);
    if(result == true) return;
    //揺らされた時の処理
    result = _this.runShaken(data);
  });
};

//Voice Magicを有効にする
App.prototype.voiceMagicStart = function(){
  const _this = this;
  //voiceMagic 電源をONにする
  this.voiceMagic.power(this.voiceMagic.POWER_ON);

  //voiceMagic 認識開始
  this.voiceMagic.recognitionInit();
  setInterval(function(){
    //voiceMagic にコマンド認識させる
    _this.voiceMagic.recognition(function(status){
        //voiceMagic 再認識開始
        _this.voiceMagic.recognitionInit();

        if(status != 1){
          //コマンド以外だった
          return;
        }
        console.log("help!!");

        //警報音を本体から鳴らす
        _this.wavPlay(_this.helpWavFilePath);

        if(_this.mode == App.MODE.GROUP){
          //アラートメッセージを送信する
          const message = _this.SomaliMessage.create(_this.device,_this.SomaliMessage.TYPE_ALERT,"助けて！");
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
        }

    });
  },3*1000);

};

//OTA処理を実行する
App.prototype.ota = function(){
  const _this = this;
  //スピーカーアンプをONにする
  this.speakerAmpPower(this.wpi.HIGH);

  //OTA開始時に音を鳴らす
  this.aplay.play(this.otaWavFilePath,function(err, stdout, stderr){
      if (err != null){
        console.log("err");
        return;
      }
      //OTA処理を開始する
      _this.somaliOta.start(function(code,err){
          if(err){
            //OTA 何らかのエラー
            _this.lastErr = err;
            _this.setStatus(App.STATUS.ERROR);
            return;
          }
          //OTA 終了時に音を鳴らす
          _this.aplay.play(_this.otaWavFilePath,function(err, stdout, stderr){
              //アンプをOFFにする
              _this.speakerAmpPower(_this.wpi.LOW);
          });
      });
  });
};

//グループ設定を開始
App.prototype.groupInit = function(){
  console.log("group_init");
  const _this = this;
  this.dgram.init(function(message, remote){
    //UDPからデータを受信したとき
    console.log('onMessage');
  });
};

//グループに追加
App.prototype.groupJoin = function(){
  console.log("group_join");
  const _this = this;
};

//通常モード開始
this.singleInit = function(){
  //UDPからの受信を停止
  this.dgram.close();
};

var app = new App();
app.setStatus(App.STATUS.INIT);
