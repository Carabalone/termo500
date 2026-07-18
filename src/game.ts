export type Clue={correct:number;present:number;absent:number};
export type Mark='neutral'|'absent'|'present'|'correct';
export type Attempt={word:string;display:string;clue:Clue;marks:Mark[]};
export type Status='playing'|'won'|'lost';
export type Game={version:2;date:string;archive:boolean;infinite?:boolean;puzzle?:number;draft:string;attempts:Attempt[];status:Status;hintUsed:boolean;updatedAt:string};
export const EPOCH='2026-07-18';
export const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ç/gi,'c').toUpperCase().replace(/[^A-Z_]/g,'');
export function score(guess:string,answer:string):Clue{
 const g=[...normalize(guess)],a=[...normalize(answer)],used=Array(5).fill(false);let correct=0,present=0;
 for(let i=0;i<5;i++)if(g[i]===a[i]){correct++;used[i]=true;g[i]='?'}
 for(let i=0;i<5;i++){if(g[i]==='?')continue;const j=a.findIndex((c,k)=>!used[k]&&c===g[i]);if(j>=0){present++;used[j]=true}}
 return{correct,present,absent:5-correct-present};
}
export function scoreMarks(guess:string,answer:string):Mark[]{
 const g=[...normalize(guess)],a=[...normalize(answer)],used=Array(5).fill(false),marks=Array(5).fill('absent') as Mark[];
 for(let i=0;i<5;i++)if(g[i]===a[i]){marks[i]='correct';used[i]=true}
 for(let i=0;i<5;i++){if(marks[i]==='correct')continue;const j=a.findIndex((c,k)=>!used[k]&&c===g[i]);if(j>=0){marks[i]='present';used[j]=true}}
 return marks;
}
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function dayNumber(date:string){const [y,m,d]=date.split('-').map(Number),[ey,em,ed]=EPOCH.split('-').map(Number);return Math.floor((Date.UTC(y,m-1,d)-Date.UTC(ey,em-1,ed))/86400000)+1}
export const newGame=(date:string,archive=false,infinite=false,puzzle?:number):Game=>({version:2,date,archive,infinite,puzzle,draft:'',attempts:[],status:'playing',hintUsed:false,updatedAt:new Date().toISOString()});
const NS='termo500.games.v2';
export function loadGames():Record<string,Game>{try{const raw=JSON.parse(localStorage.getItem(NS)||'{}');if(!raw||typeof raw!=='object')return{};return Object.fromEntries(Object.entries(raw).filter(([,g])=>validGame(g)) as [string,Game][])}catch{return{}}}
function validGame(x:unknown):x is Game{const g=x as Game;return !!g&&g.version===2&&/^\d{4}-\d{2}-\d{2}$/.test(g.date)&&Array.isArray(g.attempts)&&['playing','won','lost'].includes(g.status)}
export function saveGame(game:Game){const all=loadGames(),key=game.infinite?`i:${game.puzzle}`:`${game.archive?'a':'d'}:${game.date}`;all[key]=game;localStorage.setItem(NS,JSON.stringify(all))}
export function statistics(games:Game[],today:string){const daily=games.filter(g=>!g.archive&&!g.infinite&&g.status!=='playing');const wins=daily.filter(g=>g.status==='won'&&!g.hintUsed);const dist=Array.from({length:8},(_,i)=>wins.filter(g=>g.attempts.length===i+1).length);let current=0,noHint=0,max=0,maxNoHint=0;const map=new Map(daily.map(g=>[g.date,g]));for(let n=dayNumber(today);n>=1;n--){const dt=new Date(Date.UTC(2026,6,17+n)).toISOString().slice(0,10),g=map.get(dt);if(!g||g.status!=='won'||g.hintUsed)break;current++;noHint++}let run=0,nh=0;for(let n=1;n<=dayNumber(today);n++){const dt=new Date(Date.UTC(2026,6,17+n)).toISOString().slice(0,10),g=map.get(dt);if(g?.status==='won'&&!g.hintUsed){run++;nh++;max=Math.max(max,run);maxNoHint=Math.max(maxNoHint,nh)}else{run=0;nh=0}}return{played:daily.length,wins:wins.length,rate:daily.length?Math.round(wins.length/daily.length*100):0,current,max,noHint,maxNoHint,dist}}
