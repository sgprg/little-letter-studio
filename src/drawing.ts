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
