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
const startNotice = document.getElementById('startNotice');

const WORLD = { w: 2600, h: 1800 };
const VIEW = { w: gameCanvas.width, h: gameCanvas.height };

const evolutions = [
  { name:'시민 리더', value:1, need:100, color:'#2f80ff', accent:'#8fc6ff', size:17, aura:70, magnet:0.55, desc:'기본 캐릭터. 작은 흡수 범위를 가지고 시작합니다.' },
  { name:'도시 대장', value:10, need:100, color:'#20d6ff', accent:'#b9fbff', size:23, aura:96, magnet:0.85, desc:'흡수 점수 x10. 더 넓은 범위와 푸른 오라를 얻습니다.' },
  { name:'구역 지배자', value:100, need:100, color:'#8f53ff', accent:'#dbc5ff', size:29, aura:124, magnet:1.1, desc:'흡수 점수 x100. 보라색 에너지 링과 잔상이 생깁니다.' },
  { name:'도시 군주', value:1000, need:100, color:'#e34f64', accent:'#ffc0c8', size:35, aura:156, magnet:1.35, desc:'흡수 점수 x1,000. 망토와 강한 충격파를 가집니다.' },
  { name:'도시의 왕', value:10000, need:100, color:'#ffd36a', accent:'#fff0af', size:42, aura:194, magnet:1.65, desc:'흡수 점수 x10,000. 황금 왕관과 넓은 지배 범위를 얻습니다.' },
  { name:'도시의 황제', value:100000, need:100, color:'#fff2ad', accent:'#ffffff', size:50, aura:238, magnet:2.15, desc:'흡수 점수 x100,000. 강력한 자동 흡수 범위를 지닙니다.' }
];

const state = {
  running:false, finished:false, timeLeft:180, score:0, level:0, stageProgress:1,
  player:{x:1320,y:920,vx:0,vy:0,trail:[]}, camera:{x:0,y:0},
  followers:[], citizens:[], enemies:[], particles:[], floaters:[], keys:{}, pointer:null, last:0,
  shake:0, pulse:0, dangerFlash:0, loopStarted:false
};

const buildings = [
  {x:135,y:115,w:190,h:150,roof:'#5a2b1c',wall:'#9a7346',name:'hut'}, {x:420,y:90,w:240,h:170,roof:'#6d3b1e',wall:'#b0814d'},
  {x:840,y:135,w:180,h:135,roof:'#5f351f',wall:'#936b40'}, {x:1220,y:75,w:270,h:195,roof:'#58311f',wall:'#a47744'},
  {x:1720,y:150,w:255,h:175,roof:'#4f2e1f',wall:'#967347'}, {x:2200,y:105,w:250,h:190,roof:'#66381e',wall:'#b8894d'},
  {x:90,y:570,w:230,h:180,roof:'#52311e',wall:'#936b40'}, {x:490,y:610,w:195,h:150,roof:'#673a21',wall:'#a27441'},
  {x:760,y:520,w:290,h:200,roof:'#6b3d21',wall:'#b98a50'}, {x:1455,y:525,w:250,h:185,roof:'#53301d',wall:'#a87b49'},
  {x:1970,y:575,w:280,h:200,roof:'#6d3b1e',wall:'#a77b49'}, {x:2320,y:720,w:210,h:160,roof:'#5d321e',wall:'#a47744'},
  {x:185,y:1030,w:270,h:205,roof:'#6a3920',wall:'#9d7449'}, {x:650,y:1090,w:250,h:190,roof:'#53301d',wall:'#a87b49'},
  {x:1130,y:1075,w:300,h:220,roof:'#5a2b1c',wall:'#b0814d'}, {x:1660,y:1015,w:235,h:170,roof:'#52311e',wall:'#936b40'},
  {x:2110,y:1130,w:290,h:210,roof:'#66381e',wall:'#b8894d'}, {x:365,y:1500,w:245,h:185,roof:'#5d321e',wall:'#a47744'},
  {x:890,y:1510,w:320,h:205,roof:'#6a3920',wall:'#9d7449'}, {x:1515,y:1480,w:290,h:215,roof:'#4f2e1f',wall:'#967347'},
  {x:2150,y:1515,w:300,h:205,roof:'#6b3d21',wall:'#b98a50'}
].map(b => ({...b, block:{x:b.x+10,y:b.y+b.h*.34,w:b.w-20,h:b.h*.58}}));

const decoTrees = Array.from({length:120}, () => ({x:rand(30,WORLD.w-30), y:rand(60,WORLD.h-40), s:rand(.75,1.3)}));
const props = [
  {type:'well',x:330,y:395},{type:'market',x:1120,y:430},{type:'market',x:1880,y:890},{type:'well',x:930,y:1360},{type:'tower',x:520,y:360},{type:'tower',x:2040,y:365}
];

function showView(id){
  views.forEach(v => v.classList.toggle('active', v.id === id));
  document.body.classList.toggle('playing-mode', id === 'game');
  if(id === 'game'){
    startGame(true);
    requestAnimationFrame(() => document.getElementById('game').scrollIntoView({block:'start'}));
  } else {
    window.scrollTo({top:0, behavior:'smooth'});
  }
  if(id === 'home') drawPreview();
}
navButtons.forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
startGameBtn.addEventListener('click', () => showView('game'));
restartBtn.addEventListener('click', () => startGame(true));

