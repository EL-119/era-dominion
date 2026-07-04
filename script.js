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
  { name:'시민 리더', value:1, need:100, color:'#2f80ff', accent:'#8fc6ff', size:17, aura:58, magnet:0.55, desc:'기본 캐릭터. 작은 흡수 범위를 가지고 시작합니다.' },
  { name:'도시 대장', value:10, need:100, color:'#20d6ff', accent:'#b9fbff', size:22, aura:78, magnet:0.85, desc:'흡수 점수 x10. 더 넓은 범위와 푸른 오라를 얻습니다.' },
  { name:'구역 지배자', value:100, need:100, color:'#8f53ff', accent:'#dbc5ff', size:27, aura:100, magnet:1.1, desc:'흡수 점수 x100. 보라색 에너지 링과 잔상이 생깁니다.' },
  { name:'도시 군주', value:1000, need:100, color:'#e34f64', accent:'#ffc0c8', size:32, aura:124, magnet:1.35, desc:'흡수 점수 x1,000. 망토와 강한 충격파를 가집니다.' },
  { name:'도시의 왕', value:10000, need:100, color:'#ffd36a', accent:'#fff0af', size:38, aura:152, magnet:1.65, desc:'흡수 점수 x10,000. 황금 왕관과 넓은 지배 범위를 얻습니다.' },
  { name:'도시의 황제', value:100000, need:100, color:'#fff2ad', accent:'#ffffff', size:45, aura:190, magnet:2.15, desc:'흡수 점수 x100,000. 강력한 자동 흡수 범위를 지닙니다.' }
];

const state = {
  running:false, finished:false, timeLeft:180, score:0, level:0, stageProgress:1,
  player:{x:600,y:360,vx:0,vy:0,trail:[]}, followers:[], citizens:[], particles:[], floaters:[], keys:{}, pointer:null, last:0, shake:0, pulse:0, dangerFlash:0
};

const buildings = [
  {x:55,y:64,w:138,h:105,roof:'#5a2b1c',wall:'#9a7346'}, {x:240,y:42,w:170,h:118,roof:'#6d3b1e',wall:'#b0814d'},
  {x:900,y:52,w:200,h:128,roof:'#4f2e1f',wall:'#967347'}, {x:1000,y:246,w:145,h:98,roof:'#673a21',wall:'#a27441'},
  {x:74,y:252,w:148,h:128,roof:'#52311e',wall:'#936b40'}, {x:840,y:542,w:190,h:115,roof:'#66381e',wall:'#b8894d'},
  {x:334,y:590,w:170,h:94,roof:'#53301d',wall:'#a87b49'}, {x:560,y:72,w:120,h:88,roof:'#6a3920',wall:'#9d7449'},
  {x:656,y:570,w:126,h:96,roof:'#5d321e',wall:'#a47744'}
];

function showView(id){
  views.forEach(v => v.classList.toggle('active', v.id === id));
  if(id === 'game') startGame(true);
  if(id === 'home') drawPreview();
}
navButtons.forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
startGameBtn.addEventListener('click', () => showView('game'));
restartBtn.addEventListener('click', () => startGame(true));

function initEvolutionCards(){
  evoGrid.innerHTML = evolutions.map((e, i) => `
    <article class="evo-card">
      <div class="avatar" style="color:${e.color}">
        <div class="avatar-figure">
          ${i >= 3 ? '<div class="avatar-cape"></div>' : ''}
          ${i >= 2 ? '<div class="avatar-crown"></div>' : ''}
          <div class="avatar-head"></div><div class="avatar-body"></div>
        </div>
      </div>
      <h3>${i+1}단계 ${e.name}</h3>
      <p>${e.desc}</p>
      <span class="boost">흡수 점수 x${e.value.toLocaleString()}</span>
    </article>`).join('');
}
initEvolutionCards();

function rand(min,max){ return min + Math.random()*(max-min); }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

function makeCitizen(strong=false){
  const tier = strong ? (Math.random() < .22 ? 3 : 2) : 1;
  const r = tier === 1 ? rand(8,11) : tier === 2 ? rand(13,16) : rand(17,21);
  const strength = tier === 1 ? 1 : tier === 2 ? 18 : 45;
  return {
    x:rand(55,1145), y:rand(70,660), vx:rand(-42,42), vy:rand(-42,42), r,
    tier, strength, value: strength, absorbed:false, wander:rand(.4,2.4), bob:rand(0,10),
    color: tier===1 ? '#d7d3c9' : tier===2 ? '#ffbd56' : '#ff5d72',
    outline: tier===1 ? '#fff7e4' : tier===2 ? '#ffe3a1' : '#ffd5dc'
  };
}

