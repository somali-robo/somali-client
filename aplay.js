/** 音声ファイル再生
*/
var Aplay = function(){};

/*
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
*/

Aplay.prototype.spawn = require('child_process').spawn;

// 再生
Aplay.prototype.play = function(path,callback){
    console.log('aplay play');
  const _this = this;
  const child = this.exec('aplay',['-D','plughw:1,0',path], function(err, stdout, stderr){
    if(callback){
      callback(err, stdout, stderr);
    }
  });
  return child;
};

// 停止
Aplay.prototype.stop = function(child){
  console.log('aplay stop');
  child.kill();
};

Aplay.prototype.exec = function(cmd,args,callback){
    const _this = this;
    console.log('start '+cmd);
    const child = this.spawn(cmd,args);
    child.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    child.stderr.on('data', function (err) {
      console.log('stderr: ' + err);
      callback(null,err);
    });

    child.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      callback(code,null);
    });
    return child;
};

module.exports = new Aplay();
