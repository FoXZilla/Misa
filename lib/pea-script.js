"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//
// export function parseHTML(aHTMLString:string){
//     var dom =document.implementation.createHTMLDocument('pea3nut');
//     dom.documentElement.innerHTML =aHTMLString;
//     return dom.body;
// }
// /**
//  * @link http://javascript.ruanyifeng.com/dom/element.html#toc12
//  * */
// export function getElementPosition(e:HTMLElement) {
//     var x = 0;
//     var y = 0;
//     while (e !== null)  {
//         x += e.offsetLeft;
//         y += e.offsetTop;
//         e = e.offsetParent;
//     }
//     return {x: x, y: y};
// }
//
// export function formatDate(
//     timestamp:number|string|Date=new Date,
//     {hasTime=true ,fillZeroOfDate=true ,fillZeroOfTime=true}={}
// ){
//     var date;
//     if(timestamp instanceof Date){
//         date=timestamp;
//     }else if(typeof timestamp ==='number'){
//         date =new Date(timestamp);
//     }else{
//         throw new Error('formatDate: could not parse arguments[0] => '+timestamp);
//     }
//
//
//
//
//     var arr1 =[];
//     arr1.push(date.getFullYear());
//     arr1.push(date.getMonth()+1);
//     arr1.push(date.getDate());
//     if(fillZeroOfDate)fillZero(arr1);
//     if(hasTime===false) return arr1.join('-');
//     var arr2 =[];
//     arr2.push(date.getHours());
//     arr2.push(date.getMinutes());
//     arr2.push(date.getSeconds());
//     if(fillZeroOfTime)fillZero(arr2);
//     return arr1.join('-')+' '+arr2.join(':');
//
//     function fillZero(arr:string[]){
//         for(var i=0 ;i<arr.length ;i++){
//             let temp=arr[i];
//             temp =Number(temp)>9 ?temp :'0'+temp;
//             arr[i]=temp;
//         };
//     };
// };
//
//
// export function getRandom(min:number,max:number,{includedMin=true,includedMax=false,isInt=true}={}){
//     if(!includedMin && includedMax){
//         return -getRandom.call(null ,-max ,-min ,{includedMin:includedMax,includedMax:includedMin,isInt});
//     }
//
//     if(includedMin && includedMax && !isInt){
//         console.wran('getRandom: could not create both sides included random number.');
//         console.wran('miss max side.');
//         includedMax=false;
//     }
//
//     var random=null;
//     if(!includedMax){
//         random =Math.random()*(max-min)+min;
//         if(isInt) random=Math.floor(random);
//     }else if(includedMax && isInt){
//         random =Math.floor(
//             Math.random()*(max+1-min)+min
//         );
//     };
//
//     if(!includedMin && random===min){
//         return getRandom.apply(null ,arguments);
//     }else{
//         return random;
//     }
// };
//
function getRandomChar(len) {
    var str = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ123456789";
    var random = [];
    for (let i = 0; i < len; i++) {
        let rand = Math.floor(Math.random() * str.length);
        random.push(str.charAt(rand));
    }
    ;
    return random.join('');
}
exports.getRandomChar = getRandomChar;
;
function Assert(val) { return val; }
exports.Assert = Assert;
;
function noLeftSpace(literals) {
    var str = '';
    if (typeof literals === 'string') {
        str = literals;
    }
    else if (Array.isArray(literals)) {
        let args = Array.from(arguments).map(i => i.toString());
        let i = 0;
        while (i < literals.length) {
            str += literals[i++];
            if (i < args.length) {
                let lines = args[i].split('\n');
                let startSpace = literals[i - 1].split('\n').pop();
                if (lines.length !== 1 && !startSpace.trim()) {
                    for (let g = 1; g < lines.length; g++) {
                        lines[g] = startSpace + lines[g];
                    }
                    ;
                    str += lines.join('\n');
                }
                else {
                    str += args[i];
                }
            }
        }
    }
    ;
    var lines = str.split('\n');
    if (!lines[0].trim())
        lines.splice(0, 1);
    if (!lines[lines.length - 1].trim())
        lines.splice(lines.length - 1, 1);
    var minSpaceCount = function (countList) {
        return Math.min(...countList)
            || Math.min(...countList.slice(1))
            || 0;
        ;
    }(lines.map(function (str) {
        let space = str.match(/^\s+/);
        return space ? space[0].length : 0;
    }));
    if (minSpaceCount === 0)
        return str;
    var replaceSpaceExp = new RegExp('^\\s{' + minSpaceCount + '}');
    lines = lines.map(line => line.replace(replaceSpaceExp, ''));
    return lines.join('\n');
}
exports.noLeftSpace = noLeftSpace;
;
exports.o_0 = noLeftSpace;
//
// export function getRandomItem(arrayLike){
//     let rand = Math.floor(Math.random() * arrayLike.length);
//     return  arrayLike[rand];
// };
//
// export function debounce({fn,idle=10,context=null,run=false,runSync=false}){
//     var timer = null;
//     var wrapper =function(){
//         clearTimeout(timer);
//         timer = setTimeout(()=>{
//             fn.apply(context,arguments);
//         } ,idle);
//     };
//     if(run)wrapper();
//     else if (runSync) fn.call(context);
//     return wrapper;
// };
