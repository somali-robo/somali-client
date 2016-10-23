
var App = function(){};
App.prototype.wpi    = require('wiring-pi');
App.prototype.configDevice = require('../config_device.js');
App.prototype.amixer  = require('../amixer.js');
App.prototype.aplay  = require('../aplay.js');
App.prototype.arecord  = require('../arecord.js');
App.prototype.voiceMagic  = require('../voice_magic.js');
App.prototype.MPU6050 = require('mpu6050-wiringpi');
App.prototype.mpu6050 = null;

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
  this.voiceMagic.init(this.configDevice,this.wpi);

  //スピーカー・アンプ
  this.wpi.pinMode(this.configDevice.SPEAKER_AMP_POWER,this.wpi.OUTPUT);
  this.speakerAmpPower(this.SPEAKER_POWER_ON);

  //音量変更
  this.amixer.pcmVolume(100);

  //WPS ボタン（青） INT_EDGE_RISING 立ち上がる時
  this.wpi.pinMode(this.configDevice.WPS_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.WPS_BUTTON, this.wpi.INT_EDGE_RISING, function(delta) {
    console.log("WPS_BUTTON " + delta);

    //録音テスト
    _this.arecord.record(_this.wavFilePath,3,function(err, stdout, stderr){
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

  });

  //REC ボタン(赤) INT_EDGE_RISING 立ち上がる時
  this.wpi.pinMode(this.configDevice.REC_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.REC_BUTTON, this.wpi.INT_EDGE_RISING, function(delta) {
    console.log("REC_BUTTON " + delta);
    //MPU-6050 初期化
    var data = _this.MPU6050.read();
    console.log("MPU6050 read");
    console.dir(data);


    /*
    _this.voiceMagic.power(_this.voiceMagic.POWER_ON);
    _this.voiceMagic.recognition(function(){

    });*/
  });

  //モード スイッチ INT_EDGE_BOTH 両方
  this.wpi.pinMode(this.configDevice.MODE_SWITCH,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.MODE_SWITCH, this.wpi.INT_EDGE_BOTH, function(delta) {
    console.log("MODE_SWITCH " + delta);
  });
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
