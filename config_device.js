/** デバイスのピン設定
*
*/
var ConfigDevice = function(){};

//マイク ボリューム(0〜100)
ConfigDevice.prototype.MIC_VOLUME = 100;

//スピーカー ボリューム(0〜100)
ConfigDevice.prototype.SPEAKER_VOLUME = 100;

//ステータス LED
ConfigDevice.prototype.STATUS_LED = 4;

//WPS ボタン (水色)
ConfigDevice.prototype.WPS_BUTTON = 22;

//REC ボタン (赤色)
ConfigDevice.prototype.REC_BUTTON = 23;

//モード切り替え
ConfigDevice.prototype.MODE_SWITCH = 24;

//スピーカー・アンプ
ConfigDevice.prototype.SPEAKER_AMP_POWER = 25;

//Voice Magic i2c,0x2B
ConfigDevice.prototype.VOICE_MAGIC_I2C_ADDR  = (0x2b);
ConfigDevice.prototype.VOICE_MAGIC_PSV_N = 18;
ConfigDevice.prototype.VOICE_MAGIC_INT   = 17;
ConfigDevice.prototype.VOICE_MAGIC_VCST  = 27;

//MPU6050 i2c
ConfigDevice.prototype.MPU6050_I2C_ADDR  = (0x68);

module.exports = new ConfigDevice();
