/** Somali OTA
*
*/
var SomaliOta = function(){};

SomaliOta.prototype.spawn = require('child_process').spawn;
SomaliOta.prototype.child = null;

//git fetch originを実行
SomaliOta.prototype.exec = function(cmd,args,callback){
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

//開始
SomaliOta.prototype.start = function(callback){
    if(this.child != null){
      callback(null,"child is not null.");
      return;
    }
    const _this = this;
    //git fetch origin
    this.exec('git',['fetch','origin'],function(code,err){
      if(err){
        //OTA 何らかのエラー
        callback(null,err);
        return;
      }
      //git reset --hard origin/master
      _this.exec('git',['reset','--hard','origin/master'],function(code,err){
        callback(code,err);
      });
    });
};

module.exports = new SomaliOta();
