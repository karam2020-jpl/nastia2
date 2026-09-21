export function categoryArtwork(name:string){
 const choices:Record<string,{slot:number;caption:string}>={
 'العناية بالبشرة':{slot:0,caption:'لبشرة أكثر إشراقاً'},
 'المكياج':{slot:1,caption:'إطلالة تبرز جمالكِ'},
 'العطور':{slot:2,caption:'روائح تحكي قصتكِ'},
 'العناية بالشعر':{slot:3,caption:'شعر أكثر صحة وجمالاً'}};
 return choices[name];
}