function seedCitizens(){
  const normal = Array.from({length:150}, () => makeCitizen(false));
  const strong = Array.from({length:22}, () => makeCitizen(true));
  return normal.concat(strong);
}

function startGame(force=false){
  state.running = true; state.finished = false; state.timeLeft = 180; state.score = 0; state.level = 0; state.stageProgress = 1;
  state.player.x = 600; state.player.y = 360; state.player.vx = 0; state.player.vy = 0; state.player.trail = [];
  state.followers = []; state.citizens = seedCitizens(); state.particles = []; state.floaters = []; state.shake = 0; state.pulse = 0; state.dangerFlash = 0;
  updateHud(); banner.classList.add('hidden');
  if(force || !state.last){ state.last = performance.now(); requestAnimationFrame(loop); }
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
  if(state.pointer){ ax += (state.pointer.x - state.player.x) / 135; ay += (state.pointer.y - state.player.y) / 135; }
  const mag = Math.hypot(ax, ay);
  const speed = 205 + state.level * 16;
  if(mag > .05){ state.player.vx = (ax / mag) * speed; state.player.vy = (ay / mag) * speed; }
  else { state.player.vx *= .72; state.player.vy *= .72; }
  state.player.x = clamp(state.player.x + state.player.vx * dt, 38, gameCanvas.width-38);
  state.player.y = clamp(state.player.y + state.player.vy * dt, 48, gameCanvas.height-38);
  state.player.trail.push({x:state.player.x,y:state.player.y,life:.35,size:evolutions[state.level].size});
  if(state.player.trail.length > 22) state.player.trail.shift();
}

function update(dt){
  if(!state.running || state.finished) return;
  state.timeLeft -= dt;
  if(state.timeLeft <= 0){ finishGame(); return; }
  state.pulse += dt;
  input(dt);
  const e = evolutions[state.level];
  for(const c of state.citizens){
    c.wander -= dt; c.bob += dt * 6;
    if(c.wander <= 0){ c.vx = rand(-48,48); c.vy = rand(-48,48); c.wander = rand(.7,2.5); }
    c.x += c.vx*dt; c.y += c.vy*dt;
    if(c.x < 30 || c.x > 1170) c.vx *= -1;
    if(c.y < 45 || c.y > 680) c.vy *= -1;
    c.x = clamp(c.x,30,1170); c.y = clamp(c.y,45,680);
    const d = Math.hypot(c.x-state.player.x, c.y-state.player.y);
    if(d < e.aura){
      const pull = e.magnet * (1 - d / e.aura) * 3.2;
      c.x += (state.player.x - c.x) * dt * pull;
      c.y += (state.player.y - c.y) * dt * pull;
    }
    if(d < e.size + c.r + 8){ tryAbsorb(c); }
  }
  state.citizens = state.citizens.filter(c => !c.absorbed);
  while(state.citizens.length < 172){ state.citizens.push(makeCitizen(Math.random() < .16)); }
  updateFollowers(dt);
  updateParticles(dt);
  state.shake = Math.max(0, state.shake - dt*16);
  state.dangerFlash = Math.max(0, state.dangerFlash - dt*2.8);
  updateHud();
}

function tryAbsorb(c){
  const power = currentPower();
  if(c.tier > 1 && power < c.strength){
    state.score = Math.max(0, state.score - Math.ceil(c.strength * evolutions[state.level].value));
    state.dangerFlash = 1;
    state.shake = 8;
    addFloater(state.player.x, state.player.y - 45, `강함 ${c.strength}`, '#ff6377');
    burst(c.x,c.y,'#ff6377',18,true);
    c.vx = (c.x - state.player.x) * 2.4;
    c.vy = (c.y - state.player.y) * 2.4;
    return;
  }
  absorb(c);
}

function currentPower(){ return state.stageProgress + state.level * 28; }

