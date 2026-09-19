export function paginate<T>(items:T[],requested:number,size=12){
 const total=Math.max(1,Math.ceil(items.length/size));
 const page=Math.min(total,Math.max(1,Number.isFinite(requested)?Math.floor(requested):1));
 const start=Math.max(1,Math.min(page-3,total-6));
 return {page,total,items:items.slice((page-1)*size,page*size),pages:Array.from({length:Math.min(7,total)},(_,i)=>start+i)};
}
