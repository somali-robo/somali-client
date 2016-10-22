/** 録音
*/
var Arecord = function(){};
Arecord.prototype.exec = require('child_process').exec;
Arecord.prototype.child = null;

// 録音
Arecord.prototype.record = function(path,sec,callback){
  var _this = this;
  if(this.child != null){
    console.log("child is not null");
    return;
  }

  var cmd = 'arecord -D plughw:1,0 -f U8 -c 1 '+path;
  console.log('arecord '+cmd);
  this.child = this.exec(cmd, function(err, stdout, stderr){
    if(callback){
      callback(err, stdout, stderr);
    }
  });
  console.log('record child ----');
  console.log(this.child);

  setTimeout(function(){
    console.log('arecord kill');
    _this.child.kill();
  },sec*1000);
};

module.exports = new Arecord();
