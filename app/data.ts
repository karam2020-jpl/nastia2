export type Product={id:string;name:string;brand:string;category:string;price:number;description:string;shades:string[];sizes:string[];stock:number;color:string};
export const products:Product[]=[
 {id:'serum',name:'سيروم Advanced Night Repair',brand:'Estée Lauder',category:'العناية بالبشرة',price:79000,description:'سيروم خفيف للعناية بمظهر البشرة وترطيبها ضمن روتينك اليومي.',shades:['شفاف'],sizes:['30 مل','50 مل'],stock:12,color:'#ead5c6'},
 {id:'cream',name:'كريم Moisture Surge',brand:'Clinique',category:'العناية بالبشرة',price:62000,description:'مرطب بقوام جل يمنح البشرة إحساساً منعشاً وناعماً.',shades:['شفاف'],sizes:['30 مل','50 مل'],stock:8,color:'#d5e8df'},
 {id:'lipstick',name:'أحمر شفاه Rouge',brand:'Dior',category:'المكياج',price:54000,description:'أحمر شفاه بلون غني ولمسة مريحة.',shades:['وردي هادئ','أحمر كلاسيكي','نود'],sizes:['3.5 غم'],stock:15,color:'#efc3c1'},
 {id:'foundation',name:'كريم أساس Luminous Silk',brand:'Giorgio Armani',category:'المكياج',price:84000,description:'كريم أساس سائل بلمسة طبيعية قابلة للبناء.',shades:['فاتح','متوسط','قمحي'],sizes:['30 مل'],stock:5,color:'#e7cfb5'},
 {id:'perfume',name:'عطر Libre',brand:'YSL',category:'العطور',price:145000,description:'عطر أنيق للاستخدام في المناسبات والأوقات المميزة.',shades:['أصلي'],sizes:['50 مل','90 مل'],stock:7,color:'#eadcc4'},
 {id:'hair',name:'زيت Elixir Ultime',brand:'Kérastase',category:'العناية بالشعر',price:68000,description:'زيت لطيف يمنح الشعر مظهراً لامعاً وملمساً ناعماً.',shades:['شفاف'],sizes:['75 مل'],stock:3,color:'#e8dfc8'},
];
export const categories=['العناية بالبشرة','المكياج','العطور','العناية بالشعر'];
export const provinces=['بغداد','البصرة','أربيل','النجف','كربلاء','نينوى'];
export const delivery:Record<string,number>={بغداد:5000,البصرة:8000,أربيل:8000,النجف:7000,كربلاء:7000,نينوى:9000};
export const money=(n:number)=>new Intl.NumberFormat('ar-IQ').format(n)+' د.ع';
