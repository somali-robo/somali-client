
var App = function(){};
App.prototype.wpi    = require('wiring-pi');
App.prototype.configDevice = require('../config_device.js');
App.prototype.amixer  = require('../amixer.js');
App.prototype.aplay  = require('../aplay.js');
App.prototype.arecord  = require('../arecord.js');
App.prototype.voiceMagic  = require('../voice_magic.js');

App.prototype.wavFilePath = "../tmp/test.wav";

//初期化
App.prototype.init = function(){
  console.log("init");

  var _this = this;

  //GPIO初期化
  this.wpi.wiringPiSetupGpio();

  //スピーカー・アンプ
  this.wpi.pinMode(this.configDevice.SPEAKER_AMP_POWER,this.wpi.OUTPUT);
  this.speakerAmpPower(false);

  //WPS ボタン（青） INT_EDGE_RISING 立ち上がる時
  this.wpi.pinMode(this.configDevice.WPS_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.WPS_BUTTON, this.wpi.INT_EDGE_RISING, function(delta) {
    console.log("WPS_BUTTON " + delta);

    _this.arecord.record(_this.wavFilePath,30,function(err, stdout, stderr){
      if (err != null){
        console.log("err");
        return;
      }
      console.log("success");
    });
    
  });

  //REC ボタン(赤) INT_EDGE_RISING 立ち上がる時
  this.wpi.pinMode(this.configDevice.REC_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.configDevice.REC_BUTTON, this.wpi.INT_EDGE_RISING, function(delta) {
    console.log("REC_BUTTON " + delta);

    //アンプをONにする
    _this.speakerAmpPower(true);
    //音量変更
    _this.amixer.pcmVolume(100);
    //再生テスト
    var path = '/usr/share/sounds/alsa/Front_Left.wav';
    _this.aplay.play(path,function(err, stdout, stderr){
      if (err != null){
        console.log("err");
        return;
      }
      console.log("success");
      //アンプをOFFにする
      _this.speakerAmpPower(false);
    });
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
