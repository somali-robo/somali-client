/** 録音
*/
var Arecord = function(){};
Arecord.prototype.exec = require('child_process').exec;

// 録音
Arecord.prototype.record = function(path,sec,callback){
  var _this = this;
  var cmd = 'arecord -D plughw:1,0 -d '+sec+' -f U8 -c 1 '+path;
  console.log('arecord '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    if(callback){
      callback(err, stdout, stderr);
    }
  });
};

module.exports = new Arecord();
