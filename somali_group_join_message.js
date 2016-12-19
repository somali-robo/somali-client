/* グループ追加 送受信メッセージ
*
*/
const GroupJoinMessage = function(){};
GroupJoinMessage.prototype.serial_code = "";
GroupJoinMessage.prototype.createdAt = "";

GroupJoinMessage.prototype.create = function(serial_code){
  var result = new GroupJoinMessage();
  result.serial_code = serial_code;
  result.createdAt = new Date();
  return result;
};

module.exports = new GroupJoinMessage();
