/** ddp でサーバ更新を関しする為のクラス
*/

const DDP = function(){};
DDP.prototype.DDPClient = require("ddp");
DDP.prototype.ddpclient = null;
DDP.prototype.callback  = null;

//接続設定 host,port,url は必須
DDP.prototype.CONFIG_DDPCLIENT = {
  url  : 'wss://somali-server.herokuapp.com/sockjs/554/uk32y3t2/websocket',
  host : "somali-server.herokuapp.com",
  port : 443,
  ssl  : true,
  useSockJs: true
};

DDP.prototype.init = function(callback){
  const _this = this;
  this.callback = callback;
  this.ddpclient = new this.DDPClient(this.CONFIG_DDPCLIENT);

  this.ddpclient.connect(function(error, wasReconnect) {
    if (error) {
      console.log('DDP connection error!');
      callback(error,null,null);
      return;
    }

    if (wasReconnect) {
      console.log('Reestablishment of a connection.');
    }
    //subscribe
    _this.ddpclient.subscribe('chat_rooms',[],function(result){
      console.log("chat_rooms callback");
      console.log(result);
    });

    _this.ddpclient.subscribe('broadcast_messages',[],function(result){
      console.log("broadcast_messages callback");
      console.log(result);
    });

    console.log('connected!');
  });

  this.ddpclient.observe("chat_rooms",function(id) {
      console.log("added chat_rooms");
    },
    function(id, oldFields, clearedFields, newFields) {
      console.log("changed chat_rooms");
      //チャットへの投稿があったとき更新をコールバック通知
      _this.callback(null,"chat_rooms",newFields);
    },function(){
      console.log("removed chat_rooms");
    });

  this.ddpclient.observe("broadcast_messages",function(id) {
      console.log("added broadcast_messages");
      //ブロードキャストメッセージ追加をコールバック通知
      _this.callback(null,"broadcast_messages",id);
    },
    function(id, oldFields, clearedFields, newFields) {
      console.log("changed broadcast_messages");
    },function(){
      console.log("removed broadcast_messages");
    });
};

module.exports = new DDP();