function initEvolutionCards(){
  evoGrid.innerHTML = evolutions.map((e, i) => `
    <article class="evo-card">
      <div class="avatar" style="color:${e.color}"><div class="avatar-figure">${i >= 3 ? '<div class="avatar-cape"></div>' : ''}${i >= 2 ? '<div class="avatar-crown"></div>' : ''}<div class="avatar-head"></div><div class="avatar-body"></div></div></div>
      <h3>${i+1}단계 ${e.name}</h3><p>${e.desc}</p><span class="boost">흡수 점수 x${e.value.toLocaleString()}</span>
    </article>`).join('');
}
initEvolutionCards();

function rand(min,max){ return min + Math.random()*(max-min); }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function circleRectCollide(x,y,r,rect){
  const nx = clamp(x, rect.x, rect.x + rect.w), ny = clamp(y, rect.y, rect.y + rect.h);
  return Math.hypot(x-nx, y-ny) < r;
}
function isBlocked(x,y,r=14){ return buildings.some(b => circleRectCollide(x,y,r,b.block)); }
function safePoint(){
  for(let i=0;i<400;i++){ const x=rand(60,WORLD.w-60), y=rand(80,WORLD.h-70); if(!isBlocked(x,y,24)) return {x,y}; }
  return {x:1320,y:920};
}
function makeCitizen(strong=false){
  const p=safePoint(); const tier = strong ? (Math.random() < .25 ? 3 : 2) : 1;
  const r = tier === 1 ? rand(8,11) : tier === 2 ? rand(13,16) : rand(17,21);
  const strength = tier === 1 ? 1 : tier === 2 ? 18 : 45;
  return { x:p.x, y:p.y, vx:rand(-45,45), vy:rand(-45,45), r, tier, strength, value:strength, absorbed:false, wander:rand(.4,2.4), bob:rand(0,10),
    color:tier===1?'#d7d3c9':tier===2?'#ffbd56':'#ff5d72', outline:tier===1?'#fff7e4':tier===2?'#ffe3a1':'#ffd5dc' };
}
function seedCitizens(){ return Array.from({length:260},()=>makeCitizen(false)).concat(Array.from({length:45},()=>makeCitizen(true))); }
function makeEnemy(i){
  const p=safePoint();
  const colors=['#ff4f6d','#ff8a35','#43d17a','#b86cff','#f2d14b','#23c9ff','#ff5db8','#9ec43f','#ff7043','#7f8cff','#00b894','#e17055'];
  return { id:i, x:p.x, y:p.y, vx:0, vy:0, level:0, progress:rand(8,34), score:0, r:18, color:colors[i%colors.length], accent:'#fff4dd', target:null, think:0, name:`적 세력 ${i+1}`, absorbed:false, trail:[] };
}
function seedEnemies(){
  const area = WORLD.w * WORLD.h;
  const count = Math.max(8, Math.min(14, Math.round(area / 360000)));
  return Array.from({length:count},(_,i)=>makeEnemy(i));
}
function startGame(force=false){
  state.running=true; state.finished=false; state.timeLeft=180; state.score=0; state.level=0; state.stageProgress=1;
  state.player.x=1320; state.player.y=920; state.player.vx=0; state.player.vy=0; state.player.trail=[];
  state.followers=[]; state.citizens=seedCitizens(); state.enemies=seedEnemies(); state.particles=[]; state.floaters=[]; state.shake=0; state.pulse=0; state.dangerFlash=0; state.pointer=null;
  banner.classList.add('hidden'); showStartNotice(); updateCamera(); updateHud();
  if(force || !state.loopStarted){ state.loopStarted=true; state.last=performance.now(); requestAnimationFrame(loop); }
}
function showStartNotice(){ startNotice.classList.remove('hidden'); setTimeout(()=>startNotice.classList.add('hidden'),1300); }

window.addEventListener('keydown', e => state.keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => state.keys[e.key.toLowerCase()] = false);
function pointerPos(e){ const rect=gameCanvas.getBoundingClientRect(); const sx=(e.clientX-rect.left)*VIEW.w/rect.width; const sy=(e.clientY-rect.top)*VIEW.h/rect.height; return {x:sx+state.camera.x, y:sy+state.camera.y}; }
gameCanvas.addEventListener('pointerdown', e => { state.pointer = pointerPos(e); gameCanvas.setPointerCapture(e.pointerId); });
gameCanvas.addEventListener('pointermove', e => { if(state.pointer) state.pointer = pointerPos(e); });
gameCanvas.addEventListener('pointerup', () => state.pointer = null);
gameCanvas.addEventListener('pointercancel', () => state.pointer = null);

