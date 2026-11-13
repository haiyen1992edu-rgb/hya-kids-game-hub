const c=require('./_common');
const {connectLambda}=require('@netlify/blobs');
exports.handler=async e=>{
 try{
  connectLambda(e);
  if(e.httpMethod==='GET')return c.json(200,await c.read());
  if(e.httpMethod!=='PUT')return c.json(405,{error:'Phương thức không hỗ trợ'});
  if(!c.isAdmin(e))return c.json(401,{error:'Chỉ quản trị viên được sửa dữ liệu'});
  if(!c.sameOrigin(e))return c.json(403,{error:'Nguồn yêu cầu không hợp lệ'});
  if((e.body||'').length>250000)return c.json(413,{error:'Dữ liệu quá lớn'});
  let v;try{v=c.normalize(JSON.parse(e.body||'{}'))}catch(err){return c.json(400,{error:err.message})}
  await c.store().setJSON('config',v);
  return c.json(200,{ok:true,data:v});
 }catch(err){console.error(err);return c.json(500,{error:'Có lỗi máy chủ. Vui lòng thử lại.'})}
};
