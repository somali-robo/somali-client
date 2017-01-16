/** Somali OTA
*
*/
var SomaliOta = function(){};

SomaliOta.prototype.spawn = require('child_process').spawn;
SomaliOta.prototype.child = null;
SomaliOta.prototype.URL_ZIP_FILE = "https://github.com/somali-robo/somali-client/archive/master.zip";

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

    //wget URL -P /tmp
    _this.exec('wget',[this.URL_ZIP_FILE,'-P','/tmp'],function(code,err){
      if(err){
        //OTA 何らかのエラー
        callback(null,err);
        return;
      }

      const path = __dirname;
      //console.log("path "+path);

      //unzip -d ../somali-client/ /tmp/master.zip
      _this.exec('unzip',['-d',path,'/tmp/master.zip'],function(code,err){
        if(err){
          //OTA 何らかのエラー
          callback(null,err);
          return;
        }
        callback(code,err);
      });
    });
};

module.exports = new SomaliOta();
