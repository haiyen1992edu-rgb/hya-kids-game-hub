const c=require('./_common');
exports.handler=async e=>{
 if(e.httpMethod==='GET')return c.json(200,{admin:c.isAdmin(e)});
 if(e.httpMethod==='DELETE'){if(!c.sameOrigin(e))return c.json(403,{error:'Yêu cầu không hợp lệ'});return c.json(200,{ok:true},{'Set-Cookie':c.clearCookie()});}
 if(e.httpMethod!=='POST')return c.json(405,{error:'Phương thức không hỗ trợ'});
 if(!c.sameOrigin(e))return c.json(403,{error:'Nguồn yêu cầu không hợp lệ'});
 const {password,secret}=c.cfg();if(!password||!secret||secret.length<32)return c.json(503,{error:'Chưa cấu hình HYA_ADMIN_PASSWORD và HYA_SESSION_SECRET trên Netlify.'});
 let data;try{if((e.body||'').length>3000)throw Error();data=JSON.parse(e.body||'{}')}catch{return c.json(400,{error:'Dữ liệu không hợp lệ'})}
 const given=String(data.password||'');
 if(given.length>300||!c.safeEq(c.mac(given,secret),c.mac(password,secret)))return c.json(401,{error:'Mật khẩu quản trị không đúng'});
 return c.json(200,{ok:true},{'Set-Cookie':c.sessionCookie()});
};
