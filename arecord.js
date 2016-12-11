/** 録音
*/
var Arecord = function(){};
Arecord.prototype.spawn = require('child_process').spawn;
Arecord.prototype.child = null;

//録音 開始
Arecord.prototype.start = function(path,callback){
  if(this.child != null) return;
  console.log('arecord start');
  var _this = this;
  //var cmd = 'arecord -D plughw:1,0 -d '+sec+' -f U8 -c 1 '+path;
  var cmd = 'arecord';
  var args = ['-D','plughw:1,0','-f','U8','-c','1',path];
  console.log('arecord '+cmd);
  this.child = this.spawn(cmd,args);
  this.child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  this.child.stderr.on('data', function (err) {
    console.log('stderr: ' + err);
    callback(err);
  });

  this.child.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    callback(null);
  });
};

//録音 停止
Arecord.prototype.stop = function(){
  console.log('arecord stop');
  var _this = this;
  if(this.child == null) return;
  this.child.kill();
  this.child = null;
};

module.exports = new Arecord();
