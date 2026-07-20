import guessesText from '../assets/generated/guesses.txt?raw';
import answerData from '../assets/generated/answers.json';
import scheduleData from '../assets/generated/schedule.json';
import legacyData from '../assets/generated/legacy-answers.json';
import {EPOCH,normalize,score,type Attempt} from './game';

export type Answer={id:string;key:string;display:string;lemma:string;pos:string;frequency:number|null;source:string;reason:string;family:string;sensitive:boolean};
export const CORPUS_VERSION=answerData.version;
export const GUESSES=guessesText.trim().split('\n');
export const WORDS=GUESSES;
export const ANSWERS=answerData.answers as Answer[];
const guessSet=new Set(GUESSES),answerMap=new Map(ANSWERS.map(answer=>[answer.key,answer])),answerIdMap=new Map(ANSWERS.map(answer=>[answer.id,answer])),displayMap=new Map(ANSWERS.map(answer=>[answer.key,answer.display]));
const schedule=new Map(scheduleData.entries.map(entry=>[entry.date,entry.key]));

export const isWord=(word:string)=>guessSet.has(normalize(word));
export const displayWord=(word:string)=>displayMap.get(normalize(word))||normalize(word);
export function answerFor(day:number){const epoch=new Date(`${EPOCH}T00:00:00Z`),date=new Date(epoch.getTime()+(day-1)*86400000).toISOString().slice(0,10),key=schedule.get(date)??ANSWERS[((day-1)%ANSWERS.length+ANSWERS.length)%ANSWERS.length].key;return answerMap.get(key)!}
export function infiniteAnswer(token:string){if(/^\d+$/.test(token)){const n=Number(token);return legacyData[((n-1)%legacyData.length+legacyData.length)%legacyData.length]}return answerIdMap.get(token)??ANSWERS[0]}
export function hintFor(answer:string,attempts:Attempt[],draft:string){const mask=normalize(draft).padEnd(5,'_'),candidates=ANSWERS.filter(candidate=>candidate.key!==answer&&[...mask].every((letter,index)=>letter==='_'||letter===candidate.key[index])&&attempts.every(attempt=>{const clue=score(attempt.word,candidate.key);return clue.correct===attempt.clue.correct&&clue.present===attempt.clue.present&&clue.absent===attempt.clue.absent}));return candidates.length?candidates[Math.floor(Math.random()*candidates.length)].key:null}

type Bag={version:string;remaining:string[];seen:string[];recentFamilies:string[]};
const BAG_KEY='termo500.infinite-bag.v1';
const shuffled=(values:string[],random:()=>number)=>{const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result};
function readBag(random:()=>number):Bag{let saved:Partial<Bag>={};try{saved=JSON.parse(localStorage.getItem(BAG_KEY)||'{}')}catch{}const valid=new Set(ANSWERS.map(a=>a.key)),remaining=(saved.remaining||[]).filter((x):x is string=>typeof x==='string'&&valid.has(x)),seen=(saved.seen||[]).filter((x):x is string=>typeof x==='string'&&valid.has(x)&&!remaining.includes(x)),known=new Set([...remaining,...seen]),added=ANSWERS.map(a=>a.key).filter(key=>!known.has(key));return{version:CORPUS_VERSION,remaining:[...remaining,...shuffled(added,random)],seen,recentFamilies:(saved.recentFamilies||[]).filter(x=>typeof x==='string').slice(-20)}}
export function nextInfiniteAnswer(random=Math.random){const bag=readBag(random);if(!bag.remaining.length){bag.seen=[];bag.remaining=shuffled(ANSWERS.map(a=>a.key),random)}const recent=new Set(bag.recentFamilies),eligible=bag.remaining.findIndex(key=>!recent.has(answerMap.get(key)!.family)),index=eligible<0?0:eligible,[key]=bag.remaining.splice(index,1);bag.seen.push(key);bag.recentFamilies.push(answerMap.get(key)!.family);bag.recentFamilies=bag.recentFamilies.slice(-20);localStorage.setItem(BAG_KEY,JSON.stringify(bag));return answerMap.get(key)!.id}
