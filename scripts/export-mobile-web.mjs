import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseEnv} from 'node:util';
import sharp from 'sharp';

const mobile=fileURLToPath(new URL('../apps/mobile/',import.meta.url));
const website=fileURLToPath(new URL('../apps/website/',import.meta.url));
const require=createRequire(resolve(mobile,'package.json'));
const output=resolve(website,'public/mobile');
const envPath=resolve(website,'.env.local');
const settings={...(existsSync(envPath)?parseEnv(readFileSync(envPath,'utf8')):{}),...process.env};
const url=settings.NEXT_PUBLIC_SUPABASE_URL;
const key=settings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||settings.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!key||key.startsWith('sb_secret_')||(key.includes('.')&&JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role!=='anon'))throw Error('A public Supabase URL and publishable key are required for the mobile website');
const env={...process.env,CI:'1',EXPO_NO_DOTENV:'1',DAEGWANG_WEB_PATH:'/mobile',EXPO_PUBLIC_API_BASE_URL:'https://daegwangchurch-admin.vercel.app',EXPO_PUBLIC_WEBSITE_URL:'https://daegwangchurch.kr',EXPO_PUBLIC_SUPABASE_URL:url,EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key};
const result=spawnSync(process.execPath,[require.resolve('expo/bin/cli'),'export','--platform','web','--max-workers','2','--output-dir',output],{cwd:mobile,env,stdio:'inherit'});
if(result.status!==0)process.exit(result.status??1);
const index=resolve(output,'index.html');
let html=readFileSync(index,'utf8');
if(!html.includes('/mobile/_expo/'))throw Error('Expo router assets must be scoped to /mobile');
html=html.replace('<html lang="en">','<html lang="ko">').replace('shrink-to-fit=no','shrink-to-fit=no, viewport-fit=cover').replace('</head>',`
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="대광교회">
<meta name="theme-color" content="#F7F8F5">
<link rel="apple-touch-icon" href="/mobile/icon-180.png">
<link rel="manifest" href="/mobile/manifest.webmanifest">
<style>@font-face{font-family:NotoSansKR_400Regular;src:local("Apple SD Gothic Neo"),local("Malgun Gothic"),local("Arial")}@font-face{font-family:NotoSansKR_700Bold;src:local("AppleSDGothicNeo-Bold"),local("Malgun Gothic Bold"),local("Arial Bold")}</style>
</head>`);
writeFileSync(index,html);
for(const size of [180,192,512])await sharp(resolve(mobile,'assets/icon.png')).resize(size,size).png().toFile(resolve(output,'icon-'+size+'.png'));
writeFileSync(resolve(output,'manifest.webmanifest'),JSON.stringify({id:'/mobile',name:'대광교회',short_name:'대광교회',lang:'ko',start_url:'/mobile',scope:'/mobile',display:'standalone',background_color:'#F7F8F5',theme_color:'#F7F8F5',icons:[192,512].map(size=>({src:'/mobile/icon-'+size+'.png',sizes:size+'x'+size,type:'image/png'}))}));
