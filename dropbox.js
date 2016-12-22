/** dropbox
*/
var Dropbox = function(){};
Dropbox.prototype.fs = require("fs");
Dropbox.prototype.request = require('request');
Dropbox.prototype.dropbox = require("node-dropbox");
Dropbox.prototype.dropboxApi = null;
Dropbox.prototype.accessToken= null;


Dropbox.prototype.API_CONTENT_ROOT = "https://api-content.dropbox.com/1";

//初期化
Dropbox.prototype.init = function(accessToken){
  this.accessToken = accessToken;
  this.dropboxApi = this.dropbox.api(accessToken);
};

//PUT アップロード URL
Dropbox.prototype.creteApiFilesPutUrl = function(path){
  const url = this.API_CONTENT_ROOT+'/files_put/auto' + path.split('/').map(function(str) { return encodeURIComponent(str); }).join('/');
  console.log("creteApiFilesPutUrl "+url);
  return url;
};

//GET ダウンロード URL
Dropbox.prototype.creteApiFilesUrl = function(path){
  const url = this.API_CONTENT_ROOT+'/files/auto' + path.split('/').map(function(str) { return encodeURIComponent(str); }).join('/');
  console.log("creteApiFilesUrl "+url);
  return url;
};

//アップロード
Dropbox.prototype.upload = function(remotePath, localPath, callback) {
  console.log("upload "+remotePath+" "+localPath);
  const _this = this;
  const path = '/'+remotePath;
  this.fs.readFile(localPath, (err, data) => {
    _this.request.put(
      _this.creteApiFilesPutUrl(path),
      {
        headers: { Authorization: 'Bearer ' + _this.accessToken },
        body: data
      },
      callback
    );
  });
};

//ダウンロード
Dropbox.prototype.download = function(localPath, remotePath, callback) {
  console.log("download "+localPath+" "+remotePath);
  const _this = this;
  const path = '/'+remotePath;
  this.request.get(
    _this.creteApiFilesUrl(path),
    {
      headers: { Authorization: 'Bearer ' + _this.accessToken }
    },
    function(err, res, body) {
      callback(err, res, body);
    }
  ).pipe(this.fs.createWriteStream(localPath));
};

module.exports = new Dropbox();
