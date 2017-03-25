var request = require('request');
var fs = require('fs');
function getToken(appID, appSecret){
  return new Promise(function(resolve, reject){
    var token;
    //�ȿ��Ƿ���token���棬����ѡ�����ļ����棬�����������ĳ־ô洢��Ϊ����
    if(fs.existsSync('token.dat')){
      token = JSON.parse(fs.readFileSync('token.dat'));
    }
    //���û�л�����߹���
    if(!token || token.timeout < Date.now()){
      request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+appID+'&secret=' + appSecret, function(err, res, data){
        var result = JSON.parse(data);
        result.timeout = Date.now() + 7000000;
        //����token������
        //��Ϊaccess_token����Ч����7200�룬ÿ�����ȡ2000��
        //���Բ�໺��7000�����ҿ϶��ǹ���
        fs.writeFileSync('token.dat', JSON.stringify(result));
        resolve(result);
      });      
    }else{
      resolve(token);
    }
  });
}
module.exports = {getToken: getToken};