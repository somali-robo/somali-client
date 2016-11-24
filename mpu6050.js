/** MPU6050
*/
var Mpu6050 = function(){};
Mpu6050.prototype.mpu6050 = require('mpu6050-wiringpi');

//MPU-6050 データ購読
Mpu6050.prototype.subscribe = function(msec,callback){
  var _this = this;
  var t = setInterval(function(){
    var data = _this.mpu6050.read();
    callback(data);
  },msec);
  return t;
};

module.exports = new Mpu6050();
