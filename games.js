/* =====================================================================
   JUEGOS  ·  cada función recibe la zona (div) donde renderizar
   ===================================================================== */
const JUEGOS = {};

/* Fotos de referencia reales para ciertos conceptos.
   vis(em) devuelve la foto si el emoji tiene una, o el emoji en otro caso. */
const FOTO_REF = { '🐴':'caballo.png', '🐎':'caballo.png', '🧣':'poncho.png', '🏔️':'salta.png' };
function vis(em){
  const f = FOTO_REF[em];
  return f ? `<img src="${f}" class="foto-ref" alt="">` : em;
}

/* helper marco de juego */
function marco(zona, titulo, consigna, cuerpo){
  zona.innerHTML = `<div class="juego">
    <h2 data-leer="${titulo.replace(/"/g,'')}">${titulo}</h2>
    <p class="consigna" data-leer="${consigna.replace(/"/g,'')}">${consigna} ${btnLeer(consigna)}</p>
    <div id="cuerpo">${cuerpo}</div>
  </div>`;
  return $('#cuerpo',zona);
}

/* =====================================================================
   INFOGRAFÍA INTERACTIVA  (Primer y Segundo Ciclo)
   ===================================================================== */
function infografia(zona, datos, titulo, cita){
  const cards = datos.map((d,i)=>`
    <div class="info-card ${d.col}" tabindex="0" onclick="abrirInfo(this)" data-leer="${(d.tit+'. '+d.txt.join(' ')).replace(/"/g,'')}">
      <div class="tit">${d.ic} ${d.tit}</div>
      <span class="toca">👆 tocá para descubrir</span>
      <div class="cont"><ul>${d.txt.map(t=>`<li>${t}</li>`).join('')}</ul></div>
    </div>`).join('');
  const citaHtml = cita ? `<div class="cita-guemes" data-leer="${cita.replace(/"/g,'')}">«${cita}»<small>— Martín Miguel de Güemes</small></div>` : '';
  const c = marco(zona, titulo, 'Tocá cada tarjeta para descubrir la historia de Güemes. ¡Activá el 🔊 para escucharla!',
    `<div class="info-grid">${cards}${citaHtml}</div>
     <button class="btn-grande" onclick="finJuego()">✅ ¡Listo, aprendí mucho!</button>`);
}
function abrirInfo(card){
  const ya=card.classList.contains('abierta');
  card.classList.toggle('abierta');
  if(!ya){ sonClick(); if(App.lecturaOn) decir(card.getAttribute('data-leer')); }
}
JUEGOS.info_pc = z => infografia(z, INFO_PC, '🔎 Conocé a Güemes');
JUEGOS.info_sc = z => infografia(z, INFO_SC, '📖 Güemes en detalle',
  'Yo no pretendo ni glorias ni honores. Yo solo trabajo por la libertad de mi patria.');

/* =====================================================================
   MOTOR DE QUIZ  (Verdadero/Falso y Opción múltiple)
   ===================================================================== */
function quizVF(zona, titulo, consigna, preguntas, finalMsg){
  let idx=0, aciertos=0;
  const c = marco(zona, titulo, consigna, `<div id="q"></div>`);
  const q = $('#q',c);
  function pinta(){
    if(idx>=preguntas.length){ return medallaFinal(zona, finalMsg.replace('{n}',aciertos).replace('{t}',preguntas.length)); }
    const p=preguntas[idx];
    q.innerHTML = `
      <div class="chip" style="margin:0 auto 14px;width:max-content">Pregunta ${idx+1} de ${preguntas.length}</div>
      <div class="pregunta-card" data-leer="${p.t.replace(/"/g,'')}">${p.t}</div>
      <div class="opciones-vf">
        <button class="btn-vf v" onclick="window._resVF(true,this)"><span class="em">👍</span>VERDADERO</button>
        <button class="btn-vf f" onclick="window._resVF(false,this)"><span class="em">👎</span>FALSO</button>
      </div>
      <div class="feedback" id="fb"></div>
      <div class="explica" id="ex">${p.exp||''}</div>`;
    if(App.lecturaOn) decir(p.t);
  }
  window._resVF=(resp,btn)=>{
    const p=preguntas[idx];
    $$('.btn-vf',q).forEach(b=>b.disabled=true);
    const fb=$('#fb',q), ex=$('#ex',q);
    if(resp===p.r){ aciertos++; sonBien(); confeti(30); fb.textContent='¡Muy bien! 🎉'; fb.className='feedback bien'; }
    else { sonMal(); fb.textContent='¡Casi! Prestá atención 💡'; fb.className='feedback mal'; }
    if(p.exp){ ex.style.display='block'; if(App.lecturaOn) decir((resp===p.r?'Correcto. ':'No. ')+p.exp); }
    else if(App.lecturaOn) decir(resp===p.r?'¡Muy bien!':'Casi, prestá atención.');
    const next=document.createElement('button');
    next.className='btn-grande'; next.textContent = idx+1<preguntas.length?'Siguiente ➡️':'Ver resultado 🏅';
    next.onclick=()=>{ idx++; pinta(); };
    q.appendChild(next);
  };
  pinta();
}

JUEGOS.vf_pc = z => quizVF(z,'✅ ¿Verdadero o Falso?','Leé cada frase y tocá si es Verdadero o Falso.',[
  {t:'Güemes defendió el Norte argentino.', r:true,  exp:'¡Sí! Güemes y sus gauchos defendieron el norte del país.'},
  {t:'Los gauchos viajaban en auto.',       r:false, exp:'No: los gauchos andaban a caballo.'},
  {t:'Güemes nació en la provincia de Salta.', r:true, exp:'¡Correcto! Nació en Salta el 8 de febrero de 1785.'},
  {t:'Los gauchos andaban a caballo.',      r:true,  exp:'¡Así es! El caballo era su gran compañero.'},
], 'Respondiste {n} de {t}. ¡Sos un gran conocedor de Güemes!');

JUEGOS.vf_sc = z => quizVF(z,'⚖️ Verdadero o Falso','Pensá bien cada afirmación. Después de responder vas a ver la justificación.',[
  {t:'Güemes nació en Tucumán.', r:false, exp:'Falso: Güemes nació en Salta, no en Tucumán.'},
  {t:'Güemes participó en las Invasiones Inglesas.', r:true, exp:'Verdadero: participó en 1806 y 1807, donde mostró su valentía.'},
  {t:'Los Gauchos Infernales defendieron el Norte argentino.', r:true, exp:'Verdadero: con sus ataques sorpresa protegieron la frontera norte.'},
  {t:'Macacha era la esposa de Güemes.', r:false, exp:'Falso: Macacha era su hermana y una gran colaboradora de la causa patriota.'},
  {t:'Güemes fue gobernador de Salta.', r:true, exp:'Verdadero: fue elegido gobernador de Salta en 1815.'},
  {t:'La Guerra Gaucha utilizaba ataques sorpresa.', r:true, exp:'Verdadero: emboscadas y ataques rápidos aprovechando el terreno.'},
], 'Lograste {n} de {t}. ¡Pensaste como un verdadero historiador!');

