/* グループ追加 送受信メッセージ
*
*/
const GroupJoinMessage = function(){};
GroupJoinMessage.prototype.serialCode = "";
GroupJoinMessage.prototype.groupChatRoomId = "";
GroupJoinMessage.prototype.mode = "";
GroupJoinMessage.prototype.createdAt = "";

GroupJoinMessage.prototype.MODE_JOIN = "join";
GroupJoinMessage.prototype.MODE_CREATE_GROUP = "create_group";

GroupJoinMessage.prototype.create = function(serialCode,mode,groupChatRoomId){
  var result = new GroupJoinMessage();
  result.serialCode = serialCode;
  result.mode = mode;
  result.groupChatRoomId = groupChatRoomId;
  result.createdAt = new Date();
  return result;
};

GroupJoinMessage.prototype.parse = function(buffer){
  const json = JSON.parse(buffer.toString('UTF-8'));
  var result = new GroupJoinMessage();
  result.serialCode = json['serialCode'];
  result.mode = json['mode'];
  result.groupChatRoomId = json['groupChatRoomId'];
  result.createdAt = json['createdAt'];
  return result;
};

module.exports = new GroupJoinMessage();
