import{C as a}from"./vendor-0d868d72.js";const t=a([]);(async()=>{const a=await fetch("https://oladipupo.io/api/v1/getart"),s=(await a.json()).map(((a,t)=>({name:a.name,img:a.img,des:a.des,link:a.link})));t.set(s)})();export{t as p};
