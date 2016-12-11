
var App = function(){};
App.prototype.wpi          = require('wiring-pi');
App.prototype.configDevice = require('../config_device.js');
App.prototype.amixer       = require('../amixer.js');
App.prototype.aplay        = require('../aplay.js');
App.prototype.arecord      = require('../arecord.js');
App.prototype.voiceMagic   = require('../voice_magic.js');
App.prototype.mpu6050      = require('../mpu6050.js');

App.prototype.SPEAKER_POWER_ON = true;
App.prototype.SPEAKER_POWER_OFF = false;
App.prototype.wavFilePath = "../tmp/test.wav";

//初期化
App.prototype.init = function(){
  console.log("init");

  var _this = this;

  //GPIO初期化
  this.wpi.wiringPiSetupGpio();

  //voiceMagic 初期化
  this.voiceMagic.init(this.configDevice);

  //スピーカー・アンプ
  this.wpi.pinMode(this.configDevice.SPEAKER_AMP_POWER,this.wpi.OUTPUT);
  this.speakerAmpPower(this.SPEAKER_POWER_ON);

  //音量変更
  this.amixer.pcmVolume(100);

  //WPS ボタン（青） INT_EDGE_RISING 立ち上がる時
  this.wpi.pinMode(this.configDevice.WPS_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.WPS_BUTTON, this.wpi.INT_EDGE_BOTH, function(delta) {
    var value = _this.wpi.digitalRead(_this.configDevice.WPS_BUTTON);
    console.log("WPS_BUTTON " + value);
    if(value == _this.wpi.HIGH){
      //voiceMagic にコマンド認識させる
      _this.voiceMagic.recognition(function(){
        
      });
    }
  });

  //REC ボタン(赤) INT_EDGE_RISING 立ち上がる時
  this.wpi.pinMode(this.configDevice.REC_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.REC_BUTTON, this.wpi.INT_EDGE_BOTH, function(delta) {
    var value = _this.wpi.digitalRead(_this.configDevice.REC_BUTTON);
    console.log("REC_BUTTON " + value);

    if(value == _this.wpi.HIGH){
      //録音 開始
      _this.arecord.start(_this.wavFilePath,function(err){
        if (err != null){
          console.log("err");
          return;
        }
        console.log("success");

        //スピーカーアンプをONにする
        _this.speakerAmpPower(_this.SPEAKER_POWER_ON);

        //再生テスト
        _this.aplay.play(_this.wavFilePath,function(err, stdout, stderr){
          if (err != null){
            console.log("err");
            return;
          }
          console.log("success");

          //アンプをOFFにする
          _this.speakerAmpPower(_this.SPEAKER_POWER_OFF);
        });

      });
    }
    else{
      //録音 停止
      _this.arecord.stop();
    }
  });

  //モード スイッチ INT_EDGE_BOTH 両方
  this.wpi.pinMode(this.configDevice.MODE_SWITCH,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.MODE_SWITCH, this.wpi.INT_EDGE_BOTH, function(delta) {
    console.log("MODE_SWITCH " + delta);
  });

/*
  //MPU6050のデータを監視
  this.mpu6050.subscribe(30,function(data){
      console.log("MPU6050");
      console.dir(data);
  });
*/
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

var app = new App();
app.init();
