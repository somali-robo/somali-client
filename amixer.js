/** オーディオミキサー
*/
var Amixer = function(){};
Amixer.prototype.exec = require('child_process').exec;

//再生 音量設定
Amixer.prototype.pcmVolume = function(volume,callback){
  var cmd = 'amixer set PCM '+volume+'%';
  console.log('pcmVolume '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    callback(err, stdout, stderr);
  });
};

//録音音量 設定
Amixer.prototype.micVolume = function(volume,callback){
  var cmd = 'amixer sset Mic '+volume+'%';
  console.log('micVolume '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    callback(err, stdout, stderr);
  });
};

module.exports = new Amixer();
