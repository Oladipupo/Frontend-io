import{S as Y,i as Z,s as ee,e as $,t as A,k as C,c as g,a as I,g as G,d as f,n as H,O as h,b as c,L as x,f as V,H as k,Q as te,h as se,J,I as le,j as K,m as L,o as O,x as N,u as Q,v as R,W as ie,N as re,K as W,M as P}from"../chunks/vendor-0d868d72.js";import{H as ae,F as ne}from"../chunks/footer-a9ee1005.js";import{m as ce}from"../chunks/dbMusic-ce4f969e.js";function U(t,o,r){const i=t.slice();return i[3]=o[r],i[5]=r,i}function X(t){let o,r,i,d=t[3].name+"",p,D,u,w,_,j,m,E,a,l,e,n,s,b,M,B;function F(){return t[1](t[3])}return{c(){o=$("div"),r=$("div"),i=$("h5"),p=A(d),D=C(),u=$("img"),j=C(),m=$("div"),E=$("div"),a=$("iframe"),s=C(),this.h()},l(v){o=g(v,"DIV",{class:!0});var y=I(o);r=g(y,"DIV",{class:!0,style:!0});var q=I(r);i=g(q,"H5",{style:!0});var T=I(i);p=G(T,d),T.forEach(f),D=H(q),u=g(q,"IMG",{class:!0,style:!0,src:!0,alt:!0}),q.forEach(f),y.forEach(f),j=H(v),m=g(v,"DIV",{id:!0,class:!0});var S=I(m);E=g(S,"DIV",{});var z=I(E);a=g(z,"IFRAME",{title:!0,src:!0,width:!0,height:!0,frameborder:!0,allow:!0}),I(a).forEach(f),z.forEach(f),s=H(S),S.forEach(f),this.h()},h(){h(i,"color","white"),h(i,"text-align","center"),h(i,"font-family","'Courier New', Courier, monospace"),c(u,"class","card-img mx-auto"),h(u,"width","100%"),h(u,"min-height","50px"),x(u.src,w=t[3].img)||c(u,"src",w),c(u,"alt",""),c(r,"class","card  svelte-3xti9t"),h(r,"transition",".3s transform cubic-bezier(.155,1.105,.295,1.12)"),h(r,"width","40%"),h(r,"background-color","black "),c(o,"class","col d-flex justify-content-center align-items-center mb-5"),c(a,"title",l=t[3].name),x(a.src,e=t[3].link)||c(a,"src",e),c(a,"width","100%"),c(a,"height","380"),c(a,"frameborder","0"),c(a,"allow","encrypted-media"),c(m,"id",b="project"+t[3].name),c(m,"class","sp svelte-3xti9t")},m(v,y){V(v,o,y),k(o,r),k(r,i),k(i,p),k(r,D),k(r,u),V(v,j,y),V(v,m,y),k(m,E),k(E,a),k(m,s),M||(B=te(u,"click",F),M=!0)},p(v,y){t=v,y&1&&d!==(d=t[3].name+"")&&se(p,d),y&1&&!x(u.src,w=t[3].img)&&c(u,"src",w),y&1&&l!==(l=t[3].name)&&c(a,"title",l),y&1&&!x(a.src,e=t[3].link)&&c(a,"src",e),y&1&&b!==(b="project"+t[3].name)&&c(m,"id",b)},i(v){_||J(()=>{_=W(r,P,{}),_.start()}),n||J(()=>{n=W(E,P,{}),n.start()})},o:le,d(v){v&&f(o),v&&f(j),v&&f(m),M=!1,B()}}}function oe(t){let o,r,i,d,p,D,u,w,_,j,m,E;o=new ae({});let a=t[0],l=[];for(let e=0;e<a.length;e+=1)l[e]=X(U(t,a,e));return m=new ne({}),{c(){K(o.$$.fragment),r=C(),i=$("div"),d=$("h1"),p=A("Music"),D=C(),u=$("div"),w=$("div"),_=$("div");for(let e=0;e<l.length;e+=1)l[e].c();j=C(),K(m.$$.fragment),this.h()},l(e){L(o.$$.fragment,e),r=H(e),i=g(e,"DIV",{class:!0});var n=I(i);d=g(n,"H1",{style:!0});var s=I(d);p=G(s,"Music"),s.forEach(f),n.forEach(f),D=H(e),u=g(e,"DIV",{class:!0});var b=I(u);w=g(b,"DIV",{class:!0});var M=I(w);_=g(M,"DIV",{class:!0,style:!0});var B=I(_);for(let F=0;F<l.length;F+=1)l[F].l(B);B.forEach(f),M.forEach(f),b.forEach(f),j=H(e),L(m.$$.fragment,e),this.h()},h(){h(d,"color","white"),h(d,"font-family","'Courier New', Courier, monospace"),c(i,"class","wrapper svelte-3xti9t"),c(_,"class","row row-cols-1 "),h(_,"align-items","center"),h(_,"justify-content","center"),h(_,"width","100%"),c(w,"class","container"),c(u,"class","wrapper svelte-3xti9t")},m(e,n){O(o,e,n),V(e,r,n),V(e,i,n),k(i,d),k(d,p),V(e,D,n),V(e,u,n),k(u,w),k(w,_);for(let s=0;s<l.length;s+=1)l[s].m(_,null);V(e,j,n),O(m,e,n),E=!0},p(e,[n]){if(n&1){a=e[0];let s;for(s=0;s<a.length;s+=1){const b=U(e,a,s);l[s]?(l[s].p(b,n),N(l[s],1)):(l[s]=X(b),l[s].c(),N(l[s],1),l[s].m(_,null))}for(;s<l.length;s+=1)l[s].d(1);l.length=a.length}},i(e){if(!E){N(o.$$.fragment,e);for(let n=0;n<a.length;n+=1)N(l[n]);N(m.$$.fragment,e),E=!0}},o(e){Q(o.$$.fragment,e),Q(m.$$.fragment,e),E=!1},d(e){R(o,e),e&&f(r),e&&f(i),e&&f(D),e&&f(u),ie(l,e),e&&f(j),R(m,e)}}}function ue(t){t.clicked?(document.getElementById(`project${t.name}`).style.opacity="0",setTimeout(()=>{document.getElementById(`project${t.name}`).style.display="none"},200),t.clicked=!1):(document.getElementById(`project${t.name}`).style.display="inline",setTimeout(()=>{document.getElementById(`project${t.name}`).style.opacity="1"},100),t.clicked=!0)}function fe(t,o,r){let i;return re(t,ce,p=>r(0,i=p)),[i,p=>ue(p)]}class ve extends Y{constructor(o){super();Z(this,o,fe,oe,ee,{})}}export{ve as default};