import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import App from './App';

const tile=(n:number)=>screen.getAllByRole('button',{name:`Posição ${n}`}).find(button=>!button.hasAttribute('disabled'))!;
const key=(value:string)=>fireEvent.keyDown(window,{key:value});
const type=(word:string)=>[...word].forEach(key);

describe('editing a guess',()=>{
 beforeEach(()=>{localStorage.clear();history.replaceState(null,'','/?modo=infinito&jogo=1')});
 afterEach(cleanup);
 it('replaces a clicked position and advances for physical and virtual typing',()=>{
  render(<App/>);type('CARRO');fireEvent.click(tile(2));key('O');
  expect(tile(2)).toHaveTextContent('O');expect(tile(3)).toHaveAttribute('aria-pressed','true');
  fireEvent.click(screen.getByRole('button',{name:'S'}));
  expect(tile(3)).toHaveTextContent('S');expect(tile(4)).toHaveTextContent('R');expect(tile(5)).toHaveTextContent('O');
 });
 it('navigates empty positions, preserves gaps, and clears without shifting',()=>{
  render(<App/>);key('ArrowLeft');key('ArrowRight');key('ArrowRight');key('A');
  expect(tile(1)).toHaveTextContent(/^$/);expect(tile(2)).toHaveTextContent(/^$/);expect(tile(3)).toHaveTextContent('A');
  key('ArrowLeft');key('Backspace');expect(tile(3)).toHaveTextContent(/^$/);
  type('SOL');fireEvent.click(tile(4));key(' ');
  expect(tile(3)).toHaveTextContent('S');expect(tile(4)).toHaveTextContent(/^$/);expect(tile(5)).toHaveTextContent('L');
 });
 it('hides the cursor after the last letter and restores it for editing',()=>{
  render(<App/>);type('CARRO');
  for(let n=1;n<=5;n++)expect(tile(n)).toHaveAttribute('aria-pressed','false');
  key('S');expect(tile(5)).toHaveTextContent('O');
  key('ArrowLeft');expect(tile(5)).toHaveAttribute('aria-pressed','true');
  key('A');expect(tile(5)).toHaveTextContent('A');expect(tile(5)).toHaveAttribute('aria-pressed','false');
  key('Backspace');expect(tile(5)).toHaveTextContent(/^$/);expect(tile(5)).toHaveAttribute('aria-pressed','true');
  fireEvent.click(tile(2));expect(tile(2)).toHaveAttribute('aria-pressed','true');
 });
 it('starts without a cursor and hides it when backspacing in the first cell',()=>{
  render(<App/>);expect(tile(1)).toHaveAttribute('aria-pressed','false');
  key('A');key('ArrowLeft');key('Backspace');
  expect(tile(1)).toHaveTextContent(/^$/);expect(tile(1)).toHaveAttribute('aria-pressed','false');
  key('Backspace');key('B');expect(tile(1)).toHaveTextContent('B');expect(tile(2)).toHaveAttribute('aria-pressed','true');
  fireEvent.click(tile(1));fireEvent.click(screen.getByRole('button',{name:'Apagar letra'}));
  expect(tile(1)).toHaveAttribute('aria-pressed','false');
 });
 it('animates a confirmed hint and cleans up after the effect',()=>{
  const {container}=render(<App/>);type('CARRO');key('Enter');
  fireEvent.click(screen.getByRole('button',{name:'DICA'}));
  expect(container.querySelector('.hint-magic')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'PEDIR DICA'}));
  const effect=container.querySelector('.hint-magic')!;
  expect(effect).toBeInTheDocument();expect(screen.getByRole('status')).toHaveTextContent('Uma palavra possível foi preenchida.');
  fireEvent.animationEnd(effect);expect(container.querySelector('.hint-magic')).toBeNull();
 });
 it('rejects gaps and resets the cursor after submitting a complete guess',()=>{
  render(<App/>);type('CA RO');key('Enter');expect(screen.getByRole('status')).toHaveTextContent('Complete as cinco letras.');
  fireEvent.click(tile(3));key('R');key('Enter');
  expect(screen.getByRole('button',{name:'Marcar letra C, tentativa 1'})).toBeInTheDocument();
  expect(tile(1)).toHaveAttribute('aria-pressed','true');
 });
});
