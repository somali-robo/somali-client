/** wpa_cli wps を起動する
*
*/
var WpaCli = function(){};
WpaCli.prototype.exec = require('child_process').exec;

//STATUSを監視するタイマー間隔
WpaCli.prototype.MONITORING_INTERVAL_SEC = 30;

/** WPS クライアントを実行
*/
WpaCli.prototype.execute = function(callback){
  var _this = this;
  var cmd = 'sudo wpa_cli wps_pbc';
  console.log('execute '+cmd);
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
    setInterval(function(){
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
        console.log(" wpa_cli status ---------");
        console.log('stdout '+stdout);
        //wpa_state=COMPLETED
        if(stdout.indexOf("wpa_state=COMPLETED") != 0){
          callback(err, stdout, stderr);
        }
      });
    },this.MONITORING_INTERVAL_SEC*1000);
  });
};

/** WPS クライアントを実行
* パスワード 12345678
*/
WpaCli.prototype.executeAny = function(callback){
  var cmd = 'sudo wpa_cli wps_pin any 12345678';
  console.log('executeAny '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    callback(err, stdout, stderr);
    /*
    if (err) {
        //console.log(err);
    }
    if (stderr) {
        console.log('stderr '+stderr);
    }
    console.log('stdout '+stdout);
    */
  });
};

module.exports = new WpaCli();
