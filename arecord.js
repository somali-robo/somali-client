/** 録音
*/
var Arecord = function(){};
Arecord.prototype.exec = require('child_process').exec;

// 録音
Arecord.prototype.record = function(path,sec,callback){
  var cmd = 'arecord -D plughw:1,0 -f U8 -c 1 '+path;
  console.log('arecord '+cmd);
  var child = this.exec(cmd, function(err, stdout, stderr){
    if(callback){
      callback(err, stdout, stderr);
    }
  });
  setTimeout(function(){
    child.kill();
  },sec*1000);
};

module.exports = new Arecord();
