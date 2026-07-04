const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('[data-view]');
const startGameBtn = document.getElementById('startGame');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const pctx = previewCanvas.getContext('2d');
const crowdCountEl = document.getElementById('crowdCount');
const scoreEl = document.getElementById('score');
const levelNameEl = document.getElementById('levelName');
const timerEl = document.getElementById('timer');
const banner = document.getElementById('evolutionBanner');
const bannerLevel = document.getElementById('bannerLevel');
const bannerBoost = document.getElementById('bannerBoost');
const restartBtn = document.getElementById('restart');
const evoGrid = document.getElementById('evolutionGrid');

const evolutions = [
  { name:'시민 리더', value:1, need:100, color:'#2f80ff', size:16, aura:36, desc:'기본 캐릭터. 시민을 모아 첫 세력을 만듭니다.' },
  { name:'도시 대장', value:10, need:100, color:'#20d6ff', size:21, aura:54, desc:'흡수 점수 x10. 더 넓은 범위로 시민을 끌어들입니다.' },
  { name:'구역 지배자', value:100, need:100, color:'#8f53ff', size:25, aura:72, desc:'흡수 점수 x100. 이동 잔상과 보라색 오라가 생깁니다.' },
  { name:'도시 군주', value:1000, need:100, color:'#e34f64', size:30, aura:92, desc:'흡수 점수 x1,000. 망토와 강한 충격파를 가집니다.' },
  { name:'도시의 왕', value:10000, need:100, color:'#ffd36a', size:35, aura:112, desc:'흡수 점수 x10,000. 황금 왕관과 경비병 이펙트가 생깁니다.' },
  { name:'도시의 황제', value:100000, need:100, color:'#fff2ad', size:42, aura:140, desc:'흡수 점수 x100,000. 넓은 자동 흡수 범위를 지닙니다.' }
];

const state = {
  running:false, finished:false, timeLeft:180, score:0, level:0, stageProgress:1,
  player:{x:600,y:360,vx:0,vy:0}, followers:[], citizens:[], particles:[], keys:{}, pointer:null, last:0, shake:0
};

function showView(id){
  views.forEach(v => v.classList.toggle('active', v.id === id));
  if(id === 'game') startGame();
}
navButtons.forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
startGameBtn.addEventListener('click', () => showView('game'));
restartBtn.addEventListener('click', () => startGame(true));

function initEvolutionCards(){
  evoGrid.innerHTML = evolutions.map((e, i) => `
    <article class="evo-card">
      <div class="avatar" style="color:${e.color}">
        <div class="avatar-figure">
          ${i >= 3 ? '<div class="cape"></div>' : ''}
          ${i >= 2 ? '<div class="mini-crown">♛</div>' : ''}
          <div class="head"></div><div class="body"></div>
        </div>
      </div>
      <h3>${i+1}단계 ${e.name}</h3>
      <p>${e.desc}</p>
      <span class="boost">흡수 점수 x${e.value.toLocaleString()}</span>
    </article>`).join('');
}
initEvolutionCards();

function makeCitizen(){
  return {
    x:60 + Math.random()*1080, y:70 + Math.random()*580,
    vx:(Math.random()-.5)*36, vy:(Math.random()-.5)*36,
    r:10 + Math.random()*2, color:'#d4d0c6', wander:Math.random()*100
  };
}

function startGame(force=false){
  state.running = true; state.finished = false; state.timeLeft = 180; state.score = 0; state.level = 0; state.stageProgress = 1;
  state.player.x = 600; state.player.y = 360; state.player.vx = 0; state.player.vy = 0;
  state.followers = []; state.citizens = Array.from({length:170}, makeCitizen); state.particles = []; state.shake = 0;
  updateHud(); banner.classList.add('hidden');
  if(!state.last || force) { state.last = performance.now(); requestAnimationFrame(loop); }
}

window.addEventListener('keydown', e => state.keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => state.keys[e.key.toLowerCase()] = false);

