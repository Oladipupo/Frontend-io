import{S as e,i as t,s,e as a,t as r,k as c,c as n,a as l,g as i,d as o,n as m,O as f,b as h,L as d,f as u,H as g,Q as p,h as v,J as y,I as $,j as w,m as E,o as I,x as j,u as k,v as x,W as b,N as D,K as V,M}from"../chunks/vendor-0d868d72.js";import{H as B,F as C}from"../chunks/footer-307d44f1.js";import{m as H}from"../chunks/dbMusic-ce4f969e.js";function N(e,t,s){const a=e.slice();return a[3]=t[s],a[5]=s,a}function F(e){let t,s,w,E,I,j,k,x,b,D,B,C,H,N,F,T,z,A,G,J=e[3].name+"";function K(){return e[1](e[3])}return{c(){t=a("div"),s=a("div"),w=a("h5"),E=r(J),I=c(),j=a("img"),b=c(),D=a("div"),B=a("div"),C=a("iframe"),T=c(),this.h()},l(e){t=n(e,"DIV",{class:!0});var a=l(t);s=n(a,"DIV",{class:!0,style:!0});var r=l(s);w=n(r,"H5",{style:!0});var c=l(w);E=i(c,J),c.forEach(o),I=m(r),j=n(r,"IMG",{class:!0,style:!0,src:!0,alt:!0}),r.forEach(o),a.forEach(o),b=m(e),D=n(e,"DIV",{id:!0,class:!0});var f=l(D);B=n(f,"DIV",{});var h=l(B);C=n(h,"IFRAME",{title:!0,src:!0,width:!0,height:!0,frameborder:!0,allow:!0}),l(C).forEach(o),h.forEach(o),T=m(f),f.forEach(o),this.h()},h(){f(w,"color","white"),f(w,"text-align","center"),f(w,"font-family","'Courier New', Courier, monospace"),h(j,"class","card-img mx-auto"),f(j,"width","100%"),f(j,"min-height","50px"),d(j.src,k=e[3].img)||h(j,"src",k),h(j,"alt",""),h(s,"class","card  svelte-3xti9t"),f(s,"transition",".3s transform cubic-bezier(.155,1.105,.295,1.12)"),f(s,"width","40%"),f(s,"background-color","black "),h(t,"class","col d-flex justify-content-center align-items-center mb-5"),h(C,"title",H=e[3].name),d(C.src,N=e[3].link)||h(C,"src",N),h(C,"width","100%"),h(C,"height","380"),h(C,"frameborder","0"),h(C,"allow","encrypted-media"),h(D,"id",z="project"+e[3].name),h(D,"class","sp svelte-3xti9t")},m(e,a){u(e,t,a),g(t,s),g(s,w),g(w,E),g(s,I),g(s,j),u(e,b,a),u(e,D,a),g(D,B),g(B,C),g(D,T),A||(G=p(j,"click",K),A=!0)},p(t,s){e=t,1&s&&J!==(J=e[3].name+"")&&v(E,J),1&s&&!d(j.src,k=e[3].img)&&h(j,"src",k),1&s&&H!==(H=e[3].name)&&h(C,"title",H),1&s&&!d(C.src,N=e[3].link)&&h(C,"src",N),1&s&&z!==(z="project"+e[3].name)&&h(D,"id",z)},i(e){x||y((()=>{x=V(s,M,{}),x.start()})),F||y((()=>{F=V(B,M,{}),F.start()}))},o:$,d(e){e&&o(t),e&&o(b),e&&o(D),A=!1,G()}}}function T(e){let t,s,d,p,v,y,$,D,V,M,H,T;t=new B({});let z=e[0],A=[];for(let a=0;a<z.length;a+=1)A[a]=F(N(e,z,a));return H=new C({}),{c(){w(t.$$.fragment),s=c(),d=a("div"),p=a("h1"),v=r("Music"),y=c(),$=a("div"),D=a("div"),V=a("div");for(let e=0;e<A.length;e+=1)A[e].c();M=c(),w(H.$$.fragment),this.h()},l(e){E(t.$$.fragment,e),s=m(e),d=n(e,"DIV",{class:!0});var a=l(d);p=n(a,"H1",{style:!0});var r=l(p);v=i(r,"Music"),r.forEach(o),a.forEach(o),y=m(e),$=n(e,"DIV",{class:!0});var c=l($);D=n(c,"DIV",{class:!0});var f=l(D);V=n(f,"DIV",{class:!0,style:!0});var h=l(V);for(let t=0;t<A.length;t+=1)A[t].l(h);h.forEach(o),f.forEach(o),c.forEach(o),M=m(e),E(H.$$.fragment,e),this.h()},h(){f(p,"color","white"),f(p,"font-family","'Courier New', Courier, monospace"),h(d,"class","wrapper svelte-3xti9t"),h(V,"class","row row-cols-1 "),f(V,"align-items","center"),f(V,"justify-content","center"),f(V,"width","100%"),h(D,"class","container"),h($,"class","wrapper svelte-3xti9t")},m(e,a){I(t,e,a),u(e,s,a),u(e,d,a),g(d,p),g(p,v),u(e,y,a),u(e,$,a),g($,D),g(D,V);for(let t=0;t<A.length;t+=1)A[t].m(V,null);u(e,M,a),I(H,e,a),T=!0},p(e,[t]){if(1&t){let s;for(z=e[0],s=0;s<z.length;s+=1){const a=N(e,z,s);A[s]?(A[s].p(a,t),j(A[s],1)):(A[s]=F(a),A[s].c(),j(A[s],1),A[s].m(V,null))}for(;s<A.length;s+=1)A[s].d(1);A.length=z.length}},i(e){if(!T){j(t.$$.fragment,e);for(let e=0;e<z.length;e+=1)j(A[e]);j(H.$$.fragment,e),T=!0}},o(e){k(t.$$.fragment,e),k(H.$$.fragment,e),T=!1},d(e){x(t,e),e&&o(s),e&&o(d),e&&o(y),e&&o($),b(A,e),e&&o(M),x(H,e)}}}function z(e,t,s){let a;D(e,H,(e=>s(0,a=e)));return[a,e=>{var t;(t=e).clicked?(document.getElementById(`project${t.name}`).style.opacity="0",setTimeout((()=>{document.getElementById(`project${t.name}`).style.display="none"}),200),t.clicked=!1):(document.getElementById(`project${t.name}`).style.display="inline",setTimeout((()=>{document.getElementById(`project${t.name}`).style.opacity="1"}),100),t.clicked=!0)}]}class A extends e{constructor(e){super(),t(this,e,z,T,s,{})}}export{A as default};
