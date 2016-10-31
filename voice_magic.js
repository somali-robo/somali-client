/** Voice Magic
* DIP SW を i2c(ホストモード),2Bh
* 1 OFF,2 ON,3 OFF,4 OFF
*/
var VoiceMagic = function(){};
VoiceMagic.prototype.wpi    = require('wiring-pi');
VoiceMagic.prototype.config = null;
VoiceMagic.prototype.fd     = null;

VoiceMagic.prototype.POWER_ON = true;
VoiceMagic.prototype.POWER_OFF = false;

//レジスター SRREG 0x0d
VoiceMagic.prototype.REGISTER_SRREG_ADDR = 0x0d;
//レジスター STATUS 0x0e
VoiceMagic.prototype.REGISTER_STATUS_ADDR = 0x0e;

//初期化
VoiceMagic.prototype.init = function(config){
  this.config = config;

  //GPIO初期化
  this.wpi.wiringPiSetupGpio();

  //パワーセーブ機能の制御端子
  this.wpi.pinMode(this.config.VOICE_MAGIC_PSV_N,this.wpi.OUTPUT);

  //初期は電源OFF
  this.power(this.POWER_OFF);

  //音声区間検出回路の制御端子
  this.wpi.pinMode(this.config.VOICE_MAGIC_VCST,this.wpi.OUTPUT);
  //レジスターSTATUSのINT出力
  this.wpi.pinMode(this.config.VOICE_MAGIC_INT,this.wpi.INPUT);
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
};

//音声認識
//ハードウェア仕様 P35
VoiceMagic.prototype.recognition = function(callback){
  console.log("recognition ADDR:"+this.config.VOICE_MAGIC_I2C_ADDR);

  //i2c アドレス 0x2b
  this.fd = this.wpi.wiringPiI2CSetup(this.config.VOICE_MAGIC_I2C_ADDR);
  //console.log('fd '+this.fd);
  if(!this.fd){
    console.log('fb is null');
    return;
  }

  //レジスター SRREG RCG_EN = 1
  console.log("SRREG RCG_EN = 1");
  if((this.wpi.wiringPiI2CWriteReg8(this.fd,this.REGISTER_SRREG_ADDR,0x02))<0){
    console.log("write error register "+this.REGISTER_SRREG_ADDR);
  }

  //音声入力
  var rcgEn = 0x02;
  while (rcgEn == 0x02) {
    //RCG_EN = 0になるまで監視
    rcgEn = this.wpi.wiringPiI2CReadReg8(this.fd,this.REGISTER_SRREG_ADDR);
  }

  //TODO: 判定結果の確認 RJFLG 読み出し
  var status = this.wpi.wiringPiI2CReadReg8(this.fd,this.REGISTER_STATUS_ADDR);
  console.log("READ STATUS");
  console.dir(status);

  //TODO: 判定結果の読み出し
  //TODO: 結果をコールバック
  //callback();
};

module.exports = new VoiceMagic();
