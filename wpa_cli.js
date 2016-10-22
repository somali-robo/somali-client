/** wpa_cli wps を起動する
*
*/
var WpaCli = function(){};
WpaCli.prototype.exec = require('child_process').exec;

/** WPS クライアントを実行
*/
WpaCli.prototype.execute = function(){
  var cmd = 'sudo wpa_cli wps_pbc';
  console.log('execute '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    if (err) {
      console.log(err);
    }
    if (stderr) {
        console.log('stderr '+stderr);
    }
    console.log('stdout '+stdout);
  });
};

/** WPS クライアントを実行
* パスワード 12345678
*/
WpaCli.prototype.executeAny = function(){
  var cmd = 'sudo wpa_cli wps_pin any 12345678';
  console.log('executeAny '+cmd);
  this.exec(cmd, function(err, stdout, stderr){
    if (err) {
      console.log(err);
    }
    if (stderr) {
        console.log('stderr '+stderr);
    }
    console.log('stdout '+stdout);
  });
};

module.exports = new WpaCli();
