import wordsText from '../assets/words.txt?raw';
import accentsText from '../assets/accents.txt?raw';
import {normalize,score,type Attempt} from './game';

export const WORDS=wordsText.trim().split('\n');
const accents=new Map(accentsText.trim().split('\n').filter(Boolean).map(line=>line.split('\t') as [string,string]));
const map=new Map(WORDS.map(key=>[key,accents.get(key)||key]));
export const ANSWERS=WORDS.map(key=>({key,display:map.get(key)!}));

export const isWord=(word:string)=>map.has(normalize(word));
export const displayWord=(word:string)=>map.get(normalize(word))||normalize(word);
export function answerFor(day:number){const index=((day-1)%ANSWERS.length+ANSWERS.length)%ANSWERS.length;return ANSWERS[index]}
export function hintFor(answer:string,attempts:Attempt[],draft:string){const mask=normalize(draft).padEnd(5,'_'),candidates=ANSWERS.filter(candidate=>candidate.key!==answer&&[...mask].every((letter,index)=>letter==='_'||letter===candidate.key[index])&&attempts.every(attempt=>{const clue=score(attempt.word,candidate.key);return clue.correct===attempt.clue.correct&&clue.present===attempt.clue.present&&clue.absent===attempt.clue.absent}));return candidates.length?candidates[Math.floor(Math.random()*candidates.length)].key:null}
