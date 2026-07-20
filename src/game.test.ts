import {beforeEach,describe,expect,it} from 'vitest';
import {dayNumber,normalize,score,scoreMarks,statistics} from './game';
import {ANSWERS,GUESSES,answerFor,hintFor,infiniteAnswer,isWord,nextInfiniteAnswer} from './corpus';

describe('motor',()=>{
 beforeEach(()=>localStorage.clear());
 it('normaliza acentos e cedilha',()=>expect(normalize('Braço')).toBe('BRACO'));
 it('pontua duplicatas em duas passagens',()=>expect(score('ARARA','AORTA')).toEqual({correct:2,present:1,absent:2}));
 it('marca cada letra respeitando duplicatas',()=>expect(scoreMarks('ARARA','AORTA')).toEqual(['correct','present','absent','absent','correct']));
 it('fixa o primeiro puzzle no epoch',()=>expect(dayNumber('2026-07-18')).toBe(1));
 it('separa palpites de respostas e mantém as fixtures editoriais',()=>{const answers=new Set(ANSWERS.map(answer=>answer.key));expect(GUESSES.length).toBeGreaterThanOrEqual(8000);expect(ANSWERS.length).toBeLessThan(GUESSES.length);for(const answer of ANSWERS){expect(GUESSES).toContain(answer.key);expect(answer).toMatchObject({key:expect.stringMatching(/^[A-Z]{5}$/),display:expect.any(String),lemma:expect.any(String),pos:expect.any(String),reason:expect.any(String)})}expect(isWord('ABRIR')).toBe(true);expect(answers.has('ABRIR')).toBe(true);expect(isWord('ABRIU')).toBe(true);expect(isWord('ABREM')).toBe(true);expect(answers.has('ABRIU')).toBe(false);expect(answers.has('ABREM')).toBe(false);for(const word of ['LINDO','LINDA','SUICO','AMIGO','VASCO','MENGO'])expect(answers.has(word)).toBe(true)});
 it('congela as respostas já publicadas',()=>{expect(answerFor(1).key).toBe('TERMO');expect(answerFor(2).key).toBe('SUITE');expect(answerFor(3).key).toBe('AVIDO')});
 it('exclui plurais e conjugações produtivas, preservando homógrafo nominal',()=>{const answers=new Set(ANSWERS.map(answer=>answer.key));for(const word of ['MOLAS','PAGAM','BEBIA','PESCO'])expect(answers.has(word)).toBe(false);expect(answers.has('CANTO')).toBe(true)});
 it('mantém URLs infinitas numéricas antigas carregáveis',()=>expect(infiniteAnswer('1').key).toBe('TERMO'));
 it('não repete no infinito antes de esgotar a sacola após recarregar',()=>{const picked=new Set<string>();for(let i=0;i<ANSWERS.length;i++){const key=nextInfiniteAnswer(()=>0.5);expect(picked.has(key)).toBe(false);picked.add(key)}expect(picked.size).toBe(ANSWERS.length);expect(nextInfiniteAnswer(()=>0.5)).toBeTruthy()});
 it('nunca entrega a resposta como dica',()=>expect(hintFor('BRACO',[],'')).not.toBe('BRACO'));
 it('mantém partidas infinitas fora das estatísticas diárias',()=>{const daily={version:2 as const,date:'2026-07-18',archive:false,draft:'',attempts:[],status:'won' as const,hintUsed:false,updatedAt:''},infinite={...daily,infinite:true,puzzle:'TERMO'};expect(statistics([daily,infinite],'2026-07-18').played).toBe(1)});
 it('conta vitória com dica como derrota estatística',()=>{const game={version:2 as const,date:'2026-07-18',archive:false,draft:'',attempts:[],status:'won' as const,hintUsed:true,updatedAt:''};const stats=statistics([game],'2026-07-18');expect(stats.played).toBe(1);expect(stats.wins).toBe(0);expect(stats.current).toBe(0)});
});
