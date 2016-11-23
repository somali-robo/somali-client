/** wpa_cli wps を起動する
*
*/
var WpaCli = function(){};
WpaCli.prototype.exec = require('child_process').exec;

//接続状態を監視するタイマー
WpaCli.prototype.monitoringTimer = null;

//接続状態を監視するタイマー間隔
WpaCli.prototype.MONITORING_INTERVAL_SEC = 10;
//監視タイマーのタイムアウト
WpaCli.prototype.MONITORING_TIMEOUT_SEC = 180;

/** WPS クライアントを実行
*/
WpaCli.prototype.execute = function(callback){
  this.cmdExec('sudo wpa_cli wps_pbc',callback);
};

/** WPS クライアントを実行
* パスワード 12345678
*/
WpaCli.prototype.executeAny = function(callback){
  this.cmdExec('sudo wpa_cli wps_pin any 12345678',callback);
};

/** WPS クライアントを実行
*/
WpaCli.prototype.cmdExec = function(cmd,callback){
  var _this = this;
  console.log('cmdExec '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    if(err){
        callback(err, null, null);
        return;
    }
    if(stderr){
        callback(null, null, stderr);
        return;
    }
    /*
    console.log('stdout '+stdout);
    */

    //ネット接続されるまで監視する
    _this.monitoringTimer = setInterval(function(){
      var cmd = 'sudo wpa_cli status';
      _this.exec(cmd, function(err, stdout, stderr){
        if(err){
            callback(err, null, null);
            return;
        }
        if(stderr){
            callback(null, null, stderr);
            return;
        }
        //console.log(" wpa_cli status ---------");
        //console.log('stdout '+stdout);
        //wpa_state=COMPLETED
        var i = stdout.indexOf("wpa_state=COMPLETED");
        //console.log('i '+i);
        if(i > -1){
          console.log("clearInterval");
          clearInterval(_this.monitoringTimer);
          _this.monitoringTimer = null;
          callback(err, stdout, stderr);
        }
      });
    },_this.MONITORING_INTERVAL_SEC*1000);

    //監視タイムアウト
    setTimeout(function(){
        if(_this.monitoringTimer != null){
          console.log("timeoutFire");
          //タイムアウト
          console.log("clearInterval");
          clearInterval(_this.monitoringTimer);
          callback("timeout", null, null);
        }
    },_this.MONITORING_TIMEOUT_SEC*1000);
  });
};


module.exports = new WpaCli();
