/* グループ追加 送受信メッセージ
*
*/
const GroupJoinMessage = function(){};
GroupJoinMessage.prototype.serialCode = "";
GroupJoinMessage.prototype.createdAt = "";

GroupJoinMessage.prototype.create = function(serialCode){
  var result = new GroupJoinMessage();
  result.serialCode = serialCode;
  result.createdAt = new Date();
  return result;
};

GroupJoinMessage.prototype.parse = function(buffer){
  console.log("GroupJoinMessage parse");
  console.log(buffer);
  const json = JSON.parse(buffer.toString('UTF-8'));
  console.log(json);

  var result = new GroupJoinMessage();
  result.serialCode = json['serialCode'];
  result.createdAt = json['createdAt'];
  return result;
};

module.exports = new GroupJoinMessage();