/* Opción múltiple genérico */
function quizMC(zona, titulo, consigna, preguntas, finalMsg){
  let idx=0, aciertos=0;
  const c=marco(zona,titulo,consigna,`<div id="q"></div>`);
  const q=$('#q',c);
  function pinta(){
    if(idx>=preguntas.length){ return medallaFinal(zona, finalMsg.replace('{n}',aciertos).replace('{t}',preguntas.length)); }
    const p=preguntas[idx];
    const ops=baraja(p.ops);
    q.innerHTML=`
      <div class="chip" style="margin:0 auto 14px;width:max-content">Desafío ${idx+1} de ${preguntas.length}</div>
      <div class="pregunta-card" data-leer="${p.t.replace(/"/g,'')}">${p.t}</div>
      <div class="opciones-mc">${ops.map(o=>`<button class="btn-mc" onclick='window._resMC(this,${JSON.stringify(o===p.r)})'>${o}</button>`).join('')}</div>
      <div class="feedback" id="fb"></div>
      <div class="explica" id="ex">${p.exp||''}</div>`;
    if(App.lecturaOn) decir(p.t+'. Opciones: '+ops.join(', '));
  }
  window._resMC=(btn,ok)=>{
    $$('.btn-mc',q).forEach(b=>{ b.disabled=true;
      if(b===btn) b.classList.add(ok?'correcta':'incorrecta');
    });
    const p=preguntas[idx], fb=$('#fb',q), ex=$('#ex',q);
    if(ok){ aciertos++; sonBien(); confeti(30); fb.textContent='¡Correcto! 🌟'; fb.className='feedback bien';
      btn.classList.add('correcta'); }
    else { sonMal(); fb.textContent='No era esa 💡'; fb.className='feedback mal';
      // resaltar correcta
      $$('.btn-mc',q).forEach(b=>{ if(b.textContent===p.r) b.classList.add('correcta'); });
    }
    if(p.exp){ ex.style.display='block'; if(App.lecturaOn) decir((ok?'Correcto. ':'')+p.exp); }
    const next=document.createElement('button'); next.className='btn-grande';
    next.textContent=idx+1<preguntas.length?'Siguiente ➡️':'Ver resultado 🏅';
    next.onclick=()=>{ idx++; pinta(); };
    q.appendChild(next);
  };
  pinta();
}

/* Acertijos de Güemes (Segundo Ciclo) */
JUEGOS.acertijos = z => quizMC(z,'🕵️ Los acertijos de Güemes','Leé cada acertijo y descubrí de quién o de qué se trata.',[
  {t:'Nací en Salta hace muchos años. Defendí el norte argentino. Lideré a los Gauchos Infernales. ¿Quién soy?',
   ops:['Güemes','San Martín','Belgrano','Sarmiento'], r:'Güemes', exp:'¡Es Güemes! El gran defensor del Norte.'},
  {t:'No éramos soldados profesionales. Conocíamos los caminos y las montañas. Ayudamos a defender la patria. ¿Quiénes éramos?',
   ops:['Gauchos Infernales','Granaderos','Los realistas','Los marineros'], r:'Gauchos Infernales', exp:'Eran los Gauchos Infernales de Güemes.'},
  {t:'No usaba espada. Ayudaba con mensajes e información. Era la hermana de Güemes. ¿Quién soy?',
   ops:['Macacha','Remedios','Juana Azurduy','Mariquita'], r:'Macacha', exp:'Es Macacha Güemes, gran colaboradora patriota.'},
  {t:'Soy una provincia del norte. Allí nació Martín Miguel de Güemes. ¿Qué provincia soy?',
   ops:['Salta','Jujuy','Tucumán','Mendoza'], r:'Salta', exp:'¡Salta! La tierra natal de Güemes.'},
  {t:'No era una batalla tradicional. Utilizaba ataques sorpresa. Ayudó a defender el norte. ¿Cómo me llamaba?',
   ops:['Guerra Gaucha','Revolución de Mayo','Éxodo Jujeño','Cruce de los Andes'], r:'Guerra Gaucha', exp:'La Guerra Gaucha: emboscadas y ataques rápidos.'},
], 'Resolviste {n} de {t} acertijos. ¡Detective de la historia! 🔍');

/* =====================================================================
   ANAGRAMAS (Primer Ciclo)
   ===================================================================== */
JUEGOS.anagrama = z => {
  const palabras=[
    {p:'GÜEMES', m:'MEÜGES', em:'🧔🏻'},
    {p:'PONCHO', m:'OHPCNO', em:'🧣'},
    {p:'SALTA',  m:'TASAL',  em:'🏔️'},
    {p:'CABALLO',m:'BACALLO',em:'🐴'},
  ];
  let idx=0;
  const c=marco(z,'🔤 Ordená las letras','Tocá las letras en orden para descubrir la palabra escondida.',`<div id="ana"></div>`);
  const cont=$('#ana',c);
  function pinta(){
    if(idx>=palabras.length) return medallaFinal(z,'¡Descubriste todas las palabras secretas! 🔤✨');
    const {p,m,em}=palabras[idx];
    const letras=baraja(m.split(''));
    cont.innerHTML=`
      <div class="chip" style="margin:0 auto 8px;width:max-content">Palabra ${idx+1} de ${palabras.length}</div>
      <div class="anagrama-zona">
        <div class="pista-img">${vis(em)}</div>
        <div class="casillas" id="cas">${p.split('').map((_,i)=>`<div class="casilla" data-i="${i}" onclick="window._quitar(${i})"></div>`).join('')}</div>
        <div class="letras-disp" id="disp">${letras.map((l,i)=>`<div class="ficha" data-l="${l}" data-id="${i}" onclick="window._poner(this,'${l}')">${l}</div>`).join('')}</div>
        <div class="feedback" id="fb"></div>
      </div>`;
    if(App.lecturaOn) decir('Ordená las letras para formar la palabra.');
  }
  let armada=[];
  window._poner=(ficha,l)=>{
    const cas=$$('#cas .casilla',cont).find(x=>!x.classList.contains('llena'));
    if(!cas) return; sonClick();
    cas.textContent=l; cas.classList.add('llena'); cas.dataset.ficha=ficha.dataset.id;
    ficha.classList.add('usada');
    armada.push(l);
    if(armada.length===palabras[idx].p.length) chequear();
  };
  window._quitar=(i)=>{
    const cas=$$('#cas .casilla',cont)[i];
    if(!cas.classList.contains('llena')) return; sonClick();
    const fid=cas.dataset.ficha;
    const ficha=$$('#disp .ficha',cont).find(f=>f.dataset.id===fid);
    if(ficha) ficha.classList.remove('usada');
    cas.textContent=''; cas.classList.remove('llena'); delete cas.dataset.ficha;
    armada=$$('#cas .casilla',cont).filter(x=>x.classList.contains('llena')).map(x=>x.textContent);
  };
  function chequear(){
    const intento=$$('#cas .casilla',cont).map(x=>x.textContent).join('');
    const fb=$('#fb',cont);
    if(intento===palabras[idx].p){
      sonBien(); confeti(40); fb.textContent='¡Correcto! 🎉'; fb.className='feedback bien';
      if(App.lecturaOn) decir('¡Correcto! '+palabras[idx].p);
      const b=document.createElement('button'); b.className='btn-grande';
      b.textContent=idx+1<palabras.length?'Siguiente palabra ➡️':'¡Terminé! 🏅';
      b.onclick=()=>{ idx++; armada=[]; pinta(); };
      cont.appendChild(b);
    } else {
      sonMal(); fb.textContent='Mmm... probá de nuevo 🔁'; fb.className='feedback mal';
      setTimeout(()=>{ armada=[]; pinta(); }, 1100);
    }
  }
  pinta();
};