function input(dt){
  let ax=0, ay=0;
  if(state.keys['arrowleft'] || state.keys['a']) ax -= 1; if(state.keys['arrowright'] || state.keys['d']) ax += 1;
  if(state.keys['arrowup'] || state.keys['w']) ay -= 1; if(state.keys['arrowdown'] || state.keys['s']) ay += 1;
  if(state.pointer){ ax += (state.pointer.x-state.player.x)/230; ay += (state.pointer.y-state.player.y)/230; }
  const mag=Math.hypot(ax,ay), speed=150+state.level*12;
  if(mag>.05){ state.player.vx=(ax/mag)*speed; state.player.vy=(ay/mag)*speed; } else { state.player.vx*=.72; state.player.vy*=.72; }
  moveWithCollision(state.player,state.player.vx*dt,state.player.vy*dt,evolutions[state.level].size*.72);
  state.player.trail.push({x:state.player.x,y:state.player.y,life:.35,size:evolutions[state.level].size});
  if(state.player.trail.length>26) state.player.trail.shift();
}
function moveWithCollision(o,dx,dy,r){
  let nx=clamp(o.x+dx,35,WORLD.w-35); if(!isBlocked(nx,o.y,r)) o.x=nx; else o.vx*= -0.12;
  let ny=clamp(o.y+dy,45,WORLD.h-35); if(!isBlocked(o.x,ny,r)) o.y=ny; else o.vy*= -0.12;
}
function updateCamera(){
  const targetX=clamp(state.player.x - VIEW.w/2, 0, WORLD.w - VIEW.w);
  const targetY=clamp(state.player.y - VIEW.h/2, 0, WORLD.h - VIEW.h);
  state.camera.x += (targetX - state.camera.x) * .12;
  state.camera.y += (targetY - state.camera.y) * .12;
}
function update(dt){
  if(!state.running || state.finished) return;
  state.timeLeft -= dt; if(state.timeLeft<=0){ finishGame(); return; }
  state.pulse += dt; input(dt); updateCamera(); const e=evolutions[state.level];
  for(const c of state.citizens){
    c.wander -= dt; c.bob += dt*6; if(c.wander<=0){ c.vx=rand(-50,50); c.vy=rand(-50,50); c.wander=rand(.7,2.6); }
    const d=Math.hypot(c.x-state.player.x,c.y-state.player.y);
    if(d < e.aura){ const pull=e.magnet*(1-d/e.aura)*3.2; c.vx += (state.player.x-c.x)*dt*pull; c.vy += (state.player.y-c.y)*dt*pull; }
    moveWithCollision(c,c.vx*dt,c.vy*dt,c.r*.9);
    c.vx*=.996; c.vy*=.996;
    if(d < e.size + c.r + 10) tryAbsorb(c);
  }
  state.citizens = state.citizens.filter(c => !c.absorbed);
  updateEnemies(dt);
  state.enemies = state.enemies.filter(e => !e.absorbed);
  while(state.citizens.length < 305) state.citizens.push(makeCitizen(Math.random()<.16));
  updateFollowers(dt); updateParticles(dt); state.shake=Math.max(0,state.shake-dt*16); state.dangerFlash=Math.max(0,state.dangerFlash-dt*2.8); updateHud();
}
function tryAbsorb(c){
  const power=currentPower();
  if(c.tier>1 && power<c.strength){
    state.score=Math.max(0,state.score-Math.ceil(c.strength*evolutions[state.level].value)); state.dangerFlash=1; state.shake=8;
    addFloater(state.player.x,state.player.y-45,`강함 ${c.strength}`,'#ff6377'); burst(c.x,c.y,'#ff6377',18,true);
    c.vx=(c.x-state.player.x)*2.4; c.vy=(c.y-state.player.y)*2.4; return;
  }
  absorb(c);
}
function currentPower(){ return state.stageProgress + state.level*28; }
function absorb(c){
  c.absorbed=true; const e=evolutions[state.level]; const gain=e.value*c.value; state.score+=gain; state.stageProgress+=c.value;
  const followerCount=clamp(c.tier===1?1:Math.ceil(c.value/5),1,10);
  for(let i=0;i<followerCount;i++) state.followers.push({x:c.x+rand(-8,8),y:c.y+rand(-8,8),r:c.tier===1?7:9,color:e.color,life:1});
  addFloater(c.x,c.y-24,`+${gain.toLocaleString()}`,c.tier===1?e.accent:'#ffd36a'); burst(c.x,c.y,c.tier===1?e.color:'#ffd36a',c.tier===1?10:30,c.tier>1);
  if(state.stageProgress>=e.need && state.level<evolutions.length-1) evolve();
}
function evolve(){
  state.level++; const e=evolutions[state.level]; state.stageProgress=1; state.followers=[]; state.shake=16;
  burst(state.player.x,state.player.y,e.color,120,true); addFloater(state.player.x,state.player.y-70,'진화 완료',e.accent);
  bannerLevel.textContent=e.name; bannerBoost.textContent=`흡수 점수 x${e.value.toLocaleString()}  흡수 범위 확대`; banner.classList.remove('hidden'); setTimeout(()=>banner.classList.add('hidden'),1500);
}

