import{S as L,i as O,s as W,e as $,k as I,t as N,c as y,a as b,d as f,n as D,g as q,b as u,O as _,L as F,f as x,H as v,h as B,J as Q,I as R,j as M,m as S,o as z,x as V,u as A,v as G,W as T,N as U,K as X,M as Y}from"../chunks/vendor-0d868d72.js";import{H as Z,F as ee}from"../chunks/footer-a9ee1005.js";import{p as te}from"../chunks/dbProjects-a54810ee.js";function J(m,r,l){const a=m.slice();return a[1]=r[l],a}function K(m){let r,l,a,o,j,w,d,p,n,g=m[1].name+"",h,k;return{c(){r=$("div"),l=$("div"),a=$("a"),o=$("img"),p=I(),n=$("h5"),h=N(g),k=I(),this.h()},l(c){r=y(c,"DIV",{class:!0});var t=b(r);l=y(t,"DIV",{class:!0,style:!0});var e=b(l);a=y(e,"A",{href:!0,class:!0});var i=b(a);o=y(i,"IMG",{class:!0,style:!0,src:!0,alt:!0}),i.forEach(f),e.forEach(f),p=D(t),n=y(t,"H5",{style:!0});var s=b(n);h=q(s,g),s.forEach(f),k=D(t),t.forEach(f),this.h()},h(){u(o,"class","card-img mx-auto"),_(o,"width","100%"),_(o,"min-height","275px"),F(o.src,j=m[1].img)||u(o,"src",j),u(o,"alt",""),u(a,"href",w=m[1].git),u(a,"class","stretched-link"),u(l,"class","card svelte-x5yyi1"),_(l,"border-color","white"),_(l,"min-height","275px "),_(l,"border-width","1px"),_(l,"transition",".3s transform cubic-bezier(.155,1.105,.295,1.12)"),_(l,"background-color","black"),_(n,"color","white"),_(n,"text-align","center"),_(n,"font-family","'Courier New', Courier, monospace"),u(r,"class","col")},m(c,t){x(c,r,t),v(r,l),v(l,a),v(a,o),v(r,p),v(r,n),v(n,h),v(r,k)},p(c,t){t&1&&!F(o.src,j=c[1].img)&&u(o,"src",j),t&1&&w!==(w=c[1].git)&&u(a,"href",w),t&1&&g!==(g=c[1].name+"")&&B(h,g)},i(c){d||Q(()=>{d=X(l,Y,{}),d.start()})},o:R,d(c){c&&f(r)}}}function se(m){let r,l,a,o,j,w,d,p,n,g,h,k;r=new Z({});let c=m[0],t=[];for(let e=0;e<c.length;e+=1)t[e]=K(J(m,c,e));return h=new ee({}),{c(){M(r.$$.fragment),l=I(),a=$("div"),o=$("h1"),j=N("Projects"),w=I(),d=$("div"),p=$("div"),n=$("div");for(let e=0;e<t.length;e+=1)t[e].c();g=I(),M(h.$$.fragment),this.h()},l(e){S(r.$$.fragment,e),l=D(e),a=y(e,"DIV",{class:!0});var i=b(a);o=y(i,"H1",{style:!0});var s=b(o);j=q(s,"Projects"),s.forEach(f),i.forEach(f),w=D(e),d=y(e,"DIV",{class:!0});var E=b(d);p=y(E,"DIV",{class:!0});var H=b(p);n=y(H,"DIV",{class:!0});var P=b(n);for(let C=0;C<t.length;C+=1)t[C].l(P);P.forEach(f),H.forEach(f),E.forEach(f),g=D(e),S(h.$$.fragment,e),this.h()},h(){_(o,"color","white"),_(o,"font-family","'Courier New', Courier, monospace"),u(a,"class","wrapper svelte-x5yyi1"),u(n,"class","row row-cols-1 row-cols-lg-2"),u(p,"class","container"),u(d,"class","wrapper svelte-x5yyi1")},m(e,i){z(r,e,i),x(e,l,i),x(e,a,i),v(a,o),v(o,j),x(e,w,i),x(e,d,i),v(d,p),v(p,n);for(let s=0;s<t.length;s+=1)t[s].m(n,null);x(e,g,i),z(h,e,i),k=!0},p(e,[i]){if(i&1){c=e[0];let s;for(s=0;s<c.length;s+=1){const E=J(e,c,s);t[s]?(t[s].p(E,i),V(t[s],1)):(t[s]=K(E),t[s].c(),V(t[s],1),t[s].m(n,null))}for(;s<t.length;s+=1)t[s].d(1);t.length=c.length}},i(e){if(!k){V(r.$$.fragment,e);for(let i=0;i<c.length;i+=1)V(t[i]);V(h.$$.fragment,e),k=!0}},o(e){A(r.$$.fragment,e),A(h.$$.fragment,e),k=!1},d(e){G(r,e),e&&f(l),e&&f(a),e&&f(w),e&&f(d),T(t,e),e&&f(g),G(h,e)}}}function re(m,r,l){let a;return U(m,te,o=>l(0,a=o)),[a]}class ie extends L{constructor(r){super();O(this,r,re,se,W,{})}}export{ie as default};