function pointerPos(e){ const rect = gameCanvas.getBoundingClientRect(); return {x:(e.clientX-rect.left)*gameCanvas.width/rect.width, y:(e.clientY-rect.top)*gameCanvas.height/rect.height}; }
gameCanvas.addEventListener('pointerdown', e => { state.pointer = pointerPos(e); gameCanvas.setPointerCapture(e.pointerId); });
gameCanvas.addEventListener('pointermove', e => { if(state.pointer) state.pointer = pointerPos(e); });
gameCanvas.addEventListener('pointerup', () => state.pointer = null);
gameCanvas.addEventListener('pointercancel', () => state.pointer = null);

function input(dt){
  let ax = 0, ay = 0;
  if(state.keys['arrowleft'] || state.keys['a']) ax -= 1;
  if(state.keys['arrowright'] || state.keys['d']) ax += 1;
  if(state.keys['arrowup'] || state.keys['w']) ay -= 1;
  if(state.keys['arrowdown'] || state.keys['s']) ay += 1;
  if(state.pointer){ ax += (state.pointer.x - state.player.x) / 140; ay += (state.pointer.y - state.player.y) / 140; }
  const mag = Math.hypot(ax, ay) || 1;
  const speed = 210 + state.level * 15;
  state.player.vx = (ax / mag) * speed;
  state.player.vy = (ay / mag) * speed;
  if(!ax && !ay){ state.player.vx *= .78; state.player.vy *= .78; }
  state.player.x = clamp(state.player.x + state.player.vx * dt, 35, gameCanvas.width-35);
  state.player.y = clamp(state.player.y + state.player.vy * dt, 45, gameCanvas.height-35);
}

function update(dt){
  if(!state.running || state.finished) return;
  state.timeLeft -= dt;
  if(state.timeLeft <= 0){ finishGame(); return; }
  input(dt);

  for(const c of state.citizens){
    c.wander -= dt;
    if(c.wander <= 0){ c.vx = (Math.random()-.5)*42; c.vy = (Math.random()-.5)*42; c.wander = .8 + Math.random()*2.2; }
    c.x += c.vx*dt; c.y += c.vy*dt;
    if(c.x < 30 || c.x > 1170) c.vx *= -1;
    if(c.y < 45 || c.y > 680) c.vy *= -1;
    c.x = clamp(c.x,30,1170); c.y = clamp(c.y,45,680);
    const range = evolutions[state.level].aura;
    const d = Math.hypot(c.x-state.player.x, c.y-state.player.y);
    if(d < range && state.level >= 2){
      c.x += (state.player.x-c.x)*dt*(state.level*.7);
      c.y += (state.player.y-c.y)*dt*(state.level*.7);
    }
    if(d < evolutions[state.level].size + c.r + 7){ absorb(c); }
  }
  state.citizens = state.citizens.filter(c => !c.absorbed);
  while(state.citizens.length < 170) state.citizens.push(makeCitizen());

  const leader = {x:state.player.x, y:state.player.y};
  state.followers.forEach((f, i) => {
    const angle = i * 2.399; const ring = 42 + Math.floor(i/10)*24; const target = {x:leader.x + Math.cos(angle)*ring, y:leader.y + Math.sin(angle)*ring};
    f.x += (target.x - f.x) * Math.min(1, dt*4.8);
    f.y += (target.y - f.y) * Math.min(1, dt*4.8);
  });
  state.particles.forEach(p => { p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.r += p.grow*dt; });
  state.particles = state.particles.filter(p => p.life > 0);
  state.shake = Math.max(0, state.shake - dt*18);
  updateHud();
}

function absorb(c){
  c.absorbed = true;
  const e = evolutions[state.level];
  state.score += e.value;
  state.stageProgress++;
  state.followers.push({x:c.x,y:c.y,r:8,color:e.color});
  burst(c.x,c.y,e.color,8);
  if(state.stageProgress >= e.need && state.level < evolutions.length - 1) evolve();
}

