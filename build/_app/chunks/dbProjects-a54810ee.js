import{C as e}from"./vendor-0d868d72.js";const o=async()=>{const s=(await(await fetch("https://oladipupo.io/api/v1/getproject")).json()).map(t=>({name:t.name,img:t.img,des:t.des,git:t.git}));r.set(s)};o();const r=e([]);export{r as p};