function enemyPower(enemy){ return enemy.progress + enemy.level*35; }
function playerPower(){ return state.stageProgress + state.level*35; }
function updateEnemies(dt){
  for(const enemy of state.enemies){
    if(enemy.absorbed) continue;
    enemy.think -= dt;
    const myPower = enemyPower(enemy);
    let target = enemy.target;
    if(enemy.think <= 0 || !target || target.absorbed){
      target = chooseEnemyTarget(enemy, myPower);
      enemy.target = target;
      enemy.think = rand(.25,.75);
    }
    let ax=0, ay=0;
    if(target){
      const tx=target.x, ty=target.y;
      const d=Math.hypot(tx-enemy.x, ty-enemy.y) || 1;
      const targetPower = target.kind === 'player' ? playerPower() : target.kind === 'enemy' ? enemyPower(target.ref) : target.ref.strength;
      const hunt = myPower >= targetPower || target.kind === 'citizen';
      const dir = hunt ? 1 : -1;
      ax += ((tx-enemy.x)/d) * dir;
      ay += ((ty-enemy.y)/d) * dir;
    } else {
      ax += rand(-1,1); ay += rand(-1,1);
    }
    const mag=Math.hypot(ax,ay) || 1;
    const speed = 105 + enemy.level*10 + Math.min(35, enemy.progress*.12);
    enemy.vx = enemy.vx*.82 + (ax/mag)*speed*.18;
    enemy.vy = enemy.vy*.82 + (ay/mag)*speed*.18;
    moveWithCollision(enemy, enemy.vx*dt, enemy.vy*dt, 17 + enemy.level*3);
    enemy.trail.push({x:enemy.x,y:enemy.y,life:.25,size:18+enemy.level*4});
    if(enemy.trail.length>14) enemy.trail.shift();

    for(const c of state.citizens){
      if(c.absorbed) continue;
      const d=Math.hypot(c.x-enemy.x,c.y-enemy.y);
      if(d < 78 + enemy.level*18){
        const pull=(1-d/(78+enemy.level*18))*2.1;
        c.vx += (enemy.x-c.x)*dt*pull;
        c.vy += (enemy.y-c.y)*dt*pull;
      }
      if(d < 25 + c.r){ enemyAbsorbCitizen(enemy,c); }
    }

    for(const other of state.enemies){
      if(other===enemy || other.absorbed) continue;
      const d=Math.hypot(other.x-enemy.x, other.y-enemy.y);
      if(d < 34 + enemy.level*4 + other.level*4){
        if(enemyPower(enemy) >= enemyPower(other)*1.08) enemyAbsorbEnemy(enemy, other);
      }
    }

    const pd=Math.hypot(state.player.x-enemy.x,state.player.y-enemy.y);
    if(pd < evolutions[state.level].size + 26 + enemy.level*5){
      if(playerPower() >= enemyPower(enemy)*1.05){
        absorbEnemyByPlayer(enemy);
      } else {
        hitPlayerByEnemy(enemy);
      }
    }
  }
}
function chooseEnemyTarget(enemy, myPower){
  let best=null, bestScore=Infinity;
  for(const c of state.citizens){
    if(c.absorbed) continue;
    const d=Math.hypot(c.x-enemy.x,c.y-enemy.y);
    const score=d/(c.value||1);
    if(score<bestScore){ bestScore=score; best={kind:'citizen',ref:c,x:c.x,y:c.y}; }
  }
  for(const other of state.enemies){
    if(other===enemy || other.absorbed) continue;
    const d=Math.hypot(other.x-enemy.x,other.y-enemy.y);
    if(enemyPower(other)<myPower*.92 && d/4<bestScore){ bestScore=d/4; best={kind:'enemy',ref:other,x:other.x,y:other.y}; }
  }
  const pd=Math.hypot(state.player.x-enemy.x,state.player.y-enemy.y);
  if(playerPower()<myPower*.9 && pd/5<bestScore) best={kind:'player',ref:state.player,x:state.player.x,y:state.player.y};
  return best;
}
function enemyAbsorbCitizen(enemy,c){
  c.absorbed=true;
  enemy.progress += c.value;
  enemy.score += c.value * evolutions[enemy.level].value;
  burst(c.x,c.y,enemy.color,c.tier>1?22:8,c.tier>1);
  if(enemy.progress >= evolutions[enemy.level].need && enemy.level < evolutions.length-1){
    enemy.level++; enemy.progress=1; enemy.r = 18 + enemy.level*4; burst(enemy.x,enemy.y,enemy.color,70,true); addFloater(enemy.x,enemy.y-55,'적 진화',enemy.color);
  }
}
function enemyAbsorbEnemy(enemy,other){
  other.absorbed=true;
  enemy.progress += Math.max(8, Math.floor(enemyPower(other)/2));
  enemy.score += other.score;
  burst(other.x,other.y,enemy.color,80,true); addFloater(other.x,other.y-50,'세력 흡수',enemy.color);
}
function absorbEnemyByPlayer(enemy){
  enemy.absorbed=true;
  const e=evolutions[state.level];
  const gain=Math.max(20, Math.floor(enemyPower(enemy)/2));
  state.stageProgress += gain;
  state.score += gain * e.value;
  burst(enemy.x,enemy.y,e.color,100,true); addFloater(enemy.x,enemy.y-60,`적 격파 +${gain}`,e.accent);
  if(state.stageProgress>=e.need && state.level<evolutions.length-1) evolve();
}
function hitPlayerByEnemy(enemy){
  const e=evolutions[state.level];
  const loss=Math.min(Math.max(6, Math.floor(enemyPower(enemy)/6)), Math.max(1, Math.floor(state.stageProgress-1)));
  state.stageProgress=Math.max(1,state.stageProgress-loss);
  state.score=Math.max(0,state.score-loss*e.value);
  state.dangerFlash=1; state.shake=11;
  const d=Math.hypot(state.player.x-enemy.x,state.player.y-enemy.y)||1;
  state.player.x=clamp(state.player.x+(state.player.x-enemy.x)/d*45,35,WORLD.w-35);
  state.player.y=clamp(state.player.y+(state.player.y-enemy.y)/d*45,45,WORLD.h-35);
  addFloater(state.player.x,state.player.y-56,`-${loss}`, '#ff6377'); burst(state.player.x,state.player.y,'#ff6377',32,true);
}