function evolve(){
  state.level++;
  const e = evolutions[state.level];
  state.stageProgress = 1;
  state.followers = [];
  state.shake = 12;
  burst(state.player.x,state.player.y,e.color,70, true);
  bannerLevel.textContent = e.name;
  bannerBoost.textContent = `흡수 점수 x${e.value.toLocaleString()}`;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 1450);
}

function burst(x,y,color,count=16,big=false){
  for(let i=0;i<count;i++){
    const a = Math.random()*Math.PI*2, s = (big?80:35)+Math.random()*(big?220:70);
    state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:big?3+Math.random()*6:2+Math.random()*3,grow:big?24:8,life:big?.8+Math.random()*.5:.35+Math.random()*.35,color});
  }
}

function finishGame(){
  state.finished = true; state.running = false;
  const wrap = document.querySelector('.canvas-wrap');
  const card = document.createElement('div');
  card.className = 'evolution-banner';
  card.innerHTML = `<div class="finish-card"><h2>결과</h2><p>최종 단계: ${evolutions[state.level].name}</p><p>최종 점수: ${state.score.toLocaleString()}</p><button class="primary-btn" onclick="location.reload()">처음부터 다시</button></div>`;
  wrap.appendChild(card);
}

function updateHud(){
  const e = evolutions[state.level];
  crowdCountEl.textContent = `${state.stageProgress} / ${e.need}`;
  scoreEl.textContent = state.score.toLocaleString();
  levelNameEl.textContent = e.name;
  const t = Math.max(0, Math.floor(state.timeLeft));
  timerEl.textContent = `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
}

function drawMap(context, w, h){
  const grad = context.createLinearGradient(0,0,w,h); grad.addColorStop(0,'#516f4b'); grad.addColorStop(.45,'#b69056'); grad.addColorStop(1,'#5d412b');
  context.fillStyle = grad; context.fillRect(0,0,w,h);
  context.strokeStyle = 'rgba(255,255,255,.08)'; context.lineWidth = 4;
  for(let x=-100;x<w+200;x+=110){ context.beginPath(); context.moveTo(x,0); context.lineTo(x-260,h); context.stroke(); }
  for(let y=50;y<h;y+=95){ context.beginPath(); context.moveTo(0,y); context.lineTo(w,y+45); context.stroke(); }
  for(const b of buildings){ drawBuilding(context,b.x*w/1200,b.y*h/720,b.w*w/1200,b.h*h/720,b.roof); }
  drawWell(context, 155*w/1200, 530*h/720, w/1200);
}
const buildings = [
  {x:55,y:65,w:120,h:92,roof:'#5b2f20'},{x:230,y:40,w:160,h:110,roof:'#6f3e22'},{x:915,y:55,w:180,h:120,roof:'#4f2e1f'},
  {x:1010,y:245,w:130,h:95,roof:'#673a21'},{x:72,y:250,w:130,h:120,roof:'#52311e'},{x:850,y:540,w:180,h:110,roof:'#66381e'},
  {x:330,y:590,w:165,h:92,roof:'#53301d'}
];
function drawBuilding(c,x,y,w,h,roof){
  c.fillStyle = '#8b6840'; c.fillRect(x,y+h*.22,w,h*.78);
  c.fillStyle = roof; c.beginPath(); c.moveTo(x-12,y+h*.25); c.lineTo(x+w/2,y-20); c.lineTo(x+w+12,y+h*.25); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,214,117,.65)'; c.fillRect(x+w*.18,y+h*.48,w*.18,h*.18); c.fillRect(x+w*.62,y+h*.5,w*.18,h*.17);
}
function drawWell(c,x,y,s=1){ c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x,y+30*s,58*s,22*s,0,0,Math.PI*2); c.fill(); c.fillStyle='#8e8a78'; c.beginPath(); c.ellipse(x,y,55*s,32*s,0,0,Math.PI*2); c.fill(); c.fillStyle='#23394c'; c.beginPath(); c.ellipse(x,y,33*s,18*s,0,0,Math.PI*2); c.fill(); }
function drawPerson(c,x,y,r,color,level=0){
  c.save(); c.translate(x,y);
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,r+8,r*1.1,r*.35,0,0,Math.PI*2); c.fill();
  c.fillStyle=color;
  if(level>=3){ c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(-r*1.7,-r*.1); c.quadraticCurveTo(0,r*2.4,r*1.7,-r*.1); c.fill(); c.fillStyle=color; }
  c.beginPath(); c.arc(0,-r*.9,r*.75,0,Math.PI*2); c.fill();
  c.beginPath(); c.roundRect(-r*.75,-r*.2,r*1.5,r*2.1,r*.55); c.fill();
  if(level>=2){ c.fillStyle='#ffd36a'; c.font=`${r*1.35}px Arial`; c.textAlign='center'; c.fillText('♛',0,-r*1.55); }
  c.restore();
}
function draw(){
  const sx = (Math.random()-.5)*state.shake, sy = (Math.random()-.5)*state.shake;
  ctx.save(); ctx.translate(sx,sy); drawMap(ctx, gameCanvas.width, gameCanvas.height);
  const e = evolutions[state.level];
  ctx.strokeStyle=e.color; ctx.lineWidth=2; ctx.globalAlpha=.38; ctx.beginPath(); ctx.arc(state.player.x,state.player.y,e.aura,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;
  state.citizens.forEach(c => drawPerson(ctx,c.x,c.y,c.r,c.color,0));
  state.followers.forEach(f => drawPerson(ctx,f.x,f.y,f.r,e.color,state.level));
  drawPerson(ctx,state.player.x,state.player.y,e.size,e.color,state.level);
  state.particles.forEach(p => { ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; });
  drawMiniMap(); ctx.restore();
}
function drawMiniMap(){
  const x=1030,y=530,r=78; ctx.save(); ctx.globalAlpha=.92; ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.clip(); ctx.fillStyle='#253d33'; ctx.fillRect(x-r,y-r,r*2,r*2); ctx.strokeStyle='rgba(255,255,255,.15)'; for(let i=-1;i<3;i++){ctx.beginPath();ctx.moveTo(x-r,y-r+i*45);ctx.lineTo(x+r,y-r+i*45+60);ctx.stroke();}
  ctx.fillStyle=evolutions[state.level].color; ctx.beginPath(); ctx.arc(x-r+state.player.x/1200*r*2,y-r+state.player.y/720*r*2,5,0,Math.PI*2); ctx.fill(); ctx.restore(); ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
}
function loop(now){
  const dt = Math.min(.033,(now-state.last)/1000); state.last = now;
  update(dt); draw();
  if(state.running || !state.finished) requestAnimationFrame(loop);
}
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
CanvasRenderingContext2D.prototype.roundRect ||= function(x,y,w,h,r){ this.beginPath(); this.moveTo(x+r,y); this.arcTo(x+w,y,x+w,y+h,r); this.arcTo(x+w,y+h,x,y+h,r); this.arcTo(x,y+h,x,y,r); this.arcTo(x,y,x+w,y,r); this.closePath(); return this; };

function drawPreview(){
  const w=previewCanvas.width,h=previewCanvas.height; drawMap(pctx,w,h);
  for(let i=0;i<45;i++) drawPerson(pctx,30+Math.random()*(w-60),40+Math.random()*(h-70),5.5,'#d4d0c6',0);
  pctx.strokeStyle='rgba(47,128,255,.65)'; pctx.lineWidth=3; pctx.beginPath(); pctx.arc(w*.54,h*.55,82,0,Math.PI*2); pctx.stroke();
  for(let i=0;i<22;i++){ const a=i*2.399, rr=28+Math.floor(i/8)*18; drawPerson(pctx,w*.54+Math.cos(a)*rr,h*.55+Math.sin(a)*rr,6,'#2f80ff',0); }
  drawPerson(pctx,w*.54,h*.55,11,'#2f80ff',0);
}
drawPreview();
