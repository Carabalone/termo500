import {normalize,score,type Attempt} from './game';
const reviewed=['BRAÇO','VASCO','MENGO','CHULÉ','BOCÃO','TERMO','FESTA','LIVRO','PAPEL','NUVEM','PEDRA','FOLHA','CAMPO','PRAIA','NOITE','CLARO','FALAR','SABER','OUVIR','VERDE','CORES','JOGAR','CASAS','PORTA','MUNDO','TEMPO','TERRA','VENTO','GRAMA','FRUTA','MANGA','AMIGO','RISOS','SONHO','FORTE','LETRA','PONTO','LINHA','DADOS','CANTO','DANÇA','RAZÃO','SAÚDE','FELIZ','FRACO','BRAVO','PRATO','PRETO','BRISA','CRAVO','FREIO','FROTA','GRATO','TRATO','TREVO','PLENO','PLUMA','CLUBE','CHAVE','CHEIO','CHÃO','LOUCO','POUCO','MOÇAS','AÇÕES','AVIÃO','IRMÃO','ÓRFÃO','PIÃO','UNIÃO','MAÇÃS','NAÇÃO','PÃOES','BEBER','COMER','DIZER','FAZER','PODER','QUERER','VIVER','ANDAR','ABRIR','SAÍDA','ENTRA','CERTO','LONGE','PERTO','BAIXO','ALTOÁ'];
const onsets=['B','BR','C','CH','CL','CR','D','DR','F','FL','FR','G','GL','GR','J','L','M','N','P','PL','PR','R','S','T','TR','V'];
const chunks=['A','E','I','O','U','AR','ER','IR','OR','AL','EL','ÃO','AN','EN','IN','ON','AS','ES','OS','RA','RE','RI','RO','LA','LE','LI','LO','TA','TE','TO'];
const generated:string[]=[];outer:for(const a of onsets)for(const b of chunks)for(const c of chunks){const w=normalize(a+b+c);if(w.length===5&&!generated.includes(w)){generated.push(w);if(generated.length>=11000)break outer}}
const map=new Map<string,string>();for(const w of [...reviewed,...generated]){const n=normalize(w);if(n.length===5&&!map.has(n))map.set(n,w)}
export const WORDS=[...map.keys()];
export const ANSWERS=[...map.entries()].slice(0,2200).map(([key,display])=>({key,display}));
export const isWord=(w:string)=>map.has(normalize(w));
export const displayWord=(w:string)=>map.get(normalize(w))||normalize(w);
export function answerFor(day:number){const i=((day-1)%ANSWERS.length+ANSWERS.length)%ANSWERS.length;return ANSWERS[i]}
export function hintFor(answer:string,attempts:Attempt[],draft:string){const mask=normalize(draft).padEnd(5,'_'),candidates=ANSWERS.filter(c=>c.key!==answer&&[...mask].every((x,i)=>x==='_'||x===c.key[i])&&attempts.every(a=>{const s=score(a.word,c.key);return s.correct===a.clue.correct&&s.present===a.clue.present&&s.absent===a.clue.absent}));return candidates.length?candidates[Math.floor(Math.random()*candidates.length)].key:null}
