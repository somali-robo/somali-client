const App = function(){};

App.prototype.fs = require("fs");
App.prototype.config = require('../config.js');
App.prototype.dropbox = require("../dropbox.js");

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;

  //Dropbox APIへのアクセスの為 初期化
  this.dropbox.init(this.config.DROPBOX_ACCESS_TOKEN);

  //アップロード テスト
  const uploadLocalPath = "../tmp/a.wav";
  const uploadRemotePath = "test_dropbox.wav";
  const downloadLocalPath = "../tmp/test_download.wav";

  this.dropbox.upload(uploadRemotePath,uploadLocalPath,function(err, res, body) {
    if (err != null){
      console.log("upload err");
      console.log(err);
      return;
    }
    console.log("upload success");
    //console.log(body);

    //ダウンロード テスト
    _this.dropbox.download(downloadLocalPath,uploadRemotePath,function(err, res, body, file) {
      if (err != null){
        console.log("download err");
        console.log(err);
        return;
      }
      console.log("download success");

      //ダウンロードしたファイルのサイズを表示してみる
      _this.fs.readFile(downloadLocalPath, 'binary', (err, data) => {
        console.log("data length "+data.length);
      });
    });

  });

};

var app = new App();
app.init();