/* =====================================================================
   UNIR IMAGEN CON PALABRA (Primer Ciclo) y versión fácil (DI)
   ===================================================================== */
function juegoUnir(zona,titulo,pares,finalMsg){
  const izq=baraja(pares.map(p=>({k:p.k,em:p.em})));
  const der=baraja(pares.map(p=>({k:p.k,w:p.w})));
  let sel=null, hechos=0;
  const c=marco(zona,titulo,'Tocá una imagen y luego su palabra para unirlas. 🔗',
    `<div class="tablero-unir">
      <div class="col-unir">${izq.map(p=>`<button class="item-unir imagen" data-k="${p.k}" data-leer="imagen">${vis(p.em)}</button>`).join('')}</div>
      <div class="col-unir">${der.map(p=>`<button class="item-unir palabra" data-k="${p.k}" data-leer="${p.w}">${p.w}</button>`).join('')}</div>
    </div><div class="feedback" id="fb"></div>`);
  $$('.item-unir',c).forEach(b=>b.onclick=()=>{
    if(b.classList.contains('ok')) return; sonClick();
    if(!sel){ sel=b; b.classList.add('sel'); if(App.lecturaOn) decir(b.dataset.leer); return; }
    if(sel===b){ b.classList.remove('sel'); sel=null; return; }
    if(sel.classList.contains('imagen')===b.classList.contains('imagen')){ // misma columna: cambiar selección
      sel.classList.remove('sel'); sel=b; b.classList.add('sel'); return;
    }
    if(sel.dataset.k===b.dataset.k){
      sel.classList.add('ok'); b.classList.add('ok'); sel.classList.remove('sel');
      sonBien(); confeti(20); hechos++;
      if(hechos===pares.length) setTimeout(()=>medallaFinal(zona,finalMsg),700);
    } else {
      sonMal(); const a=sel; a.classList.add('incorrecta'); b.classList.add('incorrecta');
      $('#fb',c).textContent='No coinciden 🔁'; $('#fb',c).className='feedback mal';
      setTimeout(()=>{ a.classList.remove('incorrecta','sel'); b.classList.remove('incorrecta'); $('#fb',c).textContent=''; },700);
    }
    sel=null;
  });
}
JUEGOS.unir = z => juegoUnir(z,'🔗 Unir con su palabra',[
  {k:'caballo', em:'🐴', w:'CABALLO'},
  {k:'guemes',  em:'🧔🏻', w:'GÜEMES'},
  {k:'poncho',  em:'🧣', w:'PONCHO'},
  {k:'salta',   em:'🏔️', w:'SALTA'},
], '¡Uniste todas las parejas! 🎉');

/* =====================================================================
   ORDENAR SECUENCIA / LÍNEA DE TIEMPO  (con flechas, accesible)
   ===================================================================== */
function juegoOrdenar(zona, titulo, consigna, eventos, finalMsg, mostrarAnio){
  // eventos: array en ORDEN CORRECTO {t, em, a?}
  let orden = baraja(eventos.map((e,i)=>({...e, _id:i})));
  if(orden.every((e,i)=>e._id===i)) orden = baraja(orden); // evitar empezar resuelto
  const c=marco(zona,titulo,consigna,`<div class="lista-orden" id="lista"></div>
    <button class="btn-grande azul" id="comprobar">✅ Comprobar orden</button>`);
  const lista=$('#lista',c);
  function pinta(){
    lista.innerHTML = orden.map((e,i)=>`
      <div class="evento" data-pos="${i}">
        <div class="num">${i+1}</div>
        <span class="em">${vis(e.em)}</span>
        <div>${mostrarAnio?`<strong>${e.a}</strong> · `:''}${e.t}</div>
        <div class="flechas">
          <button onclick="window._mover(${i},-1)" aria-label="Subir">▲</button>
          <button onclick="window._mover(${i},1)" aria-label="Bajar">▼</button>
        </div>
      </div>`).join('');
  }
  window._mover=(i,d)=>{
    const j=i+d; if(j<0||j>=orden.length) return; sonClick();
    [orden[i],orden[j]]=[orden[j],orden[i]]; pinta();
  };
  $('#comprobar',c).onclick=()=>{
    const ok = orden.every((e,i)=>e._id===i);
    if(ok){
      $$('.evento',lista).forEach(el=>el.classList.add('ok'));
      setTimeout(()=>medallaFinal(zona,finalMsg),600);
    } else {
      sonMal();
      orden.forEach((e,i)=>{ const el=$$('.evento',lista)[i]; el.classList.toggle('ok',e._id===i); });
      const f=document.createElement('div'); f.className='feedback mal'; f.textContent='Todavía no... fijate las fechas 💡';
      const old=$('.feedback',c); if(old) old.remove(); c.appendChild(f);
      if(App.lecturaOn) decir('Todavía no. Fijate en el orden de los hechos.');
      setTimeout(()=>f.remove(),1800);
    }
  };
  pinta();
}
JUEGOS.secuencia = z => juegoOrdenar(z,'🪜 La vida de Güemes',
  'Ordená del 1 al 4 los momentos de la vida de Güemes usando las flechas.',[
    {t:'Nació en Salta', em:'👶'},
    {t:'Luchó junto a los gauchos', em:'🐴'},
    {t:'Defendió el Norte argentino', em:'⚔️'},
    {t:'Es recordado como héroe nacional', em:'🏅'},
  ], '¡Ordenaste perfecto la vida de Güemes! 🪜', false);

JUEGOS.tiempo = z => juegoOrdenar(z,'📅 Línea de tiempo',
  'Ordená los hechos según el año en que ocurrieron, del más antiguo al más reciente.',
  TIMELINE.map(t=>({t:t.t, em:t.em, a:t.a})),
  '¡Armaste la línea de tiempo de Güemes! 📅⭐', true);