function absorb(c){
  c.absorbed = true;
  const e = evolutions[state.level];
  const gain = e.value * c.value;
  state.score += gain;
  state.stageProgress += c.value;
  const followerCount = clamp(c.tier === 1 ? 1 : Math.ceil(c.value / 5), 1, 10);
  for(let i=0;i<followerCount;i++) state.followers.push({x:c.x+rand(-8,8),y:c.y+rand(-8,8),r:c.tier===1?7:9,color:e.color,life:1});
  addFloater(c.x, c.y - 24, `+${gain.toLocaleString()}`, c.tier===1 ? e.accent : '#ffd36a');
  burst(c.x,c.y,c.tier===1 ? e.color : '#ffd36a',c.tier===1?10:30,c.tier>1);
  if(state.stageProgress >= e.need && state.level < evolutions.length - 1) evolve();
}

function evolve(){
  state.level++;
  const e = evolutions[state.level];
  state.stageProgress = 1;
  state.followers = [];
  state.shake = 16;
  burst(state.player.x,state.player.y,e.color,100,true);
  addFloater(state.player.x,state.player.y-70,'진화 완료',e.accent);
  bannerLevel.textContent = e.name;
  bannerBoost.textContent = `흡수 점수 x${e.value.toLocaleString()}  흡수 범위 확대`;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 1500);
}

function updateFollowers(dt){
  const leader = {x:state.player.x, y:state.player.y};
  const maxVisible = 96;
  state.followers = state.followers.slice(-maxVisible);
  state.followers.forEach((f, i) => {
    const angle = i * 2.399 + state.pulse*.25; const ring = 42 + Math.floor(i/11)*23;
    const target = {x:leader.x + Math.cos(angle)*ring, y:leader.y + Math.sin(angle)*ring*.72};
    f.x += (target.x - f.x) * Math.min(1, dt*5.2);
    f.y += (target.y - f.y) * Math.min(1, dt*5.2);
  });
}

function addFloater(x,y,text,color){ state.floaters.push({x,y,text,color,life:.9,vy:-34}); }
function burst(x,y,color,count=16,big=false){
  for(let i=0;i<count;i++){
    const a = Math.random()*Math.PI*2, s = (big?95:45)+Math.random()*(big?240:80);
    state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:big?3+Math.random()*7:2+Math.random()*3,grow:big?24:8,life:big?.85+Math.random()*.45:.35+Math.random()*.35,color});
  }
}
function updateParticles(dt){
  state.particles.forEach(p => { p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.r += p.grow*dt; p.vx*=.985; p.vy*=.985; });
  state.particles = state.particles.filter(p => p.life > 0);
  state.floaters.forEach(f => { f.life -= dt; f.y += f.vy*dt; });
  state.floaters = state.floaters.filter(f => f.life > 0);
  state.player.trail.forEach(t => t.life -= dt);
  state.player.trail = state.player.trail.filter(t => t.life > 0);
}

