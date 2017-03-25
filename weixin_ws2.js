var PORT = require('./lib/config').wxPort;
var http = require('http');
var qs = require('qs');
var TOKEN = 'yuntu';
var getUserInfo = require('./lib/user').getUserInfo;
var replyText = require('./lib/reply').replyText; 
var wss = require('./lib/ws.js').wss;

function checkSignature(params, token){
  var key = [token, params.timestamp, params.nonce].sort().join('');
  var sha1 = require('crypto').createHash('sha1');
  sha1.update(key); 
  return  sha1.digest('hex') == params.signature;
}

var server = http.createServer(function (request, response) {

  //����URL�е�query���֣���qsģ��(npm install qs)��query������json
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
            getUserInfo(result.xml.FromUserName[0])
            .then(function(userInfo){
              //����û���Ϣ���ϲ�����Ϣ��
              result.user = userInfo;
              //����Ϣͨ��websocket�㲥
              wss.broadcast(result);
              var res = replyText(result, '��Ϣ���ͳɹ���');
              response.end(res);
            })
          }
        }
      });
    });
  }
});

server.listen(PORT);

console.log("Weixin server runing at port: " + PORT + ".");