/* =====================================================================
   SOPA DE LETRAS  (generador + selección por arrastre/click)
   ===================================================================== */
function sopaDeLetras(zona, titulo, palabras){
  const N=10, ABC='ABCDEFGHIJLMNOPRSTU';
  const norm = w => w.replace(/Ü/g,'U');
  const objetivo = palabras.map(norm);
  let grid, ubic;
  function generar(){
    grid=Array.from({length:N},()=>Array(N).fill(''));
    ubic={};
    const dirs=[[0,1],[1,0],[1,1],[-1,1]];
    for(const w of objetivo){
      let puesto=false,intentos=0;
      while(!puesto && intentos<300){
        intentos++;
        const [dr,dc]=dirs[Math.floor(Math.random()*dirs.length)];
        const len=w.length;
        const r0=Math.floor(Math.random()*N), c0=Math.floor(Math.random()*N);
        const rf=r0+dr*(len-1), cf=c0+dc*(len-1);
        if(rf<0||rf>=N||cf<0||cf>=N) continue;
        let ok=true;const cells=[];
        for(let k=0;k<len;k++){ const r=r0+dr*k,c=c0+dc*k;
          if(grid[r][c]&&grid[r][c]!==w[k]){ok=false;break;} cells.push([r,c]); }
        if(!ok) continue;
        cells.forEach(([r,c],k)=>grid[r][c]=w[k]); ubic[w]=cells.map(x=>x.join(',')); puesto=true;
      }
      if(!puesto) return false;
    }
    for(let r=0;r<N;r++)for(let c=0;c<N;c++) if(!grid[r][c]) grid[r][c]=ABC[Math.floor(Math.random()*ABC.length)];
    return true;
  }
  let t=0; while(!generar() && t<20) t++;
  const c=marco(zona,titulo,'Buscá las palabras de la lista. Tocá la primera y la última letra, o deslizá el dedo por encima.',
    `<div class="sopa-cont">
      <div class="sopa-grid" id="sg" style="grid-template-columns:repeat(${N},1fr)"></div>
      <div class="lista-buscar"><h4>🔎 A buscar:</h4>${palabras.map((w,i)=>`<div class="palabra-buscar" data-w="${objetivo[i]}">${w}</div>`).join('')}</div>
    </div>`);
  const sg=$('#sg',c);
  grid.forEach((row,r)=>row.forEach((l,col)=>{
    const d=document.createElement('div'); d.className='celda'; d.textContent=l; d.dataset.r=r; d.dataset.c=col;
    sg.appendChild(d);
  }));
  let sel=[], dragging=false, encontradas=0;
  const cellAt=(x,y)=>{ const el=document.elementFromPoint(x,y); return el&&el.classList.contains('celda')?el:null; };
  function start(el){ if(!el)return; dragging=true; sel=[el]; el.classList.add('sel'); }
  function move(el){ if(!dragging||!el||sel.includes(el))return;
    // solo línea recta desde el primero
    el.classList.add('sel'); sel.push(el); }
  function end(){ if(!dragging)return; dragging=false; evaluar(); }
  function evaluar(){
    const palabra=sel.map(e=>e.textContent).join('');
    const rev=[...sel].reverse().map(e=>e.textContent).join('');
    let hit=null;
    for(const w of objetivo){ if((palabra===w||rev===w) && !sel[0].dataset.done){ hit=w; break; } }
    if(hit){
      sel.forEach(e=>{e.classList.remove('sel');e.classList.add('found');});
      $(`.palabra-buscar[data-w="${hit}"]`,c).classList.add('tachada');
      sonBien(); encontradas++;
      if(App.lecturaOn) decir('¡Encontraste '+hit+'!');
      if(encontradas===objetivo.length){ confeti(80); setTimeout(()=>medallaFinal(zona,'¡Encontraste todas las palabras! 🔍🎉'),600); }
    } else { sonClick(); sel.forEach(e=>e.classList.remove('sel')); }
    sel=[];
  }
  // mouse
  sg.addEventListener('mousedown',e=>{e.preventDefault();start(e.target.closest('.celda'));});
  sg.addEventListener('mouseover',e=>move(e.target.closest('.celda')));
  document.addEventListener('mouseup',end);
  // touch
  sg.addEventListener('touchstart',e=>{const t=e.touches[0];start(cellAt(t.clientX,t.clientY));},{passive:true});
  sg.addEventListener('touchmove',e=>{const t=e.touches[0];move(cellAt(t.clientX,t.clientY));e.preventDefault();},{passive:false});
  sg.addEventListener('touchend',end);
  // click-click (dos toques): primer toque inicia, segundo completa recta
  let primero=null;
  sg.addEventListener('click',e=>{
    const el=e.target.closest('.celda'); if(!el||dragging)return;
    if(!primero){ primero=el; el.classList.add('sel'); return; }
    // trazar recta entre primero y el
    const r0=+primero.dataset.r,c0=+primero.dataset.c,r1=+el.dataset.r,c1=+el.dataset.c;
    const dr=Math.sign(r1-r0),dc=Math.sign(c1-c0);
    const len=Math.max(Math.abs(r1-r0),Math.abs(c1-c0))+1;
    const recta=(r1-r0)===dr*(len-1)&&(c1-c0)===dc*(len-1);
    sel=[]; $$('.celda.sel',sg).forEach(x=>x.classList.remove('sel'));
    if(recta){ for(let k=0;k<len;k++){const cc=$(`.celda[data-r="${r0+dr*k}"][data-c="${c0+dc*k}"]`,sg);cc.classList.add('sel');sel.push(cc);} evaluar(); }
    primero=null;
  });
}
JUEGOS.sopa_pc = z => sopaDeLetras(z,'🔍 Sopa de letras',['GÜEMES','SALTA','CABALLO','GAUCHOS','PONCHO']);
JUEGOS.sopa_sc = z => sopaDeLetras(z,'🔍 Sopa de letras',['GÜEMES','SALTA','CABALLO','GAUCHOS','PONCHO','MACACHA']);

/* =====================================================================
   CRUCIGRAMA ACRÓSTICO (la columna central forma GÜEMES)
   ===================================================================== */
