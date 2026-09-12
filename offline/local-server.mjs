import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("./site/",import.meta.url));
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".webp":"image/webp",".png":"image/png",".svg":"image/svg+xml",".json":"application/json"};

createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  let path=resolve(root,"."+(name==="/"?"/index.html":name));
  if(path!==resolve(root)&&!path.startsWith(resolve(root)+sep)){res.writeHead(403).end();return;}
  if((await stat(path)).isDirectory())path=resolve(path,"index.html");
  res.writeHead(200,{"Content-Type":types[extname(path)]||"application/octet-stream"}).end(await readFile(path));
}catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"}).end("Not found");}}).listen(4180,"127.0.0.1",()=>console.log("有温度的问诊室：http://127.0.0.1:4180/"));
