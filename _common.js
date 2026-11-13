const crypto = require('node:crypto');
const {getStore} = require('@netlify/blobs');
const initial = require('../../games.json');
const store = () => getStore({name:'hya-kids-config',consistency:'strong'});
const json = (status,data,headers={})=>({statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers},body:JSON.stringify(data)});
const cfg=()=>({password:process.env.HYA_ADMIN_PASSWORD,secret:process.env.HYA_SESSION_SECRET});
const b64=s=>Buffer.from(s).toString('base64url');
const mac=(payload,secret)=>crypto.createHmac('sha256',secret).update(payload).digest('base64url');
function safeEq(a,b){const aa=Buffer.from(a), bb=Buffer.from(b);return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
function sessionCookie(){const {secret}=cfg();const payload=b64(JSON.stringify({exp:Date.now()+8*60*60*1000}));return `hya_admin=${payload}.${mac(payload,secret)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`;}
const clearCookie=()=> 'hya_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
function isAdmin(event){const {secret}=cfg();if(!secret)return false;const cookie=event.headers.cookie||event.headers.Cookie||'';const match=cookie.match(/(?:^|;\s*)hya_admin=([^;]+)/);if(!match)return false;const bits=match[1].split('.');if(bits.length!==2||!safeEq(bits[1],mac(bits[0],secret)))return false;try{return JSON.parse(Buffer.from(bits[0],'base64url').toString()).exp>Date.now()}catch{return false}}
function sameOrigin(e){const origin=e.headers.origin||e.headers.Origin;const host=e.headers['x-forwarded-host']||e.headers.host;try{return !!origin && new URL(origin).host===host && new URL(origin).protocol==='https:'}catch{return false}}
async function read(){return await store().get('config',{type:'json',consistency:'strong'})||initial}
function normalize(v){if(!v||typeof v!=='object'||!Array.isArray(v.games)||v.games.length>200)throw Error('Danh sách trò chơi không hợp lệ');const str=(x,max=120)=>String(x??'').trim().slice(0,max);const color=x=>/^#[0-9a-fA-F]{6}$/.test(x||'')?x:'#e6dcff';const games=v.games.map((g,i)=>{if(!g||typeof g!=='object')throw Error('Trò chơi không hợp lệ');const url=str(g.url,1500);if(url&&!/^https:\/\//i.test(url))throw Error('Link game phải bắt đầu bằng https://');if(url){const u=new URL(url);if(u.username||u.password)throw Error('Link không hợp lệ')};const name=str(g.name);if(!name)throw Error('Tên trò chơi không được để trống');return {id:'game-'+String(i+1).padStart(2,'0'),name,category:str(g.category)||'Khám phá',emoji:str(g.emoji,15)||'🎮',description:str(g.description,400),color:color(g.color),url}});return {siteTitle:str(v.siteTitle)||'HYA KIDS – Thế giới trò chơi mầm non',heroTag:str(v.heroTag)||'🌈 KHÁM PHÁ CÙNG BÉ',heroTitle:str(v.heroTitle)||'Thế giới trò chơi mầm non',heroDescription:str(v.heroDescription,250)||'Chạm vào trò chơi yêu thích và bắt đầu hành trình khám phá!',games};}
module.exports={json,cfg,mac,safeEq,sessionCookie,clearCookie,isAdmin,sameOrigin,read,store,normalize};