JUEGOS.cruci = z => {
  const filas=[
    {n:1, w:'GAUCHOS',    spine:0, pista:'Valientes hombres a caballo que luchaban junto a él.'},
    {n:2, w:'FUEGO',      spine:1, pista:'Lo que se encendía en los fogones de los campamentos por la noche.'},
    {n:3, w:'HEROES',     spine:1, pista:'Título que tienen los valientes que defendieron la patria.'},
    {n:4, w:'CAMPO',      spine:2, pista:'Lugar donde vivían y entrenaban los gauchos.'},
    {n:5, w:'INFERNALES', spine:3, pista:'El ejército de gauchos de Güemes se llamaba los…'},
    {n:6, w:'SALTA',      spine:0, pista:'La provincia donde nació el general.'},
  ];
  const espina='GUEMES';
  const maxSpine=Math.max(...filas.map(f=>f.spine));
  const c=marco(z,'🧩 Crucigrama','Leé las pistas y completá. La columna amarilla forma el apellido del general: G-U-E-M-E-S. ¡Ya te la regalamos!',
    `<div class="acrostico" id="ac"></div><button class="btn-grande azul" id="comp">✅ Comprobar</button>`);
  const ac=$('#ac',c);
  filas.forEach((f,fi)=>{
    const fila=document.createElement('div'); fila.className='fila-cruci';
    const nro=document.createElement('div'); nro.className='nro'; nro.textContent=f.n; fila.appendChild(nro);
    const celdas=document.createElement('div'); celdas.className='celdas-cruci';
    const pad=maxSpine-f.spine;
    for(let p=0;p<pad;p++){ const sp=document.createElement('div'); sp.style.width='40px'; celdas.appendChild(sp); }
    for(let i=0;i<f.w.length;i++){
      const inp=document.createElement('input'); inp.className='cb'; inp.maxLength=1; inp.dataset.f=fi; inp.dataset.i=i;
      if(i===f.spine){ inp.value=espina[f.n-1]; inp.readOnly=true; inp.classList.add('spine'); }
      inp.addEventListener('input',e=>{ e.target.value=e.target.value.toUpperCase();
        if(e.target.value){ const nx=e.target.parentElement.querySelectorAll('input.cb:not([readonly])');
          const arr=[...nx]; const k=arr.indexOf(e.target); if(arr[k+1]) arr[k+1].focus(); } });
      celdas.appendChild(inp);
    }
    fila.appendChild(celdas);
    const pista=document.createElement('div'); pista.className='pista'; pista.textContent=f.pista; pista.setAttribute('data-leer',f.pista);
    fila.appendChild(pista);
    ac.appendChild(fila);
  });
  $('#comp',c).onclick=()=>{
    let todo=true;
    const norm=s=>s.toUpperCase().replace(/Ü/g,'U');
    filas.forEach((f,fi)=>{
      const inps=$$(`input.cb[data-f="${fi}"]`,ac);
      const val=inps.map(x=>x.value).join('');
      const ok=norm(val)===norm(f.w);
      inps.forEach(x=>x.classList.toggle('ok',ok));
      if(!ok) todo=false;
    });
    if(todo){ confeti(90); setTimeout(()=>medallaFinal(z,'¡Completaste el crucigrama de Güemes! 🧩🎉'),500); }
    else { sonMal(); const f=document.createElement('div'); f.className='feedback mal'; f.textContent='Revisá las palabras que faltan 💡';
      const old=$('.feedback',c); if(old)old.remove(); c.insertBefore(f,$('#comp',c));
      if(App.lecturaOn) decir('Revisá las palabras que faltan.'); setTimeout(()=>f.remove(),1800); }
  };
};

/* =====================================================================
   PINTAR A GÜEMES (canvas: balde de pintura + pincel)
   ===================================================================== */
JUEGOS.pintar = z => {
  const c=marco(z,'🎨 Pintá a Güemes','Elegí un color y tocá una zona para pintarla. Con el 🖌️ podés dibujar libre.',
    `<div class="paint-tools" id="tools"></div>
     <div class="paint-tools">
       <button class="btn-acc" id="modo-balde">🪣 Balde</button>
       <button class="btn-acc" id="modo-pincel">🖌️ Pincel</button>
       <button class="btn-acc" id="borrar">🧽 Limpiar</button>
       <button class="btn-acc" id="descargar">💾 Guardar</button>
     </div>
     <canvas id="lienzo" class="paint-canvas" width="520" height="420"></canvas>`);
  const colores=['#C0392B','#6CB6E3','#F6C544','#4FA56B','#8B5E3C','#2E6FA6','#E29B27','#F4D6B0','#3a2a1a','#FFFFFF'];
  $('#tools',c).innerHTML=colores.map((col,i)=>`<button class="swatch ${i===0?'sel':''}" style="background:${col}" data-col="${col}" aria-label="Color ${col}"></button>`).join('');
  const cv=$('#lienzo',c), ctx=cv.getContext('2d',{willReadFrequently:true});
  let color='#C0392B', modo='balde', pintando=false;
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,cv.width,cv.height);
  dibujarLineas();
  function dibujarLineas(){
    ctx.strokeStyle='#2a1c10'; ctx.lineWidth=3; ctx.lineJoin='round';
    // escarapela arriba izq
    ctx.beginPath(); ctx.arc(70,70,34,0,7); ctx.stroke();
    ctx.beginPath(); ctx.arc(70,70,16,0,7); ctx.stroke();
    // sombrero
    ctx.beginPath(); ctx.ellipse(260,120,95,26,0,0,7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(205,118); ctx.quadraticCurveTo(260,55,315,118); ctx.stroke();
    // cara
    ctx.beginPath(); ctx.arc(260,180,52,0,7); ctx.stroke();
    // barba
    ctx.beginPath(); ctx.moveTo(214,185); ctx.quadraticCurveTo(260,265,306,185); ctx.stroke();
    // ojos
    ctx.beginPath(); ctx.arc(242,170,5,0,7); ctx.moveTo(283,170); ctx.arc(278,170,5,0,7); ctx.stroke();
    // poncho (triángulo)
    ctx.beginPath(); ctx.moveTo(260,232); ctx.lineTo(150,400); ctx.lineTo(370,400); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(210,310); ctx.lineTo(310,310); ctx.stroke();
    // bandera mástil derecha
    ctx.beginPath(); ctx.moveTo(440,60); ctx.lineTo(440,400); ctx.stroke();
    ctx.strokeRect(360,70,80,30); ctx.beginPath(); ctx.moveTo(360,80); ctx.lineTo(440,80); ctx.moveTo(360,90); ctx.lineTo(440,90); ctx.stroke();
  }
  $$('.swatch',c).forEach(s=>s.onclick=()=>{ $$('.swatch',c).forEach(x=>x.classList.remove('sel')); s.classList.add('sel'); color=s.dataset.col; sonClick(); });
  $('#modo-balde',c).onclick=()=>{modo='balde';sonClick();};
  $('#modo-pincel',c).onclick=()=>{modo='pincel';sonClick();};
  $('#borrar',c).onclick=()=>{ ctx.fillStyle='#fff'; ctx.fillRect(0,0,cv.width,cv.height); dibujarLineas(); sonClick(); };
  $('#descargar',c).onclick=()=>{ const a=document.createElement('a'); a.download='mi-guemes.png'; a.href=cv.toDataURL(); a.click(); };
  function pos(e){ const r=cv.getBoundingClientRect(); const t=e.touches?e.touches[0]:e;
    return {x:Math.floor((t.clientX-r.left)*cv.width/r.width), y:Math.floor((t.clientY-r.top)*cv.height/r.height)}; }
  function hexRGB(h){ if(h==='#FFFFFF')return[255,255,255]; const n=parseInt(h.slice(1),16); return [n>>16,(n>>8)&255,n&255]; }
  function flood(x,y){
    const img=ctx.getImageData(0,0,cv.width,cv.height), d=img.data, W=cv.width;
    const idx=(x,y)=>(y*W+x)*4;
    const s=idx(x,y), tc=[d[s],d[s+1],d[s+2]]; const [nr,ng,nb]=hexRGB(color);
    if(Math.abs(tc[0]-30)<40&&Math.abs(tc[1]-20)<40&&Math.abs(tc[2]-16)<40) return; // no pintar líneas
    const match=i=>Math.abs(d[i]-tc[0])<32&&Math.abs(d[i+1]-tc[1])<32&&Math.abs(d[i+2]-tc[2])<32;
    if(tc[0]===nr&&tc[1]===ng&&tc[2]===nb) return;
    const st=[[x,y]];
    while(st.length){ const [cx,cy]=st.pop(); if(cx<0||cy<0||cx>=W||cy>=cv.height)continue;
      const i=idx(cx,cy); if(!match(i))continue;
      d[i]=nr;d[i+1]=ng;d[i+2]=nb;d[i+3]=255;
      st.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]); }
    ctx.putImageData(img,0,0);
  }
  function brush(p){ ctx.fillStyle=color; ctx.beginPath(); ctx.arc(p.x,p.y,9,0,7); ctx.fill(); }
  cv.addEventListener('mousedown',e=>{ const p=pos(e); if(modo==='balde'){flood(p.x,p.y);sonClick();} else {pintando=true;brush(p);} });
  cv.addEventListener('mousemove',e=>{ if(pintando&&modo==='pincel') brush(pos(e)); });
  document.addEventListener('mouseup',()=>pintando=false);
  cv.addEventListener('touchstart',e=>{ const p=pos(e); if(modo==='balde'){flood(p.x,p.y);} else {pintando=true;brush(p);} e.preventDefault(); },{passive:false});
  cv.addEventListener('touchmove',e=>{ if(pintando&&modo==='pincel') brush(pos(e)); e.preventDefault(); },{passive:false});
  cv.addEventListener('touchend',()=>pintando=false);
};

