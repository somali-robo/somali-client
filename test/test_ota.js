const App = function(){};

App.prototype.ota = require('../somali_ota.js');
//初期化
App.prototype.init = function(){
  console.log("init");

  //OTA開始
  this.ota.start(function(code,err){
    if(err){
      console.log("OTA error.");
      return;
    }
    console.log("OTA success. "+ code);
  });
};

var app = new App();
app.init();
