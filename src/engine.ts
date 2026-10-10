import { artwork, type Art } from './art';
import { emptyDrawing, MAX_ACTIONS, MAX_POINTS, type Action, type Drawing, type Point, type Tool } from './drawing';

function layer(width=1600,height=1300){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  return canvas.getContext('2d',{willReadFrequently:width<800})!;
}
type Gesture={id:number;type:string;action:Action;painted:number;bounds:DOMRect};

export class DrawingEngine {
  tool:Tool='fill'; color='#ed4f59'; size=22; easy=true; penOnly=false;
  drawing:Drawing=emptyDrawing(); complete=false;
  private scene:Art=artwork.cat;
  private paths:Path2D[]=[];
  private outside:Path2D[]=[];
  private active:Gesture|null=null;
  private frame=0;
  private pointsUsed=0;
  private lastPen=-Infinity;
  private context:CanvasRenderingContext2D;
  private paint=layer();
  private preview=layer();
  private outlines=layer();
  private coverage=layer(200,163);
  private targets=new Uint8Array(200*163);
  private totals:number[]=[];
  private abort=new AbortController();
  onChange:(reason:'draw'|'history'|'clear')=>void=()=>{};
  onGesture:()=>void=()=>{};
  onLimit:()=>void=()=>{};
  constructor(readonly canvas:HTMLCanvasElement){
    this.context=canvas.getContext('2d')!;canvas.width=1600;canvas.height=1300;
    const options={signal:this.abort.signal};
    canvas.addEventListener('pointerdown',this.down,options);
    canvas.addEventListener('pointermove',this.move,options);
    canvas.addEventListener('pointerup',this.up,options);
    canvas.addEventListener('pointercancel',this.cancel,options);
    canvas.addEventListener('lostpointercapture',this.cancel,options);
    canvas.addEventListener('contextmenu',e=>e.preventDefault(),options);
    // A viewport change invalidates gesture coordinates; never bridge a rotation with a stray line.
    window.addEventListener('resize',()=>this.discard(),options);
    window.addEventListener('blur',()=>this.discard(),options);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.discard();},options);
    this.setPicture('cat',emptyDrawing());
  }
  destroy(){this.discard();this.abort.abort();cancelAnimationFrame(this.frame);}
  private reset(c:CanvasRenderingContext2D){c.resetTransform();c.clearRect(0,0,c.canvas.width,c.canvas.height);c.setTransform(c.canvas.width/800,0,0,c.canvas.height/650,0,0);}
  setPicture(id:string,drawing:Drawing){
    this.discard();this.scene=artwork[id];this.paths=this.scene.regions.map(r=>new Path2D(r.d));
    this.outside=this.paths.map(path=>{const p=new Path2D();p.rect(0,0,800,650);p.addPath(path);return p;});
    this.drawing=drawing;this.buildOutlines();this.buildTargets();this.rebuild();
  }
  private point(e:PointerEvent,bounds:DOMRect,last?:Point):Point{
    // Pointer-up pressure is normally zero; retain the last contact pressure at the endpoint.
    const pressure=e.pointerType==='pen'?(e.pressure>0?e.pressure:last?.p??.5):.65;
    return {x:Math.max(0,Math.min(800,(e.clientX-bounds.left)*800/bounds.width)),y:Math.max(0,Math.min(650,(e.clientY-bounds.top)*650/bounds.height)),p:pressure};
  }
  private region(p:Point){
    const c=this.context;c.save();c.resetTransform();
    for(let i=this.paths.length-1;i>=0;i--)if(c.isPointInPath(this.paths[i],p.x,p.y)){c.restore();return this.scene.regions[i].id;}
    c.restore();return '__paper';
  }
  private down=(e:PointerEvent)=>{
    if(e.button!==0)return;
    if(e.pointerType==='pen'){
      this.lastPen=performance.now();
      // A resting finger must never claim the canvas ahead of the stylus.
      if(this.active?.type==='touch')this.discard();
    }
    if(this.active||(e.pointerType==='touch'&&(this.penOnly||performance.now()-this.lastPen<800||Math.max(e.width,e.height)>45)))return;
    if(this.drawing.cursor>=MAX_ACTIONS||this.pointsUsed>=MAX_POINTS-1){this.onLimit();return;}
    e.preventDefault();this.onGesture();
    const bounds=this.canvas.getBoundingClientRect(),p=this.point(e,bounds);
    const action:Action={tool:this.tool,color:this.color,size:this.size,region:this.tool==='fill'||this.easy?this.region(p):null,points:[p]};
    this.reset(this.preview);this.active={id:e.pointerId,type:e.pointerType,action,painted:0,bounds};
    if(e.isTrusted)this.canvas.setPointerCapture(e.pointerId);
    this.schedule();
  };
  private move=(e:PointerEvent)=>{
    if(e.pointerType==='pen')this.lastPen=performance.now();
    if(!this.active||this.active.id!==e.pointerId||this.active.action.tool==='fill')return;
    e.preventDefault();const events=e.getCoalescedEvents?.()||[];
    for(const item of events.length?events:[e]){
      const points=this.active.action.points,last=points[points.length-1],p=this.point(item,this.active.bounds,last);
      if(Math.hypot(p.x-last.x,p.y-last.y)<.4)continue;
      if(points.length+this.pointsUsed>=MAX_POINTS)break;
      points.push(p);
    }
    this.schedule();
  };
  private up=(e:PointerEvent)=>{
    if(!this.active||this.active.id!==e.pointerId)return;
    this.move(e);this.paintPending();
    const a=this.active.action;this.active=null;
    this.paint.save();this.paint.resetTransform();this.paint.drawImage(this.preview.canvas,0,0);this.paint.restore();
    this.reset(this.preview);this.action(this.coverage,a,0,true);
    this.drawing.actions=this.drawing.actions.slice(0,this.drawing.cursor);this.drawing.actions.push(a);this.drawing.cursor++;
    this.pointsUsed+=a.points.length;this.measureCompletion();this.render();this.onChange('draw');
    if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);
  };
  private cancel=(e:PointerEvent)=>{if(this.active?.id===e.pointerId)this.discard();};
  private discard(){
    const id=this.active?.id;this.active=null;this.reset(this.preview);
    if(id!==undefined&&this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);
    this.schedule();
  }
  undo(){this.discard();if(this.drawing.cursor){this.drawing.cursor--;this.rebuild();this.onChange('history');}}
  redo(){this.discard();if(this.drawing.cursor<this.drawing.actions.length){this.drawing.cursor++;this.rebuild();this.onChange('history');}}
  clear(){this.discard();this.drawing=emptyDrawing();this.rebuild();this.onChange('clear');}
  private schedule(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.render();});}
  private clip(c:CanvasRenderingContext2D,region:string|null){
    if(region===null)return;
    const index=this.scene.regions.findIndex(r=>r.id===region);
    if(index>=0)c.clip(this.paths[index]);
    for(let i=index+1;i<this.paths.length;i++)c.clip(this.outside[i],'evenodd');
  }
  private action(c:CanvasRenderingContext2D,a:Action,start=0,coverage=false){
    c.save();this.clip(c,a.region);
    c.fillStyle=coverage||a.tool==='eraser'?'#ffffff':a.color;c.strokeStyle=c.fillStyle;
    if(coverage&&a.tool==='eraser')c.globalCompositeOperation='destination-out';
    if(a.tool==='fill'){if(start===0)c.fillRect(0,0,800,650);c.restore();return;}
    const factor=a.tool==='pencil'?.36:a.tool==='crayon'?.8:a.tool==='eraser'?1.45:1;
    c.lineCap='round';c.lineJoin='round';
    const width=(p:Point)=>a.size*factor*(.35+.65*p.p);
    for(let i=start;i<a.points.length;i++){
      const p=a.points[i],last=a.points[Math.max(0,i-1)],w=width(p),previous=width(last);
      // Interpolate pressure along the segment to avoid sudden width jumps.
      const steps=Math.max(1,Math.ceil(Math.abs(w-previous)/2));
      for(let j=1;j<=steps;j++){
        const f=j/steps,g=(j-1)/steps;c.lineWidth=previous+(w-previous)*f;
        if(i===0){c.beginPath();c.arc(p.x,p.y,w/2,0,2*Math.PI);c.fill();break;}
        c.beginPath();c.moveTo(last.x+(p.x-last.x)*g,last.y+(p.y-last.y)*g);c.lineTo(last.x+(p.x-last.x)*f,last.y+(p.y-last.y)*f);c.stroke();
      }
      if(a.tool==='crayon'&&!coverage){
        c.save();c.fillStyle='#ffffff';c.globalAlpha=.45;
        for(let j=0;j<4;j++){const seed=(i*31+j*97)%83;c.fillRect(p.x+(seed/83-.5)*w,p.y+(((seed*17)%79)/79-.5)*w,1.5,1.5);}
        c.restore();
      }
    }
    c.restore();
  }
  private buildOutlines(){
    const c=this.outlines;this.reset(c);c.strokeStyle='#38425c';c.lineWidth=5.5;c.lineCap='round';c.lineJoin='round';
    this.paths.forEach((path,i)=>{c.save();for(let j=i+1;j<this.paths.length;j++)c.clip(this.outside[j],'evenodd');c.stroke(path);c.restore();});
    this.scene.lines.forEach(d=>c.stroke(new Path2D(d)));
    c.fillStyle='#38425c';for(const [x,y,r] of this.scene.dots){c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();}
  }
  private buildTargets(){
    const c=layer(200,163);this.reset(c);
    this.paths.forEach((path,i)=>{c.fillStyle=`rgb(${(i+1)*8},0,0)`;c.fill(path);});
    // Exclude the dark outlines and their antialiasing fringe from the goal.
    c.globalCompositeOperation='destination-out';c.lineWidth=10;
    this.paths.forEach(path=>c.stroke(path));
    this.scene.lines.forEach(d=>c.stroke(new Path2D(d)));
    for(const [x,y,r] of this.scene.dots){c.beginPath();c.arc(x,y,r+3,0,Math.PI*2);c.fill();}
    const data=c.getImageData(0,0,200,163).data;this.targets.fill(0);this.totals=Array(this.paths.length+1).fill(0);
    for(let i=0;i<this.targets.length;i++){
      const id=data[i*4]/8;
      if(data[i*4+3]===255&&Number.isInteger(id)&&id>0&&id<=this.paths.length){this.targets[i]=id;this.totals[id]++;}
    }
  }
  private measureCompletion(){
    const data=this.coverage.getImageData(0,0,200,163).data,counts=this.totals.map(()=>0);
    for(let i=0;i<this.targets.length;i++)if(this.targets[i]&&data[i*4+3]>=240)counts[this.targets[i]]++;
    this.complete=this.totals.some(n=>n>0)&&this.totals.every((n,i)=>!n||counts[i]/n>=.95);
    this.canvas.dataset.complete=String(this.complete);
  }
  private rebuild(){
    this.reset(this.paint);this.reset(this.coverage);this.pointsUsed=0;
    for(const a of this.drawing.actions.slice(0,this.drawing.cursor)){this.action(this.paint,a);this.action(this.coverage,a,0,true);this.pointsUsed+=a.points.length;}
    this.measureCompletion();this.render();
  }
  private paintPending(){
    if(!this.active)return;
    this.action(this.preview,this.active.action,this.active.painted);this.active.painted=this.active.action.points.length;
  }
  render(){
    this.paintPending();const c=this.context;c.resetTransform();c.fillStyle='#fff';c.fillRect(0,0,1600,1300);
    c.drawImage(this.paint.canvas,0,0);if(this.active)c.drawImage(this.preview.canvas,0,0);c.drawImage(this.outlines.canvas,0,0);
    this.canvas.dataset.actions=String(this.drawing.cursor);
  }
  async export(word:string,letter:string):Promise<Blob>{
    const c=document.createElement('canvas');c.width=1600;c.height=1470;
    const ctx=c.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(this.canvas,0,110);
    ctx.fillStyle='#38425c';ctx.font='bold 64px sans-serif';ctx.textAlign='center';ctx.fillText(`${letter} · ${word}`,800,90);
    return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('PNG export failed')),'image/png'));
  }
}