/* =====================================================================
   CUADRO HISTÓRICO (clasificar piezas: ¿Quién? / ¿Qué hizo?)
   ===================================================================== */
JUEGOS.cuadro = z => {
  const personajes={
    'GÜEMES':{em:'🧔🏻', piezas:['Fue gobernador de Salta','Lideró a los Gauchos Infernales','Defendió el Norte argentino']},
    'MACACHA':{em:'💌', piezas:['Era la hermana de Güemes','Transmitía información secreta','Colaboraba con los patriotas']},
    'GAUCHOS INFERNALES':{em:'🐎', piezas:['Conocían los caminos del norte','Hacían ataques sorpresa','Defendieron la frontera']},
  };
  const todas=[]; Object.entries(personajes).forEach(([k,v])=>v.piezas.forEach(p=>todas.push({k,p})));
  const cols=Object.entries(personajes).map(([k,v])=>`
    <div class="ch-col"><h4>${vis(v.em)} ${k}</h4>
      <div class="ch-drop" data-k="${k}" data-leer="${k}"></div></div>`).join('');
  const c=marco(z,'📊 Cuadro histórico','Arrastrá (o tocá) cada acción y soltala en el personaje correcto.',
    `<div class="cuadro-hist">${cols}</div>
     <div class="ch-banco" id="banco">${baraja(todas).map((t,i)=>`<div class="ch-pieza" draggable="true" data-k="${t.k}" data-id="${i}" data-leer="${t.p}">${t.p}</div>`).join('')}</div>`);
  let arrastrada=null, seleccion=null, hechos=0;
  function intentar(pieza,destino){
    if(pieza.dataset.k===destino.dataset.k){
      pieza.classList.add('ok'); pieza.draggable=false; destino.appendChild(pieza); sonBien(); confeti(15); hechos++;
      if(App.lecturaOn) decir('¡Correcto!');
      if(hechos===todas.length) setTimeout(()=>medallaFinal(z,'¡Armaste el cuadro histórico completo! 📊⭐'),600);
    } else { sonMal(); pieza.style.outline='4px solid var(--poncho)'; setTimeout(()=>pieza.style.outline='',600); }
  }
  $$('.ch-pieza',c).forEach(p=>{
    p.addEventListener('dragstart',()=>arrastrada=p);
    p.addEventListener('click',()=>{ if(p.classList.contains('ok'))return; sonClick();
      $$('.ch-pieza',c).forEach(x=>x.classList.remove('sel')); p.classList.add('sel'); seleccion=p;
      if(App.lecturaOn) decir(p.dataset.leer+'. Ahora tocá un personaje.'); });
  });
  $$('.ch-drop',c).forEach(d=>{
    d.addEventListener('dragover',e=>e.preventDefault());
    d.addEventListener('drop',e=>{ e.preventDefault(); if(arrastrada) intentar(arrastrada,d); arrastrada=null; });
    d.addEventListener('click',()=>{ if(seleccion){ const s=seleccion; seleccion=null; s.classList.remove('sel'); intentar(s,d); } });
  });
};

/* =====================================================================
   GÜEMES EN INSTAGRAM 1815 (creación libre)
   ===================================================================== */
