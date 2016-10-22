/** 音声ファイル再生
*/
var Aplay = function(){};
Aplay.prototype.exec = require('child_process').exec;

// 再生
Aplay.prototype.play = function(path,callback){
  var cmd = 'aplay -D plughw:1,0 '+path;
  console.log('play '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    callback(err, stdout, stderr);
  });
};

//音量設定
Aplay.prototype.volume = function(volume,callback){
  var cmd = 'amixer set PCM '+volume+'%';
  console.log('volume '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    callback(err, stdout, stderr);
  });
};

module.exports = new Aplay();
