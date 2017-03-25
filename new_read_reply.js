var PORT = 9529;
var http = require('http');
var qs = require('qs');
var https = require('https');
var TOKEN = 'yuntu';
var fs =require('fs');
function checkSignature(params, token){
  //1. ��token��timestamp��nonce�������������ֵ�������
  //2. �����������ַ���ƴ�ӳ�һ���ַ�������sha1����
  //3. �����߻�ü��ܺ���ַ�������signature�Աȣ���ʶ��������Դ��΢��

  var key = [token, params.timestamp, params.nonce].sort().join('');
  var sha1 = require('crypto').createHash('sha1');
  sha1.update(key);
  
  return  sha1.digest('hex') == params.signature;
}

var server = http.createServer(function (request, response) {

  //����URL�е�query���֣���qsģ��(npm install qs)��query������json
  var query = require('url').parse(request.url).query;
  var params = qs.parse(query);
   console.log("query is"+query);
   console.log("params is"+params);
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
    console.log("postdata is"+postdata);
    });
    
    //��ȡ����POST����
    request.addListener("end",function(){
      var parseString = require('xml2js').parseString;
     
      parseString(postdata, function (err, result) {
        if(!err){ console.log("pple1");
         
         var res = replyText(result, 'pple');
           
   console.log('RRRRRRes is'+res);
          response.end(res);
        }
      });
    });
  }
});

server.listen(PORT);

console.log("Server runing at port: " + PORT + ".");
var name;
function replyText(msg, replyText){
  if(msg.xml.MsgType[0] !== 'text'){
    return '';
  }
  console.log("pple2");
var openid=msg.xml.FromUserName[0];
console.log("pple3");
var token=fs.readFileSync('/home/weixinaccesstoken/token.dat');
console.log("token is "+token);
 var options = {
        hostname: 'api.weixin.qq.com',
        path: '/cgi-bin/user/info?access_token=' + token+ '&openid='+ openid
    };
        console.log(options);
        
    var req = https.get(options, function (res) {
        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);
        var bodyChunks = '';
        res.on('data', function (chunk) {
            bodyChunks += chunk;
            console.log("new bodychunk ", bodyChunks);
        });
        res.on('end', function () {
            var body = JSON.parse(bodyChunks);
            //console.dir(body);
            
               name= body.nickname;
                
               
console.log(name);
 
  
  
             
        });
    });
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
    content: name
  });

  //��Ҫ���ص���Ϣͨ��һ���򵥵�tmplģ�壨npm install tmpl������΢��
 
}