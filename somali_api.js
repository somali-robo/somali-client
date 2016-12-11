/** Somali API
*/
var SomaliApi = function(){};

//HTTPリクエスト
SomaliApi.prototype.request = require('request');
//SomaliApi.prototype.API_HOST = "https://somali-server.herokuapp.com";
SomaliApi.prototype.API_HOST = "http://192.168.0.9:3000";
SomaliApi.prototype.API_INTONATIONS = "/api/intonations";
SomaliApi.prototype.API_DEVICES = "/api/devices";
SomaliApi.prototype.API_CHAT_ROOMS = "/api/chat_rooms";
SomaliApi.prototype.API_BROADCAST_MESSAGES = "/api/broadcast_messages";

//抑揚認識発話 データ取得
SomaliApi.prototype.getIntonations = function(callback){
  var options = {url: this.API_HOST+this.API_INTONATIONS};
  this.request.get(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//デバイス一覧を取得
SomaliApi.prototype.getDevice = function(id,callback){
  var options = {url: this.API_HOST+this.API_DEVICES+"/"+id};
  this.request.get(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//デバイス一覧を取得
SomaliApi.prototype.getDevices = function(callback){
  var options = {url: this.API_HOST+this.API_DEVICES};
  this.request.get(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//デバイスを登録
SomaliApi.prototype.postDevice = function(serialCode,name,callback){
  //var createdAt = (new Date()).toISOString();
  var options = {url: this.API_HOST+this.API_DEVICES+"/serial_code/"+serialCode,form: {"name":name}};
  //console.log("postDevice");
  //console.log(options);
  this.request.post(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//チャットルームを取得
SomaliApi.prototype.getChatRoom = function(id,callback){
  var options = {url: this.API_HOST+this.API_CHAT_ROOMS+"/"+id};
  this.request.get(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//チャットルーム登録
SomaliApi.prototype.postChatRoom = function(name,members,messages,callback){
  //var createdAt = (new Date()).toISOString();
  var options = {url: this.API_HOST+this.API_CHAT_ROOMS,form: {"name":name,"members":members,"messages":messages}};
  //console.log("postChatRoom");
  //console.log(options);
  //console.log(members);
  this.request.post(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//チャットルームにメッセージ追加
SomaliApi.prototype.putChatroomMessage = function(id,message,callback){
  console.log("putChatroomMessage");
  console.log(message);
  var options = {url: this.API_HOST+this.API_CHAT_ROOMS+"/"+id+"/messages",form:{"message":message}};
  console.log(options);
  this.request.put(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//チャットルームのメッセージ一覧取得
SomaliApi.prototype.getChatroomMessages = function(id,callback){
  //console.log("getChatroomMessage");
  var options = {url: this.API_HOST+this.API_CHAT_ROOMS+"/"+id+"/messages"};
  //console.log(options);
  this.request.get(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//ブロードキャスト メッセージを取得
SomaliApi.prototype.getBroadcastMessages = function(callback){
  var options = {url: this.API_HOST+this.API_BROADCAST_MESSAGES};
  this.request.get(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

module.exports = new SomaliApi();
