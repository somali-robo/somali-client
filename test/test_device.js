
var App = function(){};
App.prototype.config = require('./config.js');
App.prototype.wpi    = require('wiring-pi');
App.prototype.aplay  = require('./aplay.js');

//初期化
App.prototype.init = function(){
  var _this = this;
  //GPIO初期化
  this.wpi.wiringPiSetupGpio();

  //スピーカー・アンプ
  this.wpi.pinMode(this.config.SPEAKER_AMP_POWER,this.wpi.OUTPUT);
  this.wpi.digitalWrite(this.config.SPEAKER_AMP_POWER,this.wpi.LOW);

  //WPS ボタン INT_EDGE_RISING 立ち上がる時
  this.wpi.pinMode(this.config.WPS_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.config.WPS_BUTTON, this.wpi.INT_EDGE_RISING, function(delta) {
    console.log("WPS_BUTTON " + delta);
    //アンプをOFFにする
    _this.speakerAmpPower(true);
  });

  //REC ボタン INT_EDGE_RISING 立ち上がる時
  this.wpi.pinMode(this.config.REC_BUTTON,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.config.REC_BUTTON, this.wpi.INT_EDGE_RISING, function(delta) {
    console.log("REC_BUTTON " + delta);

    //アンプをONにする
    _this.speakerAmpPower(false);

    //再生テスト
    var path = '/usr/share/sounds/alsa/Front_Left.wav';
    _this.aplay.play(path,function(err, stdout, stderr){
      if (err != null){
        console.log("err");
        return;
      }
      console.log("success");
    });
  });

  //モード スイッチ INT_EDGE_BOTH 両方
  this.wpi.pinMode(this.config.MODE_SWITCH,this.wpi.INPUT);
  this.wpi.wiringPiISR(this.config.MODE_SWITCH, this.wpi.INT_EDGE_BOTH, function(delta) {
    console.log("MODE_SWITCH " + delta);
  });
};

//スピーカー・アンプ ON,OFF
App.prototype.speakerAmpPower = function(isOn){
  if(isOn == true){
    //ON
    this.wpi.digitalWrite(this.config.SPEAKER_AMP_POWER,this.wpi.HIGH);
  }
  else{
    //OFF
    this.wpi.digitalWrite(this.config.SPEAKER_AMP_POWER,this.wpi.LOW);
  }
};

var app = new App();
app.init();
