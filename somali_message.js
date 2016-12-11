/* 送受信メッセージ
*
*/
const Message = function(){};
Message.prototype.from = null;
Message.prototype.type = "";
Message.prototype.value = "";
Message.prototype.empath = {};
Message.prototype.createdAt = "";

//タイプ
Message.prototype.TYPE_TEXT = "text";
Message.prototype.TYPE_WAV  = "wav";
Message.prototype.TYPE_ALERT = "alert"

Message.prototype.create = function(from,type,value){
  var result = new Message();
  result.from = from;
  result.type = type;
  result.value = value;
  result.createdAt = new Date();
  return result;
};

module.exports = new Message();
