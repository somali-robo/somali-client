/** dropbox
*/
var Dropbox = function(){};
Dropbox.prototype.fs = require("fs");
Dropbox.prototype.request = require('request');
Dropbox.prototype.dropbox = require("node-dropbox");
Dropbox.prototype.dropboxApi = null;
Dropbox.prototype.accessToken= null;
//アップロード
Dropbox.prototype.init = function(accessToken){
  this.accessToken = accessToken;
  this.dropboxApi = this.dropbox.api(accessToken);
};

//アップロード
Dropbox.prototype.upload = function(remotePath,localPath,callback){
  var _this = this;
  this.fs.readFile(localPath, (err, data) => {
    console.log("data length "+data.length);
    _this.dropboxApi.createFile("/"+remotePath, data, callback);
  });
};

/*
Dropbox.prototype.upload = function(remotePath, localPath, callback) {
  var _this = this;
  this.fs.readFile(localPath, (err, data) => {
    _this.request.put(
      'https://api-content.dropbox.com/1/files_put/auto' + remotePath.split('/').map(function(str) { return encodeURIComponent(str); }).join('/'),
      {
        headers: { Authorization: 'Bearer ' + _this.accessToken },
        body: data
      },
      callback
    );
  });
};
*/

module.exports = new Dropbox();
