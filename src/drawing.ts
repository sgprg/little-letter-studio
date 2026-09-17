import { artwork, type Art } from './art';
export type Tool = 'fill' | 'pencil' | 'brush' | 'crayon' | 'eraser';
export type Point = { x:number; y:number; p:number };
export type Action = { tool:Tool; color:string; size:number; region:string|null; points:Point[] };
export type Drawing = { version:1; actions:Action[]; cursor:number };
export const emptyDrawing = ():Drawing => ({version:1,actions:[],cursor:0});
export const MAX_ACTIONS=300, MAX_POINTS=30000;
export function validDrawing(input:unknown): input is Drawing {
  const d=input as Drawing;
  return !!d && d.version===1 && Array.isArray(d.actions) && d.actions.length<=MAX_ACTIONS && Number.isInteger(d.cursor) && d.cursor>=0 && d.cursor<=d.actions.length &&
    d.actions.every(a=>['fill','pencil','brush','crayon','eraser'].includes(a.tool) && /^#[0-9a-f]{6}$/i.test(a.color) && Number.isFinite(a.size) && a.size>0 && a.size<=80 &&
      (a.region===null||typeof a.region==='string') && Array.isArray(a.points) && a.points.length<=MAX_POINTS && a.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=800&&p.y>=0&&p.y<=650&&Number.isFinite(p.p)&&p.p>=0&&p.p<=1)) && d.actions.reduce((s,a)=>s+a.points.length,0)<=MAX_POINTS;
}
export class DrawingEngine {
  tool:Tool='fill'; color='#ed4f59'; size=22; easy=true; penOnly=false;
  drawing:Drawing=emptyDrawing();
  private scene:Art=artwork.cat;
  private paths:Path2D[]=[];
  private active:{ id:number; action:Action }|null=null;
  private frame=0;
  private context:CanvasRenderingContext2D;
  private abort=new AbortController();
  onChange:()=>void=()=>{};
  onLimit:()=>void=()=>{};
  constructor(readonly canvas:HTMLCanvasElement) {
    this.context=canvas.getContext('2d')!;
    canvas.width=1600;canvas.height=1300;
    const options={signal:this.abort.signal};
    canvas.addEventListener('pointerdown',this.down,options);
    canvas.addEventListener('pointermove',this.move,options);
    canvas.addEventListener('pointerup',this.up,options);
    canvas.addEventListener('pointercancel',this.cancel,options);
    canvas.addEventListener('lostpointercapture',this.cancel,options);
    canvas.addEventListener('contextmenu',e=>e.preventDefault(),options);
    this.setPicture('cat',emptyDrawing());
  }
  destroy(){this.abort.abort();cancelAnimationFrame(this.frame);}
  setPicture(id:string,drawing:Drawing){this.active=null;this.scene=artwork[id];this.paths=this.scene.regions.map(r=>new Path2D(r.d));this.drawing=drawing;this.render();}
  private point(e:PointerEvent):Point {
    const r=this.canvas.getBoundingClientRect();
    return {x:Math.max(0,Math.min(800,(e.clientX-r.left)*800/r.width)),y:Math.max(0,Math.min(650,(e.clientY-r.top)*650/r.height)),p:e.pointerType==='pen'&&e.pressure>0?e.pressure:.65};
  }
  private region(p:Point){
    const c=this.context;c.save();c.resetTransform();
    for(let i=this.paths.length-1;i>=0;i--) if(c.isPointInPath(this.paths[i],p.x,p.y)){c.restore();return this.scene.regions[i].id;}
    c.restore();return '__paper';
  }
  private down=(e:PointerEvent)=>{
    if(this.active||e.button!==0||(this.penOnly&&e.pointerType!=='pen'&&e.pointerType!=='mouse'))return;
    if(this.drawing.cursor>=MAX_ACTIONS||this.pointCount()>=MAX_POINTS-1){this.onLimit();return;}
    e.preventDefault();
    const p=this.point(e),region=this.tool==='fill'||this.easy?this.region(p):null;
    const a:Action={tool:this.tool,color:this.color,size:this.size,region,points:[p]};
    this.active={id:e.pointerId,action:a};
    if(e.isTrusted)this.canvas.setPointerCapture(e.pointerId);
    this.schedule();
  };
  private move=(e:PointerEvent)=>{
    if(!this.active||this.active.id!==e.pointerId||this.active.action.tool==='fill')return;
    e.preventDefault();
    const events=e.getCoalescedEvents?.()||[];
    for(const item of events.length?events:[e]){
      const p=this.point(item),points=this.active.action.points,last=points[points.length-1];
      if(Math.hypot(p.x-last.x,p.y-last.y)<1)continue;
      if(points.length+this.pointCount()>=MAX_POINTS)break;
      points.push(p);
    }
    this.schedule();
  };
  private up=(e:PointerEvent)=>{
    if(!this.active||this.active.id!==e.pointerId)return;
    this.move(e);
    const action=this.active.action;this.active=null;
    this.drawing.actions=this.drawing.actions.slice(0,this.drawing.cursor);
    this.drawing.actions.push(action);this.drawing.cursor++;
    this.render();this.onChange();
    if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);
  };
  private cancel=(e:PointerEvent)=>{if(this.active?.id===e.pointerId){this.active=null;this.schedule();}};
  private pointCount(){return this.drawing.actions.slice(0,this.drawing.cursor).reduce((s,a)=>s+a.points.length,0);}
  undo(){this.active=null;if(this.drawing.cursor){this.drawing.cursor--;this.render();this.onChange();}}
  redo(){this.active=null;if(this.drawing.cursor<this.drawing.actions.length){this.drawing.cursor++;this.render();this.onChange();}}
  clear(){this.active=null;this.drawing=emptyDrawing();this.render();this.onChange();}
  private schedule(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.render();});}
  private clip(c:CanvasRenderingContext2D,region:string|null){
    if(region===null)return;
    const index=this.scene.regions.findIndex(r=>r.id===region);
    if(index>=0)c.clip(this.paths[index]);
    for(let i=index+1;i<this.paths.length;i++){
      const outside=new Path2D();outside.rect(0,0,800,650);outside.addPath(this.paths[i]);c.clip(outside,'evenodd');
    }
  }
  private action(c:CanvasRenderingContext2D,a:Action){
    c.save();this.clip(c,a.region);c.fillStyle=a.tool==='eraser'?'#ffffff':a.color;c.strokeStyle=c.fillStyle;
    if(a.tool==='fill'){c.fillRect(0,0,800,650);c.restore();return;}
    const factor=a.tool==='pencil'?.36:a.tool==='crayon'?.8:a.tool==='eraser'?1.45:1;
    c.lineCap='round';c.lineJoin='round';
    const pts=a.points;
    for(let i=0;i<pts.length;i++){
      const p=pts[i],last=pts[Math.max(0,i-1)],width=a.size*factor*(.35+.65*p.p);
      c.lineWidth=width;
      if(i===0){c.beginPath();c.arc(p.x,p.y,width/2,0,2*Math.PI);c.fill();}
      else {c.beginPath();c.moveTo(last.x,last.y);c.lineTo(p.x,p.y);c.stroke();}
      if(a.tool==='crayon'){
        // Deterministic paper grain; undo/replay never changes the texture.
        c.save();c.fillStyle='#ffffff';c.globalAlpha=.45;
        for(let j=0;j<4;j++){const seed=(i*31+j*97)%83;c.fillRect(p.x+(seed/83-.5)*width,p.y+(((seed*17)%79)/79-.5)*width,1.5,1.5);}
        c.restore();
      }
    }
    c.restore();
  }
  render(){
    const c=this.context;c.setTransform(2,0,0,2,0,0);c.fillStyle='#fff';c.fillRect(0,0,800,650);
    for(const a of this.drawing.actions.slice(0,this.drawing.cursor))this.action(c,a);
    if(this.active)this.action(c,this.active.action);
    c.strokeStyle='#38425c';c.lineWidth=5.5;c.lineCap='round';c.lineJoin='round';
    // Hide boundary segments covered by regions in front of them.
    this.scene.regions.forEach((r,i)=>{c.save();for(let j=i+1;j<this.paths.length;j++){const outside=new Path2D();outside.rect(0,0,800,650);outside.addPath(this.paths[j]);c.clip(outside,'evenodd');}c.stroke(this.paths[i]);c.restore();});
    this.scene.lines.forEach(d=>c.stroke(new Path2D(d)));
    c.fillStyle='#38425c';for(const [x,y,r] of this.scene.dots){c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();}
    this.canvas.dataset.actions=String(this.drawing.cursor);
  }
  async export(word:string,letter:string):Promise<Blob>{
    const c=document.createElement('canvas');c.width=1600;c.height=1470;
    const ctx=c.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(this.canvas,0,110);
    ctx.fillStyle='#38425c';ctx.font='bold 64px sans-serif';ctx.textAlign='center';ctx.fillText(`${letter} · ${word}`,800,90);
    return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('PNG export failed')),'image/png'));
  }
}
