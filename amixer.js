/** オーディオミキサー
*/
var Amixer = function(){};
Amixer.prototype.exec = require('child_process').exec;

//再生 音量設定
Amixer.prototype.pcmVolume = function(volume,callback){
  var cmd = 'sudo amixer -c 1 sset Speaker '+volume+'%';
  console.log('pcmVolume '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    //console.log("callback "+callback);
    if(callback){
      callback(err, stdout, stderr);
    }
  });
};

//録音音量 設定
Amixer.prototype.micVolume = function(volume,callback){
  var cmd = 'amixer -c 1 sset Mic '+volume+'%';
  console.log('micVolume '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    console.log("callback "+callback);
    if(callback){
      callback(err, stdout, stderr);
    }
  });
};

module.exports = new Amixer();
