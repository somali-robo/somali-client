/** Somali API
*/
var SomaliApi = function(){};

//HTTPリクエスト
SomaliApi.prototype.request = require('request');
//SomaliApi.prototype.API_HOST = "https://somali-server.herokuapp.com";
SomaliApi.prototype.API_HOST = "http://192.168.11.64:3000";
SomaliApi.prototype.API_SERVICE_INFOS = "/api/service_infos";
SomaliApi.prototype.API_INTONATIONS = "/api/intonations";
SomaliApi.prototype.API_DEVICES = "/api/devices";
SomaliApi.prototype.API_CHAT_ROOMS = "/api/chat_rooms";

//サービス情報
SomaliApi.prototype.getServiceInfos = function(callback){
  var options = {url: this.API_HOST+this.API_SERVICE_INFOS};
  this.request.get(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

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
  var options = {url: this.API_HOST+this.API_DEVICES,form: {"serialCode":serialCode,"name":name}};
  this.request.post(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//チャットルーム登録
SomaliApi.prototype.postChatRoom = function(name,callback){
  //var createdAt = (new Date()).toISOString();
  var options = {url: this.API_HOST+this.API_CHAT_ROOMS,form: {"name":name}};
  this.request.post(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

//チャットルーム更新
SomaliApi.prototype.putChatRoom = function(id,name,members,messages,callback){
  var options = {url: this.API_HOST+this.API_CHAT_ROOMS+"/"+id,form:{"name":name,"members":members,"messages":messages}};
  this.request.put(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};


module.exports = new SomaliApi();
