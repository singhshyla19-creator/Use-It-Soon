import { error, hashPassword, json, loadAppData, normalizeEmail, passwordError, readJson, sanitizeAppData, tokenHash, validEmail } from "../../_lib/auth.js";
export async function onRequestPost({request,env}){
 if(!env.DB)return error("Account storage is not configured yet.",503);
 if(new URL(request.url).protocol!=="https:"||request.headers.get("Origin")!==new URL(request.url).origin)return error("This request could not be verified.",403);
 const body=await readJson(request);if(body.error)return error(body.error);
 const email=normalizeEmail(body.email),invalidPassword=passwordError(body.password);
 if(!validEmail(email))return error("Enter a valid email address.");if(invalidPassword)return error(invalidPassword);
 if(await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first())return error("An account with this email may already exist. Try signing in.",409);
 const id=crypto.randomUUID(),salt=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))),passwordHash=await hashPassword(body.password,salt);
 const token=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
 const expires=Math.floor(Date.now()/1000)+2592000,data=sanitizeAppData(body.appData);
 try{await env.DB.batch([env.DB.prepare("INSERT INTO users (id,email,password_hash,salt,created_at) VALUES (?,?,?,?,?)").bind(id,email,passwordHash,salt,Date.now()),env.DB.prepare("INSERT INTO user_data (user_id,data_json,updated_at) VALUES (?,?,?)").bind(id,JSON.stringify(data),Date.now()),env.DB.prepare("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)").bind(await tokenHash(token),id,expires)])}catch(e){if(String(e).toLowerCase().includes("unique"))return error("An account with this email may already exist. Try signing in.",409);return error("We couldn’t create your account right now. Please try again.",500)}
 const cookie="__Host-uis_session="+token+"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000";
 return json({user:{email},data:await loadAppData(env.DB,id)},201,{"set-cookie":cookie});
}
