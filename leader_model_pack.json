
export function buildPremiumLeaderModel(level, color, levels, THREE){
  const spec = levels[level] || levels[0];
  const s = spec.scale || 1;
  const root = new THREE.Group();
  root.userData.isCharacter = true;
  root.userData.walkParts = [];
  root.userData.spinParts = [];
  root.userData.modelVersion = 'premium-fantasy-v18';

  const palette = [
    {cloth:0x2f78ff, dark:0x18457c, accent:0x9fd8ff, cape:0x1f5fd0, metal:0xcfd9df, trim:0xf3c56b, hair:0x2a1a12},
    {cloth:0x21bfff, dark:0x145a7c, accent:0xc8f5ff, cape:0x145a9e, metal:0xd8e8ef, trim:0xffd86b, hair:0x332014},
    {cloth:0x8847ff, dark:0x3b176e, accent:0xe1b8ff, cape:0x4e188f, metal:0xbfb0ff, trim:0xf6c874, hair:0x24170f},
    {cloth:0xe53935, dark:0x68131b, accent:0xffad7a, cape:0x8a1020, metal:0x3a4654, trim:0xffd27a, hair:0x27130b},
    {cloth:0xffcb32, dark:0x7a520b, accent:0xffffff, cape:0x183d88, metal:0xffdf7a, trim:0xffffff, hair:0x1e130a},
    {cloth:0xfff1c0, dark:0x75604a, accent:0x8fffff, cape:0xffffff, metal:0xffd767, trim:0x7ff8ff, hair:0x21180f}
  ][level] || {cloth:color,dark:0x1d3557,accent:0xffffff,cape:0x1a4fd0,metal:0xd8e8ef,trim:0xffd86b,hair:0x24170f};

  const matCache = new Map();
  function M(hex, opts={}){
    const key = JSON.stringify([hex,opts]);
    if(matCache.has(key)) return matCache.get(key);
    const m = new THREE.MeshStandardMaterial({
      color:hex,
      roughness:opts.roughness ?? .38,
      metalness:opts.metalness ?? .08,
      emissive:opts.emissive ?? 0x000000,
      emissiveIntensity:opts.emissiveIntensity ?? 0
    });
    matCache.set(key,m);return m;
  }
  const skin=M(0xf2bd92,{roughness:.58});
  const blush=M(0xff8e7f,{roughness:.66});
  const eyeWhite=M(0xffffff,{roughness:.18,emissive:0xffffff,emissiveIntensity:.03});
  const black=M(0x07080b,{roughness:.55});
  const cloth=M(palette.cloth,{roughness:.42,metalness:.06,emissive:level>=5?0x221400:0,emissiveIntensity:level>=5?.08:0});
  const dark=M(palette.dark,{roughness:.52,metalness:.08});
  const accent=M(palette.accent,{roughness:.24,metalness:level>=4?.35:.1,emissive:level>=5?0x005555:0,emissiveIntensity:level>=5?.18:0});
  const metal=M(palette.metal,{roughness:.18,metalness:.78,emissive:level>=4?0x2a1800:0,emissiveIntensity:level>=4?.15:0});
  const trim=M(palette.trim,{roughness:.16,metalness:.82,emissive:0x2d1c00,emissiveIntensity:.16});
  const capeMat=M(palette.cape,{roughness:.42,metalness:.04,emissive:level>=5?0x111111:0,emissiveIntensity:level>=5?.04:0});
  const hair=M(palette.hair,{roughness:.82});
  const leather=M(0x3a2518,{roughness:.76,metalness:.04});
  const boot=M(0x151019,{roughness:.65,metalness:.06});

  function add(mesh,parent=root){mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function box(w,h,d,mat,x,y,z,rx=0,ry=0,rz=0,parent=root){const m=new THREE.Mesh(new THREE.BoxGeometry(w*s,h*s,d*s),mat);m.position.set(x*s,y*s,z*s);m.rotation.set(rx,ry,rz);return add(m,parent)}
  function sph(r,mat,x,y,z,parent=root,seg=24){const m=new THREE.Mesh(new THREE.SphereGeometry(r*s,seg,Math.max(10,Math.floor(seg*.65))),mat);m.position.set(x*s,y*s,z*s);return add(m,parent)}
  function cap(r,l,mat,x,y,z,rx=0,ry=0,rz=0,parent=root,seg=14){const m=new THREE.Mesh(new THREE.CapsuleGeometry(r*s,l*s,6,seg),mat);m.position.set(x*s,y*s,z*s);m.rotation.set(rx,ry,rz);return add(m,parent)}
  function cyl(r,h,mat,x,y,z,rx=0,ry=0,rz=0,parent=root,seg=24){const m=new THREE.Mesh(new THREE.CylinderGeometry(r*s,r*s,h*s,seg),mat);m.position.set(x*s,y*s,z*s);m.rotation.set(rx,ry,rz);return add(m,parent)}
  function cone(r,h,mat,x,y,z,rx=0,ry=0,rz=0,parent=root,seg=20){const m=new THREE.Mesh(new THREE.ConeGeometry(r*s,h*s,seg),mat);m.position.set(x*s,y*s,z*s);m.rotation.set(rx,ry,rz);return add(m,parent)}
  function grp(x,y,z,parent=root){const g=new THREE.Group();g.position.set(x*s,y*s,z*s);parent.add(g);return g;}

  const shadow = new THREE.Mesh(new THREE.CircleGeometry((2.55+level*.55)*s,72), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:.25}));
  shadow.rotation.x = -Math.PI/2; shadow.position.y = .025; root.add(shadow);
  const aura = new THREE.Mesh(new THREE.TorusGeometry((2.35+level*.52)*s,.055*s,10,120), new THREE.MeshBasicMaterial({color:color, transparent:true, opacity:level>=1?.32:.14}));
  aura.rotation.x = Math.PI/2; aura.position.y=.11; aura.userData.spin=true; root.userData.spinParts.push(aura); root.add(aura);

  const body = grp(0,0,0);
  const leftArm=grp(-.93,3.86,.12,body), rightArm=grp(.93,3.86,.12,body), leftLeg=grp(-.36,1.95,.04,body), rightLeg=grp(.36,1.95,.04,body);
  root.userData.walkParts=[leftArm,rightArm,leftLeg,rightLeg];

  // Heroic proportioned legs and boots
  cap(.20,1.75,level>=2?metal:leather,0,-.1,0,.05,0,.06,leftLeg,16);
  cap(.20,1.75,level>=2?metal:leather,0,-.1,0,-.05,0,-.06,rightLeg,16);
  box(.62,.34,.86,boot,0,-1.12,.20,0,.07,0,leftLeg);
  box(.62,.34,.86,boot,0,-1.12,.20,0,-.07,0,rightLeg);
  box(.72,.12,.94,trim,0,-.82,.30,0,0,.03,leftLeg);
  box(.72,.12,.94,trim,0,-.82,.30,0,0,-.03,rightLeg);
  if(level>=2){
    box(.50,.75,.17,metal,-.08,.38,.46,.08,0,.06,leftLeg); box(.50,.75,.17,metal,.08,.38,.46,-.08,0,-.06,rightLeg);
    box(.48,.14,.18,trim,-.08,.84,.55,0,0,.05,leftLeg); box(.48,.14,.18,trim,.08,.84,.55,0,0,-.05,rightLeg);
  }

  // Pelvis, skirt, layered tunic/armor
  box(1.28,.35,.76,leather,0,2.55,.05,0,0,0,body);
  for(let i=-2;i<=2;i++){box(.33,.80,.14,i===0?accent:cloth,i*.32,2.18,.55,0,0,-i*.06,body)}
  const waist=box(1.02,.76,.62,cloth,0,3.03,.02,0,0,0,body); waist.scale.set(1,.9,.72);
  const chest=sph(.77,cloth,0,3.88,.05,body,32); chest.scale.set(1.24,.82,.78);
  box(1.36,.22,.82,leather,0,2.80,.17,0,0,0,body);
  box(.34,.42,.19,trim,0,2.82,.60,0,0,0,body);
  box(1.22,1.22,.18,level>=1?metal:M(0xe8dac3,{roughness:.62}),0,3.52,.68,0,0,0,body);
  box(.16,1.28,.22,trim,0,3.56,.83,0,0,0,body);
  for(let side of [-1,1]){box(.16,1.1,.16,trim,side*.52,3.55,.82,0,0,side*.16,body)}

  // Shoulders and collar, gives non-blocky silhouette
  const shL=sph(.42,level>=2?trim:metal,-.92,4.26,.10,body,26); shL.scale.set(1.35,.62,.9);
  const shR=sph(.42,level>=2?trim:metal,.92,4.26,.10,body,26); shR.scale.set(1.35,.62,.9);
  box(1.68,.16,.36,trim,0,4.34,.30,0,0,0,body);
  if(level>=3){sph(.24,M(0xfff3d6,{roughness:.45}),-.96,4.50,.08,body,16);sph(.24,M(0xfff3d6,{roughness:.45}),.96,4.50,.08,body,16)}

  // Arms with separated upper/forearm/hands
  sph(.23,level>=1?metal:cloth,0,.43,0,leftArm,18); sph(.23,level>=1?metal:cloth,0,.43,0,rightArm,18);
  cap(.16,1.06,level>=2?metal:cloth,0,-.18,.03,0,0,.38,leftArm,16);
  cap(.16,1.06,level>=2?metal:cloth,0,-.18,.03,0,0,-.38,rightArm,16);
  box(.38,.24,.45,level>=2?metal:leather,-.30,-.74,.15,0,0,.18,leftArm);
  box(.38,.24,.45,level>=2?metal:leather,.30,-.74,.15,0,0,-.18,rightArm);
  sph(.17,skin,-.43,-.97,.18,leftArm,14); sph(.17,skin,.43,-.97,.18,rightArm,14);

  // Face/head/hair with readable game-camera detail
  cyl(.18,.35,skin,0,4.62,0,0,0,0,body,20);
  const head=sph(.67,skin,0,5.24,.05,body,34); head.scale.set(.92,1.05,.86);
  const hairCap=sph(.70,hair,0,5.50,-.08,body,28); hairCap.scale.set(1.02,.58,.78);
  sph(.19,hair,-.54,5.25,.03,body,16); sph(.19,hair,.54,5.25,.03,body,16);
  for(let i=-4;i<=4;i++){cone(.12,.50,hair,i*.12,5.63,.52,Math.PI*.62,0,i*.09,body,10)}
  sph(.073,eyeWhite,-.23,5.32,.61,body,12); sph(.073,eyeWhite,.23,5.32,.61,body,12);
  sph(.036,black,-.23,5.31,.66,body,8); sph(.036,black,.23,5.31,.66,body,8);
  box(.24,.035,.035,black,-.25,5.47,.63,0,0,.12,body); box(.24,.035,.035,black,.25,5.47,.63,0,0,-.12,body);
  box(.20,.035,.03,M(0x8b4b43,{roughness:.7}),0,5.10,.66,0,0,0,body);
  sph(.05,blush,-.44,5.18,.58,body,10); sph(.05,blush,.44,5.18,.58,body,10);

  // Tier-specific accessories: visible silhouette changes
  if(level===0){
    box(.84,1.02,.12,M(0xf2dfbd,{roughness:.68}),0,3.55,.80,0,0,.06,body);
    cyl(.035,1.35,leather,.72,3.35,.22,0,0,-.55,body,8);
  }
  if(level>=1){
    const shield=cyl(.72,.18,cloth,-1.56,3.35,.62,Math.PI/2,.08,.1,body,40); shield.scale.set(.82,1.18,1);
    cyl(.46,.20,metal,-1.57,3.36,.65,Math.PI/2,.08,.1,body,32);
    box(.86,.13,.12,trim,-1.57,3.36,.82,0,0,.1,body);
    cyl(.05,2.60,metal,1.58,3.20,.34,0,0,-.48,body,12); cone(.18,.55,metal,2.12,2.18,.36,0,0,-.48,body,16);
    cyl(.56,.44,metal,0,5.85,0,0,0,0,body,30); cone(.20,.42,trim,0,6.24,0,0,0,0,body,16);
  }
  if(level>=2){
    box(1.58,1.40,.24,M(0x5d24bb,{roughness:.38,metalness:.18,emissive:0x12002a,emissiveIntensity:.1}),0,3.70,.88,0,0,0,body);
    box(.25,1.46,.24,trim,0,3.70,1.06,0,0,0,body);
    addCapeLayer(2.9,4.0,.33,palette.cape,0,body);
    cone(.38,.74,M(0x7835e8,{roughness:.36,metalness:.12}),0,6.20,0,0,0,0,body,22);
    cone(.11,.66,trim,-.50,6.20,0,0,0,.45,body,12); cone(.11,.66,trim,.50,6.20,0,0,0,-.45,body,12);
  }
  if(level>=3){
    box(1.85,1.62,.30,M(0xb91d28,{roughness:.34,metalness:.22,emissive:0x220005,emissiveIntensity:.1}),0,3.78,1.02,0,0,0,body);
    box(.35,1.72,.34,trim,0,3.80,1.22,0,0,0,body);
    addCapeLayer(3.7,5.15,.40,0x8a1020,0,body);
    cyl(.07,3.45,trim,-1.92,3.46,.62,0,0,.08,body,12); box(1.02,.64,.10,M(0xb91d28,{roughness:.36}),-2.18,4.80,.68,0,0,.08,body);
    addSmallCrown(body,.62,6.40,5);
  }
  if(level>=4){
    box(2.06,1.82,.36,trim,0,3.90,1.12,0,0,0,body);
    box(.40,1.90,.46,accent,0,3.92,1.38,0,0,0,body);
    addCapeLayer(4.25,5.95,.45,0x153b88,0,body);
    addCrown(body,.92,6.55,7);
    cyl(.08,3.1,trim,1.98,3.36,.46,0,0,-.35,body,12); sph(.28,M(0x8df7ff,{roughness:.08,emissive:0x24d8ff,emissiveIntensity:1.1}),1.50,4.50,.48,body,18);
  }
  if(level>=5){
    box(2.36,2.08,.44,M(0xfff0c9,{roughness:.26,metalness:.24,emissive:0x221400,emissiveIntensity:.1}),0,3.96,1.24,0,0,0,body);
    box(.44,2.14,.56,trim,0,4.00,1.54,0,0,0,body);
    addCapeLayer(5.45,7.05,.50,0xfff4df,.08,body);
    addCrown(body,1.1,6.85,9);
    const halo=new THREE.Mesh(new THREE.TorusGeometry(1.62*s,.045*s,8,96),new THREE.MeshBasicMaterial({color:0x93ffff,transparent:true,opacity:.5}));halo.position.set(0,5.20*s,.08*s);halo.rotation.x=Math.PI/2;halo.userData.spin=true;root.userData.spinParts.push(halo);body.add(halo);
    cyl(.09,4.1,trim,2.10,3.48,.52,0,0,-.22,body,16); sph(.34,M(0x8cffff,{roughness:.08,emissive:0x26dcff,emissiveIntensity:1.45}),2.58,5.24,.55,body,22);
  }

  function addCapeLayer(w,d,tilt,hex,offset,parent){
    const back=box(w,.22,d,M(hex,{roughness:.40,metalness:.03,emissive:level>=5?0x111111:0,emissiveIntensity:level>=5?.06:0}),0,2.55,-1.56-offset,tilt,0,0,parent);
    back.scale.z=1.0;
    box(w*.64,.08,d*.88,M(0xffffff,{roughness:.3,metalness:.06,emissive:level>=5?0x111111:0,emissiveIntensity:level>=5?.04:0}),0,2.72,-1.58-offset,tilt+.02,0,0,parent);
    for(let side of [-1,1]) box(.16,.16,d*.94,trim,side*w*.42,2.70,-1.52-offset,tilt,0,side*.05,parent);
  }
  function addSmallCrown(parent,r,y,points){
    const band=new THREE.Mesh(new THREE.TorusGeometry(r*s,.08*s,10,48),trim); band.rotation.x=Math.PI/2; band.position.set(0,y*s,0); add(band,parent);
    for(let i=0;i<points;i++){const a=i*Math.PI*2/points; cone(.10,.42,trim,Math.cos(a)*r,y+.32,Math.sin(a)*r,0,0,a,parent,12)}
  }
  function addCrown(parent,r,y,points){
    const band=new THREE.Mesh(new THREE.TorusGeometry(r*s,.10*s,12,64),trim); band.rotation.x=Math.PI/2; band.position.set(0,y*s,0); add(band,parent);
    for(let i=0;i<points;i++){const a=i*Math.PI*2/points; cone(.12,.65,trim,Math.cos(a)*r,y+.46,Math.sin(a)*r,0,0,a,parent,14)}
    sph(.10,accent,0,(y+.75),r*.02,parent,14);
  }

  // Toon-like outline shells on key pieces only. High quality without applying to all NPCs.
  const outlineMat = new THREE.MeshBasicMaterial({color:0x05070b, side:THREE.BackSide, transparent:true, opacity:.22});
  const outlineTargets=[];
  body.traverse(o=>{ if(o.isMesh && o.geometry && !String(o.geometry.type).includes('Circle') && outlineTargets.length<34) outlineTargets.push(o); });
  for(const o of outlineTargets){
    const clone = new THREE.Mesh(o.geometry, outlineMat);
    clone.position.copy(o.position); clone.rotation.copy(o.rotation); clone.scale.copy(o.scale).multiplyScalar(1.025);
    o.parent.add(clone);
  }
  root.scale.setScalar(1.42);
  return root;
}