function updateFollowers(dt){
  state.followers=state.followers.slice(-120);
  state.followers.forEach((f,i)=>{ const angle=i*2.399+state.pulse*.25, ring=48+Math.floor(i/12)*26; const tx=state.player.x+Math.cos(angle)*ring, ty=state.player.y+Math.sin(angle)*ring*.72; f.x+=(tx-f.x)*Math.min(1,dt*5.2); f.y+=(ty-f.y)*Math.min(1,dt*5.2); });
}
function addFloater(x,y,text,color){ state.floaters.push({x,y,text,color,life:.9,vy:-34}); }
function burst(x,y,color,count=16,big=false){ for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2,s=(big?95:45)+Math.random()*(big?240:80); state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:big?3+Math.random()*7:2+Math.random()*3,grow:big?24:8,life:big?.85+Math.random()*.45:.35+Math.random()*.35,color}); } }
function updateParticles(dt){ state.particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.grow*dt;p.vx*=.985;p.vy*=.985;}); state.particles=state.particles.filter(p=>p.life>0); state.floaters.forEach(f=>{f.life-=dt;f.y+=f.vy*dt;}); state.floaters=state.floaters.filter(f=>f.life>0); state.player.trail.forEach(t=>t.life-=dt); state.player.trail=state.player.trail.filter(t=>t.life>0); }
function finishGame(){
  state.finished=true; state.running=false; const wrap=document.querySelector('.canvas-wrap'); const old=wrap.querySelector('.finish-card-wrap'); if(old) old.remove();
  const card=document.createElement('div'); card.className='evolution-banner finish-card-wrap'; card.innerHTML=`<div class="finish-card"><h2>결과</h2><p>최종 단계: ${evolutions[state.level].name}</p><p>최종 점수: ${state.score.toLocaleString()}</p><button class="primary-btn" id="againBtn">처음부터 다시</button></div>`; wrap.appendChild(card); document.getElementById('againBtn').addEventListener('click',()=>{card.remove();startGame(true);});
}
function updateHud(){ const e=evolutions[state.level]; crowdCountEl.textContent=`${Math.floor(state.stageProgress)} / ${e.need}`; scoreEl.textContent=state.score.toLocaleString(); levelNameEl.textContent=e.name; const t=Math.max(0,Math.floor(state.timeLeft)); timerEl.textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`; }

function draw(){
  const sx=state.shake?rand(-state.shake,state.shake):0, sy=state.shake?rand(-state.shake,state.shake):0; ctx.clearRect(0,0,VIEW.w,VIEW.h); ctx.save(); ctx.translate(sx,sy); ctx.translate(-state.camera.x,-state.camera.y);
  drawWorld(ctx); if(state.dangerFlash>0){ ctx.save(); ctx.translate(state.camera.x,state.camera.y); ctx.fillStyle=`rgba(255,40,70,${state.dangerFlash*.12})`; ctx.fillRect(-20,-20,VIEW.w+40,VIEW.h+40); ctx.restore(); }
  drawAura(ctx,state.player.x,state.player.y,evolutions[state.level]);
  const drawItems=[...state.citizens.map(o=>({type:'citizen',o,y:o.y})),...state.followers.map(o=>({type:'follower',o,y:o.y})),...state.enemies.map(o=>({type:'enemy',o,y:o.y})),...buildings.map(o=>({type:'building',o,y:o.y+o.h})),...props.map(o=>({type:'prop',o,y:o.y+80})),{type:'player',o:state.player,y:state.player.y}].sort((a,b)=>a.y-b.y);
  for(const item of drawItems){ if(item.type==='building') drawBuilding(ctx,item.o); if(item.type==='prop') drawProp(ctx,item.o); if(item.type==='citizen') drawCitizen(ctx,item.o); if(item.type==='follower') drawFollower(ctx,item.o); if(item.type==='enemy') drawEnemy(ctx,item.o); if(item.type==='player') drawPlayer(ctx,item.o,evolutions[state.level]); }
  drawParticles(ctx); drawFloaters(ctx); ctx.restore(); drawMiniMap(ctx);
}
function drawWorld(c){
  const g=c.createLinearGradient(0,0,WORLD.w,WORLD.h); g.addColorStop(0,'#4f7a58'); g.addColorStop(.48,'#c69b5f'); g.addColorStop(1,'#4e3828'); c.fillStyle=g; c.fillRect(0,0,WORLD.w,WORLD.h); drawRoads(c); drawGridTexture(c);
  for(const t of decoTrees) if(inView(t.x,t.y,80)) drawTree(c,t.x,t.y,t.s); vignette(c);
}
function inView(x,y,pad=150){ return x>state.camera.x-pad && x<state.camera.x+VIEW.w+pad && y>state.camera.y-pad && y<state.camera.y+VIEW.h+pad; }
function drawRoads(c){ c.save(); c.globalAlpha=.95; c.strokeStyle='rgba(92,66,42,.72)'; c.lineWidth=70; c.lineCap='round'; c.lineJoin='round'; c.beginPath(); c.moveTo(-100,860); c.bezierCurveTo(480,700,980,1050,1580,820); c.bezierCurveTo(1960,670,2220,780,WORLD.w+120,610); c.stroke(); c.beginPath(); c.moveTo(1180,-80); c.bezierCurveTo(960,480,1340,830,1120,WORLD.h+90); c.stroke(); c.beginPath(); c.moveTo(210,1500); c.bezierCurveTo(790,1280,1420,1500,2100,1300); c.stroke(); c.strokeStyle='rgba(255,235,178,.14)'; c.lineWidth=5; c.setLineDash([36,28]); c.beginPath(); c.moveTo(-100,860); c.bezierCurveTo(480,700,980,1050,1580,820); c.bezierCurveTo(1960,670,2220,780,WORLD.w+120,610); c.stroke(); c.setLineDash([]); c.restore(); }
function drawGridTexture(c){ c.save(); c.globalAlpha=.06; c.strokeStyle='#fff'; for(let x=0;x<WORLD.w;x+=90){ c.beginPath(); c.moveTo(x,0); c.lineTo(x-520,WORLD.h); c.stroke(); } c.restore(); }
function drawBuilding(c,b){ if(!inView(b.x+b.w/2,b.y+b.h/2,260)) return; c.save(); const x=b.x,y=b.y,w=b.w,h=b.h; c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x+w*.55,y+h*.98,w*.62,h*.19,0,0,Math.PI*2); c.fill(); const wall=c.createLinearGradient(x,y,x+w,y+h); wall.addColorStop(0,b.wall); wall.addColorStop(1,'#65462d'); c.fillStyle=wall; roundRect(c,x,y+h*.32,w,h*.66,10); c.fill(); c.fillStyle=shade(b.wall,-18); c.beginPath(); c.moveTo(x+w,y+h*.32); c.lineTo(x+w+32,y+h*.20); c.lineTo(x+w+32,y+h*.84); c.lineTo(x+w,y+h*.98); c.closePath(); c.fill(); c.fillStyle=b.roof; c.beginPath(); c.moveTo(x-22,y+h*.34); c.lineTo(x+w*.5,y-34); c.lineTo(x+w+28,y+h*.34); c.closePath(); c.fill(); c.fillStyle=shade(b.roof,-25); c.beginPath(); c.moveTo(x+w*.5,y-34); c.lineTo(x+w+28,y+h*.34); c.lineTo(x+w+34,y+h*.18); c.closePath(); c.fill(); c.fillStyle='rgba(255,220,126,.82)'; for(let i=.18;i<.8;i+=.22){ roundRect(c,x+w*i,y+h*.55,w*.12,h*.16,4); c.fill(); } c.restore(); }
function drawProp(c,o){ if(!inView(o.x,o.y,160)) return; if(o.type==='well') drawWell(c,o.x,o.y,1.25); if(o.type==='market') drawMarket(c,o.x,o.y,1.15); if(o.type==='tower') drawTower(c,o.x,o.y,1); }
function drawTree(c,x,y,s=1){ c.save(); c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x+8*s,y+32*s,25*s,9*s,0,0,Math.PI*2); c.fill(); c.fillStyle='#5b3a21'; roundRect(c,x-5*s,y+7*s,10*s,30*s,4*s); c.fill(); c.fillStyle='#3b6f42'; c.beginPath(); c.arc(x,y,22*s,0,Math.PI*2); c.fill(); c.fillStyle='#27442b'; c.beginPath(); c.arc(x+13*s,y+8*s,16*s,0,Math.PI*2); c.fill(); c.restore(); }
function drawWell(c,x,y,s=1){ c.save(); c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x,y+31*s,58*s,22*s,0,0,Math.PI*2); c.fill(); c.fillStyle='#807968'; roundRect(c,x-45*s,y-10*s,90*s,40*s,8*s); c.fill(); c.fillStyle='#26384b'; c.beginPath(); c.ellipse(x,y+7*s,33*s,13*s,0,0,Math.PI*2); c.fill(); c.restore(); }
function drawMarket(c,x,y,s=1){ c.save(); c.translate(x,y); c.scale(s,s); c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,70,92,24,0,0,Math.PI*2); c.fill(); c.fillStyle='#d9513d'; c.fillRect(-75,0,150,42); c.fillStyle='#ffd36a'; for(let i=-70;i<75;i+=30)c.fillRect(i,0,15,42); c.fillStyle='#7b4c29'; c.fillRect(-66,42,12,54); c.fillRect(54,42,12,54); c.restore(); }
function drawTower(c,x,y,s=1){ c.save(); c.translate(x,y); c.scale(s,s); c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,100,58,18,0,0,Math.PI*2); c.fill(); c.fillStyle='#8f7757'; roundRect(c,-28,10,56,95,9); c.fill(); c.fillStyle='#51301f'; c.beginPath(); c.moveTo(-40,18); c.lineTo(0,-28); c.lineTo(40,18); c.closePath(); c.fill(); c.restore(); }
function vignette(c){ const g=c.createRadialGradient(state.camera.x+VIEW.w/2,state.camera.y+VIEW.h/2,80,state.camera.x+VIEW.w/2,state.camera.y+VIEW.h/2,Math.max(VIEW.w,VIEW.h)*.78); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(0,0,0,.32)'); c.fillStyle=g; c.fillRect(state.camera.x,state.camera.y,VIEW.w,VIEW.h); }
function drawAura(c,x,y,e){ c.save(); const pulse=1+Math.sin(state.pulse*4)*.04; c.strokeStyle=e.color; c.globalAlpha=.34; c.lineWidth=3; c.setLineDash([12,9]); c.beginPath(); c.arc(x,y,e.aura*pulse,0,Math.PI*2); c.stroke(); c.setLineDash([]); const g=c.createRadialGradient(x,y,10,x,y,e.aura); g.addColorStop(0,e.color+'28'); g.addColorStop(.52,e.color+'12'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,e.aura,0,Math.PI*2); c.fill(); c.restore(); }
function drawPlayer(c,p,e){ for(const t of state.player.trail){ c.globalAlpha=Math.max(0,t.life)*.28; drawCharacter(c,t.x,t.y,t.size*.9,e.color,e.accent,state.level,true); } c.globalAlpha=1; drawCharacter(c,p.x,p.y,e.size,e.color,e.accent,state.level,false); drawNameplate(c,p.x,p.y-e.size-38,`${Math.floor(state.stageProgress)} / ${e.need}`,e.color); }
function drawCharacter(c,x,y,size,color,accent,level,ghost=false){ c.save(); c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x,y+size*1.05,size*1.05,size*.32,0,0,Math.PI*2); c.fill(); if(level>=3){ c.fillStyle=ghost?color:shade(color,-18); c.globalAlpha=ghost?.18:.68; c.beginPath(); c.moveTo(x-size*.92,y-size*.2); c.quadraticCurveTo(x,y+size*1.9,x+size*.92,y-size*.2); c.closePath(); c.fill(); c.globalAlpha=1; } c.strokeStyle=accent; c.lineWidth=Math.max(2,size*.09); c.globalAlpha=ghost?.25:.85; c.beginPath(); c.arc(x,y+size*.18,size*(1.08+level*.08),state.pulse*1.5,state.pulse*1.5+Math.PI*1.45); c.stroke(); c.globalAlpha=1; const body=c.createLinearGradient(x-size,y-size,x+size,y+size); body.addColorStop(0,accent); body.addColorStop(.45,color); body.addColorStop(1,shade(color,-36)); c.fillStyle=body; roundRect(c,x-size*.62,y-size*.16,size*1.24,size*1.33,size*.34); c.fill(); c.fillStyle=accent; roundRect(c,x-size*.47,y+size*.38,size*.94,size*.22,size*.12); c.fill(); c.fillStyle=body; c.beginPath(); c.arc(x,y-size*.78,size*.48,0,Math.PI*2); c.fill(); c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.arc(x-size*.14,y-size*.86,size*.055,0,Math.PI*2); c.arc(x+size*.14,y-size*.86,size*.055,0,Math.PI*2); c.fill(); if(level>=2) drawCrown(c,x,y-size*1.32,size*.72,level>=4?'#ffd36a':accent); c.restore(); }
function drawCrown(c,x,y,s,color){ c.fillStyle=color; c.beginPath(); c.moveTo(x-s*.55,y+s*.35); c.lineTo(x-s*.38,y-s*.2); c.lineTo(x-s*.14,y+s*.14); c.lineTo(x,y-s*.42); c.lineTo(x+s*.14,y+s*.14); c.lineTo(x+s*.38,y-s*.2); c.lineTo(x+s*.55,y+s*.35); c.closePath(); c.fill(); }
function drawCitizen(c,o){ if(!inView(o.x,o.y,120)) return; c.save(); const y=o.y+Math.sin(o.bob)*2; c.fillStyle='rgba(0,0,0,.24)'; c.beginPath(); c.ellipse(o.x,y+o.r*1.25,o.r*1.05,o.r*.32,0,0,Math.PI*2); c.fill(); if(o.tier>1){ c.strokeStyle=o.color; c.globalAlpha=.42; c.lineWidth=2; c.beginPath(); c.arc(o.x,y,o.r*2.05,0,Math.PI*2); c.stroke(); c.globalAlpha=1; } const grad=c.createLinearGradient(o.x-o.r,y-o.r,o.x+o.r,y+o.r); grad.addColorStop(0,o.outline); grad.addColorStop(.55,o.color); grad.addColorStop(1,shade(o.color,-34)); c.fillStyle=grad; roundRect(c,o.x-o.r*.55,y-o.r*.1,o.r*1.1,o.r*1.35,o.r*.32); c.fill(); c.beginPath(); c.arc(o.x,y-o.r*.75,o.r*.48,0,Math.PI*2); c.fill(); if(o.tier>1) drawNameplate(c,o.x,y-o.r*2.5,`${o.strength}`,o.color); c.restore(); }

function drawEnemy(c,o){
  if(!inView(o.x,o.y,170)) return;
  const e=evolutions[o.level];
  c.save();
  for(const t of o.trail){ c.globalAlpha=Math.max(0,t.life)*.18; drawCharacter(c,t.x,t.y,t.size*.82,o.color,o.accent,o.level,true); }
  c.globalAlpha=1;
  c.strokeStyle=o.color; c.globalAlpha=.25; c.lineWidth=3; c.setLineDash([8,8]);
  c.beginPath(); c.arc(o.x,o.y,78+o.level*18,0,Math.PI*2); c.stroke(); c.setLineDash([]); c.globalAlpha=1;
  drawCharacter(c,o.x,o.y,18+o.level*4,o.color,o.accent,o.level,false);
  drawNameplate(c,o.x,o.y-(44+o.level*5),`적 ${Math.floor(o.progress)}`,o.color);
  c.restore();
}

function drawFollower(c,o){ drawCharacter(c,o.x,o.y,o.r,o.color,'#bfe6ff',0,true); }
function drawNameplate(c,x,y,text,color){ c.save(); c.font='800 16px system-ui'; const w=c.measureText(text).width+20; c.fillStyle='rgba(4,10,18,.78)'; roundRect(c,x-w/2,y-17,w,28,14); c.fill(); c.strokeStyle=color; c.lineWidth=2; c.stroke(); c.fillStyle='#ffffff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text,x,y-3); c.restore(); }
function drawParticles(c){ c.save(); for(const p of state.particles){ if(!inView(p.x,p.y,80)) continue; c.globalAlpha=Math.max(0,p.life); c.fillStyle=p.color; c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fill(); } c.restore(); }
function drawFloaters(c){ c.save(); c.textAlign='center'; c.textBaseline='middle'; for(const f of state.floaters){ if(!inView(f.x,f.y,80)) continue; c.globalAlpha=Math.max(0,f.life); c.font='900 20px system-ui'; c.strokeStyle='rgba(0,0,0,.8)'; c.lineWidth=5; c.strokeText(f.text,f.x,f.y); c.fillStyle=f.color; c.fillText(f.text,f.x,f.y); } c.restore(); }
function drawMiniMap(c){ const x=1012,y=18,w=170,h=118; c.save(); c.fillStyle='rgba(5,11,20,.76)'; roundRect(c,x,y,w,h,16); c.fill(); c.strokeStyle='rgba(255,255,255,.18)'; c.stroke(); c.fillStyle='rgba(255,255,255,.14)'; for(const b of buildings){ c.fillRect(x+b.x/WORLD.w*w,y+b.y/WORLD.h*h,Math.max(2,b.w/WORLD.w*w),Math.max(2,b.h/WORLD.h*h)); } c.fillStyle='#d7d3c9'; for(let i=0;i<state.citizens.length;i+=6){ const z=state.citizens[i]; c.fillRect(x+z.x/WORLD.w*w,y+z.y/WORLD.h*h,2,2); } c.strokeStyle='#fff'; c.strokeRect(x+state.camera.x/WORLD.w*w,y+state.camera.y/WORLD.h*h,VIEW.w/WORLD.w*w,VIEW.h/WORLD.h*h); c.fillStyle='#ff6377'; for(const en of state.enemies){ c.beginPath(); c.arc(x+en.x/WORLD.w*w,y+en.y/WORLD.h*h,3,0,Math.PI*2); c.fill(); } c.fillStyle=evolutions[state.level].color; c.beginPath(); c.arc(x+state.player.x/WORLD.w*w,y+state.player.y/WORLD.h*h,4,0,Math.PI*2); c.fill(); c.restore(); }
function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath(); }
function shade(hex,amt){ const n=parseInt(hex.replace('#',''),16); let r=(n>>16)+amt,g=(n>>8&255)+amt,b=(n&255)+amt; r=clamp(r,0,255); g=clamp(g,0,255); b=clamp(b,0,255); return `rgb(${r},${g},${b})`; }
function loop(now){ const dt=Math.min(.033,(now-state.last)/1000 || .016); state.last=now; update(dt); draw(); requestAnimationFrame(loop); }
function drawPreview(){ const w=previewCanvas.width,h=previewCanvas.height; const oldCam={...state.camera}; state.camera={x:840,y:600}; const oldView={w:VIEW.w,h:VIEW.h}; drawWorld(pctx); state.camera=oldCam; pctx.save(); pctx.scale(w/WORLD.w*2.1,h/WORLD.h*2.1); pctx.restore(); pctx.clearRect(0,0,w,h); const grad=pctx.createLinearGradient(0,0,w,h); grad.addColorStop(0,'#4f7a58'); grad.addColorStop(.52,'#c69b5f'); grad.addColorStop(1,'#4e3828'); pctx.fillStyle=grad; pctx.fillRect(0,0,w,h); pctx.strokeStyle='rgba(92,66,42,.72)'; pctx.lineWidth=34; pctx.beginPath(); pctx.moveTo(-20,h*.58); pctx.bezierCurveTo(w*.3,h*.4,w*.55,h*.72,w+40,h*.45); pctx.stroke(); for(let i=0;i<9;i++){ drawBuilding(pctx,{x:rand(20,w-150),y:rand(20,h-120),w:rand(70,120),h:rand(70,100),roof:'#5a2b1c',wall:'#b0814d'}); } const fakeE=evolutions[3]; drawAura(pctx,w*.5,h*.55,{...fakeE,aura:92}); for(let i=0;i<44;i++){ const a=i*2.399,r=40+Math.floor(i/10)*25; drawCharacter(pctx,w*.5+Math.cos(a)*r,h*.55+Math.sin(a)*r*.72,7,'#2f80ff','#bfe6ff',0,true); } for(let i=0;i<34;i++) drawCitizen(pctx,{x:rand(30,w-30),y:rand(50,h-35),r:rand(6,9),tier:i%9===0?2:1,strength:i%9===0?18:1,color:i%9===0?'#ffbd56':'#d7d3c9',outline:'#fff7e4',bob:0}); drawCharacter(pctx,w*.5,h*.55,28,fakeE.color,fakeE.accent,3,false); drawNameplate(pctx,w*.5,h*.55-66,'87 / 100',fakeE.color); }
drawPreview();
