/* =====================================================================
   ¡A LAS CARGAS, GÜEMES!  ·  Plataforma educativa interactiva
   Núcleo: router, accesibilidad, sonidos, confeti, datos y menús.
   ===================================================================== */

/* ---------- Estado global ---------- */
const App = { ciclo:'pc', estrellas:0, lecturaOn:false, enHistoria:false, histPaso:0, musicaOn:false, letra:'normal',
              completados:new Set(), medallas:new Set(), nombre:'', juegoActual:'', historiaCompleta:false };

/* ---------- Guardado de progreso (funciona en GitHub Pages / archivo local) ---------- */
const STORE_KEY = 'cofre_guemes_v1';
function cargarEstado(){
  try{
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    App.estrellas = s.estrellas || 0;
    App.completados = new Set(s.completados || []);
    App.medallas = new Set(s.medallas || []);
    App.nombre = s.nombre || '';
    App.historiaCompleta = !!s.historiaCompleta;
  }catch(e){ /* almacenamiento no disponible: seguimos sin guardar */ }
}
function guardarEstado(){
  try{
    localStorage.setItem(STORE_KEY, JSON.stringify({
      estrellas: App.estrellas,
      completados: [...App.completados],
      medallas: [...App.medallas],
      nombre: App.nombre,
      historiaCompleta: App.historiaCompleta
    }));
  }catch(e){}
}
function reiniciarProgreso(){
  App.estrellas=0; App.completados=new Set(); App.medallas=new Set(); App.historiaCompleta=false;
  guardarEstado();
}

/* ---------- Utilidades ---------- */
const $ = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const baraja = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(v=>v[1]);

/* ---------- Router ---------- */
function ir(vista){
  $$('.vista').forEach(v=>v.classList.remove('activa'));
  $('#vista-'+vista).classList.add('activa');
  window.scrollTo({top:0,behavior:'instant'});
  cancelarVoz();
}

/* =====================================================================
   ACCESIBILIDAD
   ===================================================================== */
function toggleClase(clase,btnId){
  const on = document.body.classList.toggle(clase);
  const b = $('#'+btnId); b.classList.toggle('activo',on); b.setAttribute('aria-pressed',on);
}
function toggleLetra(){
  const orden=['normal','mayus','minus'];
  App.letra = orden[(orden.indexOf(App.letra)+1)%3];
  document.body.classList.remove('txt-mayus','txt-minus');
  let ic='Aa', lbl='Letra', say='Letra normal';
  if(App.letra==='mayus'){ document.body.classList.add('txt-mayus'); ic='AA'; lbl='MAYÚS'; say='Imprenta mayúscula'; }
  else if(App.letra==='minus'){ document.body.classList.add('txt-minus'); ic='aa'; lbl='minús'; say='Imprenta minúscula'; }
  const ei=$('#b-letra-ic'), el=$('#b-letra-lbl'), b=$('#b-letra');
  if(ei) ei.textContent=ic;
  if(el) el.textContent=lbl;
  if(b){ b.classList.toggle('activo',App.letra!=='normal'); b.setAttribute('aria-pressed',App.letra!=='normal'); }
  sonClick(); decir(say);
}
function toggleLectura(){
  App.lecturaOn = !App.lecturaOn;
  const b=$('#b-leer'); b.classList.toggle('activo',App.lecturaOn); b.setAttribute('aria-pressed',App.lecturaOn);
  if(App.lecturaOn) decir('Lectura en voz alta activada. Tocá los textos para escucharlos.');
  else cancelarVoz();
}
/* Síntesis de voz */
let vozES=null;
function cargarVoz(){
  const vs = speechSynthesis.getVoices();
  vozES = vs.find(v=>/es-AR|es-419|es-MX|es-ES|es_/.test(v.lang)) || vs.find(v=>v.lang.startsWith('es')) || null;
}
if('speechSynthesis' in window){ cargarVoz(); speechSynthesis.onvoiceschanged=cargarVoz; }
function decir(txt,forzar=false){
  if(!('speechSynthesis' in window)) return;
  if(!App.lecturaOn && !forzar) return;
  cancelarVoz();
  const u=new SpeechSynthesisUtterance(txt);
  u.lang='es-AR'; u.rate=.95; u.pitch=1.05; if(vozES)u.voice=vozES;
  speechSynthesis.speak(u);
}
function decirSiempre(txt){ const guardado=App.lecturaOn; App.lecturaOn=true; decir(txt); App.lecturaOn=guardado; }
function cancelarVoz(){ if('speechSynthesis' in window) speechSynthesis.cancel(); }
/* lee al hacer click en cualquier elemento con data-leer */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-leer]');
  if(el && App.lecturaOn){ decir(el.getAttribute('data-leer')||el.textContent); }
});

/* =====================================================================
   SONIDOS (Web Audio) + CONFETI + ESTRELLAS
   ===================================================================== */
