/** Somali OTA
*
*/
var SomaliOta = function(){};

SomaliOta.prototype.spawn = require('child_process').spawn;
SomaliOta.prototype.child = null;

//開始
SomaliOta.prototype.start = function(callback){
    if(this.child != null){
      callback(null,"child is not null.");
      return;
    }
    const _this = this;
    const cmd = 'git';
    const args = ['pull'];
    console.log('SomaliOta start '+cmd);
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

module.exports = new SomaliOta();
