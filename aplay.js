/** 音声ファイル再生
*/
var Aplay = function(){};
Aplay.prototype.exec = require('child_process').exec;
Aplay.prototype.isPlay = false;

// 再生
Aplay.prototype.play = function(path,callback){
  if(this.isPlay == true) return;
  var _this = this;
  var cmd = 'aplay -D plughw:1,0 '+path;
  console.log('play '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    _this.isPlay = false;
    if(callback){
      callback(err, stdout, stderr);
    }
  });
};

module.exports = new Aplay();