let actx=null;
function beep(freq,dur=.15,tipo='sine',vol=.18){
  try{ actx=actx||new(window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(),g=actx.createGain();
    o.type=tipo;o.frequency.value=freq;o.connect(g);g.connect(actx.destination);
    g.gain.setValueAtTime(vol,actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+dur);
    o.start();o.stop(actx.currentTime+dur);
  }catch(e){}
}
const sonBien=()=>{beep(660,.12,'triangle');setTimeout(()=>beep(880,.18,'triangle'),110);};
const sonMal =()=>{beep(200,.22,'sawtooth',.14);};
const sonClick=()=>beep(520,.06,'square',.08);

/* ---------- Música ambiente folklórica (generada, sin derechos) ----------
   Progresión suave en compás de 6/8 (aire de zamba norteña): Am · F · C · G.
   Se sintetiza con osciladores: bajo + bombo en los tiempos fuertes y un
   arpegio tipo guitarra criolla. Volumen bajo para no molestar en el aula. */
const ACORDES = [
  [110.00,[220.00,261.63,329.63]], // Am
  [ 87.31,[174.61,220.00,261.63]], // F
  [130.81,[196.00,261.63,329.63]], // C
  [ 98.00,[196.00,246.94,293.66]], // G
];
const musica = { timer:null, s:0 };
function tickMusica(){
  if(!App.musicaOn) return;
  const ch = ACORDES[Math.floor(musica.s/6)%ACORDES.length];
  const sb = musica.s % 6;                 // paso dentro del compás (6/8)
  if(sb===0 || sb===3){                    // tiempos fuertes: bajo + bombo
    beep(ch[0], .55, 'sine', .085);
    beep(58, .16, 'triangle', .10);
  }
  if(sb!==0){                              // arpegio de guitarra
    beep(ch[1][sb % ch[1].length], .42, 'triangle', .045);
  }
  musica.s++;
}
function toggleMusica(){
  App.musicaOn = !App.musicaOn;
  const b=$('#b-musica');
  if(b){ b.classList.toggle('activo',App.musicaOn); b.setAttribute('aria-pressed',App.musicaOn); }
  if(App.musicaOn){
    try{ actx=actx||new(window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume(); }catch(e){}
    musica.s=0;
    clearInterval(musica.timer);
    musica.timer=setInterval(tickMusica, 300);   // ~corchea
    decir('Música encendida');
  }else{
    clearInterval(musica.timer); musica.timer=null;
  }
}

function confeti(n=80){
  const cols=['#6CB6E3','#F6C544','#C0392B','#4FA56B','#fff','#E29B27'];
  const cont=$('#confeti');
  for(let i=0;i<n;i++){
    const c=document.createElement('div');c.className='conf';
    c.style.left=Math.random()*100+'vw';
    c.style.background=cols[i%cols.length];
    c.style.animationDuration=(2+Math.random()*2)+'s';
    c.style.animationDelay=(Math.random()*.5)+'s';
    c.style.borderRadius=Math.random()>.5?'50%':'2px';
    cont.appendChild(c);
    setTimeout(()=>c.remove(),4200);
  }
}
function sumarEstrella(n=1){
  App.estrellas+=n;
  const cont=$('#estrellas-cont'); if(cont) cont.textContent=App.estrellas;
  guardarEstado();
}

/* ---------- Medallas coleccionables ---------- */
const MEDALLAS = [
  {id:'escarapela', em:'🎗️', nom:'Escarapela',        desc:'Completá tu primer juego.',          n:1},
  {id:'poncho',     em:'🧣', nom:'Poncho gaucho',      desc:'Completá 3 juegos.',                 n:3},
  {id:'sombrero',   em:'🤠', nom:'Sombrero de gaucho', desc:'Completá 5 juegos.',                 n:5},
  {id:'sable',      em:'⚔️', nom:'Sable de Güemes',    desc:'Completá 8 juegos.',                 n:8},
  {id:'bandera',    em:'🇦🇷', nom:'Bandera patria',     desc:'Completá 12 juegos.',                n:12},
  {id:'heroe',      em:'🏅', nom:'Héroe del Norte',    desc:'Terminá el Modo Historia completo.', historia:true},
];
function completarJuego(id){
  if(!id) return;
  const nuevo = !App.completados.has(id);
  App.completados.add(id);
  if(nuevo) guardarEstado();
  revisarMedallas();
}
function revisarMedallas(){
  const total = App.completados.size;
  MEDALLAS.forEach(m=>{
    if(App.medallas.has(m.id)) return;
    const gana = m.historia ? App.historiaCompleta : (total >= m.n);
    if(gana){ App.medallas.add(m.id); guardarEstado(); mostrarMedalla(m); }
  });
}
function mostrarMedalla(m){
  confeti(120); sonBien();
  let t=$('#medalla-toast');
  if(!t){ t=document.createElement('div'); t.id='medalla-toast'; document.body.appendChild(t); }
  t.innerHTML = `<span class="mt-em">${m.em}</span>
    <span class="mt-txt"><strong>¡Ganaste una medalla!</strong><br>${m.nom}</span>`;
  t.classList.add('show');
  if(App.lecturaOn) decirSiempre('¡Ganaste la medalla '+m.nom+'!');
  clearTimeout(mostrarMedalla._t);
  mostrarMedalla._t=setTimeout(()=>t.classList.remove('show'), 3600);
}

/* =====================================================================
   DATOS HISTÓRICOS (extraídos de la infografía del cuadernillo)
   ===================================================================== */
const INFO_PC = [
  {ic:'🧔🏻', tit:'¿Quién fue Güemes?', col:'c-azul', txt:[
    'Fue un valiente líder argentino que luchó por la independencia de nuestro país.',
    'Nació el 8 de febrero de 1785 en la provincia de Salta.',
    'Fue militar y político. Dedicó su vida a defender la patria.',
    'Amaba mucho a su tierra y a su gente.']},
  {ic:'🐴', tit:'Los Gauchos de Güemes', col:'c-rojo', txt:[
    'Fueron sus compañeros inseparables.',
    'Usaban poncho y chiripá.',
    'Andaban a caballo y conocían muy bien los caminos del norte.',
    'Ayudaban al ejército patriota con mucha valentía.']},
  {ic:'⚔️', tit:'¿Qué hizo Güemes?', col:'c-verde', txt:[
    'Organizó la defensa del norte argentino y detuvo a los invasores.',
    'Realizó la "Guerra Gaucha", usando el terreno, la rapidez y la sorpresa.',
    'Protegió a los pueblos para que el ejército de San Martín pudiera avanzar.',
    'Trabajó siempre por la unidad y el bien de todos.']},
  {ic:'⭐', tit:'¿Por qué es importante?', col:'c-sol', txt:[
    'Gracias a Güemes y sus gauchos se defendió el norte argentino.',
    'Su lucha fue clave para lograr la independencia.',
    'Su valentía, humildad y amor por la patria nos inspiran hasta hoy.']},
  {ic:'🕊️', tit:'¿Cómo murió?', col:'c-violeta', txt:[
    'El 7 de junio de 1821 fue herido en una emboscada.',
    'Sus gauchos lo cuidaron varios días, pero las heridas eran muy graves.',
    'El 17 de junio de 1821 falleció en la Cañada de la Horqueta, defendiendo la libertad.']},
  {ic:'📍', tit:'¿Dónde nació?', col:'c-tierra', txt:[
    'Nació en Salta, una provincia del noroeste argentino.',
    'Desde joven amó su tierra, su gente y sus tradiciones.']},
];

const INFO_SC = [
  {ic:'🧔🏻', tit:'¿Quién fue?', col:'c-azul', txt:[
    'Martín Miguel de Güemes nació el 8 de febrero de 1785 en la ciudad de Salta.',
    'Fue militar, político y uno de los principales protagonistas de la lucha por la independencia argentina.']},
  {ic:'⚔️', tit:'Sus comienzos', col:'c-rojo', txt:[
    'Desde joven se incorporó a la carrera militar.',
    'Participó en las Invasiones Inglesas (1806 y 1807), donde demostró su valentía.',
    'Tras la Revolución de Mayo de 1810, se sumó a la lucha por la independencia.']},
  {ic:'🏛️', tit:'Gobernador de Salta', col:'c-verde', txt:[
    'En 1815 fue elegido gobernador de Salta.',
    'Desde ese cargo organizó la defensa del norte y apoyó los planes de los patriotas.']},
  {ic:'🐎', tit:'Los Gauchos Infernales', col:'c-tierra', txt:[
    'Güemes formó un ejército con gauchos del norte.',
    'Conocían el territorio y usaban ataques rápidos para enfrentar a los realistas.',
    'Gracias a ellos el norte argentino pudo defenderse muchas veces.']},
  {ic:'💥', tit:'La Guerra Gaucha', col:'c-violeta', txt:[
    'Era la estrategia de desgastar al enemigo con ataques sorpresa y emboscadas.',
    'Aprovechaban el conocimiento del terreno. Por eso recibió el nombre de "Guerra Gaucha".']},
  {ic:'💌', tit:'Macacha Güemes', col:'c-rojo', txt:[
    'Su hermana, Macacha Güemes, fue una importante colaboradora.',
    'Ayudó a transmitir información y a mantener la comunicación entre los patriotas.',
    'Su participación fue fundamental para muchas acciones.']},
  {ic:'🗺️', tit:'¿Dónde actuó?', col:'c-azul', txt:[
    'Defendió el norte argentino, una región clave.',
    'Sus acciones impidieron que los realistas avanzaran desde el Alto Perú (actual Bolivia) hacia el resto del país.']},
  {ic:'🕊️', tit:'Su muerte', col:'c-violeta', txt:[
    'El 17 de junio de 1821 falleció a causa de una herida recibida en un enfrentamiento con los realistas.',
    'A pesar de su estado, siguió dirigiendo la resistencia hasta sus últimos días.']},
];

const TIMELINE = [
  {a:'1785', t:'Nace en Salta', em:'👶'},
  {a:'1806-1807', t:'Participa en las Invasiones Inglesas', em:'🚢'},
  {a:'1810', t:'Apoya la Revolución de Mayo', em:'📜'},
  {a:'1815', t:'Es elegido Gobernador de Salta', em:'🏛️'},
  {a:'1821', t:'Fallece el 17 de junio defendiendo la patria', em:'🕊️'},
];

/* =====================================================================
   PORTADA / INICIO
   ===================================================================== */
function renderInicio(){
  $('#vista-inicio').innerHTML = `
  <section class="hero">
    <div class="cielo"></div>
    <div class="nube" style="width:120px;height:38px;top:30px;left:8%"></div>
    <div class="nube" style="width:90px;height:30px;top:70px;right:12%"></div>
    <div class="cofre-marca" data-leer="Una creación de Cofre Didáctico">
      <span class="pre">Una creación de</span>
      <img src="logo-cofre.png" alt="Cofre Didáctico" class="cofre-logo">
    </div>
    <div class="banderin" data-leer="17 de Junio. Paso a la inmortalidad de Martín Miguel de Güemes.">★ 17 DE JUNIO ★</div>
    <h1 data-leer="Martín Miguel de Güemes">MARTÍN MIGUEL<br><span>DE GÜEMES</span></h1>
    <p class="sub">Héroe de la Independencia Argentina · El defensor del Norte</p>
    <div class="hero-retrato">
      <div class="hero-foto-marco">
        <img src="guemes-portada.png" alt="Retrato de Martín Miguel de Güemes" class="hero-foto">
      </div>
      <span class="hero-placa">Martín Miguel de Güemes · 1785 – 1821</span>
    </div>
    <p class="frase" data-leer="Defender la patria también es cuidar nuestra libertad.">🌟 «Defender la patria también es cuidar nuestra libertad» 🌟</p>
  </section>

  <div class="wrap">
    <h2 class="titulo-seccion">🎮 ¡Elegí tu aventura!</h2>
    <p class="bajada">Una plataforma para aprender jugando sobre Güemes, los Gauchos Infernales y la Guerra Gaucha. Elegí por dónde empezar:</p>

    <button class="banner-historia" onclick="abrirHistoria()" data-leer="Modo Historia. Una aventura narrada por Güemes y su hermana Macacha, con misiones de juego.">
      <span class="bh-ic">📖</span>
      <span class="bh-txt">
        <strong>Modo Historia: La aventura de Güemes</strong>
        <small>Recorré su vida con Macacha y Güemes como guías. ¡6 misiones para completar! ▶</small>
      </span>
      <span class="bh-fig">${svgMacacha()}</span>
    </button>

    <div class="grid-cards">

      <button class="card-nav c-azul" onclick="abrirCiclo('pc')" data-leer="Primer Ciclo. Primero, segundo y tercer grado. Juegos para los más chicos.">
        <span class="edad">1°·2°·3°</span>
        <span class="emoji">🧒</span>
        <h3>Primer Ciclo</h3>
        <p>Juegos para los más chiquitos: pintar, armar y descubrir.</p>
      </button>

      <button class="card-nav c-rojo" onclick="abrirCiclo('sc')" data-leer="Segundo Ciclo. Cuarto, quinto y sexto grado. Desafíos para los más grandes.">
        <span class="edad">4°·5°·6°</span>
        <span class="emoji">🧑</span>
        <h3>Segundo Ciclo</h3>
        <p>Desafíos para los más grandes: acertijos, líneas de tiempo y más.</p>
      </button>

      <button class="card-nav c-verde" onclick="abrirCiclo('di')" data-leer="Aula para todos. Actividades adaptadas con mucho apoyo, ideales para discapacidad intelectual.">
        <span class="edad">♿ Inclusiva</span>
        <span class="emoji">🧩</span>
        <h3>Aula para Todos</h3>
        <p>Actividades simples, con mucho apoyo y refuerzo positivo.</p>
      </button>

      <button class="card-nav c-violeta" onclick="abrirCiclo('av')" data-leer="Escuchar y tocar. Sección con narración en voz alta y letras grandes, para apoyo visual.">
        <span class="edad">👁️ Apoyo visual</span>
        <span class="emoji">🔊</span>
        <h3>Escuchar y Tocar</h3>
        <p>Todo narrado en voz alta, con letras grandes y mucho contraste.</p>
      </button>

    </div>

    ${panelProgreso()}

    <h2 class="titulo-seccion">👩‍🏫 Para el aula</h2>
    <p class="bajada">Cada sección reúne juegos inspirados en Genially, Wordwall, Kahoot, Educaplay y Baamboozle, pensados como complemento del cuadernillo digital. Todo funciona sin instalar nada, en celular, tablet o computadora.</p>
    <div class="grid-cards">
      <div class="card-nav c-sol" style="cursor:default">
        <span class="emoji">🎯</span><h3>+15 juegos</h3><p>Quiz, anagramas, sopa de letras, secuencias, crucigrama, ¡y más!</p>
      </div>
      <div class="card-nav c-tierra" style="cursor:default">
        <span class="emoji">♿</span><h3>Accesible</h3><p>Lectura en voz alta, texto grande, alto contraste y modo calmo.</p>
      </div>
      <div class="card-nav c-azul" style="cursor:default">
        <span class="emoji">💛</span><h3>Valores</h3><p>Valentía, humildad, libertad, identidad y amor por la patria.</p>
      </div>
    </div>
  </div>`;
}

/* ---------- Panel de progreso (portada) ---------- */
function panelProgreso(){
  const total=totalJuegos();
  const comp=App.completados.size;
  const pct = total ? Math.round(comp/total*100) : 0;
  return `
  <div class="panel-prog">
    <div class="pp-info">
      <h3>🏆 Mi progreso</h3>
      <div class="pp-barra"><div class="pp-fill" style="width:${pct}%"></div></div>
      <small>${comp} de ${total} juegos · ⭐ ${App.estrellas} estrellas · 🏅 ${App.medallas.size}/${MEDALLAS.length} medallas</small>
    </div>
    <div class="pp-botones">
      <button class="btn-grande azul" onclick="renderMedallas()">🏅 Mis medallas</button>
      <button class="btn-grande" onclick="renderDiploma()">📜 Mi diploma</button>
    </div>
  </div>`;
}

/* ---------- Vitrina de medallas ---------- */
function renderMedallas(){
  sonClick();
  const cards=MEDALLAS.map(m=>{
    const ok=App.medallas.has(m.id);
    return `<div class="medalla-card ${ok?'ganada':'bloqueada'}" data-leer="${m.nom}. ${ok?'Ganada':'Bloqueada'}. ${m.desc}">
      <div class="mc-em">${ok?m.em:'🔒'}</div>
      <h4>${m.nom}</h4>
      <small>${m.desc}</small>
      <span class="mc-estado">${ok?'¡Ganada! ✅':'Bloqueada'}</span>
    </div>`;
  }).join('');
  $('#vista-juego').innerHTML=`<div class="wrap">
    <div style="text-align:center;margin:6px 0 12px"><button class="btn-volver" onclick="irInicio()">⟵ Inicio</button></div>
    <div class="juego">
      <h2 data-leer="Mis medallas">🏅 Mis medallas</h2>
      <p class="consigna">Ganá medallas completando juegos y la aventura. ¡Coleccionalas todas!</p>
      <div class="medallas-grid">${cards}</div>
    </div></div>`;
  ir('juego');
  if(App.lecturaOn) decir('Mis medallas. Llevás '+App.medallas.size+' de '+MEDALLAS.length+'.');
}

/* ---------- Diploma imprimible ---------- */
function renderDiploma(){
  sonClick();
  const fecha=new Date().toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
  $('#vista-juego').innerHTML=`<div class="wrap">
    <div class="no-print" style="text-align:center;margin:6px 0 12px"><button class="btn-volver" onclick="irInicio()">⟵ Inicio</button></div>
    <div class="juego">
      <h2 class="no-print" data-leer="Mi diploma">📜 Mi diploma</h2>
      <p class="consigna no-print">Escribí tu nombre y creá tu diploma para imprimir o guardar en PDF.</p>
      <div class="dip-form no-print">
        <input id="dip-nombre" maxlength="40" placeholder="Escribí tu nombre y apellido" value="${(App.nombre||'').replace(/"/g,'&quot;')}">
        <button class="btn-grande" id="dip-gen">✨ Crear diploma</button>
      </div>
      <div id="dip-zona"></div>
    </div></div>`;
  ir('juego');
  const pintar=()=>{
    const val=($('#dip-nombre')?($('#dip-nombre').value||''):'').trim();
    App.nombre=val; guardarEstado();
    const nom = val || 'Gaucho/a de la Libertad';
    const medGan=MEDALLAS.filter(m=>App.medallas.has(m.id)).length;
    $('#dip-zona').innerHTML=`
      <div class="diploma" id="diploma">
        <div class="dip-marco">
          <img src="logo-cofre.png" class="dip-logo" alt="Cofre Didáctico">
          <div class="dip-cinta">🇦🇷 17 de Junio · Día de Martín Miguel de Güemes</div>
          <h3 class="dip-titulo">Diploma de Gaucho/a de Güemes</h3>
          <p class="dip-otorga">Se otorga con orgullo a</p>
          <p class="dip-nombre">${nom}</p>
          <p class="dip-texto">por recorrer con valentía la vida de Martín Miguel de Güemes, héroe de la Independencia Argentina, y demostrar amor por la patria, la libertad y la identidad de nuestro pueblo.</p>
          <div class="dip-pie">
            <div class="dip-col"><img src="guemes-portada.png" class="dip-retrato" alt="Güemes"><span>Martín M. de Güemes</span></div>
            <div class="dip-sello">⭐ ${App.estrellas}<br><small>estrellas</small></div>
            <div class="dip-col"><img src="logo-cofre.png" class="dip-firma-logo" alt=""><span>Cofre Didáctico</span></div>
          </div>
          <p class="dip-fecha">Otorgado el ${fecha} · ${medGan} medallas conseguidas</p>
        </div>
      </div>
      <div class="no-print" style="text-align:center;margin-top:14px">
        <button class="btn-grande azul" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
      </div>`;
    confeti(80); sonBien();
    if(App.lecturaOn) decir('¡Tu diploma está listo, '+nom+'!');
  };
  if($('#dip-gen')) $('#dip-gen').onclick=pintar;
  if(App.nombre) pintar();
}

/* =====================================================================
   MENÚ DE JUEGOS POR CICLO
   ===================================================================== */
const MENUS = {
  pc:{titulo:'🧒 Primer Ciclo', clase:'',
    desc:'Tocá un juego para empezar. ¡Vas a ganar estrellas! ⭐',
    juegos:[
      {id:'info_pc', ic:'🔎', t:'Conocé a Güemes', s:'Infografía interactiva', tag:'Explorar'},
      {id:'glosario', ic:'📖', t:'Glosario ilustrado', s:'Palabras clave con imagen y audio', tag:'Palabras'},
      {id:'vf_pc', ic:'✅', t:'¿Verdadero o Falso?', s:'Tocá la respuesta correcta', tag:'Quiz'},
      {id:'anagrama', ic:'🔤', t:'Ordená las letras', s:'Descubrí la palabra escondida', tag:'Letras'},
      {id:'unir', ic:'🔗', t:'Unir con su palabra', s:'Imagen + palabra', tag:'Memoria'},
      {id:'secuencia', ic:'🪜', t:'La vida de Güemes', s:'Ordená la secuencia', tag:'Ordenar'},
      {id:'sopa_pc', ic:'🔍', t:'Sopa de letras', s:'Buscá las palabras', tag:'Buscar'},
      {id:'cruci', ic:'🧩', t:'Crucigrama', s:'Completá con pistas', tag:'Pistas'},
      {id:'pintar', ic:'🎨', t:'Pintá a Güemes', s:'Coloreá libremente', tag:'Arte'},
    ]},
  sc:{titulo:'🧑 Segundo Ciclo', clase:'',
    desc:'Desafíos para pensar y aprender. Sumá estrellas resolviendo cada uno. ⭐',
    juegos:[
      {id:'info_sc', ic:'📖', t:'Güemes en detalle', s:'Infografía + cita histórica', tag:'Explorar'},
      {id:'glosario', ic:'📖', t:'Glosario ilustrado', s:'Palabras clave con imagen y audio', tag:'Palabras'},
      {id:'vf_sc', ic:'⚖️', t:'V o F con justificación', s:'Pensá tu respuesta', tag:'Quiz'},
      {id:'acertijos', ic:'🕵️', t:'Los acertijos de Güemes', s:'Adiviná de quién se trata', tag:'Pistas'},
      {id:'tiempo', ic:'📅', t:'Línea de tiempo', s:'Ordená los hechos por año', tag:'Ordenar'},
      {id:'cuadro', ic:'📊', t:'Cuadro histórico', s:'¿Quién fue? ¿Qué hizo?', tag:'Clasificar'},
      {id:'sopa_sc', ic:'🔍', t:'Sopa de letras', s:'Incluye a Macacha', tag:'Buscar'},
      {id:'cruci', ic:'🧩', t:'Crucigrama', s:'Completá con pistas', tag:'Pistas'},
      {id:'instagram', ic:'📱', t:'Güemes en 1815', s:'Creá su posteo histórico', tag:'Crear'},
    ]},
  di:{titulo:'🧩 Aula para Todos', clase:'',
    desc:'Actividades cortas, con pictogramas, mucho apoyo y festejo en cada acierto. 💚 Se recomienda activar 🔊 «Leer en voz alta».',
    juegos:[
      {id:'mirar', ic:'👀', t:'Mirá y escuchá', s:'Conocé a Güemes paso a paso', tag:'Mirar'},
      {id:'glosario', ic:'📖', t:'Glosario', s:'Palabras con imagen y voz', tag:'Palabras'},
      {id:'vf_facil', ic:'👍', t:'¿Sí o No?', s:'Dos opciones grandes', tag:'Elegir'},
      {id:'unir_facil', ic:'🧲', t:'Unir parejas', s:'Solo 3 parejas', tag:'Unir'},
      {id:'sec_facil', ic:'1️⃣', t:'Primero y después', s:'Ordená 3 momentos', tag:'Ordenar'},
      {id:'pintar', ic:'🎨', t:'Pintar a Güemes', s:'Coloreá tranquilo', tag:'Arte'},
    ]},
  av:{titulo:'🔊 Escuchar y Tocar', clase:'',
    desc:'Esta sección está pensada para escuchar. Activá 🔊 «Leer en voz alta» y, si querés, «Texto grande» y «Alto contraste» en la barra de arriba.',
    juegos:[
      {id:'audio', ic:'🎧', t:'La historia narrada', s:'Escuchá la vida de Güemes', tag:'Audio'},
      {id:'glosario', ic:'📖', t:'Glosario hablado', s:'Palabras con imagen y voz', tag:'Palabras'},
      {id:'vf_audio', ic:'✅', t:'Quiz para escuchar', s:'Pregunta leída en voz alta', tag:'Audio'},
      {id:'audio_tiempo', ic:'📅', t:'Línea de tiempo hablada', s:'Cada hecho se lee solo', tag:'Audio'},
    ]},
};

function abrirCiclo(ciclo){
  App.ciclo=ciclo; App.enHistoria=false; sonClick();
  const m=MENUS[ciclo];
  // sugerencias de accesibilidad automáticas
  if(ciclo==='av' && !App.lecturaOn) toggleLectura();
  const tiles = m.juegos.map(j=>`
    <button class="tile" onclick="abrirJuego('${j.id}')" data-leer="${j.t}. ${j.s}">
      <span class="ic">${j.ic}</span>
      <h4>${j.t}</h4>
      <small>${j.s}</small>
      <span class="pill">${j.tag}</span>
    </button>`).join('');
  $('#vista-menu').innerHTML = `
  <div class="wrap">
    <div style="text-align:center;margin:6px 0 18px">
      <button class="btn-volver" onclick="irInicio()">⟵ Inicio</button>
    </div>
    <div class="cinta-ciclo">
      <span class="lbl">${m.titulo}</span>
      <span class="chip estrella">⭐ <span id="estrellas-cont">${App.estrellas}</span></span>
    </div>
    <p class="bajada" data-leer="${m.desc.replace(/"/g,'')}">${m.desc}</p>
    <div class="grid-juegos">${tiles}</div>
  </div>`;
  ir('menu');
  if(App.lecturaOn) decir(m.titulo+'. '+m.desc);
}

/* =====================================================================
   DISPATCHER DE JUEGOS  (las funciones viven en games.js)
   ===================================================================== */
function abrirJuego(id){
  sonClick(); App.enHistoria=false; App.juegoActual=id;
  const cont=$('#vista-juego');
  const fn = JUEGOS[id];
  if(!fn){ cont.innerHTML='<div class="wrap"><div class="juego"><h2>Próximamente</h2></div></div>'; ir('juego'); return; }
  cont.innerHTML = `<div class="wrap">
    <div style="text-align:center;margin:6px 0 12px">
      <button class="btn-volver" onclick="abrirCiclo('${App.ciclo}')">⟵ Volver a los juegos</button>
      <span class="chip estrella" style="vertical-align:middle">⭐ <span id="estrellas-cont">${App.estrellas}</span></span>
    </div>
    <div id="zona-juego"></div>
  </div>`;
  ir('juego');
  fn($('#zona-juego'));
}

/* ---------- Botón "leer esta pantalla" ---------- */
function btnLeer(texto){
  return `<button class="btn-leer" onclick='decirSiempre(${JSON.stringify(texto)})'>🔊 Escuchar</button>`;
}

/* ---------- Regreso tras un juego (sabe si estás en la aventura) ---------- */
function finJuego(){
  completarJuego(App.juegoActual);
  if(App.enHistoria) avanzarHistoria();
  else abrirCiclo(App.ciclo);
}

/* ---------- Medalla final reutilizable ---------- */
function medallaFinal(zona,msg,onContinuar){
  confeti(120); sonBien(); sumarEstrella(); completarJuego(App.juegoActual);
  const enH=App.enHistoria;
  zona.innerHTML = `<div class="juego"><div class="medalla">
    <div class="escudo">🏅</div>
    <h3>¡Excelente trabajo!</h3>
    <p style="font-weight:800;color:var(--tierra);max-width:520px;margin:8px auto" data-leer="${msg.replace(/"/g,'')}">${msg}</p>
    ${btnLeer(msg)}
    <button class="btn-grande" onclick="finJuego()">${enH?'▶ Seguir la aventura':'🎮 Jugar otra cosa'}</button>
  </div></div>`;
  if(App.lecturaOn) decirSiempre('¡Excelente trabajo! '+msg);
}

/* ---------- SVG mascota gaucho (inline, sin dependencias) ---------- */
function svgGaucho(){
  return `<svg class="mascota float-anim" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg" aria-label="Ilustración de Güemes a caballo">
    <ellipse cx="120" cy="205" rx="80" ry="12" fill="rgba(0,0,0,.12)"/>
    <!-- caballo -->
    <path d="M55 200 q-5-60 35-78 q30-14 70-6 q35 7 38 40 q2 30-8 44 l-12 0 -6-30 -50 4 -8 26z" fill="#8B5E3C"/>
    <path d="M60 200l4-26 12 0 -2 26z" fill="#6e4a2f"/>
    <path d="M170 200l6-26 11 0 -3 26z" fill="#6e4a2f"/>
    <path d="M183 110 q22-6 30 8 q4 8-4 14 q-10 6-22-4z" fill="#8B5E3C"/>
    <path d="M205 116l8-3 2 8-7 2z" fill="#5a3a23"/>
    <circle cx="200" cy="120" r="2.6" fill="#2a1c10"/>
    <!-- poncho/jinete -->
    <path d="M96 95 q24-14 46 0 l10 44 q-33 12-66 0z" fill="#C0392B"/>
    <path d="M119 70 a14 14 0 1 1 .1 0z" fill="#f0c9a0"/>
    <path d="M106 64 q13-16 28 0 q-3-12-14-12 q-11 0-14 12z" fill="#3a2a1a"/>
    <path d="M104 62 q15-6 30 0 l3 6 q-18-6-36 0z" fill="#5a3a23"/>
    <rect x="116" y="80" width="8" height="5" rx="2" fill="#3a2a1a"/>
    <!-- bandera -->
    <rect x="150" y="40" width="3" height="70" fill="#6e4a2f"/>
    <path d="M153 42 h40 v26 h-40z" fill="#fff"/>
    <path d="M153 42 h40 v8 h-40z" fill="#6CB6E3"/>
    <path d="M153 60 h40 v8 h-40z" fill="#6CB6E3"/>
    <circle cx="173" cy="55" r="4" fill="#F6C544"/>
  </svg>`;
}

/* ---------- SVG Macacha Güemes (co-guía de la aventura) ---------- */
function svgMacacha(){
  return `<svg class="mascota" viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" aria-label="Ilustración de Macacha Güemes">
    <ellipse cx="80" cy="190" rx="48" ry="9" fill="rgba(0,0,0,.12)"/>
    <!-- vestido / rebozo -->
    <path d="M80 80 q34 4 40 50 q4 30-6 56 l-68 0 q-10-26-6-56 q6-46 40-50z" fill="#C0392B"/>
    <path d="M80 80 q-22 6-30 40 l60 0 q-8-34-30-40z" fill="#6CB6E3"/>
    <path d="M52 132 l56 0 -4 16 -48 0z" fill="#F6C544"/>
    <!-- cuello/cara -->
    <rect x="73" y="66" width="14" height="16" rx="5" fill="#e9b486"/>
    <circle cx="80" cy="52" r="20" fill="#f0c9a0"/>
    <!-- pelo recogido -->
    <path d="M58 50 q-2-26 22-28 q24 2 22 28 q-6-12-22-12 q-16 0-22 12z" fill="#3a2a1a"/>
    <path d="M60 48 q20-10 40 0 q2 8-2 12 q-18-8-36 0 q-4-4-2-12z" fill="#2a1c10"/>
    <ellipse cx="80" cy="34" rx="8" ry="6" fill="#3a2a1a"/>
    <!-- ojos / sonrisa -->
    <circle cx="73" cy="52" r="2.4" fill="#2a1c10"/>
    <circle cx="87" cy="52" r="2.4" fill="#2a1c10"/>
    <path d="M73 60 q7 6 14 0" stroke="#b5651d" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="68" cy="57" r="3" fill="#f4a9a0" opacity=".6"/>
    <circle cx="92" cy="57" r="3" fill="#f4a9a0" opacity=".6"/>
    <!-- carta/mensaje en la mano (fue mensajera de los patriotas) -->
    <g transform="rotate(-12 120 150)"><rect x="108" y="138" width="26" height="20" rx="2" fill="#FFF8EC" stroke="#8B5E3C" stroke-width="1.5"/><path d="M108 138l13 9 13-9" fill="none" stroke="#8B5E3C" stroke-width="1.5"/></g>
  </svg>`;
}

/* =====================================================================
   MODO HISTORIA  ·  aventura narrada por Güemes y Macacha
   ===================================================================== */
const CAPITULOS = [
  { anio:'1785', tit:'Nace un niño en Salta', guia:'macacha',
    narr:'¡Hola! Soy Macacha Güemes. Te invito a conocer la vida de mi hermano Martín. Todo comenzó el 8 de febrero de 1785, cuando nació en la hermosa provincia de Salta, en el norte argentino.',
    juego:'info_pc', cta:'Conocé quién fue Güemes 🔎' },
  { anio:'1806 – 1807', tit:'Las Invasiones Inglesas', guia:'guemes',
    narr:'¡Soy Martín Miguel de Güemes! Desde muy joven me sumé al ejército. En 1806 y 1807 ayudé a defender estas tierras durante las Invasiones Inglesas. ¡Demostrá lo que aprendiste ordenando estas palabras secretas!',
    juego:'anagrama', cta:'Ordená las palabras 🔤' },
  { anio:'1810', tit:'La Revolución de Mayo', guia:'macacha',
    narr:'En 1810 ocurrió la Revolución de Mayo y el sueño de la libertad creció con fuerza. Martín se sumó de lleno a la lucha por la independencia. ¿Podés ordenar los momentos de su vida?',
    juego:'secuencia', cta:'Ordená la secuencia 🪜' },
  { anio:'La Guerra Gaucha', tit:'Los Gauchos Infernales', guia:'guemes',
    narr:'Formé un ejército de gauchos valientes: ¡los Gauchos Infernales! Con poncho y a caballo, conocíamos cada camino del norte. Atacábamos por sorpresa: a eso le llamaban la «Guerra Gaucha». Encontrá las palabras escondidas.',
    juego:'sopa_pc', cta:'Buscá las palabras 🔍' },
  { anio:'1815', tit:'Gobernador de Salta', guia:'macacha',
    narr:'En 1815, Martín fue elegido gobernador de Salta. Desde allí organizó la defensa del norte y frenó a los realistas que querían avanzar desde el Alto Perú. ¿Resolvés estos acertijos?',
    juego:'acertijos', cta:'Resolvé los acertijos 🕵️' },
  { anio:'17 de junio de 1821', tit:'Paso a la inmortalidad', guia:'guemes',
    narr:'El 7 de junio de 1821 fui herido en una emboscada. El 17 de junio partí, defendiendo siempre la libertad de mi patria. Pero mi historia sigue viva en cada uno de ustedes. Completá este crucigrama para cerrar nuestra aventura.',
    juego:'cruci', cta:'Completá el crucigrama 🧩' },
];

function abrirHistoria(){
  App.enHistoria=true; App.histPaso=0; sonClick();
  renderCapitulo(0);
}

function puntosProgreso(activo){
  return `<div class="hist-prog" aria-hidden="true">${
    CAPITULOS.map((_,i)=>`<span class="pp ${i<activo?'hecho':''} ${i===activo?'actual':''}"></span>`).join('')
  }</div>`;
}

function renderCapitulo(i){
  App.histPaso=i;
  const cap=CAPITULOS[i];
  const img = cap.guia==='macacha' ? 'macacha.png' : 'guemes-portada.png';
  const nombre = cap.guia==='macacha' ? 'Macacha' : 'Güemes';
  const fig = `<div class="guia-foto-marco"><img class="guia-foto" src="${img}" alt="Retrato de ${nombre}"></div>`;
  $('#vista-historia').innerHTML = `
  <div class="wrap">
    <div class="hist-barra">
      <button class="btn-volver" onclick="salirHistoria()">⟵ Salir</button>
      <span class="hist-info">Misión ${i+1} de ${CAPITULOS.length}</span>
      <span class="chip estrella">⭐ <span id="estrellas-cont">${App.estrellas}</span></span>
    </div>
    ${puntosProgreso(i)}
    <div class="escena">
      <span class="cap-anio">📅 ${cap.anio}</span>
      <h2 class="cap-tit" data-leer="${cap.tit}">${cap.tit}</h2>
      <div class="escena-fila">
        <div class="guia-fig guia-${cap.guia}">${fig}<span class="guia-nombre">${nombre}</span></div>
        <div class="globo" data-leer="${cap.narr.replace(/"/g,'')}">
          <p>${cap.narr}</p>
          ${btnLeer(cap.narr)}
        </div>
      </div>
      <button class="btn-grande btn-mision" onclick="jugarMision(${i})">▶ ${cap.cta}</button>
    </div>
  </div>`;
  ir('historia');
  if(App.lecturaOn) decirSiempre(cap.tit+'. '+cap.narr);
}

function jugarMision(i){
  sonClick();
  const cap=CAPITULOS[i];
  App.juegoActual=cap.juego;
  const fn=JUEGOS[cap.juego];
  $('#vista-juego').innerHTML = `<div class="wrap">
    <div class="hist-barra">
      <button class="btn-volver" onclick="renderCapitulo(${i})">⟵ Volver al relato</button>
      <span class="hist-info">Misión ${i+1} de ${CAPITULOS.length}</span>
      <span class="chip estrella">⭐ <span id="estrellas-cont">${App.estrellas}</span></span>
      <button class="btn-volver btn-sig" onclick="avanzarHistoria()">Siguiente ▶</button>
    </div>
    <div id="zona-juego"></div>
  </div>`;
  ir('juego');
  if(fn) fn($('#zona-juego'));
  else $('#zona-juego').innerHTML='<div class="juego"><h2>Próximamente</h2></div>';
}

function avanzarHistoria(){
  const sig=App.histPaso+1;
  if(sig>=CAPITULOS.length) renderFinalHistoria();
  else renderCapitulo(sig);
}

function salirHistoria(){ App.enHistoria=false; cancelarVoz(); irInicio(); }

function renderFinalHistoria(){
  confeti(180); sonBien(); sumarEstrella(2);
  App.historiaCompleta=true; guardarEstado(); revisarMedallas();
  $('#vista-historia').innerHTML = `
  <div class="wrap">
    <div class="escena final-historia">
      <div class="escudo-final">🏅</div>
      <h2 data-leer="¡Completaste la aventura de Güemes!">¡Completaste la aventura! 🎉</h2>
      <p class="final-txt" data-leer="Recorriste toda la vida de Martín Miguel de Güemes, desde que nació en Salta hasta su paso a la inmortalidad el 17 de junio. ¡Gracias por acompañarnos! Sos un verdadero gaucho o gaucha de la libertad.">
        Recorriste toda la vida de <strong>Martín Miguel de Güemes</strong>, desde que nació en Salta hasta su paso a la inmortalidad el 17 de junio. ¡Sos un verdadero gaucho o gaucha de la libertad! 🇦🇷
      </p>
      <div class="escena-fila" style="justify-content:center">
        <div class="guia-fig guia-guemes"><div class="guia-foto-marco"><img class="guia-foto" src="guemes-portada.png" alt="Retrato de Güemes"></div><span class="guia-nombre">Güemes</span></div>
        <div class="guia-fig guia-macacha"><div class="guia-foto-marco"><img class="guia-foto" src="macacha.png" alt="Retrato de Macacha"></div><span class="guia-nombre">Macacha</span></div>
      </div>
      ${btnLeer('¡Completaste la aventura de Güemes! Sos un verdadero gaucho o gaucha de la libertad.')}
      <div style="margin-top:14px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <button class="btn-grande" onclick="abrirHistoria()">🔁 Vivirla de nuevo</button>
        <button class="btn-grande" style="background:var(--tierra)" onclick="salirHistoria()">🏠 Volver al inicio</button>
      </div>
    </div>
  </div>`;
  ir('historia');
  App.enHistoria=false;
  if(App.lecturaOn) decirSiempre('¡Completaste la aventura de Güemes! Sos un verdadero gaucho o gaucha de la libertad.');
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */
function irInicio(){ renderInicio(); ir('inicio'); }
function totalJuegos(){ return (typeof JUEGOS!=='undefined') ? Object.keys(JUEGOS).length : 0; }

function boot(){
  cargarEstado();
  renderInicio();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
// pequeña ayuda: si las voces tardan, recargar
setTimeout(cargarVoz,600);
