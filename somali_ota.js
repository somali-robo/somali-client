/** Somali OTA
*
*/
var SomaliOta = function(){};

SomaliOta.prototype.spawn = require('child_process').spawn;
SomaliOta.prototype.moment = require("moment");
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
    _this.exec('wget',[this.URL_ZIP_FILE,'-N','-P','/tmp'],function(code,err){
      if(err){
        //OTA 何らかのエラー
        callback(null,err);
        return;
      }

      const yymmddhhmmss = _this.moment().format("YYYYMMDDHHmmss");
      const destPath = __dirname+'/../somali-client-'+yymmddhhmmss;
      //const path = __dirname+'/';
      console.log("destPath "+destPath);

      //unzip -d destPath -j -o /tmp/master.zip
      _this.exec('unzip',['-d',destPath,'-o','/tmp/master.zip'],function(code,err){
        if(err){
          //OTA 何らかのエラー
          callback(null,err);
          return;
        }

        //config.js をコピーする
        const srcConfigPath = __dirname+'/config.js';
        const destConfigPath = destPath+"/somali-client-master/config.js";
        _this.exec('cp',[srcConfigPath,destConfigPath],function(code,err){
          if(err){
            //OTA 何らかのエラー
            callback(null,err);
            return;
          }

          //SOMALI.json をコピーする
          const srcSomaliJsonPath = __dirname+'/SOMALI.json';
          const destSomaliJsonPath = destPath+"/somali-client-master/SOMALI.json";
          _this.exec('cp',[srcSomaliJsonPath,destSomaliJsonPath],function(code,err){
            if(err){
              //OTA 何らかのエラー
              callback(null,err);
              return;
            }

            const srcNodeModulesPath = __dirname+'/node_modules/';
            const destNodeModulesPath = destPath+"/somali-client-master/";
            _this.exec('cp',['-r',srcNodeModulesPath,destNodeModulesPath],function(code,err){
              if(err){
                //OTA 何らかのエラー
                callback(null,err);
                return;
              }

              //シンボリックリンク貼り直し
              //ln -s destPath srcPath
              const srcPath = __dirname+'/../somali-client-last';
              console.log("srcPath "+srcPath);
              _this.exec('ln',['-s','-f','-n',destPath,srcPath],function(code,err){
                if(err){
                  //OTA 何らかのエラー
                  callback(null,err);
                  return;
                }
              });

            });
          });
        });
      });
    });
};

module.exports = new SomaliOta();
