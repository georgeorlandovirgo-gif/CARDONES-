import {mkdtemp,cp,symlink,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();const stage=await mkdtemp(join(tmpdir(),'cardones-preview-'));
try{
 for(const file of ['src','public','package.json','tsconfig.json','next-env.d.ts','next.config.ts'])await cp(join(root,file),join(stage,file),{recursive:true});
 await rm(join(stage,'src/app/api'),{recursive:true,force:true});
 await rm(join(stage,'public/qa-local.html'),{force:true});
 await symlink(join(root,'node_modules'),join(stage,'node_modules'),'dir');
 const result=spawnSync(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'build'],{cwd:stage,stdio:'inherit',env:{...process.env,GITHUB_PAGES_PREVIEW:'true',NEXT_PUBLIC_STORE_DEMO:'1',NEXT_PUBLIC_BASE_PATH:'/CARDONES-',NEXT_PUBLIC_SITE_URL:'https://georgeorlandovirgo-gif.github.io/CARDONES-'}});
 if(result.status!==0)throw Error('Static preview build failed.');
 await rm(join(root,'out'),{recursive:true,force:true});await cp(join(stage,'out'),join(root,'out'),{recursive:true});
 console.log('Verified static preview written to out/. Production source was not modified.');
}finally{await rm(stage,{recursive:true,force:true});}
