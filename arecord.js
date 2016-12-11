/** 録音
*/
var Arecord = function(){};
Arecord.prototype.exec = require('child_process').exec;
Arecord.prototype.child = null;

//録音 開始
Arecord.prototype.start = function(path,callback){
  console.log('arecord start');
  var _this = this;
  //var cmd = 'arecord -D plughw:1,0 -d '+sec+' -f U8 -c 1 '+path;
  var cmd = 'arecord -D plughw:1,0 -f U8 -c 1 '+path;
  console.log('arecord '+cmd);
  this.child = this.exec(cmd, function(err, stdout, stderr){
    if(callback){
      callback(err, stdout, stderr);
    }
  });
};

//録音 停止
Arecord.prototype.stop = function(){
  console.log('arecord stop');
  if(this.child == null) return;
  this.child.kill();
};

module.exports = new Arecord();
