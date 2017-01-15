/** DDPClient テスト
*/
const App = function(){};
App.prototype.ddp = require('../ddp.js');

//初期化
App.prototype.init = function(){
  console.log("init");
  const _this = this;
  this.ddp.init(function(error,name,data){
      if(error){
        console.log("error");
        console.log(error);
        return;
      }
      console.log("name:"+name);
      console.log(data);
  });
};

var app = new App();
app.init();