JUEGOS.instagram = z => {
  const imgs={'🐴':'a caballo','⚔️':'en batalla','🏔️':'en las montañas','🔥':'en el fogón','🏛️':'como gobernador'};
  const c=marco(z,'📱 Güemes en 1815','Imaginá que Güemes tiene Instagram en 1815. Completá su publicación y mirá cómo queda.',
    `<div class="ig-builder">
      <div class="ig-form">
        <label>📸 Elegí la foto:</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap" id="igimgs">
          ${Object.keys(imgs).map((e,i)=>`<button class="swatch" style="font-size:1.8rem;background:#fff;width:54px;height:54px;${i===0?'outline:5px solid var(--celeste-oscuro)':''}" data-em="${e}">${vis(e)}</button>`).join('')}
        </div>
        <label>✍️ Escribí el texto del posteo:</label>
        <textarea id="cap" placeholder="Ej: ¡Hoy defendimos el norte junto a mis gauchos! 🐴🔥 #GuerraGaucha #Salta"></textarea>
        <label>🏷️ Hashtags:</label>
        <input id="tags" placeholder="#Salta #Libertad #GauchosInfernales">
        <button class="btn-grande" id="pub">📤 Publicar</button>
      </div>
      <div>
        <div class="ig-post" id="post">
          <div class="ig-head">
            <div class="ig-avatar"><svg viewBox="0 0 40 40" width="42" height="42"><circle cx="20" cy="15" r="8" fill="#8B5E3C"/><path d="M8 38a12 12 0 0 1 24 0z" fill="#C0392B"/></svg></div>
            <div class="ig-user">general.guemes <small>Salta, Provincias Unidas · 1815</small></div>
          </div>
          <div class="ig-img" id="igimg">${vis('🐴')}</div>
          <div class="ig-actions">❤️ 💬 ✈️</div>
          <div class="ig-likes" id="iglikes">Les gusta a macacha.guemes y 1.785 personas más</div>
          <div class="ig-caption" id="igcap"><b>general.guemes</b> Escribí tu posteo arriba ✍️</div>
          <div class="ig-coment">
            <div><b>macacha.guemes</b> ¡Cuidate hermano! 💌</div>
            <div><b>gauchos.infernales</b> ¡A las cargas, mi general! 🔥🐴</div>
          </div>
        </div>
      </div>
    </div>`);
  let em='🐴';
  $$('#igimgs .swatch',c).forEach(b=>b.onclick=()=>{ $$('#igimgs .swatch',c).forEach(x=>x.style.outline=''); b.style.outline='5px solid var(--celeste-oscuro)'; em=b.dataset.em; $('#igimg',c).innerHTML=vis(em); sonClick(); });
  $('#pub',c).onclick=()=>{
    const cap=$('#cap',c).value.trim()||'¡Defendiendo el Norte argentino!';
    const tags=$('#tags',c).value.trim();
    $('#igcap',c).innerHTML=`<b>general.guemes</b> ${cap} ${tags?`<span style="color:#2E6FA6">${tags}</span>`:''}`;
    $('#igimg',c).innerHTML=vis(em);
    sonBien(); confeti(60); sumarEstrella(); completarJuego(App.juegoActual);
    $('#iglikes',c).textContent='Les gusta a macacha.guemes y 18.210 personas más';
    if(App.lecturaOn) decir('Publicación creada. '+cap);
    const sc=$('#estrellas-cont'); if(sc) sc.textContent=App.estrellas;
  };
};

/* =====================================================================
   PROPUESTAS ADAPTADAS · AULA PARA TODOS (Discapacidad Intelectual)
   Pocas opciones, pictogramas grandes, refuerzo positivo, auto-lectura.
   ===================================================================== */

/* Mirá y escuchá: tarjetas paso a paso muy simples */
JUEGOS.mirar = z => {
  const pasos=[
    {em:'🧔🏻', t:'Él es Güemes. Fue un héroe muy valiente.'},
    {em:'🏔️', t:'Güemes nació en Salta.'},
    {em:'🐴', t:'Güemes andaba a caballo con sus gauchos.'},
    {em:'🧣', t:'Los gauchos usaban poncho.'},
    {em:'⚔️', t:'Güemes defendió el norte de nuestro país.'},
    {em:'🇦🇷', t:'Por eso lo recordamos el 17 de junio. ¡Gracias, Güemes!'},
  ];
  let i=0;
  const c=marco(z,'👀 Mirá y escuchá','Tocá la flecha para conocer a Güemes, paso a paso.',`<div id="paso"></div>`);
  function pinta(){
    const p=pasos[i];
    $('#paso',c).innerHTML=`
      <div style="text-align:center">
        <div style="font-size:7rem;margin:10px">${vis(p.em)}</div>
        <div class="pregunta-card" data-leer="${p.t}">${p.t}</div>
        <div style="margin-top:18px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          ${i>0?`<button class="btn-grande azul" id="ant">⬅️ Atrás</button>`:''}
          ${i<pasos.length-1?`<button class="btn-grande" id="sig">Seguir ➡️</button>`:`<button class="btn-grande" id="fin">🎉 ¡Terminé!</button>`}
        </div>
      </div>`;
    decirSiempre(p.t); confeti(12);
    if($('#sig',c)) $('#sig',c).onclick=()=>{i++;sonClick();pinta();};
    if($('#ant',c)) $('#ant',c).onclick=()=>{i--;sonClick();pinta();};
    if($('#fin',c)) $('#fin',c).onclick=()=>medallaFinal(z,'¡Conociste a Güemes! Sos genial. 🌟');
  }
  pinta();
};

/* ¿Sí o No?: dos opciones enormes con imagen */
JUEGOS.vf_facil = z => {
  const preguntas=[
    {em:'🏔️', t:'¿Güemes nació en Salta?', r:true},
    {em:'🐴', t:'¿Los gauchos andaban a caballo?', r:true},
    {em:'🚗', t:'¿Los gauchos andaban en auto?', r:false},
    {em:'⚔️', t:'¿Güemes era valiente?', r:true},
  ];
  let i=0;
  const c=marco(z,'👍 ¿Sí o No?','Mirá la imagen, escuchá la pregunta y tocá Sí o No.',`<div id="q"></div>`);
  function pinta(){
    if(i>=preguntas.length) return medallaFinal(z,'¡Muy bien! Respondiste todo. 💚');
    const p=preguntas[i];
    $('#q',c).innerHTML=`
      <div style="text-align:center"><div style="font-size:6rem">${vis(p.em)}</div>
      <div class="pregunta-card" data-leer="${p.t}">${p.t}</div>
      <div class="opciones-vf" style="max-width:480px">
        <button class="btn-vf v" onclick="window._sn(true,this)"><span class="em">✅</span>SÍ</button>
        <button class="btn-vf f" onclick="window._sn(false,this)"><span class="em">❌</span>NO</button>
      </div><div class="feedback" id="fb"></div></div>`;
    decirSiempre(p.t);
  }
  window._sn=(resp,btn)=>{
    const p=preguntas[i], fb=$('#fb',c);
    if(resp===p.r){ sonBien();confeti(40); fb.textContent='¡Muy bien! 🎉'; fb.className='feedback bien'; decirSiempre('¡Muy bien!');
      const b=document.createElement('button'); b.className='btn-grande'; b.textContent='Seguir ➡️'; b.onclick=()=>{i++;pinta();}; $('#q',c).appendChild(b);
      $$('.btn-vf',c).forEach(x=>x.disabled=true);
    } else { sonMal(); fb.textContent='Probá la otra 🙂'; fb.className='feedback mal'; decirSiempre('Probá la otra opción.'); }
  };
  pinta();
};

/* Unir 3 parejas (versión simple del juego de unir) */
JUEGOS.unir_facil = z => juegoUnir(z,'🧲 Unir parejas',[
  {k:'guemes', em:'🧔🏻', w:'GÜEMES'},
  {k:'caballo',em:'🐴', w:'CABALLO'},
  {k:'salta',  em:'🏔️', w:'SALTA'},
], '¡Uniste las tres parejas! 💚');

