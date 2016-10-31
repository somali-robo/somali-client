/** docomo HOYA 音声合成を楽につかうモジュール
*  HOYA
*  https://dev.smt.docomo.ne.jp/?p=docs.api.page&api_name=text_to_speech&p_name=api_hoya#tag01
*/

var Hoya = function(){};

//HTTPリクエスト
Hoya.prototype.request = require('request');
//リクエスト先サーバ
Hoya.prototype.API_SERVER_HOST = "https://api.apigw.smt.docomo.ne.jp/voiceText/v1/textToSpeech";

//話者名
Hoya.prototype.SPEAKER_SHOW   = "show";
Hoya.prototype.SPEAKER_HARUKA = "haruka";
Hoya.prototype.SPEAKER_HIKARI = "hikari";
Hoya.prototype.SPEAKER_TAKERU = "takeru";
Hoya.prototype.SPEAKER_SANTA  = "santa";
Hoya.prototype.SPEAKER_BEAR   = "bear";

/** 文字列を音声合成
*
* @param apiKey  APIキー
* @param text    音声合成したい文字列
* @param speaker 話者名
* @param params  各パラメータ
* @param callback コールバック
*
*/
Hoya.prototype.textToSpeech = function(apiKey,text,speaker,params,callback){
	var url = this.API_SERVER_HOST+"?APIKEY="+apiKey;
	var op = params;
	op['speaker'] = speaker;
	op['text']    = text;

		var options = {
			url: url,
		form:op,
		encoding: 'binary',
		strictSSL:false,
	};
	this.request.post(options,callback);
};

module.exports = new Hoya();
