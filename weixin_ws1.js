var PORT = require('./lib/config').wxPort;
var http = require('http');
var qs = require('qs');
var TOKEN = 'yuntu';
var wss = require('./lib/ws.js').wss;
function checkSignature(params, token){
  //1. ��token��timestamp��nonce�������������ֵ�������
  //2. �����������ַ���ƴ�ӳ�һ���ַ�������sha1����
  //3. �����߻�ü��ܺ���ַ�������signature�Աȣ���ʶ��������Դ��΢��
  var key = [token, params.timestamp, params.nonce].sort().join('');
  var sha1 = require('crypto').createHash('sha1');
  sha1.update(key);  
  return  sha1.digest('hex') == params.signature;
}

var server = http.createServer(function(request, response){
var query = require('url').parse(request.url).query;
  var params = qs.parse(query);
  if(!checkSignature(params, TOKEN)){
    //���ǩ�����ԣ��������󲢷���
    response.end('signature fail');
    return;
  }
  if(request.method == "GET"){
    //���������GET������echostr����ͨ����������ЧУ��
    response.end(params.echostr);
  }else{
    //������΢�Ÿ������߷�������POST����
    var postdata = "";
    request.addListener("data",function(postchunk){
        postdata += postchunk;
    });

    //��ȡ����POST����
    request.addListener("end",function(){
      var parseString = require('xml2js').parseString;
      parseString(postdata, function (err, result) {
        if(!err){
          if(result.xml.MsgType[0] === 'text'){
            //����Ϣͨ��websocket�㲥
            wss.broadcast(result);
            var res = replyText(result, 'hello');
            response.end(res);
          }
        }
      });
    });
  }
});
server.listen(PORT);
console.log("Weixin server runing at port: " + PORT + ".");
function replyText(msg, replyText){
  if(msg.xml.MsgType[0] !== 'text'){
    return '';
  }
  console.log(msg);
  //��Ҫ���ص���Ϣͨ��һ���򵥵�tmplģ�壨npm install tmpl������΢��
  var tmpl = require('tmpl');
  var replyTmpl = '<xml>' +
    '<ToUserName><![CDATA[{toUser}]]></ToUserName>' +
    '<FromUserName><![CDATA[{fromUser}]]></FromUserName>' +
    '<CreateTime><![CDATA[{time}]]></CreateTime>' +
    '<MsgType><![CDATA[{type}]]></MsgType>' +
    '<Content><![CDATA[{content}]]></Content>' +
    '</xml>';
  return tmpl(replyTmpl, {
    toUser: msg.xml.FromUserName[0],
    fromUser: msg.xml.ToUserName[0],
    type: 'text',
    time: Date.now(),
    content: replyText
  });
}