function finishGame(){
  state.finished = true; state.running = false;
  const wrap = document.querySelector('.canvas-wrap');
  const old = wrap.querySelector('.finish-card-wrap'); if(old) old.remove();
  const card = document.createElement('div');
  card.className = 'evolution-banner finish-card-wrap';
  card.innerHTML = `<div class="finish-card"><h2>결과</h2><p>최종 단계: ${evolutions[state.level].name}</p><p>최종 점수: ${state.score.toLocaleString()}</p><button class="primary-btn" id="againBtn">처음부터 다시</button></div>`;
  wrap.appendChild(card);
  document.getElementById('againBtn').addEventListener('click', () => { card.remove(); startGame(true); });
}
function updateHud(){
  const e = evolutions[state.level];
  crowdCountEl.textContent = `${Math.floor(state.stageProgress)} / ${e.need}`;
  scoreEl.textContent = state.score.toLocaleString();
  levelNameEl.textContent = e.name;
  const t = Math.max(0, Math.floor(state.timeLeft));
  timerEl.textContent = `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
}

function drawMap(context,w,h){
  const grad = context.createLinearGradient(0,0,w,h); grad.addColorStop(0,'#426f55'); grad.addColorStop(.48,'#c59a5d'); grad.addColorStop(1,'#4f3526');
  context.fillStyle = grad; context.fillRect(0,0,w,h);
  drawRoads(context,w,h);
  for(const b of buildings) drawBuilding(context,b.x*w/1200,b.y*h/720,b.w*w/1200,b.h*h/720,b.roof,b.wall);
  drawWell(context,155*w/1200,530*h/720,w/1200);
  drawTrees(context,w,h);
  drawMarket(context,725*w/1200,210*h/720,w/1200);
  vignette(context,w,h);
}
function drawRoads(c,w,h){
  c.save(); c.globalAlpha=.9;
  c.strokeStyle='rgba(88,62,39,.72)'; c.lineWidth=42; c.lineCap='round';
  c.beginPath(); c.moveTo(-60,h*.54); c.bezierCurveTo(w*.28,h*.42,w*.56,h*.65,w+80,h*.45); c.stroke();
  c.beginPath(); c.moveTo(w*.47,-60); c.bezierCurveTo(w*.37,h*.28,w*.57,h*.5,w*.42,h+60); c.stroke();
  c.strokeStyle='rgba(255,235,178,.12)'; c.lineWidth=4;
  for(let x=-100;x<w+160;x+=120){ c.beginPath(); c.moveTo(x,0); c.lineTo(x-230,h); c.stroke(); }
  c.restore();
}
function drawBuilding(c,x,y,w,h,roof,wall){
  c.save();
  c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x+w*.55,y+h*.98,w*.58,h*.18,0,0,Math.PI*2); c.fill();
  const wg=c.createLinearGradient(x,y,x+w,y+h); wg.addColorStop(0,wall); wg.addColorStop(1,'#6d4d31');
  c.fillStyle=wg; roundRect(c,x,y+h*.25,w,h*.72,8); c.fill();
  c.fillStyle=roof; c.beginPath(); c.moveTo(x-14,y+h*.28); c.lineTo(x+w/2,y-22); c.lineTo(x+w+14,y+h*.28); c.closePath(); c.fill();
  c.fillStyle='rgba(255,220,126,.82)'; roundRect(c,x+w*.18,y+h*.52,w*.18,h*.18,4); c.fill(); roundRect(c,x+w*.62,y+h*.54,w*.18,h*.17,4); c.fill();
  c.restore();
}
function drawWell(c,x,y,s=1){
  c.save(); c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x,y+31*s,58*s,22*s,0,0,Math.PI*2); c.fill();
  c.fillStyle='#807968'; roundRect(c,x-45*s,y-10*s,90*s,40*s,8*s); c.fill();
  c.fillStyle='#26384b'; c.beginPath(); c.ellipse(x,y+7*s,33*s,13*s,0,0,Math.PI*2); c.fill(); c.restore();
}
function drawMarket(c,x,y,s){
  c.save(); c.translate(x,y); c.scale(s,s); c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,70,92,24,0,0,Math.PI*2); c.fill();
  c.fillStyle='#d9513d'; c.fillRect(-75,0,150,42); c.fillStyle='#ffd36a'; for(let i=-70;i<75;i+=30)c.fillRect(i,0,15,42);
  c.fillStyle='#7b4c29'; c.fillRect(-66,42,12,54); c.fillRect(54,42,12,54); c.restore();
}
function drawTrees(c,w,h){
  const pts = [[520,500],[1090,430],[245,520],[1120,620],[470,225],[45,620],[775,640],[720,92],[1040,165]];
  for(const [x,y] of pts){ const sx=x*w/1200, sy=y*h/720; c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(sx+5,sy+24,22,8,0,0,Math.PI*2); c.fill(); c.fillStyle='#3b6f42'; c.beginPath(); c.arc(sx,sy,20,0,Math.PI*2); c.fill(); c.fillStyle='#27442b'; c.beginPath(); c.arc(sx+12,sy+7,15,0,Math.PI*2); c.fill(); }
}
function vignette(c,w,h){ const g=c.createRadialGradient(w/2,h/2,80,w/2,h/2,Math.max(w,h)*.7); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(0,0,0,.34)'); c.fillStyle=g; c.fillRect(0,0,w,h); }

function draw(){
  const sx = state.shake ? rand(-state.shake,state.shake) : 0, sy = state.shake ? rand(-state.shake,state.shake) : 0;
  ctx.save(); ctx.translate(sx,sy); drawMap(ctx,gameCanvas.width,gameCanvas.height);
  if(state.dangerFlash>0){ ctx.fillStyle=`rgba(255,40,70,${state.dangerFlash*.12})`; ctx.fillRect(-20,-20,1240,760); }
  drawAura(ctx,state.player.x,state.player.y,evolutions[state.level]);
  const sorted = [...state.citizens.map(o=>({type:'citizen',o})), ...state.followers.map(o=>({type:'follower',o})), {type:'player',o:state.player}].sort((a,b)=>a.o.y-b.o.y);
  for(const item of sorted){
    if(item.type==='citizen') drawCitizen(ctx,item.o);
    if(item.type==='follower') drawFollower(ctx,item.o);
    if(item.type==='player') drawPlayer(ctx,item.o,evolutions[state.level]);
  }
  drawParticles(ctx); drawFloaters(ctx); drawMiniMap(ctx); ctx.restore();
}
function drawAura(c,x,y,e){
  c.save();
  const pulse = 1 + Math.sin(state.pulse*4)*.04;
  c.strokeStyle=e.color; c.globalAlpha=.34; c.lineWidth=3; c.setLineDash([12,9]); c.beginPath(); c.arc(x,y,e.aura*pulse,0,Math.PI*2); c.stroke(); c.setLineDash([]);
  const g=c.createRadialGradient(x,y,10,x,y,e.aura); g.addColorStop(0,e.color+'28'); g.addColorStop(.52,e.color+'12'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,e.aura,0,Math.PI*2); c.fill();
  c.restore();
}
function drawPlayer(c,p,e){
  for(const t of state.player.trail){ c.globalAlpha=Math.max(0,t.life)*.28; drawCharacter(c,t.x,t.y,t.size*.9,e.color,e.accent,state.level,true); }
  c.globalAlpha=1; drawCharacter(c,p.x,p.y,e.size,e.color,e.accent,state.level,false);
  drawNameplate(c,p.x,p.y-e.size-34,`${Math.floor(state.stageProgress)} / ${e.need}`,e.color);
}
function drawCharacter(c,x,y,size,color,accent,level,ghost=false){
  c.save();
  c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x,y+size*1.05,size*1.05,size*.32,0,0,Math.PI*2); c.fill();
  if(level>=3){ c.fillStyle=ghost?color:shade(color,-18); c.globalAlpha=ghost?.18:.68; c.beginPath(); c.moveTo(x-size*.92,y-size*.2); c.quadraticCurveTo(x,y+size*1.9,x+size*.92,y-size*.2); c.closePath(); c.fill(); c.globalAlpha=1; }
  c.strokeStyle=accent; c.lineWidth=Math.max(2,size*.09); c.globalAlpha=ghost?.25:.85; c.beginPath(); c.arc(x,y+size*.18,size*(1.08+level*.08),state.pulse*1.5,state.pulse*1.5+Math.PI*1.45); c.stroke(); c.globalAlpha=1;
  const body=c.createLinearGradient(x-size,y-size,x+size,y+size); body.addColorStop(0,accent); body.addColorStop(.45,color); body.addColorStop(1,shade(color,-36));
  c.fillStyle=body; roundRect(c,x-size*.62,y-size*.16,size*1.24,size*1.33,size*.34); c.fill();
  c.fillStyle=accent; roundRect(c,x-size*.47,y+size*.38,size*.94,size*.22,size*.12); c.fill();
  c.fillStyle=body; c.beginPath(); c.arc(x,y-size*.78,size*.48,0,Math.PI*2); c.fill();
  c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.arc(x-size*.14,y-size*.86,size*.055,0,Math.PI*2); c.arc(x+size*.14,y-size*.86,size*.055,0,Math.PI*2); c.fill();
  if(level>=2) drawCrown(c,x,y-size*1.32,size*.72,level>=4?'#ffd36a':accent);
  c.restore();
}
function drawCrown(c,x,y,s,color){ c.fillStyle=color; c.beginPath(); c.moveTo(x-s*.55,y+s*.35); c.lineTo(x-s*.38,y-s*.2); c.lineTo(x-s*.14,y+s*.14); c.lineTo(x,y-s*.42); c.lineTo(x+s*.14,y+s*.14); c.lineTo(x+s*.38,y-s*.2); c.lineTo(x+s*.55,y+s*.35); c.closePath(); c.fill(); }
function drawCitizen(c,o){
  c.save(); const y=o.y+Math.sin(o.bob)*2;
  c.fillStyle='rgba(0,0,0,.24)'; c.beginPath(); c.ellipse(o.x,y+o.r*1.25,o.r*1.05,o.r*.32,0,0,Math.PI*2); c.fill();
  if(o.tier>1){ c.strokeStyle=o.color; c.globalAlpha=.42; c.lineWidth=2; c.beginPath(); c.arc(o.x,y,o.r*2.05,0,Math.PI*2); c.stroke(); c.globalAlpha=1; }
  const grad=c.createLinearGradient(o.x-o.r,y-o.r,o.x+o.r,y+o.r); grad.addColorStop(0,o.outline); grad.addColorStop(.55,o.color); grad.addColorStop(1,shade(o.color,-34));
  c.fillStyle=grad; roundRect(c,o.x-o.r*.55,y-o.r*.1,o.r*1.1,o.r*1.35,o.r*.32); c.fill();
  c.beginPath(); c.arc(o.x,y-o.r*.75,o.r*.48,0,Math.PI*2); c.fill();
  if(o.tier>1) drawNameplate(c,o.x,y-o.r*2.5,`${o.strength}`,o.color);
  c.restore();
}
function drawFollower(c,o){ drawCharacter(c,o.x,o.y,o.r,o.color,'#bfe6ff',0,true); }
function drawNameplate(c,x,y,text,color){
  c.save(); c.font='800 16px system-ui'; const w=c.measureText(text).width+20; c.fillStyle='rgba(4,10,18,.78)'; roundRect(c,x-w/2,y-17,w,28,14); c.fill(); c.strokeStyle=color; c.lineWidth=2; c.stroke(); c.fillStyle='#ffffff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text,x,y-3); c.restore();
}
function drawParticles(c){
  c.save(); for(const p of state.particles){ c.globalAlpha=Math.max(0,p.life); c.fillStyle=p.color; c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fill(); } c.restore();
}
function drawFloaters(c){
  c.save(); c.textAlign='center'; c.textBaseline='middle'; for(const f of state.floaters){ c.globalAlpha=Math.max(0,f.life); c.font='900 20px system-ui'; c.strokeStyle='rgba(0,0,0,.8)'; c.lineWidth=5; c.strokeText(f.text,f.x,f.y); c.fillStyle=f.color; c.fillText(f.text,f.x,f.y); } c.restore();
}
function drawMiniMap(c){
  const x=1024,y=20,w=150,h=90; c.save(); c.fillStyle='rgba(5,11,20,.72)'; roundRect(c,x,y,w,h,16); c.fill(); c.strokeStyle='rgba(255,255,255,.18)'; c.stroke();
  c.fillStyle='#d7d3c9'; for(let i=0;i<state.citizens.length;i+=5){ const z=state.citizens[i]; c.fillRect(x+z.x/1200*w,y+z.y/720*h,2,2); }
  c.fillStyle=evolutions[state.level].color; c.beginPath(); c.arc(x+state.player.x/1200*w,y+state.player.y/720*h,4,0,Math.PI*2); c.fill(); c.restore();
}
function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath(); }
function shade(hex,amt){
  const n=parseInt(hex.replace('#',''),16); let r=(n>>16)+amt,g=(n>>8&255)+amt,b=(n&255)+amt; r=clamp(r,0,255); g=clamp(g,0,255); b=clamp(b,0,255); return `rgb(${r},${g},${b})`;
}

function loop(now){
  const dt = Math.min(.033,(now-state.last)/1000 || .016); state.last = now;
  update(dt); draw(); requestAnimationFrame(loop);
}

function drawPreview(){
  const w=previewCanvas.width,h=previewCanvas.height; drawMap(pctx,w,h);
  const fakeE=evolutions[3]; drawAura(pctx,w*.5,h*.55,{...fakeE,aura:92});
  for(let i=0;i<44;i++){ const a=i*2.399,r=40+Math.floor(i/10)*25; drawCharacter(pctx,w*.5+Math.cos(a)*r,h*.55+Math.sin(a)*r*.72,7,'#2f80ff','#bfe6ff',0,true); }
  for(let i=0;i<34;i++){ drawCitizen(pctx,{x:rand(30,w-30),y:rand(50,h-35),r:rand(6,9),tier:i%9===0?2:1,strength:i%9===0?18:1,color:i%9===0?'#ffbd56':'#d7d3c9',outline:'#fff7e4',bob:0}); }
  drawCharacter(pctx,w*.5,h*.55,28,fakeE.color,fakeE.accent,3,false); drawNameplate(pctx,w*.5,h*.55-66,'87 / 100',fakeE.color);
}
drawPreview();