/* Primero y después: ordenar 3 momentos con flechas grandes */
JUEGOS.sec_facil = z => juegoOrdenar(z,'1️⃣ Primero y después',
  'Ordená con las flechas: ¿qué pasó primero?',[
    {t:'Güemes nació', em:'👶'},
    {t:'Güemes luchó a caballo', em:'🐴'},
    {t:'Lo recordamos como héroe', em:'🏅'},
  ], '¡Ordenaste muy bien! 💚', false);

/* =====================================================================
   APOYO VISUAL · ESCUCHAR Y TOCAR  (todo narrado, contraste/grande)
   ===================================================================== */
JUEGOS.audio = z => {
  const bloques=[
    {tit:'Quién fue', txt:'Martín Miguel de Güemes nació el 8 de febrero de 1785 en Salta. Fue un valiente militar y político que luchó por la independencia de la Argentina.'},
    {tit:'Los gauchos', txt:'Güemes lideró a los Gauchos Infernales. Andaban a caballo, usaban poncho y conocían muy bien los caminos del norte.'},
    {tit:'La Guerra Gaucha', txt:'Con ataques sorpresa y emboscadas, Güemes y sus gauchos defendieron el norte e impidieron que los enemigos avanzaran.'},
    {tit:'Su hermana Macacha', txt:'Macacha Güemes ayudó transmitiendo información y manteniendo la comunicación entre los patriotas.'},
    {tit:'Su legado', txt:'El 17 de junio de 1821 Güemes falleció defendiendo la libertad. Hoy lo recordamos como un gran héroe nacional.'},
  ];
  const c=marco(z,'🎧 La historia narrada','Tocá cada bloque para escucharlo. También podés escuchar todo seguido.',
    `<div style="text-align:center;margin-bottom:14px"><button class="btn-grande azul" id="todo">▶️ Escuchar toda la historia</button></div>
     <div class="info-grid">${bloques.map((b,i)=>`
        <button class="info-card c-azul" style="text-align:left" onclick="window._leerB(${i})" data-leer="${b.tit}. ${b.txt}">
          <div class="tit">🔊 ${b.tit}</div>
          <div style="margin-top:8px;font-weight:600">${b.txt}</div>
        </button>`).join('')}</div>`);
  window._leerB=i=>{ sonClick(); decirSiempre(bloques[i].tit+'. '+bloques[i].txt); };
  $('#todo',c).onclick=()=>{ sonClick(); decirSiempre('La historia de Güemes. '+bloques.map(b=>b.txt).join(' ')); };
};

/* Quiz para escuchar: pregunta leída automáticamente, 2 opciones grandes */
JUEGOS.vf_audio = z => {
  const preguntas=[
    {t:'Escuchá: Güemes defendió el norte argentino. ¿Es verdadero o falso?', r:true,  exp:'Verdadero. Güemes defendió el norte.'},
    {t:'Escuchá: Güemes nació en el mar. ¿Es verdadero o falso?', r:false, exp:'Falso. Güemes nació en Salta.'},
    {t:'Escuchá: Los gauchos andaban a caballo. ¿Es verdadero o falso?', r:true,  exp:'Verdadero. Andaban a caballo.'},
    {t:'Escuchá: Macacha era hermana de Güemes. ¿Es verdadero o falso?', r:true,  exp:'Verdadero. Macacha era su hermana.'},
  ];
  const guardado=App.lecturaOn; App.lecturaOn=true;
  quizVF(z,'✅ Quiz para escuchar','La pregunta se lee sola. Escuchá con atención y elegí.', preguntas,
    'Escuchaste y respondiste {n} de {t}. ¡Muy bien! 👂⭐');
  App.lecturaOn=guardado||App.lecturaOn;
};

/* Línea de tiempo hablada: cada hecho se lee al tocar */
JUEGOS.audio_tiempo = z => {
  const c=marco(z,'📅 Línea de tiempo hablada','Tocá cada año para escuchar qué pasó en la vida de Güemes.',
    `<div class="lista-orden">${TIMELINE.map((t,i)=>`
      <button class="evento" style="cursor:pointer;width:100%" onclick="window._lt(${i})" data-leer="Año ${t.a}. ${t.t}">
        <div class="num">${t.em}</div>
        <div><strong style="font-size:1.3em;color:var(--poncho)">${t.a}</strong><br>${t.t}</div>
      </button>`).join('')}</div>
      <button class="btn-grande" onclick="finJuego()">✅ ¡Listo!</button>`);
  window._lt=i=>{ sonClick(); decirSiempre('En '+TIMELINE[i].a+', '+TIMELINE[i].t); };
};

/* =====================================================================
   GLOSARIO ILUSTRADO  ·  palabras clave con imagen + audio
   ===================================================================== */
const GLOSARIO = [
  {em:'🐴', w:'Caballo',        d:'El fiel compañero del gaucho. Les permitía moverse rápido por los caminos del norte.'},
  {em:'🧣', w:'Poncho',         d:'Abrigo de lana que usaban los gauchos. Los protegía del frío y del sol.'},
  {em:'🏔️', w:'Salta',          d:'La provincia del norte argentino donde nació Güemes, el 8 de febrero de 1785.'},
  {em:'🤠', w:'Gaucho',         d:'Hombre de campo y gran jinete. Los Gauchos Infernales lucharon junto a Güemes.'},
  {em:'⚔️', w:'Guerra Gaucha',  d:'Forma de luchar con ataques sorpresa y emboscadas, aprovechando el terreno del norte.'},
  {em:'👑', w:'Realistas',      d:'Los soldados que peleaban por el rey de España y querían dominar estas tierras.'},
  {em:'🗺️', w:'Alto Perú',      d:'Región del norte (hoy Bolivia) desde donde avanzaban los realistas.'},
  {em:'💌', w:'Macacha',        d:'La hermana de Güemes. Ayudaba llevando mensajes e información a los patriotas.'},
];
JUEGOS.glosario = z => {
  const c=marco(z,'📖 Glosario ilustrado','Tocá cada palabra para ver la imagen y escuchar qué significa.',
    `<div class="info-grid">${GLOSARIO.map((g,i)=>`
       <button class="info-card c-azul glos-card" onclick="window._glos(${i})" data-leer="${g.w}. ${g.d}">
         <div class="glos-fig">${vis(g.em)}</div>
         <div class="tit">${g.w}</div>
         <div class="glos-def" id="gd${i}">${g.d}</div>
       </button>`).join('')}</div>
     <button class="btn-grande" onclick="finJuego()">✅ ¡Listo, aprendí las palabras!</button>`);
  window._glos=i=>{ sonClick(); const card=$$('.glos-card',c)[i]; if(card) card.classList.toggle('abierta'); decirSiempre(GLOSARIO[i].w+'. '+GLOSARIO[i].d); };
};
