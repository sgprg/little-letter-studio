import { Capacitor } from '@capacitor/core';

const installed=()=>Capacitor.isNativePlatform()||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||(navigator as Navigator & {standalone?:boolean}).standalone===true;
export let playing=installed();
let observer:ResizeObserver|undefined, wasFullscreen=false;
let change=()=>{};

export function bindPlay(onChange:()=>void){
  change=onChange;observer?.disconnect();
  const stage=document.querySelector<HTMLElement>('.drawing-stage')!;
  observer=new ResizeObserver(()=>fit());observer.observe(stage);apply();
}
function fit(){
  const stage=document.querySelector<HTMLElement>('.drawing-stage'),canvas=document.querySelector<HTMLCanvasElement>('#drawing');
  if(!stage||!canvas)return;
  if(playing){const width=Math.min(stage.clientWidth,stage.clientHeight*800/650);canvas.style.width=`${width}px`;canvas.style.height=`${width*650/800}px`;}
  else{canvas.style.width='';canvas.style.height='';}
}
function apply(){document.documentElement.classList.toggle('play-mode',playing);change();requestAnimationFrame(fit);}
export async function enterPlay():Promise<boolean>{
  playing=true;apply();
  if(installed()||document.fullscreenElement)return true;
  if(!document.fullscreenEnabled||!document.documentElement.requestFullscreen)return false;
  try{await document.documentElement.requestFullscreen({navigationUI:'hide'});wasFullscreen=true;return true;}catch{return false;}
}
export async function leavePlay(){
  playing=false;apply();
  if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});
}
document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement){wasFullscreen=true;playing=true;apply();}
  else if(wasFullscreen){wasFullscreen=false;playing=false;apply();}
});

// Short, quiet notes generated on-device: no audio downloads or voice service.
let audio:AudioContext|undefined;
export function unlockSound(){
  try{audio??=new AudioContext();if(audio.state==='suspended')void audio.resume().catch(()=>{});}catch{}
}
export function chime(){
  if(!audio||audio.state!=='running')return;
  try{
    [523.25,659.25,783.99].forEach((frequency,i)=>{
      const oscillator=audio!.createOscillator(),gain=audio!.createGain(),start=audio!.currentTime+i*.13;
      oscillator.type='sine';oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.055,start+.025);gain.gain.exponentialRampToValueAtTime(.001,start+.38);
      oscillator.connect(gain);gain.connect(audio!.destination);oscillator.start(start);oscillator.stop(start+.4);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    });
  }catch{}
}
