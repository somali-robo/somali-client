/** Voice Magic
* DIP SW を i2c,2Bh
* 1 OFF,2 ON,3 OFF,4 OFF
*/
var VoiceMagic = function(){};
VoiceMagic.prototype.config = null;
VoiceMagic.prototype.wpi    = null;
VoiceMagic.prototype.POWER_ON = true;
VoiceMagic.prototype.POWER_OFF = false;

//初期化
VoiceMagic.prototype.init = function(config,wpi){
  this.config = config;
  thi.wpi = wpi;

  //パワーセーブ機能の制御端子
  this.wpi.pinMode(this.config.VOICE_MAGIC_PSV_N,this.wpi.OUTPUT);
  //音声区間検出回路の制御端子
  this.wpi.pinMode(this.config.VOICE_MAGIC_VCST,this.wpi.OUTPUT);
  //レジスターSTATUSのINT出力
  this.wpi.pinMode(this.config.VOICE_MAGIC_INT,this.wpi.INPUT);

  //初期は電源OFF
  this.power(this.POWER_OFF);
};

//電源 ON,OFF
VoiceMagic.prototype.power = function(isOn){
  if(isOn){
    //電源 ON
    this.wpi.digitalWrite(this.config.VOICE_MAGIC_PSV_N,this.wpi.HIGH);
  }
  else{
    //電源 OFF
    this.wpi.digitalWrite(this.config.VOICE_MAGIC_PSV_N,this.wpi.LOW);
  }
}

module.exports = new VoiceMagic();
