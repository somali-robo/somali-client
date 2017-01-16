const App = function(){};
App.prototype.wpi = require('wiring-pi');
App.prototype.aplay = require('../aplay.js');
App.prototype.configDevice = require('../config_device.js');

//BGM音
App.prototype.bgmWavFilePath = "../resources/bgm.wav";

//瞑想音再生リピート
App.prototype.isRepeatBgm = true;
//瞑想音再生中のプロセス
App.prototype.childBgm = null;

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;
  //GPIO初期化
  this.wpi.wiringPiSetupGpio();
  //スピーカー・アンプ
  this.wpi.pinMode(this.configDevice.SPEAKER_AMP_POWER,this.wpi.OUTPUT);
  this.speakerAmpPower(this.wpi.LOW);

  this.playBgm();
};

//スピーカー・アンプ ON,OFF
App.prototype.speakerAmpPower = function(v){
  const _this = this;
  if(v == this.wpi.HIGH){
    //ONは直ぐに実行
    this.wpi.digitalWrite(this.configDevice.SPEAKER_AMP_POWER,v);
  }
  else{
    //delay後にOFFする
    setTimeout(function(){
      _this.wpi.digitalWrite(_this.configDevice.SPEAKER_AMP_POWER,v);
    },3*1000);
  }
};

//wavファイル再生
App.prototype.wavPlay = function(path,callback){
  const _this = this;
  //スピーカーアンプをONにする
  this.speakerAmpPower(this.wpi.HIGH);
  //再生
  const child = this.aplay.play(path,function(code,err){
    //アンプをOFFにする
    _this.speakerAmpPower(_this.wpi.LOW);
    if(callback){
      callback(code,err);
    }
    if (err != null){
      console.log("err");
      return;
    }
    console.log("success");
  });
  return child;
};

//瞑想音 再生
App.prototype.playBgm = function(){
  console.log("playBgm");
  const _this = this;
  const c = function(code,err){
    console.log("code "+code);
    if (err != null){
      console.log("err");
      console.log(err);
      return;
    }
    if(_this.isRepeatBgm == true){
      //リピート
      //console.log("repeat playBgm");
      //_this.playBgm();
    }
  };
  console.log("WavFilePath "+this.bgmWavFilePath);
  this.childBgm = this.wavPlay(this.bgmWavFilePath,c);
};
//瞑想音 停止
App.prototype.stopBgm = function(){
  console.log("stopBgm");
  //瞑想音を停止する
  this.aplay.stop(this.childBgm);
  this.isRepeatBgm = false;
  //アンプをOFFにする
  this.speakerAmpPower(this.wpi.LOW);
};

var app = new App();
app.init();
