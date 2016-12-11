/** dropbox
*/
var Dropbox = function(){};
Dropbox.prototype.fs = require("fs");
Dropbox.prototype.dropbox = require("node-dropbox");
Dropbox.prototype.dropboxApi = null;

//アップロード
Dropbox.prototype.init = function(accessToken){
  this.dropboxApi = this.dropbox.api(accessToken);
};

//アップロード
Dropbox.prototype.upload = function(remotePath,localPath,callback){
  var _this = this;
  this.fs.readFile(localPath,'binary', (err, data) => {
    console.log("data length "+data.length);
    _this.dropboxApi.createFile("/"+remotePath, data, callback);
  });
};

module.exports = new Dropbox();
