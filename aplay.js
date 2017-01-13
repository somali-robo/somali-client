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
Aplay.prototype.child = null;

// 再生
Aplay.prototype.play = function(path,callback){
    console.log('aplay play');
  if(this.isPlay == true) return;
  var _this = this;
  this.exec('aplay',['-D','plughw:1,0',path], function(err, stdout, stderr){
    _this.isPlay = false;
    if(callback){
      callback(err, stdout, stderr);
    }
  });
};

// 停止
Aplay.prototype.stop = function(){
  console.log('aplay stop');
  var _this = this;
  if(this.child == null) return;
  this.child.kill();
  this.isPlay = false;
};

Aplay.prototype.exec = function(cmd,args,callback){
    if(this.child != null){
      callback(null,"child is not null.");
      return;
    }
    const _this = this;
    console.log('start '+cmd);
    this.child = this.spawn(cmd,args);
    this.child.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    this.child.stderr.on('data', function (err) {
      console.log('stderr: ' + err);
      callback(null,err);
    });

    this.child.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      _this.child = null;
      callback(code,null);
    });
};

module.exports = new Aplay();
