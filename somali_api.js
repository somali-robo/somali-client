/** Somali API
*/
var SomaliApi = function(){};

//HTTPリクエスト
SomaliApi.prototype.request = require('request');
SomaliApi.prototype.API_GET_MESSAGE = "https://somali-server.herokuapp.com/api/messages"
//SomaliApi.prototype.API_GET_MESSAGE = "http://192.168.0.9:3000/api/messages"

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

module.exports = new SomaliApi();
