/** Somali API
*/
var SomaliApi = function(){};

//HTTPリクエスト
SomaliApi.prototype.request = require('request');
SomaliApi.prototype.API_HOST = "https://somali-server.herokuapp.com";
SomaliApi.prototype.API_DEVICES = "/api/devices";

/*
SomaliApi.prototype.getMessages = function(callback){
  var options = {url: this.API_GET_MESSAGE};
  this.request.get(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};
*/
SomaliApi.prototype.postDevice = function(serialCode,name,callback){
  var createdAt = (new Date()).toISOString();
  var options = {url: this.API_HOST+this.API_DEVICES,form: {"serialCode":serialCode,"name":name,"createdAt":createdAt}};
  this.request.post(options,function(err,response){
    if(err){
      callback(err);
      return;
    }
    var result = JSON.parse(response.body);
    callback(null,result);
  });
};

module.exports = new SomaliApi();
