/** Test App
*/
var App = function(){};
App.prototype.config = require('./config.js');
App.prototype.empath = require('./empath.js');
App.prototype.hoya = require('./hoya.js');
App.prototype.aplay = require('./aplay.js');
App.prototype.somaliApi = require('./somali_api.js');

//初期化
App.prototype.init = function(){
  var _this = this;

/*
  //音声ファイルを送って感情取得
  var wavPath = "./tmp/sample3.wav";
  this.empath.analyzeWav(this.config.EMPATH_API_KEY, wavPath, function(json,err){
    if(err != null){
      console.log({'err':err});
    }
    console.log({'json':json});
  });
*/

var callbackTextToSpeech = function( err, resp, body ){
  if(!err && resp.statusCode === 200){
    //テスト用に書き出し
    var path = './tmp/docomo.wav';
    var fs = require('fs');
    fs.writeFile(path, body, 'binary', function(err){
        if (err != null){
          console.log("err");
          return;
        }
        console.log("success");
        /*
        //再生
        _this.aplay.start(path,function(err, stdout, stderr){
          if (err) {
            console.log(err);
          }
          if (stderr) {
              console.log('stderr '+stderr);
          }
          console.log('stdout '+stdout);
        });
        */
    });
  }
};

this.somaliApi.getMessages(function(err,response){
  //console.log(response.data);
  var data = response.data;
  for (i in data){
    var body = data[i].body;
    console.log(body);
    //var text   = "てすともじれつです";
    //_this.hoya.textToSpeech(this.config.DOCOMO_API_KEY,text,'bear',{},callbackTextToSpeech);
  }
});

};

var app = new App();
app.init();
