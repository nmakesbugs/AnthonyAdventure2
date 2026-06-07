'use strict';
/* ================================================================
   ANTHONY & MERLIN: THE ADVENTURE GETS WEIRD — game.js v0.1
   ================================================================ */
const GW=390,GH=700;

/* ── GLOBAL STATE ── */
window.__anthonyMerlin={
  handleInput:()=>{}, resumeFromDamage:()=>{}, proceedFromWin:()=>{},
  currentScene:null,
  state:{currentScene:'',aesthetic:'crt',hp:100,maxHp:100,phase:'',
         routingChoice:null,ddrScore:null,ddrHits:0,ddrTotal:0}
};
window.__gameState=window.__anthonyMerlin.state;
function setScene(n){window.__gameState.currentScene=n;document.body.setAttribute('data-scene',n);}

/* ── AUDIO ── */
const Audio=(()=>{
  let ctx=null;
  const init=()=>{if(!ctx)try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}};
  const resume=()=>{if(ctx&&ctx.state==='suspended')ctx.resume();};
  const tone=(freq,dur,type='square',vol=0.18)=>{
    if(!ctx)return;resume();
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);
    o.start();o.stop(ctx.currentTime+dur);
  };
  return{
    init,resume,
    tick(){try{init();tone(660,0.04,'square',0.06);}catch(e){}},
    click(){try{init();tone(440,0.06,'square',0.12);}catch(e){}},
    boof(p=1){try{init();resume();
      const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
      o.type='sawtooth';o.frequency.setValueAtTime(160*p,ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(70*p,ctx.currentTime+0.25);
      g.gain.setValueAtTime(0.4,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);
      o.start();o.stop(ctx.currentTime+0.3);}catch(e){}},
    thwack(){try{init();tone(180,0.12,'sawtooth',0.35);setTimeout(()=>tone(120,0.08,'sawtooth',0.25),60);}catch(e){}},
    whoosh(){try{init();tone(800,0.15,'sine',0.2);tone(400,0.2,'sine',0.1);}catch(e){}},
    stun(){try{init();[523,659,523].forEach((f,i)=>setTimeout(()=>tone(f,0.1,'square',0.15),i*80));}catch(e){}},
    hit(){try{init();tone(200,0.1,'sawtooth',0.3);}catch(e){}},
    fanfare(){try{init();[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.18,'square',0.22),i*120));}catch(e){}},
    ddrGood(){try{init();tone(880,0.08,'sine',0.2);}catch(e){}},
    ddrPerfect(){try{init();[880,1108].forEach((f,i)=>setTimeout(()=>tone(f,0.08,'sine',0.25),i*60));}catch(e){}},
    ddrMiss(){try{init();tone(220,0.1,'sawtooth',0.15);}catch(e){}},
    ddrWin(){try{init();[523,659,784,880,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'square',0.2),i*100));}catch(e){}},
    endChime(){try{init();[261,329,392,523].forEach((f,i)=>setTimeout(()=>tone(f,0.4,'sine',0.18),i*200));}catch(e){}},
  };
})();

/* ── DIALOGUE MANAGER ── */
class DialogueManager{
  constructor(){
    this.box=document.getElementById('dialogue-box');
    this.spk=document.getElementById('dlg-speaker');
    this.txt=document.getElementById('dlg-text');
    this.cont=document.getElementById('dlg-continue');
    this.queue=[];this.onDone=null;this.typing=false;
    this.full='';this.timer=null;this._suppress=false;
    this.box.addEventListener('click',()=>this._tap());
    this.box.addEventListener('touchend',(e)=>{e.preventDefault();this._tap();},{passive:false});
  }
  show(lines,onDone){
    document.getElementById('choice-panel').style.display='none';
    this.queue=Array.isArray(lines)?[...lines]:[lines];
    this.onDone=onDone||null;
    this.box.style.display='block';
    this._suppress=true;
    setTimeout(()=>{this._suppress=false;},180);
    this._next();
  }
  hide(){this.box.style.display='none';if(this.timer){clearTimeout(this.timer);this.timer=null;}}
  _next(){
    if(!this.queue.length){this.hide();if(this.onDone)this.onDone();return;}
    const line=this.queue.shift();
    const warm=window.__gameState.aesthetic==='chaos';
    const spk=typeof line==='string'?'':(line.speaker||'');
    const text=typeof line==='string'?line:(line.text||'');
    this.cont.style.opacity='0';
    this.box.className=warm?'warm':'';
    this.spk.className='dlg-speaker'+(warm?' warm':'');
    this.txt.className='dlg-text'+(warm?' warm':'');
    this.cont.className='dlg-continue'+(warm?' warm':'');
    if(spk==='NARRATOR'){this.spk.style.color='#cc44ff';this.spk.textContent='📖 NARRATOR';}
    else if(spk==='MERLIN'){this.spk.style.color='#88ee88';this.spk.textContent='🐾 MERLIN';}
    else if(spk){this.spk.style.color=warm?'#D4A843':'#ffd700';this.spk.textContent=spk;}
    else{this.spk.textContent='';}
    this.full=text;this.txt.textContent='';this.typing=true;
    this._typeChar(0);
  }
  _typeChar(i){
    if(i<this.full.length){
      this.txt.textContent=this.full.slice(0,i+1);
      if(i%3===0)Audio.tick();
      this.timer=setTimeout(()=>this._typeChar(i+1),22);
    }else{this.typing=false;this.cont.style.opacity='1';}
  }
  _tap(){
    if(this._suppress)return;
    if(this.typing){
      clearTimeout(this.timer);this.timer=null;
      this.txt.textContent=this.full;this.typing=false;this.cont.style.opacity='1';
    }else{Audio.click();this._next();}
  }
}
const Dlg=new DialogueManager();

/* ── DOM UTILITIES ── */
function showChoices(choices,onChoice){
  Dlg.hide();
  const panel=document.getElementById('choice-panel');
  const warm=window.__gameState.aesthetic==='chaos';
  panel.className=warm?'warm':'';
  panel.querySelectorAll('.choice-btn').forEach(b=>b.remove());
  panel.querySelector('.choice-title').className='choice-title'+(warm?' warm':'');
  choices.forEach((c,i)=>{
    const btn=document.createElement('button');
    btn.className='choice-btn'+(warm?' warm':'');
    btn.textContent=c.text;
    const go=()=>{
      if(panel.dataset.done)return;panel.dataset.done='1';Audio.click();
      panel.querySelectorAll('.choice-btn').forEach(b=>b.disabled=true);
      setTimeout(()=>{panel.style.display='none';delete panel.dataset.done;onChoice(i,c);},220);
    };
    btn.addEventListener('click',go);
    btn.addEventListener('touchend',(e)=>{e.preventDefault();go();},{passive:false});
    panel.appendChild(btn);
  });
  panel.style.display='flex';
}
function flashScreen(type,dur=300){
  const f=document.getElementById('screen-flash');
  f.className=type;f.style.opacity='1';
  setTimeout(()=>{f.style.opacity='0';},dur);
}
function showTitleCard(chapter,title,onDone,isGreen=false){
  const card=document.getElementById('title-card');
  document.getElementById('tc-chapter').textContent=chapter;
  const ttEl=document.getElementById('tc-title');
  ttEl.textContent=title;ttEl.className='tc-title'+(isGreen?' green':'');
  card.className='show';Audio.endChime();
  setTimeout(()=>{card.className='';if(onDone)onDone();},2800);
}
function updateHPBar(){
  const s=window.__gameState,pct=Math.max(0,s.hp/s.maxHp*100);
  const fill=document.getElementById('hp-fill');
  fill.style.width=pct+'%';
  fill.className=pct>60?'good':pct>30?'medium':'low';
  document.getElementById('hp-text').textContent=s.hp+'/'+s.maxHp;
}
function showDamageOverlay(msg,onContinue){
  const el=document.getElementById('damage-overlay');
  document.getElementById('damage-msg').textContent=msg;
  document.getElementById('damage-hp-display').textContent=window.__gameState.hp+'/'+window.__gameState.maxHp;
  el.style.display='flex';
  window.__anthonyMerlin.resumeFromDamage=()=>{el.style.display='none';if(onContinue)onContinue();};
}
function showWinOverlay(msg,onContinue){
  const el=document.getElementById('win-overlay');
  document.getElementById('win-msg').textContent=msg;
  el.style.display='flex';Audio.fanfare();
  window.__anthonyMerlin.proceedFromWin=()=>{el.style.display='none';if(onContinue)onContinue();};
}
function hideAllUI(){
  ['dialogue-box','choice-panel','beat-controls','ddr-container',
   'routing-container','hp-bar-wrap','damage-overlay','win-overlay',
   'cyndie-call','wave-announce'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.style.display='none';}
  });
  const card=document.getElementById('title-card');if(card)card.className='';
}

/* ── TEXTURE BUILDER HELPER ── */
function makeTex(scene,key,w,h,fn){
  const g=scene.make.graphics({x:0,y:0,add:false});fn(g);
  g.generateTexture(key,w,h);g.destroy();
}

function buildTextures(scene){
  /* ANTHONY — Madison/travel outfit (Ch.1): fancy fitted tee + slacks.
     NOT a green suit. Worn through prologue, plane, and the hotel reveal.
     Cheetah jacket (anthony-idle etc.) only appears from Ch.2 onward. */
  makeTex(scene,'anthony-crt',48,92,g=>{
    const sk=0xC9A47A,hr=0x2A1A0E,tee=0x26262C,teeHi=0x33333A,slk=0x5A5448,shoe=0x2A2018;
    g.fillStyle(shoe,1);g.fillRoundedRect(9,82,12,8,2);g.fillRoundedRect(27,82,12,8,2);
    g.fillStyle(slk,1);g.fillRoundedRect(9,50,12,34,2);g.fillRoundedRect(27,50,12,34,2);
    g.fillStyle(0x4A443A,1);g.fillRect(8,49,32,3);
    g.fillStyle(tee,1);g.fillRoundedRect(6,20,36,32,5);
    g.fillStyle(teeHi,1);g.fillRoundedRect(8,22,8,28,4);
    g.fillStyle(0x1C1C20,1);g.fillTriangle(19,20,24,28,29,20);
    g.fillStyle(0x1C1C20,1);g.fillRect(22,21,4,12);
    g.fillStyle(0x8A8A90,1);g.fillCircle(24,24,1);g.fillCircle(24,28,1);
    g.fillStyle(tee,1);g.fillRoundedRect(0,22,7,12,2);g.fillRoundedRect(41,22,7,12,2);
    g.fillStyle(sk,1);g.fillRoundedRect(0,33,7,15,2);g.fillRoundedRect(41,33,7,15,2);
    g.fillStyle(sk,1);g.fillEllipse(3,49,7,7);g.fillEllipse(45,49,7,7);
    g.fillStyle(sk,1);g.fillRect(20,16,8,6);
    g.fillStyle(sk,1);g.fillRoundedRect(16,8,16,13,3);g.fillEllipse(24,12,23,19);
    g.fillStyle(hr,1);g.fillEllipse(24,5,24,11);g.fillRoundedRect(13,3,22,6,2);
    g.fillStyle(0x3A2614,1);g.fillRect(15,4,18,2);
    g.fillStyle(0x201008,1);g.fillEllipse(20,12,3,4);g.fillEllipse(28,12,3,4);
    g.fillStyle(0xEAEAEA,1);g.fillCircle(21,11,1);g.fillCircle(29,11,1);
    g.fillStyle(hr,1);g.fillRect(17,8,5,1);g.fillRect(26,8,5,1);
    g.fillStyle(0x7A4A30,1);g.fillRect(20,18,8,1);g.fillRect(21,19,6,1);
  });

  /* ANTHONY FULL COLOR (post-reveal) */
  function drawAnthony(g,frame){
    const sk=0xA07240,hr=0x1a0a00,jkt=0xD4A020,sp=0x3B2800;
    const pt=0x2A2A35,sh=0xE8E8E8,ti=0x007A7A,bc=0x5C3317;
    g.fillStyle(0x1a0a00,1);g.fillRoundedRect(5,84,14,8,2);g.fillRoundedRect(29,84,14,8,2);
    const ls=frame===1?3:frame===2?-3:0;
    g.fillStyle(pt,1);g.fillRoundedRect(6,52,13,34,2);g.fillRoundedRect(26,52+ls,13,34,2);
    g.fillStyle(0x1a1a1a,1);g.fillRect(5,50,36,4);
    g.fillStyle(jkt,1);g.fillRoundedRect(4,20,40,32,4);
    g.fillStyle(sp,1);
    [[10,24,6,4],[22,26,5,4],[33,23,6,4],[9,36,5,3],[24,38,6,3],[36,36,5,3],[14,46,5,3],[30,46,5,3]]
      .forEach(([x,y,w,h])=>g.fillEllipse(x,y,w,h));
    g.fillStyle(sh,1);g.fillTriangle(18,20,23,38,13,38);g.fillTriangle(26,20,31,38,37,38);
    g.fillStyle(ti,1);g.fillRoundedRect(21,20,6,20,1);
    const ax=frame===3?6:0;
    g.fillStyle(jkt,1);g.fillRoundedRect(-2,22,8,28,2);g.fillRoundedRect(40+ax,22,8,28,2);
    g.fillStyle(sk,1);g.fillEllipse(2,50,8,8);g.fillEllipse(44+ax,50,8,8);
    g.fillStyle(bc,1);g.fillRoundedRect(42+ax,52,14,10,2);
    g.fillStyle(0x3a1a08,1);g.fillRoundedRect(46+ax,50,6,3,1);
    g.fillStyle(sk,1);g.fillRoundedRect(18,10,12,12,2);g.fillEllipse(24,10,28,22);
    g.fillStyle(hr,1);g.fillEllipse(24,3,26,12);g.fillRoundedRect(10,1,26,7,2);
    g.fillStyle(0x2a1000,1);g.fillEllipse(18,10,5,5);g.fillEllipse(28,10,5,5);
    g.fillStyle(0xFFFFFF,1);g.fillCircle(19,9,1.5);g.fillCircle(29,9,1.5);
    g.fillStyle(0x8B5A3A,1);g.fillEllipse(24,15,4,3);
    g.fillStyle(0x3a1000,1);g.fillEllipse(24,19,8,4);
    g.fillStyle(sk,1);g.fillRect(19,17,10,3);
  }
  ['idle','walk1','walk2','swing','stun'].forEach((f,i)=>makeTex(scene,'anthony-'+f,56,94,g=>drawAnthony(g,i)));

  /* MERLIN */
  function drawMerlin(g,pose){
    const lp=pose===2;
    g.fillStyle(0x000000,0.15);g.fillEllipse(lp?90:66,108,lp?110:90,14);
    g.fillStyle(0x0e0e0e,1);
    [[14,75],[9,62],[5,50],[2,40]].forEach(([x,y],i)=>g.fillCircle(x,y+(pose===1?i*2:-i*2),7-i));
    g.fillStyle(0x111111,1);g.fillEllipse(lp?80:66,lp?60:72,lp?120:98,60);
    g.fillStyle(0x0c0c0c,1);
    g.fillRoundedRect(lp?20:28,84,14,pose===1?26:20,5);
    g.fillRoundedRect(lp?42:46,84,14,pose===1?20:26,5);
    g.fillRoundedRect(lp?90:78,lp?50:84,14,lp?20:pose===1?20:26,5);
    g.fillRoundedRect(lp?110:96,lp?50:84,14,lp?20:pose===1?26:20,5);
    g.fillStyle(0x111111,1);g.fillEllipse(lp?110:100,52,34,36);
    g.fillStyle(0x1c1c1c,1);g.fillCircle(lp?116:108,32,30);
    g.fillStyle(0x242424,1);g.fillEllipse(lp?130:122,40,28,20);
    g.fillStyle(0x0e0e0e,1);g.fillEllipse(lp?136:128,35,15,10);
    g.fillStyle(0x0d0d0d,1);g.fillEllipse(lp?100:92,14,20,30);g.fillEllipse(lp?126:118,11,18,28);
    g.fillStyle(0x8B5E3C,1);g.fillCircle(lp?107:99,26,7);g.fillCircle(lp?123:115,23,7);
    g.fillStyle(0x2a1500,1);g.fillCircle(lp?107:99,26,4);g.fillCircle(lp?123:115,23,4);
    g.fillStyle(0xFFFFFF,1);g.fillCircle(lp?109:101,24,2);g.fillCircle(lp?125:117,21,2);
    if(pose===0||pose===2){
      g.fillStyle(0xFF9FB5,1);g.fillEllipse(lp?133:124,54,14,22);
      g.fillStyle(0xE888A0,1);g.fillRect(lp?132:123,44,2,14);
    }
    g.fillStyle(0x4488DD,1);g.fillRoundedRect(lp?95:84,58,30,9,3);
    g.fillStyle(0xFFD700,1);(lp?[98,104,110,116]:[87,93,99,105]).forEach(cx=>g.fillCircle(cx,62,2));
  }
  makeTex(scene,'merlin-idle',145,115,g=>drawMerlin(g,0));
  makeTex(scene,'merlin-walk',145,115,g=>drawMerlin(g,1));
  makeTex(scene,'merlin-tackle',145,115,g=>drawMerlin(g,2));
  makeTex(scene,'merlin-sit',145,115,g=>drawMerlin(g,0));

  /* NICK — Madison: black V-neck tee, jeans, boots, grey-brown hair.
     No glasses. No suit. Casual, distinct from Anthony. */
  makeTex(scene,'nick-crt',48,92,g=>{
    const sk=0xCBA079,hr=0x6B5E4A,vne=0x161616,vneHi=0x222222,jean=0x3A4A66,jeanHi=0x46587A,boot=0x2A1C10;
    g.fillStyle(boot,1);g.fillRoundedRect(8,80,13,10,2);g.fillRoundedRect(27,80,13,10,2);
    g.fillStyle(0x1A1208,1);g.fillRect(8,87,13,3);g.fillRect(27,87,13,3);
    g.fillStyle(jean,1);g.fillRoundedRect(9,50,12,32,2);g.fillRoundedRect(27,50,12,32,2);
    g.fillStyle(jeanHi,1);g.fillRect(11,52,2,28);g.fillRect(29,52,2,28);
    g.fillStyle(0x2A3650,1);g.fillRect(8,49,32,3);
    g.fillStyle(vne,1);g.fillRoundedRect(6,20,36,32,4);
    g.fillStyle(vneHi,1);g.fillRoundedRect(8,22,7,26,3);
    g.fillStyle(sk,1);g.fillTriangle(19,20,24,32,29,20);
    g.fillStyle(vne,1);g.fillRoundedRect(0,22,7,13,2);g.fillRoundedRect(41,22,7,13,2);
    g.fillStyle(sk,1);g.fillRoundedRect(0,34,7,14,2);g.fillRoundedRect(41,34,7,14,2);
    g.fillStyle(sk,1);g.fillEllipse(3,49,7,7);g.fillEllipse(45,49,7,7);
    g.fillStyle(sk,1);g.fillRect(20,16,8,6);
    g.fillStyle(sk,1);g.fillRoundedRect(16,8,16,13,3);g.fillEllipse(24,12,23,19);
    g.fillStyle(hr,1);g.fillEllipse(24,5,25,11);g.fillRoundedRect(12,3,24,6,2);
    g.fillStyle(0x7D7060,1);g.fillRect(14,4,8,2);g.fillRect(28,4,6,2);
    g.fillStyle(0x201008,1);g.fillEllipse(20,12,3,4);g.fillEllipse(28,12,3,4);
    g.fillStyle(0xEAEAEA,1);g.fillCircle(21,11,1);g.fillCircle(29,11,1);
    g.fillStyle(hr,1);g.fillRect(17,8,5,1);g.fillRect(26,8,5,1);
    g.fillStyle(0x9A8468,0.4);g.fillRect(18,18,12,3);
    g.fillStyle(0x7A4A30,1);g.fillRect(21,18,6,1);
  });

  /* ENEMIES */
  makeTex(scene,'enemy-lanyard',44,84,g=>{
    const sk=0xC8956B,sh=0x6699CC,pt=0xC8B07A;
    g.fillStyle(0xCCCCCC,1);g.fillRoundedRect(8,74,10,8,2);g.fillRoundedRect(26,74,10,8,2);
    g.fillStyle(pt,1);g.fillRoundedRect(7,46,12,30,2);g.fillRoundedRect(25,46,12,30,2);
    g.fillStyle(0x8B7050,1);g.fillRect(5,44,32,4);
    g.fillStyle(sh,1);g.fillRoundedRect(4,18,34,28,3);
    g.fillStyle(0xEEEEEE,1);g.fillTriangle(16,18,20,32,11,32);g.fillTriangle(22,18,27,32,32,32);
    g.fillStyle(0xFFDD00,1);g.fillRect(18,16,2,28);g.fillRoundedRect(14,42,12,8,2);
    g.fillStyle(0xFFFFFF,1);g.fillRoundedRect(15,43,10,6,1);
    g.fillStyle(0xDDDDDD,1);g.fillRoundedRect(-1,20,6,22,2);g.fillRoundedRect(38,20,6,22,2);
    g.fillStyle(sk,1);g.fillEllipse(1,42,6,6);g.fillEllipse(42,42,6,6);
    g.fillStyle(sk,1);g.fillRoundedRect(13,6,14,14,2);g.fillEllipse(20,9,24,20);
    g.fillStyle(0x1a0a00,1);g.fillEllipse(16,9,4,5);g.fillEllipse(24,9,4,5);
    g.fillStyle(0xFFFFFF,1);g.fillCircle(17,8,1.5);g.fillCircle(25,8,1.5);
    g.fillStyle(0x1a0a00,1);g.fillRect(13,5,6,2);g.fillRect(24,5,6,2);
    g.fillStyle(0x2a1800,1);g.fillRoundedRect(6,2,22,7,2);
  });

  makeTex(scene,'enemy-briefcase',44,84,g=>{
    const sk=0xD4A87A,bz=0x2A2A3F,bc=0x5C3317;
    g.fillStyle(0x111111,1);g.fillRoundedRect(8,74,10,8,2);g.fillRoundedRect(26,74,10,8,2);
    g.fillStyle(0x1A1A2A,1);g.fillRoundedRect(7,46,12,30,2);g.fillRoundedRect(25,46,12,30,2);
    g.fillStyle(0x0a0a0a,1);g.fillRect(5,44,32,4);
    g.fillStyle(bz,1);g.fillRoundedRect(4,18,34,28,3);
    g.fillStyle(0xEEEEEE,1);g.fillTriangle(16,18,20,32,11,32);g.fillTriangle(22,18,27,32,32,32);
    g.fillStyle(0x888888,1);g.fillRoundedRect(20,18,5,18,1);
    g.fillStyle(bz,1);g.fillRoundedRect(-1,20,6,22,2);g.fillRoundedRect(38,14,7,16,2);
    g.fillStyle(sk,1);g.fillEllipse(1,42,6,6);g.fillEllipse(42,16,7,7);
    g.fillStyle(bc,1);g.fillRoundedRect(38,6,16,10,2);
    g.fillStyle(0x3a1a08,1);g.fillRoundedRect(42,4,8,3,1);
    g.fillStyle(sk,1);g.fillRoundedRect(13,6,14,14,2);g.fillEllipse(20,9,24,20);
    g.fillStyle(0x1a0a00,1);g.fillEllipse(16,9,4,5);g.fillEllipse(24,9,4,5);
    g.fillStyle(0xFFFFFF,1);g.fillCircle(17,8,1.5);g.fillCircle(25,8,1.5);
    g.fillStyle(0x1a0a00,1);g.fillRect(13,4,6,2);g.fillRect(22,4,8,3);
    g.fillStyle(0x2a1800,1);g.fillRoundedRect(6,2,22,7,2);
  });

  makeTex(scene,'enemy-kombucha',44,84,g=>{
    const sk=0xC8956B,fl=0x882222,jn=0x1A2040,ht=0x444444;
    g.fillStyle(0x333355,1);g.fillRoundedRect(8,74,10,8,2);g.fillRoundedRect(26,74,10,8,2);
    g.fillStyle(jn,1);g.fillRoundedRect(7,46,12,30,2);g.fillRoundedRect(25,46,12,30,2);
    g.fillStyle(fl,1);g.fillRoundedRect(4,18,34,28,3);
    g.fillStyle(0x662222,1);for(let x=4;x<38;x+=7)g.fillRect(x,18,2,28);
    for(let y=18;y<46;y+=7)g.fillRect(4,y,34,2);
    g.fillStyle(ht,1);g.fillEllipse(21,6,26,14);g.fillRoundedRect(7,8,26,8,2);
    g.fillStyle(fl,1);g.fillRoundedRect(-1,20,6,22,2);g.fillRoundedRect(38,14,7,16,2);
    g.fillStyle(sk,1);g.fillEllipse(1,42,6,6);g.fillEllipse(42,16,7,7);
    g.fillStyle(0x226622,1);g.fillRoundedRect(40,4,8,18,3);
    g.fillStyle(0x88AA88,1);g.fillRoundedRect(43,2,2,3,1);
    g.fillStyle(sk,1);g.fillRoundedRect(14,7,14,14,2);g.fillEllipse(21,10,22,20);
    g.fillStyle(0x7A4A2A,1);g.fillEllipse(21,20,18,10);
    g.fillStyle(0x1a0a00,1);g.fillEllipse(16,9,4,5);g.fillEllipse(24,9,4,5);
    g.fillStyle(0xFFFFFF,1);g.fillCircle(17,8,1.5);g.fillCircle(25,8,1.5);
    g.fillStyle(0x1a0a00,1);g.fillRoundedRect(6,2,22,8,2);
  });

  /* CIA OPERATIVE */
  makeTex(scene,'operative-stern',52,102,g=>{
    const sk=0xC8A882,su=0x111111,sh=0xEEEEEE,gl=0x222222;
    g.fillStyle(0x080808,1);g.fillRoundedRect(12,90,12,10,2);g.fillRoundedRect(30,90,12,10,2);
    g.fillStyle(su,1);g.fillRoundedRect(8,52,15,40,2);g.fillRoundedRect(28,52,15,40,2);
    g.fillStyle(0x080808,1);g.fillRect(6,50,38,4);
    g.fillStyle(su,1);g.fillRoundedRect(4,22,42,30,4);
    g.fillStyle(sh,1);g.fillTriangle(21,22,26,42,15,42);g.fillTriangle(27,22,32,42,40,42);
    g.fillStyle(0x000000,1);g.fillRoundedRect(23,22,5,22,1);
    g.fillStyle(su,1);g.fillRoundedRect(-1,24,8,28,2);g.fillRoundedRect(43,24,8,28,2);
    g.fillStyle(sk,1);g.fillEllipse(3,52,8,8);g.fillEllipse(48,52,8,8);
    g.fillStyle(su,1);g.fillRoundedRect(8,40,28,10,2);
    g.fillStyle(sk,1);g.fillRoundedRect(19,12,12,12,2);g.fillEllipse(25,12,30,26);
    g.fillStyle(0x1a0a00,1);g.fillEllipse(25,4,28,12);g.fillRoundedRect(10,2,28,7,2);
    g.fillStyle(gl,1);g.fillRoundedRect(11,10,11,7,2);g.fillRoundedRect(28,10,11,7,2);g.fillRect(22,12,5,2);
    g.fillStyle(0xE8C8A8,1);g.fillCircle(40,16,3);
    g.fillStyle(0x888888,1);g.fillRect(40,16,1,6);
    g.fillStyle(0x8B5A3A,1);g.fillRect(20,20,10,2);
    g.fillStyle(0x1a0a00,1);g.fillRoundedRect(8,1,28,9,2);
  });
  makeTex(scene,'operative-soft',52,102,g=>{
    const sk=0xC8A882,su=0x111111,sh=0xEEEEEE,gl=0x222222;
    g.fillStyle(0x080808,1);g.fillRoundedRect(12,90,12,10,2);g.fillRoundedRect(30,90,12,10,2);
    g.fillStyle(su,1);g.fillRoundedRect(8,52,15,40,2);g.fillRoundedRect(28,52,15,40,2);
    g.fillStyle(0x080808,1);g.fillRect(6,50,38,4);
    g.fillStyle(su,1);g.fillRoundedRect(4,22,42,30,4);
    g.fillStyle(sh,1);g.fillTriangle(21,22,26,42,15,42);g.fillTriangle(27,22,32,42,40,42);
    g.fillStyle(0x000000,1);g.fillRoundedRect(23,22,5,22,1);
    g.fillStyle(su,1);g.fillRoundedRect(-1,24,8,28,2);g.fillRoundedRect(43,24,8,28,2);
    g.fillStyle(sk,1);g.fillEllipse(3,52,8,8);g.fillEllipse(48,52,8,8);
    g.fillStyle(su,1);g.fillRoundedRect(8,40,28,10,2);
    g.fillStyle(sk,1);g.fillRoundedRect(19,12,12,12,2);g.fillEllipse(25,12,30,26);
    g.fillStyle(0x1a0a00,1);g.fillEllipse(25,4,28,12);g.fillRoundedRect(10,2,28,7,2);
    g.fillStyle(gl,1);g.fillRoundedRect(11,10,11,7,2);g.fillRoundedRect(28,10,11,7,2);g.fillRect(22,12,5,2);
    g.fillStyle(0xE8C8A8,1);g.fillCircle(40,16,3);
    g.fillStyle(0x888888,1);g.fillRect(40,16,1,6);
    g.fillStyle(0x8B5A3A,1);g.fillEllipse(25,21,10,5);g.fillStyle(sk,1);g.fillRect(20,19,10,3);
    g.fillStyle(0x1a0a00,1);g.fillRoundedRect(8,1,28,9,2);
  });

  /* MS. PATRICIA CHO */
  makeTex(scene,'mscho',50,102,g=>{
    const sk=0xD4A882,bz=0x1A2A5A,bl=0x0E0E1A,sh=0xF0F0F0;
    g.fillStyle(0x222222,1);g.fillRoundedRect(12,92,10,8,2);g.fillRoundedRect(28,92,10,8,2);
    g.fillStyle(bl,1);g.fillRoundedRect(12,62,10,32,2);g.fillRoundedRect(28,62,10,32,2);
    g.fillStyle(bz,1);g.fillRoundedRect(5,24,38,40,4);
    g.fillStyle(sh,1);g.fillTriangle(19,24,24,44,13,44);g.fillTriangle(27,24,32,44,38,44);
    g.fillStyle(bz,1);g.fillRoundedRect(-1,26,7,30,2);g.fillRoundedRect(42,26,7,30,2);
    g.fillStyle(sk,1);g.fillEllipse(2,56,7,7);g.fillEllipse(47,56,7,7);
    g.fillStyle(0xEEEEEE,1);g.fillRoundedRect(40,40,18,12,2);
    g.fillStyle(0x3344AA,1);g.fillRect(41,41,6,3);
    g.fillStyle(0xCCAA44,1);g.fillRect(11,22,3,6);g.fillRect(35,22,3,6);
    g.fillStyle(0x333333,1);g.fillRoundedRect(10,16,12,7,2);g.fillRoundedRect(28,16,12,7,2);g.fillRect(22,18,5,2);
    g.fillStyle(sk,1);g.fillRoundedRect(17,9,14,14,2);g.fillEllipse(24,11,28,22);
    g.fillStyle(0x1a0a00,1);g.fillEllipse(24,4,26,12);g.fillCircle(24,6,8);
    g.fillStyle(0x444444,1);g.fillEllipse(18,5,8,6);g.fillEllipse(30,5,8,6);
    g.fillStyle(sk,1);g.fillEllipse(18,16,4,5);g.fillEllipse(28,16,4,5);
    g.fillStyle(0xFFFFFF,1);g.fillCircle(19,15,1.5);g.fillCircle(29,15,1.5);
    g.fillStyle(0x8B5A3A,1);g.fillEllipse(24,20,4,3);
    g.fillStyle(0x3a1000,1);g.fillRect(20,24,8,2);
    g.fillStyle(0x1a0a00,1);g.fillRoundedRect(10,0,26,9,2);
  });

  /* PROJECTILES */
  makeTex(scene,'proj-briefcase',18,14,g=>{
    g.fillStyle(0x5C3317,1);g.fillRoundedRect(0,2,18,10,2);
    g.fillStyle(0x3a1a08,1);g.fillRoundedRect(5,0,8,3,1);
  });
  makeTex(scene,'proj-kombucha',10,22,g=>{
    g.fillStyle(0x226622,1);g.fillRoundedRect(0,4,10,18,3);
    g.fillStyle(0x88AA88,1);g.fillRoundedRect(3,0,4,5,1);
  });

  /* BACKGROUNDS */
  makeTex(scene,'bg-office',GW,GH,g=>{
    g.fillStyle(0x050f05,1);g.fillRect(0,0,GW,GH);
    g.fillStyle(0x0a1a0a,1);g.fillRect(0,420,GW,GH-420);
    g.fillStyle(0x0d200d,1);g.fillRoundedRect(30,340,160,20,2);g.fillRoundedRect(220,340,140,20,2);
    g.fillStyle(0x061206,1);g.fillRoundedRect(50,260,80,80,4);g.fillRoundedRect(240,260,80,80,4);
    g.fillStyle(0x00ff41,0.12);g.fillRoundedRect(55,265,70,65,2);g.fillRoundedRect(245,265,70,65,2);
    g.fillStyle(0x001a00,1);g.fillRoundedRect(60,60,100,120,4);g.fillRoundedRect(230,60,100,120,4);
    g.fillStyle(0x003300,1);g.fillRect(60,118,100,4);g.fillRect(160,62,4,120);
    g.fillStyle(0x00aa22,0.07);g.fillRect(62,62,48,116);g.fillRect(112,62,46,116);
  });
  makeTex(scene,'bg-hotel',GW,GH,g=>{
    g.fillStyle(0x1A120A,1);g.fillRect(0,0,GW,GH);
    g.fillStyle(0x2A1E14,1);g.fillRect(0,0,GW,380);
    g.fillStyle(0x3A2C20,1);g.fillRect(0,380,GW,GH-380);
    g.fillStyle(0xEEDDBB,1);g.fillRoundedRect(80,280,230,160,6);
    g.fillStyle(0xDDCCAA,1);g.fillRoundedRect(80,280,230,50,6);
    g.fillStyle(0xF5EEDD,1);g.fillRoundedRect(90,296,100,28,4);g.fillRoundedRect(200,296,100,28,4);
    g.fillStyle(0x5C3317,1);g.fillRoundedRect(70,240,250,50,6);
    g.fillStyle(0x2A3A2A,1);g.fillRoundedRect(155,258,80,44,6);
    g.fillStyle(0x3A4A3A,1);g.fillRoundedRect(160,263,70,34,4);
    g.fillStyle(0xCCCCAA,1);g.fillRoundedRect(183,254,34,8,3);
    g.fillStyle(0x888866,1);g.fillRect(160,278,70,2);
    g.fillStyle(0x8B6040,1);g.fillRect(310,300,6,60);g.fillRoundedRect(296,298,34,4,2);
    g.fillStyle(0xFFCC88,0.35);g.fillEllipse(313,300,60,40);
    g.fillStyle(0x4A3420,1);g.fillRect(40,60,80,140);
    g.fillStyle(0x382818,1);g.fillRect(42,62,36,136);g.fillRect(80,62,36,136);
    g.fillStyle(0xFFCC88,0.08);g.fillRect(44,64,34,132);
  });
  makeTex(scene,'bg-dc-top',GW,GH,g=>{
    g.fillStyle(0x2A2A2A,1);g.fillRect(0,0,GW,GH);
    g.fillStyle(0x333333,1);g.fillRect(80,0,80,GH);g.fillRect(230,0,80,GH);
    g.fillRect(0,100,GW,60);g.fillRect(0,280,GW,60);g.fillRect(0,460,GW,60);
    g.fillStyle(0x888800,0.5);
    for(let y=0;y<GH;y+=40){g.fillRect(118,y,6,20);g.fillRect(268,y,6,20);}
    for(let x=0;x<GW;x+=40){g.fillRect(x,128,20,6);g.fillRect(x,308,20,6);}
    g.fillStyle(0x1A1A2A,1);
    g.fillRect(0,0,78,98);g.fillRect(162,0,66,98);g.fillRect(312,0,GW-312,98);
    g.fillRect(0,162,78,116);g.fillRect(162,162,66,116);g.fillRect(312,162,GW-312,116);
    g.fillRect(0,342,78,116);g.fillRect(162,342,66,116);g.fillRect(312,342,GW-312,116);
    g.fillStyle(0xCCCC44,0.25);
    [[10,10],[30,10],[50,10],[10,30],[30,30],[10,50],[30,50]].forEach(([x,y])=>{
      g.fillRect(x,y,10,8);g.fillRect(x+170,y,10,8);
      g.fillRect(x,y+162,10,8);g.fillRect(x+170,y+162,10,8);
    });
  });
  makeTex(scene,'bg-capitol',GW*2,GH,g=>{
    g.fillStyle(0x5A7FBF,1);g.fillRect(0,0,GW*2,GH*0.45);
    g.fillStyle(0x7A9FDF,1);g.fillRect(0,0,GW*2,GH*0.3);
    g.fillStyle(0xEEEEFF,0.65);
    [[80,60,80],[220,40,60],[350,70,70],[500,50,55],[620,65,65]].forEach(([x,y,r])=>g.fillEllipse(x,y,r*2,r));
    g.fillStyle(0xE8E4D8,1);g.fillEllipse(GW,GH*0.35,200,180);
    g.fillStyle(0xD4D0C4,1);g.fillRect(GW-60,GH*0.35,120,GH*0.2);
    g.fillStyle(0xF0EDE0,1);for(let i=0;i<8;i++)g.fillRect(GW-110+i*30,GH*0.28,14,GH*0.27);
    g.fillStyle(0xE0DDD0,1);g.fillRect(GW-150,GH*0.55,300,12);g.fillRect(GW-170,GH*0.57,340,12);
    g.fillStyle(0x8A8878,1);g.fillRect(0,GH*0.6,GW*2,GH*0.4);
    g.fillStyle(0x9A9A88,1);g.fillRect(0,GH*0.6,GW*2,18);
    g.fillStyle(0x2A5A2A,1);
    [50,150,350,430,600,700].forEach(x=>{g.fillEllipse(x,GH*0.5,80,60);g.fillRect(x-5,GH*0.5,10,GH*0.15);});
  });
  makeTex(scene,'bg-corridor',GW,GH,g=>{
    g.fillStyle(0x1A1A0A,1);g.fillRect(0,0,GW,GH);
    g.fillStyle(0xD4D0C0,1);g.fillRect(0,380,GW,GH-380);
    for(let x=0;x<GW;x+=60)g.fillRect(x,380,2,GH-380);
    for(let y=380;y<GH;y+=60)g.fillRect(0,y,GW,2);
    g.fillStyle(0xE8E4D4,1);g.fillRect(0,0,GW,380);
    g.fillStyle(0xD0CCC0,1);g.fillRect(0,240,GW,12);
    g.fillStyle(0xEEEADA,1);g.fillRect(20,0,24,380);g.fillRect(GW-44,0,24,380);
    g.fillStyle(0xD8D4C4,1);g.fillRect(22,0,4,380);g.fillRect(GW-42,0,4,380);
    g.fillStyle(0x5C3317,1);g.fillRoundedRect(GW/2-70,60,140,280,4);
    g.fillStyle(0x4A2A10,1);g.fillRoundedRect(GW/2-65,65,60,270,2);g.fillRoundedRect(GW/2+5,65,60,270,2);
    g.fillStyle(0xCCAA44,1);g.fillCircle(GW/2-10,200,6);g.fillCircle(GW/2+10,200,6);
    g.fillStyle(0xEEEADA,1);g.fillEllipse(GW/2,60,160,60);
    g.fillStyle(0x5C3317,1);g.fillEllipse(GW/2,68,130,44);
  });
  makeTex(scene,'bg-senate',GW,GH,g=>{
    g.fillStyle(0x1A1008,1);g.fillRect(0,0,GW,GH);
    g.fillStyle(0xCCCCC0,1);g.fillRect(0,400,GW,GH-400);
    for(let x=0;x<GW;x+=50)g.fillRect(x,400,2,GH-400);
    for(let y=400;y<GH;y+=50)g.fillRect(0,y,GW,2);
    g.fillStyle(0xE8E4D4,1);g.fillRect(0,0,GW,400);
    g.fillStyle(0x5C3317,1);g.fillRoundedRect(GW/2-100,20,94,360,4);g.fillRoundedRect(GW/2+6,20,94,360,4);
    g.fillStyle(0x4A2A10,1);
    g.fillRoundedRect(GW/2-94,26,40,348,2);g.fillRoundedRect(GW/2-50,26,40,348,2);
    g.fillRoundedRect(GW/2+10,26,40,348,2);g.fillRoundedRect(GW/2+54,26,40,348,2);
    g.fillStyle(0xCCAA44,1);g.fillRoundedRect(GW/2-18,192,18,20,4);g.fillRoundedRect(GW/2,192,18,20,4);
    g.fillStyle(0xEEEADA,1);g.fillRect(0,0,28,GH);g.fillRect(GW-28,0,28,GH);
    g.fillStyle(0xCCAA44,0.35);g.fillRect(GW/2-50,392,100,3);
  });
  makeTex(scene,'bg-ending',GW,GH,g=>{
    g.fillStyle(0x0e0b08,1);g.fillRect(0,0,GW,GH);
    g.fillStyle(0x1a1208,1);g.fillRect(0,GH*0.45,GW,GH);
    g.fillStyle(0x261a0e,1);g.fillRect(0,GH*0.78,GW,GH);
    g.fillStyle(0xFFCC88,0.06);g.fillEllipse(GW*0.75,GH*0.22,200,90);
    g.fillStyle(0x8B6040,1);g.fillRect(GW*0.68,GH*0.32,6,GH*0.4);g.fillRoundedRect(GW*0.6,GH*0.3,22,4,2);
    g.fillStyle(0xFFCC88,0.22);g.fillEllipse(GW*0.71,GH*0.33,50,30);
    g.fillStyle(0xFFCC88,0.25);
    [[55,45],[110,70],[195,28],[268,52],[340,38],[88,108],[298,95],[175,55]].forEach(([x,y])=>g.fillCircle(x,y,1.5));
    g.fillStyle(0x2a1c0e,1);g.fillRect(0,GH*0.82,GW,GH*0.18);
  });
}

/* ── SCENE: BOOT ── */
class BootScene extends Phaser.Scene{
  constructor(){super('Boot');}
  create(){buildTextures(this);this.scene.start('Title');}
}

/* ── SCENE: TITLE ── */
class TitleScene extends Phaser.Scene{
  constructor(){super('Title');}
  create(){
    setScene('title');hideAllUI();
    // CRT policy-game aesthetic — no Merlin, maintain sequel deception
    this.add.rectangle(GW/2,GH/2,GW,GH,0x060e06);
    for(let y=0;y<GH;y+=4)this.add.rectangle(GW/2,y,GW,2,0x000000,0.12);
    // Anthony center-stage, alone
    this.add.image(GW/2,GH*0.50,'anthony-crt').setScale(1.1).setDepth(4);
    this.add.text(GW/2,GH*0.72,'ANTHONY',{fontFamily:'Press Start 2P,monospace',fontSize:'5px',color:'#ffd700'}).setOrigin(0.5).setDepth(5);
    // Fake-sequel title text
    this.add.text(GW/2,GH*0.13,"ANTHONY'S",{fontFamily:'Press Start 2P,monospace',fontSize:'9px',color:'#ffd700',align:'center',stroke:'#5a3a00',strokeThickness:2}).setOrigin(0.5).setDepth(5);
    this.add.text(GW/2,GH*0.20,'POLICY JOURNEY',{fontFamily:'Press Start 2P,monospace',fontSize:'9px',color:'#ffd700',align:'center'}).setOrigin(0.5).setDepth(5);
    this.add.text(GW/2,GH*0.29,'CHAPTER TWO',{fontFamily:'Press Start 2P,monospace',fontSize:'7px',color:'#00bb33',align:'center'}).setOrigin(0.5).setDepth(5);
    this.add.text(GW/2,GH*0.36,'THE HILL BECKONS',{fontFamily:'VT323,monospace',fontSize:'26px',color:'#b8f0b8',align:'center'}).setOrigin(0.5).setDepth(5);
    this.add.text(GW/2,GH*0.43,'A Policy RPG — Real Stakes, Impossible Choices',{fontFamily:'VT323,monospace',fontSize:'13px',color:'#336633',align:'center',wordWrap:{width:GW-40}}).setOrigin(0.5).setDepth(5);
    const tap=this.add.text(GW/2,GH*0.82,'▶ TAP TO BEGIN',{fontFamily:'Press Start 2P,monospace',fontSize:'8px',color:'#D4A843'}).setOrigin(0.5).setDepth(5);
    this.tweens.add({targets:tap,alpha:0,duration:600,yoyo:true,repeat:-1,ease:'Step'});
    this.add.text(GW/2,GH*0.90,'v2.0  ·  VEEVA SITE SOLUTIONS  ·  MADISON WI',{fontFamily:'Press Start 2P,monospace',fontSize:'4px',color:'#224422',align:'center'}).setOrigin(0.5).setDepth(5);
    this.input.once('pointerdown',()=>{Audio.click();this.scene.start('Prologue');});
  }
}

/* ── SCENE: PROLOGUE ── */
class PrologueScene extends Phaser.Scene{
  constructor(){super('Prologue');}
  create(){
    setScene('prologue');window.__gameState.aesthetic='crt';hideAllUI();
    this.add.image(GW/2,GH/2,'bg-office');
    for(let y=0;y<GH;y+=4)this.add.rectangle(GW/2,y,GW,2,0x000000,0.1).setDepth(10);
    this.anthony=this.add.image(GW*0.28,GH*0.52,'anthony-crt').setScale(1.1).setDepth(3);
    this.nick=this.add.image(GW*0.72,GH*0.52,'nick-crt').setScale(1.2).setDepth(3);
    this.add.text(GW*0.28,GH*0.68,'ANTHONY',{fontFamily:'Press Start 2P,monospace',fontSize:'6px',color:'#ffd700'}).setOrigin(0.5).setDepth(5);
    this.add.text(GW*0.72,GH*0.68,'NICK',{fontFamily:'Press Start 2P,monospace',fontSize:'6px',color:'#ffd700'}).setOrigin(0.5).setDepth(5);
    this._dlg1();
  }
  _dlg1(){
    Dlg.show([
      {speaker:'NICK',text:"Anthony. Good news and bad news. Which first."},
      {speaker:'ANTHONY',text:"There's never actually a good news option with you, Nick."},
      {speaker:'NICK',text:"Fair. FDA RFI submitted. Twenty pages. Clean. Peter said solid."},
      {speaker:'ANTHONY',text:"Peter said solid. That is literally the best possible outcome."},
      {speaker:'NICK',text:"Senate HELP Committee. Washington DC. They want you there."},
      {speaker:'ANTHONY',text:"...When."},
      {speaker:'NICK',text:"Tomorrow. Bernie Sanders specifically requested you."},
      {speaker:'ANTHONY',text:"Bernie. Bernie Sanders. Specifically. Requested me."},
      {speaker:'NICK',text:"That is exactly what I said."},
      {speaker:'ANTHONY',text:"...oh noooo. But in a good way."},
      {speaker:'NICK',text:"Pack light. Be sharp. Don't forget the cheetah jacket."},
      {speaker:'ANTHONY',text:"Nick. I'm going to the United States Senate."},
      {speaker:'NICK',text:"I know. Don't forget the cheetah jacket."},
    ],()=>this._packChoice());
  }
  _packChoice(){
    showChoices([
      {text:"🐆 Pack it. It's who you are."},
      {text:"🤵 Leave it. Be serious. This is the Senate."},
    ],(i)=>{
      const msg=i===0
        ?"Anthony packed the cheetah jacket. Of course he did. Some choices are not choices at all."
        :"Anthony put the cheetah jacket down. Then picked it back up. Then put it in the bag. There was never really a choice.";
      Dlg.show([{speaker:'NARRATOR',text:msg}],()=>this._suitcase());
    });
  }
  _suitcase(){
    this.cameras.main.fadeOut(600,0,0,0);
    this.time.delayedCall(700,()=>{
      this.cameras.main.fadeIn(600,0,0,0);
      this.anthony.setVisible(false);this.nick.setVisible(false);
      // Subtle rattle — no Merlin reveal yet
      Dlg.show([
        {speaker:'NARRATOR',text:"INT. BAGGAGE HOLD. DANE COUNTY AIRPORT. 5:52 AM."},
        {speaker:'NARRATOR',text:"The sound of wheels on tarmac. The low hum of a departing aircraft."},
        {speaker:'NARRATOR',text:"Anthony's suitcase rattled. Once."},
        {speaker:'NARRATOR',text:"He was already on the jet bridge. He did not hear it."},
      ],()=>showTitleCard('CHAPTER ONE','THE HILL BECKONS',()=>this.scene.start('Plane')));
    });
  }
}

/* ── SCENE: PLANE ── */
class PlaneScene extends Phaser.Scene{
  constructor(){super('Plane');}
  create(){
    setScene('plane');hideAllUI();
    this.add.rectangle(GW/2,GH/2,GW,GH,0x080808);
    // Departures-board readout — clearly two different airports
    this.add.text(GW/2,GH*0.10,'DEPARTING',{fontFamily:'Press Start 2P,monospace',fontSize:'6px',color:'#336633',align:'center'}).setOrigin(0.5);
    this.add.text(GW/2,GH*0.145,'DANE COUNTY REGIONAL AIRPORT',{fontFamily:'Press Start 2P,monospace',fontSize:'6px',color:'#ffd700',align:'center'}).setOrigin(0.5);
    this.add.text(GW/2,GH*0.185,'Madison, Wisconsin · 6:15 AM',{fontFamily:'VT323,monospace',fontSize:'17px',color:'#00bb33',align:'center'}).setOrigin(0.5);
    this.add.text(GW/2,GH*0.245,'▼',{fontFamily:'VT323,monospace',fontSize:'18px',color:'#336633',align:'center'}).setOrigin(0.5);
    this.add.text(GW/2,GH*0.30,'ARRIVING',{fontFamily:'Press Start 2P,monospace',fontSize:'6px',color:'#336633',align:'center'}).setOrigin(0.5);
    this.add.text(GW/2,GH*0.345,'REAGAN NATIONAL (DCA)',{fontFamily:'Press Start 2P,monospace',fontSize:'6px',color:'#ffd700',align:'center'}).setOrigin(0.5);
    this.add.text(GW/2,GH*0.385,'Washington, DC',{fontFamily:'VT323,monospace',fontSize:'17px',color:'#00bb33',align:'center'}).setOrigin(0.5);
    // Anthony walks across airport — stays in his Madison outfit (pre-reveal).
    const ant=this.add.image(-30,GH*0.55,'anthony-crt').setScale(0.9);
    this.walkTimer=this.time.addEvent({delay:200,repeat:22,callback:()=>{
      ant.x+=16;ant.y=GH*0.55+(ant.x/16%2===0?-2:2);// subtle stride bob, same texture
    }});
    this.time.delayedCall(5000,()=>this._planeInterior());
  }
  _planeInterior(){
    this.children.removeAll(true);
    this.add.rectangle(GW/2,GH/2,GW,GH,0x0a0a1a);
    this.add.rectangle(GW/2,GH*0.3,GW,GH*0.55,0x151525);
    for(let i=0;i<5;i++){
      this.add.rectangle(60+i*66,GH*0.32,42,30,0x0a0a0a).setStrokeStyle(1,0x224422);
      this.add.rectangle(60+i*66,GH*0.32,34,22,0x002a00,0.3);
    }
    const bin=this.add.rectangle(GW/2,GH*0.1,180,52,0x1a1a2a).setStrokeStyle(2,0x224422);
    this.add.image(GW*0.3,GH*0.52,'anthony-crt').setScale(0.9);
    Dlg.show([
      {speaker:'NARRATOR',text:"Flight 2247. Madison to Ronald Reagan Washington National. 2 hours 14 minutes."},
      {speaker:'ANTHONY',text:"Senate HELP jurisdiction. ADA compliance frameworks. FDA digital health guidance. Bernie's known positions on healthcare interoperability..."},
      {speaker:'NARRATOR',text:"Thirty thousand feet over Indiana, the overhead bin rattled."},
    ],()=>{
      this.tweens.add({targets:bin,x:GW/2+5,duration:60,yoyo:true,repeat:7,onComplete:()=>{
        Dlg.show([
          {speaker:'ANTHONY',text:"..."},
          {speaker:'NARRATOR',text:"Anthony looked at the bin. The bin was still. The bin was fine. Anthony put his headphones back on."},
          {speaker:'NARRATOR',text:"The bin was not fine."},
        ],()=>this._hotelArrival());
      }});
      Audio.boof();
    });
  }
  _hotelArrival(){
    this.cameras.main.fadeOut(500,0,0,0);
    this.time.delayedCall(600,()=>{
      this.children.removeAll(true);
      this.add.image(GW/2,GH/2,'bg-hotel');
      this.cameras.main.fadeIn(500,0,0,0);
      this.add.image(GW*0.35,GH*0.54,'anthony-crt').setScale(0.95);
      Dlg.show([
        {speaker:'NARRATOR',text:"The Marriott on E Street, Washington DC. Room 1147."},
        {speaker:'NARRATOR',text:"Anthony closed the door quickly. Hung the do-not-disturb sign."},
        {speaker:'ANTHONY',text:"I'm probably just tired."},
        {speaker:'NARRATOR',text:"He opened the suitcase."},
      ],()=>{this.cameras.main.fadeOut(400,0,0,0);this.time.delayedCall(450,()=>this.scene.start('Hotel'));});
    });
  }
}

/* ── SCENE: HOTEL (THE REVEAL) ── */
class HotelScene extends Phaser.Scene{
  constructor(){super('Hotel');}
  create(){
    setScene('hotel');hideAllUI();
    this.add.image(GW/2,GH/2,'bg-hotel');
    this.cameras.main.fadeIn(400);
    this.anthony=this.add.image(GW*0.32,GH*0.52,'anthony-crt').setScale(0.95).setDepth(3);
    this.time.delayedCall(600,()=>this._reveal());
  }
  _reveal(){
    Dlg.show([{speaker:'NARRATOR',text:"The suitcase opened."}],()=>{
      flashScreen('warm',900);
      this.cameras.main.flash(600,255,200,50);
      Audio.boof(1.4);
      this.time.delayedCall(750,()=>{
        window.__gameState.aesthetic='chaos';
        this.add.image(GW/2,GH/2,'bg-hotel').setDepth(0);
        // Anthony stays in his Madison outfit — the cheetah jacket comes in Ch.2.
        this.anthony.setScale(1.0).setDepth(3);
        this.merlin=this.add.image(GW*0.65,GH*0.53,'merlin-idle').setScale(0.62).setDepth(4).setAlpha(0);
        this.tweens.add({targets:this.merlin,alpha:1,y:GH*0.53,duration:400});
        Audio.boof();
        this.add.text(GW*0.65,GH*0.7,'MERLIN',{fontFamily:'Fredoka One,sans-serif',fontSize:'13px',color:'#D4A843'}).setOrigin(0.5).setDepth(5);
        this.add.text(GW*0.32,GH*0.7,'ANTHONY',{fontFamily:'Press Start 2P,monospace',fontSize:'6px',color:'#ffd700'}).setOrigin(0.5).setDepth(5);
        this.time.delayedCall(500,()=>this._revealDlg());
      });
    });
  }
  _revealDlg(){
    Dlg.show([
      {speaker:'MERLIN',text:"OH. This is not the house. This is a very different house. Very small. But it smells like Anthony. Merlin loves Anthony. The couch movie nights. The big shepherds. This is fine."},
      {speaker:'ANTHONY',text:"...Merlin."},
      {speaker:'MERLIN',text:"Hello Anthony. Merlin is here."},
      {speaker:'ANTHONY',text:"You were in my suitcase. That suitcase was checked. At an airport. With TSA."},
      {speaker:'MERLIN',text:"Yes. Merlin went in there. And then Merlin was here. It worked out very well."},
      {speaker:'NARRATOR',text:"Nobody has asked Merlin how he left the house. Merlin has not volunteered this information. The investigation is ongoing."},
      {speaker:'ANTHONY',text:"Okay. New plan. You're a fact now, not a question. I have a Senate HELP hearing in nine hours and I am going to walk in there prepared."},
      {speaker:'MERLIN',text:"Merlin smells a man named Bernie. Is he important? Is he giving out treats?"},
      {speaker:'ANTHONY',text:"He's a United States Senator, and— how do you already— you know what, fine. We adapt. We always adapt."},
      {speaker:'MERLIN',text:"That sounds like a very good dog. Merlin supports this."},
      {speaker:'ANTHONY',text:"...oh noooo. But in a manageable way."},
    ],()=>this._nickChoice());
  }
  _nickChoice(){
    showChoices([
      {text:"📞 Call Nick. He needs to know about this."},
      {text:"🐆 Proceed as if this is normal. It's fine."},
    ],(i)=>{
      if(i===0){
        Dlg.show([
          {speaker:'NICK',text:"...why is Merlin in DC."},
          {speaker:'ANTHONY',text:"Unknown. I've decided to treat it as a logistics problem, not a metaphysics problem."},
          {speaker:'NICK',text:"Okay but how did he get in your suitcase. Like physically. How."},
          {speaker:'ANTHONY',text:"Nick. Nobody has asked Merlin how he left the house. He has not volunteered it. I'm told the investigation is ongoing."},
          {speaker:'NICK',text:"Who's investigating—"},
          {speaker:'ANTHONY',text:"Unclear. Moving on. I've got my talking points, the RFI numbers cold, and a backup framework if Bernie goes off-script."},
          {speaker:'NICK',text:"...you actually sound ready. Don't let the dog near the Senate cafeteria."},
          {speaker:'MERLIN',text:"Merlin heard cafeteria. Merlin is very interested in this."},
        ],()=>this._titleCard());
      }else{
        Dlg.show([
          {speaker:'NARRATOR',text:"Anthony did not call Nick. Some situations require executive decisiveness. Probably."},
          {speaker:'MERLIN',text:"Merlin is ready for adventure. Merlin has done adventure before. Merlin is very good at it."},
          {speaker:'ANTHONY',text:"You literally do not know what adventure means."},
          {speaker:'MERLIN',text:"Merlin knows it smells good. That is enough."},
        ],()=>this._titleCard());
      }
    });
  }
  _titleCard(){this.scene.start('RevealTitle');}
}

/* ── SCENE: REAL TITLE REVEAL (only after the hotel Merlin reveal) ── */
class RevealTitleScene extends Phaser.Scene{
  constructor(){super('RevealTitle');}
  create(){
    setScene('revealtitle');hideAllUI();
    window.__gameState.aesthetic='chaos';
    this.add.rectangle(GW/2,GH/2,GW,GH,0x140d05);
    // Warm vignette + confetti-ish specks
    for(let i=0;i<40;i++){
      const x=(i*97)%GW,y=(i*53)%GH;
      this.add.rectangle(x,y,2,2,0xD4A843,0.25);
    }
    this.add.image(GW*0.30,GH*0.50,'anthony-crt').setScale(1.05).setDepth(3);
    this.add.image(GW*0.66,GH*0.52,'merlin-idle').setScale(0.62).setDepth(4);
    this.add.text(GW/2,GH*0.16,'ANTHONY & MERLIN',{fontFamily:'Fredoka One,sans-serif',fontSize:'24px',color:'#D4A843',align:'center',stroke:'#3a2400',strokeThickness:4}).setOrigin(0.5).setDepth(6);
    this.add.text(GW/2,GH*0.255,'THE ADVENTURE GETS WEIRD',{fontFamily:'Press Start 2P,monospace',fontSize:'9px',color:'#F0EAD8',align:'center'}).setOrigin(0.5).setDepth(6);
    this.add.text(GW/2,GH*0.31,'...nobody knows how the dog got here',{fontFamily:'VT323,monospace',fontSize:'15px',color:'#88ee88',align:'center',wordWrap:{width:GW-40}}).setOrigin(0.5).setDepth(6);
    const tap=this.add.text(GW/2,GH*0.86,'▶ TAP TO CONTINUE',{fontFamily:'Press Start 2P,monospace',fontSize:'8px',color:'#D4A843'}).setOrigin(0.5).setDepth(6);
    this.tweens.add({targets:tap,alpha:0,duration:600,yoyo:true,repeat:-1,ease:'Step'});
    Audio.fanfare();
    this.input.once('pointerdown',()=>{Audio.click();this._toChapterTwo();});
    // Fallback auto-advance so the scene is never a dead end
    this.time.delayedCall(9000,()=>{if(this.scene.isActive())this._toChapterTwo();});
  }
  _toChapterTwo(){
    if(this._advanced)return;this._advanced=true;
    // Anthony dons the cheetah jacket — Ch.2 begins.
    Dlg.show([
      {speaker:'NARRATOR',text:"Anthony reached into the suitcase, past the dog-shaped impossibility, and pulled out the cheetah jacket."},
      {speaker:'ANTHONY',text:"If I'm walking into the United States Senate with a stowaway dog, I'm doing it in the jacket. Confidence is a strategy."},
      {speaker:'MERLIN',text:"The jacket smells like the good days. Merlin trusts the jacket."},
      {speaker:'ANTHONY',text:"Alright, Merlin. You read smells, I read rooms. Between us we're basically a functioning delegation."},
    ],()=>showTitleCard('CHAPTER TWO','DC TRAFFIC IS A THREAT TO NATIONAL SECURITY',()=>this.scene.start('Routing')));
  }
}

/* ── SCENE: ROUTING PUZZLE ── */
const ROUTES=[
  {name:'K Street Corridor',emoji:'🚫',status:'blocked',
   anthony:"Primary route. 31-car Secret Service motorcade blocking every lane. Has been running for 47 minutes. Zero viable gaps.",
   merlin:"Smells like exhaust and important people who do not like other people. Merlin does not enjoy this smell."},
  {name:'Pennsylvania Ave via 17th',emoji:'🚧',status:'blocked',
   anthony:"Parallel option. Active construction on the north end. 45-minute minimum. We miss the hearing window.",
   merlin:"Construction smells like loud and concrete. Merlin does not like loud. Merlin would like to leave this area immediately."},
  {name:'Constitution Ave — Mall Route',emoji:'⚠️',status:'damage',damage:15,
   anthony:"Long way around. The Mall is packed with tourists. Passable but we lose significant time.",
   merlin:"Merlin smells MANY children. And ice cream. This is relevant. Merlin is very distracted. Merlin is fine. Merlin is focused. Ice cream."},
  {name:'Metro Center Underground',emoji:'🚇',status:'blocked',
   anthony:"Metro is technically an option but we're 20 minutes from the nearest station on foot. The math does not work.",
   merlin:"Underground smells like everyone who has ever existed all at the same time. Merlin cannot process this. Merlin will never go underground."},
  {name:'G Street Service Route',emoji:'❓',status:'blocked',
   anthony:"Service roads. Theoretically possible. There's an unmarked black van parked on G Street since last Tuesday. I don't love it.",
   merlin:"The van smells like government and coffee and something Merlin does not want to investigate. Merlin has decided. Not that way."},
  {name:'17th St Alley — Hot Dog Route',emoji:'🌭',status:'win',
   anthony:"Wait. There's a gap off 17th. Street vendor in an active argument with parking enforcement right at the motorcade exit. 40-foot gap. This is the play.",
   merlin:"HOT DOGS. That is the smell. That is absolutely the correct direction. Merlin has never been more certain. GO THAT WAY. THAT WAY IS RIGHT."},
];

class RoutingScene extends Phaser.Scene{
  constructor(){super('Routing');}
  create(){
    setScene('routing');hideAllUI();
    this.add.image(GW/2,GH/2,'bg-dc-top');
    // Cab on street
    this.add.rectangle(GW/2,170,120,60,0xDDCC44,1).setDepth(2);
    this.add.rectangle(GW/2,170,80,40,0xAA8800,0.5).setDepth(3);
    this.add.image(GW/2-22,175,'anthony-idle').setScale(0.46).setDepth(4);
    this.add.image(GW/2+20,177,'merlin-sit').setScale(0.26).setDepth(4);
    this.add.text(GW/2,22,'K STREET LOCKDOWN',{fontFamily:'Press Start 2P,monospace',fontSize:'6px',color:'#ff4444',align:'center'}).setOrigin(0.5).setDepth(5);
    this.add.text(GW/2,38,'SELECT YOUR ROUTE',{fontFamily:'VT323,monospace',fontSize:'20px',color:'#D4A843',align:'center'}).setOrigin(0.5).setDepth(5);
    this._firstFail=false;this._cyndieDone=false;
    this._buildUI();
  }
  _buildUI(){
    const c=document.getElementById('routing-container');
    c.innerHTML='<div class="routing-header">— CHOOSE YOUR ROUTE —</div>';
    ROUTES.forEach((r,i)=>{
      const d=document.createElement('div');
      d.className='route-option';d.id='ropt-'+i;
      d.innerHTML=`<div class="route-name">${r.emoji} ${r.name}</div>`+
        `<div class="route-anthony">📋 ${r.anthony}</div>`+
        `<div class="route-merlin">🐾 ${r.merlin}</div>`;
      const go=()=>this._pick(i);
      d.addEventListener('click',go);
      d.addEventListener('touchend',(e)=>{e.preventDefault();go();},{passive:false});
      c.appendChild(d);
    });
    c.style.display='flex';
  }
  _pick(i){
    const r=ROUTES[i];
    document.querySelectorAll('.route-option').forEach(el=>el.classList.remove('selected'));
    const el=document.getElementById('ropt-'+i);if(el)el.classList.add('selected');
    Audio.click();window.__gameState.routingChoice=i;
    if(r.status==='win'){
      document.getElementById('routing-container').style.display='none';
      flashScreen('gold',400);Audio.fanfare();
      Dlg.show([
        {speaker:'MERLIN',text:"HOT DOGS WERE CORRECT. Merlin is very smart. You are all welcome."},
        {speaker:'ANTHONY',text:"You routed us through a Federal motorcade gap using hot dog smell."},
        {speaker:'MERLIN',text:"Merlin helped. Merlin is beginning to understand government."},
        {speaker:'NARRATOR',text:"The cab slid through the gap on 17th. The vendor and officer did not notice. The Secret Service did not notice. Nobody noticed. Merlin was very proud."},
      ],()=>showTitleCard('CHAPTER THREE','THE STAFFERS HAVE NOTHING TO LOSE',()=>this.scene.start('BeatEmUp')));
    }else if(r.status==='damage'){
      if(!this._firstFail){this._firstFail=true;this._cyndie(()=>this._dmg(r));}
      else this._dmg(r);
    }else{
      if(!this._firstFail){this._firstFail=true;this._cyndie(()=>{});}
      else Dlg.show([{speaker:'NARRATOR',text:"Blocked. Anthony noted this with the quiet efficiency of someone who has navigated a 20-page FDA RFI."}],()=>{document.getElementById('routing-container').style.display='flex';});
    }
  }
  _dmg(r){
    window.__gameState.hp=Math.max(0,window.__gameState.hp-r.damage);
    flashScreen('red',300);
    Dlg.show([
      {speaker:'NARRATOR',text:`The Constitution Ave detour cost them ${r.damage} minutes and Merlin's full attention (ice cream). They had to backtrack.`},
      {speaker:'MERLIN',text:"Merlin did not get ice cream. This is a very difficult day for Merlin."},
    ],()=>{document.getElementById('routing-container').style.display='flex';});
  }
  _cyndie(onDone){
    if(this._cyndieDone){onDone();return;}
    this._cyndieDone=true;
    document.getElementById('routing-container').style.display='none';
    // Brief "incoming call" flash, then tap-based dialogue
    const ov=document.getElementById('cyndie-call');
    document.getElementById('cyndie-text').textContent='';
    ov.style.display='flex';
    Audio.boof(0.7);
    // 1-second incoming call display, then switch to tap dialogue
    // Use native setTimeout so it fires in headless/throttled rAF environments too
    setTimeout(()=>{
      ov.style.display='none';
      Dlg.show([
        {speaker:'📱 CYNDIE',text:"Anthony. Where are you right now."},
        {speaker:'ANTHONY',text:"Washington DC. Senate HELP Committee. Bernie Sanders' office specifically—"},
        {speaker:'📱 CYNDIE',text:"When were you going to TELL me you were flying to DC."},
        {speaker:'ANTHONY',text:"I was going to call you right after the—"},
        {speaker:'MERLIN',text:"BOOF."},
        {speaker:'📱 CYNDIE',text:"...is that a dog."},
        {speaker:'ANTHONY',text:"..."},
        {speaker:'📱 CYNDIE',text:"Is that MERLIN. Did you bring Merlin to the United States Senate."},
        {speaker:'MERLIN',text:"BOOF BOOF."},
        {speaker:'📱 CYNDIE',text:"How did he even get out of the house. The doors were locked. I locked them."},
        {speaker:'ANTHONY',text:"Cyndie, I have looked into this personally. Nobody has asked Merlin how he left the house. He has not volunteered it. The investigation is ongoing."},
        {speaker:'📱 CYNDIE',text:"...the investigation. Anthony."},
        {speaker:'ANTHONY',text:"I know. But here's where we are: I've got my talking points, the jacket, and a dog who's somehow opening doors for me. I'm going to make it work. I always make it work."},
        {speaker:'📱 CYNDIE',text:"...you actually sound on top of it. We are STILL talking about this later."},
        {speaker:'MERLIN',text:"Merlin said hello to Cyndie. Cyndie did not hear it. Merlin said it anyway."},
      ],()=>{
        document.getElementById('routing-container').style.display='flex';
        onDone();
      });
    });
  }
}

/* ── SCENE: BEAT-EM-UP ── */
class BeatEmUpScene extends Phaser.Scene{
  constructor(){super('BeatEmUp');}
  create(){
    setScene('beatemup');hideAllUI();
    window.__gameState.hp=100;window.__gameState.maxHp=100;
    // Scrolling background
    this.bg=this.add.tileSprite(GW/2,GH/2,GW,GH,'bg-capitol');
    this.bgOffset=0;
    // Ground line
    this.groundY=GH*0.72;
    // Player state
    this.player={x:GW*0.22,y:this.groundY,w:50,h:88,state:'idle',stateTimer:0,facing:1,immune:false,immuneTimer:0};
    this.merlinState={x:GW*0.1,y:this.groundY+20,tackling:false,tackleTarget:null,tackleTimer:0,cooldown:0,returnTimer:0};
    this.enemies=[];this.projectiles=[];
    this.enemyMargin=40;// horizontal bound so staffers stay on-screen
    this.wave=0;this.waveActive=false;this.waveCleared=false;this.scriptedFired=false;
    this.gameOver=false;
    // Sprites
    this.anthonySprite=this.add.image(this.player.x,this.player.y,'anthony-idle').setDepth(4).setOrigin(0.5,1);
    this.merlinSprite=this.add.image(this.merlinState.x,this.merlinState.y,'merlin-walk').setDepth(4).setOrigin(0.5,1).setScale(0.45);
    // Name tags
    this.antTag=this.add.text(this.player.x,this.groundY+8,'ANTHONY',{fontFamily:'Press Start 2P,monospace',fontSize:'5px',color:'#ffd700'}).setOrigin(0.5).setDepth(5);
    this.merTag=this.add.text(this.merlinState.x,this.groundY+30,'MERLIN',{fontFamily:'Fredoka One,sans-serif',fontSize:'10px',color:'#88ee88'}).setOrigin(0.5).setDepth(5);
    // HP bar
    document.getElementById('hp-bar-wrap').style.display='flex';
    updateHPBar();
    // Input state — set before controls so listeners always have a target
    this.keys={left:false,right:false,duck:false};
    // Bind controls now, but keep them HIDDEN until the intro is read.
    this._setupControls();
    this._hideControls();
    // Start intro — explanatory text first, controls appear only after.
    Dlg.show([
      {speaker:'NARRATOR',text:"The Capitol complex perimeter. The recently unemployed DC staffers had been milling outside for three days. They had their laptops. Their kombucha. Their lanyards."},
      {speaker:'NARRATOR',text:"When they saw Anthony — and the jacket — something snapped."},
      {speaker:'MERLIN',text:"These people smell sad and angry. This is a concerning combination. Merlin is ready to help."},
      {speaker:'NARRATOR',text:"CONTROLS: ◀ ▶ move · 💼 SWING to hit · 📄 STUN to freeze them · 💨 DODGE to avoid hits · 🐾 MERLIN to tackle. Clear three waves."},
    ],()=>{this._showControls();this._spawnWave(1);});
  }
  _setupControls(){
    // Always point the live handlers at the current scene instance (scene can
    // restart after a game over, which creates a fresh instance).
    window.__beatScene=this;
    window.__anthonyMerlin.handleInput=(a)=>{
      const s=window.__beatScene;if(!s)return;
      if(a==='swing')s._doSwing();
      else if(a==='stun')s._doStun();
      else if(a==='dodge')s._doDodge();
      else if(a==='merlin')s._doMerlin();
    };
    // Attach DOM listeners exactly once — they route through window.__beatScene
    // so they never reference a stale scene after a restart.
    if(window.__beatBound)return;
    window.__beatBound=true;
    const holds={'btn-left':'left','btn-right':'right','btn-duck':'duck'};
    Object.entries(holds).forEach(([id,key])=>{
      const b=document.getElementById(id);if(!b)return;
      const set=(v)=>(e)=>{if(e)e.preventDefault();const s=window.__beatScene;if(s&&s.keys)s.keys[key]=v;};
      b.addEventListener('touchstart',set(true),{passive:false});
      b.addEventListener('touchend',set(false),{passive:false});
      b.addEventListener('mousedown',set(true));
      b.addEventListener('mouseup',set(false));
      b.addEventListener('mouseleave',set(false));
    });
    const actions={'btn-swing':'_doSwing','btn-stun':'_doStun','btn-dodge':'_doDodge','btn-merlin':'_doMerlin'};
    Object.entries(actions).forEach(([id,fn])=>{
      const b=document.getElementById(id);if(!b)return;
      const go=(e)=>{if(e)e.preventDefault();const s=window.__beatScene;if(s&&!s.gameOver&&!s.waveCleared)s[fn]();};
      b.addEventListener('touchend',go,{passive:false});
      b.addEventListener('click',go);
    });
  }
  _showControls(){const c=document.getElementById('beat-controls');if(c)c.style.display='block';}
  _hideControls(){const c=document.getElementById('beat-controls');if(c)c.style.display='none';}
  _spawnWave(n){
    this.wave=n;this.waveActive=true;this.scriptedFired=false;this.waveSpawned=false;
    const wa=document.getElementById('wave-announce');
    wa.innerHTML=`WAVE ${n}`;wa.style.display='block';
    Audio.fanfare();
    this.time.delayedCall(1800,()=>{
      wa.style.display='none';
      this._doSpawn(n);
    });
  }
  _doSpawn(wave){
    const types=['enemy-lanyard','enemy-briefcase','enemy-kombucha'];
    const counts=[4,6,6];const count=counts[wave-1]||4;
    const EM=this.enemyMargin;// keep spawns on-screen and reachable
    for(let i=0;i<count;i++){
      const side=i%2===0?1:-1;
      const tx=side===1?(GW-EM-(i%3)*10):(EM+(i%3)*10);
      const ty=this.groundY;
      const typeIdx=wave===1?(i%2):(i%3);
      const e={
        x:tx,y:ty,w:40,h:82,hp:wave===3?60:50,maxHp:wave===3?60:50,
        type:typeIdx,texture:types[typeIdx],
        state:'walk',attackTimer:0,throwTimer:wave===3?60:80,
        facing:side===1?-1:1,dead:false,sprite:null,
      };
      e.sprite=this.add.image(e.x,e.y,e.texture).setDepth(3).setOrigin(0.5,1).setScale(0.9);
      this.enemies.push(e);
    }
    this.waveSpawned=true;
  }
  update(t,dt){
    if(this.gameOver||this.waveCleared)return;
    const s=dt/1000;
    this._updatePlayer(s);
    this._updateMerlin(s);
    this._updateEnemies(s);
    this._updateProjectiles(s);
    this._checkCollisions();
    this._renderEntities();
    if(this.waveActive&&this.waveSpawned&&this._waveComplete())this._onWaveComplete();
    if(this.wave===3&&this.waveActive&&!this.scriptedFired)this._checkScriptedMoment();
  }
  _updatePlayer(s){
    const p=this.player;
    // Movement
    if(p.state==='idle'||p.state==='walk'){
      if(this.keys.left&&p.x>60){p.x-=180*s;p.facing=-1;p.state='walk';}
      else if(this.keys.right&&p.x<GW-60){p.x+=180*s;p.facing=1;p.state='walk';}
      else if(!this.keys.left&&!this.keys.right&&p.state==='walk')p.state='idle';
    }
    // State timers
    if(p.stateTimer>0){
      p.stateTimer-=s;
      if(p.stateTimer<=0&&p.state!=='idle'&&p.state!=='walk')p.state='idle';
    }
    if(p.immune){p.immuneTimer-=s;if(p.immuneTimer<=0)p.immune=false;}
    // Scroll bg
    this.bgOffset=Math.max(0,Math.min(GW,p.x-GW*0.25));
    if(this.bg)this.bg.tilePositionX=this.bgOffset*0.4;
  }
  _updateMerlin(s){
    const m=this.merlinState;
    if(m.cooldown>0)m.cooldown-=s;
    if(m.tackling&&m.tackleTarget){
      const e=m.tackleTarget;
      if(e.dead){m.tackling=false;m.tackleTarget=null;m.returnTimer=1.5;return;}
      const dx=e.x-m.x,dy=e.y-m.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<40){
        // Hit
        this._damageEnemy(e,40);
        Audio.thwack();flashScreen('gold',200);
        m.tackling=false;m.tackleTarget=null;m.returnTimer=1.5;
      }else{
        m.x+=dx/dist*500*s;m.y+=dy/dist*200*s;
      }
    }else if(m.returnTimer>0){
      m.returnTimer-=s;
      const tx=this.player.x-60;const ty=this.groundY+20;
      m.x+=(tx-m.x)*4*s;m.y+=(ty-m.y)*4*s;
    }else{
      // Follow Anthony
      const tx=this.player.x-60,ty=this.groundY+20;
      m.x+=(tx-m.x)*3*s;m.y+=(ty-m.y)*3*s;
    }
  }
  _updateEnemies(s){
    this.enemies.forEach(e=>{
      if(e.dead)return;
      const dx=this.player.x-e.x;
      const dist=Math.abs(dx);
      if(e.type===0){// LanyardSwinger: rush
        if(dist>60){e.x+=Math.sign(dx)*80*s;e.facing=Math.sign(dx);}
        else{// melee attack
          e.attackTimer-=s;
          if(e.attackTimer<=0){
            e.attackTimer=1.5;this._hitPlayer(12);
          }
        }
      }else if(e.type===1){// BriefcaseChucker: keep distance, throw
        if(dist<160)e.x-=Math.sign(dx)*60*s;
        else if(dist>260)e.x+=Math.sign(dx)*60*s;
        e.throwTimer-=s;
        if(e.throwTimer<=0){
          e.throwTimer=2.5;this._spawnProjectile(e.x,e.y-40,'proj-briefcase',Math.sign(dx)*280,0);
        }
      }else if(e.type===2){// KombuchaLobber: lob arcs
        if(dist>80)e.x+=Math.sign(dx)*50*s;
        e.throwTimer-=s;
        if(e.throwTimer<=0){
          e.throwTimer=3.0;this._spawnProjectile(e.x,e.y-60,'proj-kombucha',Math.sign(dx)*160,-200);
        }
      }
      // Clamp so staffers never drift off-screen — always visible/playable.
      e.x=Math.max(this.enemyMargin,Math.min(GW-this.enemyMargin,e.x));
    });
  }
  _updateProjectiles(s){
    this.projectiles.forEach(p=>{
      p.x+=p.vx*s;p.vy+=600*s;p.y+=p.vy*s;
      if(p.sprite)p.sprite.setPosition(p.x,p.y);
      if(p.x<-50||p.x>GW+50||p.y>GH){p.dead=true;if(p.sprite){p.sprite.destroy();p.sprite=null;}}
    });
    this.projectiles=this.projectiles.filter(p=>!p.dead);
  }
  _checkCollisions(){
    if(this.player.immune)return;
    const px=this.player.x,py=this.player.y,pw=this.player.w/2,ph=this.player.h;
    // Projectile hits
    this.projectiles.forEach(p=>{
      if(p.dead)return;
      if(Math.abs(p.x-px)<pw+10&&p.y>py-ph&&p.y<py+10){
        p.dead=true;if(p.sprite){p.sprite.destroy();p.sprite=null;}
        this._hitPlayer(10);
      }
    });
  }
  _renderEntities(){
    const p=this.player;
    const tex=p.state==='swing'?'anthony-swing':p.state==='stun'?'anthony-stun':
              p.state==='walk'?(Math.floor(Date.now()/200)%2===0?'anthony-walk1':'anthony-walk2'):'anthony-idle';
    if(this.anthonySprite){
      this.anthonySprite.setTexture(tex).setPosition(p.x,p.y);
      this.anthonySprite.setFlipX(p.facing<0);
    }
    const m=this.merlinState;
    if(this.merlinSprite){
      this.merlinSprite.setTexture(m.tackling?'merlin-tackle':'merlin-walk').setPosition(m.x,m.y);
      this.merlinSprite.setFlipX(m.x<this.player.x);
    }
    if(this.antTag)this.antTag.setPosition(p.x,this.groundY+8);
    if(this.merTag)this.merTag.setPosition(m.x,m.y+12);
    this.enemies.forEach(e=>{
      if(e.dead||!e.sprite)return;
      e.sprite.setPosition(e.x,e.y).setFlipX(e.facing<0);
    });
  }
  _doSwing(){
    if(this.player.state==='swing')return;
    this.player.state='swing';this.player.stateTimer=0.4;
    Audio.thwack();
    // Check enemies in melee range
    this.enemies.forEach(e=>{
      if(e.dead)return;
      const dx=Math.abs(e.x-this.player.x);
      if(dx<90&&Math.abs(e.y-this.player.y)<80)this._damageEnemy(e,30);
    });
  }
  _doStun(){
    // Never fire once the wave is resolving — its Dlg.show would clobber the
    // resolution dialogue's onDone (the Wave 3 hang).
    if(!this.waveActive)return;
    Audio.stun();flashScreen('gold',300);
    this.enemies.forEach(e=>{if(!e.dead){e.attackTimer+=3;e.throwTimer+=3;}});
    Dlg.show([{speaker:'ANTHONY',text:"SECTION 508 OF THE REHAB ACT SAYS—"}],()=>{});
    const btn=document.getElementById('btn-stun');if(btn){btn.classList.add('on-cooldown');setTimeout(()=>btn.classList.remove('on-cooldown'),4000);}
  }
  _doDodge(){
    this.player.immune=true;this.player.immuneTimer=0.6;
    const dir=this.player.facing;this.player.x=Math.max(30,Math.min(GW-30,this.player.x+dir*70));
    Audio.whoosh();if(this.anthonySprite)this.anthonySprite.setAlpha(0.4);
    this.time.delayedCall(600,()=>{if(this.anthonySprite)this.anthonySprite.setAlpha(1);});
  }
  _doMerlin(){
    if(this.merlinState.cooldown>0)return;
    const tgt=this.enemies.filter(e=>!e.dead).sort((a,b)=>Math.abs(a.x-this.player.x)-Math.abs(b.x-this.player.x))[0];
    if(!tgt)return;
    this.merlinState.tackling=true;this.merlinState.tackleTarget=tgt;this.merlinState.cooldown=3;
    Audio.boof();
    const btn=document.getElementById('btn-merlin');if(btn){btn.classList.add('on-cooldown');setTimeout(()=>btn.classList.remove('on-cooldown'),3000);}
  }
  _spawnProjectile(x,y,tex,vx,vy){
    const sp=this.add.image(x,y,tex).setDepth(3);
    this.projectiles.push({x,y,vx,vy,sprite:sp,dead:false});
  }
  _hitPlayer(dmg){
    if(this.player.immune)return;
    window.__gameState.hp=Math.max(0,window.__gameState.hp-dmg);
    updateHPBar();flashScreen('red',200);Audio.hit();
    this.player.immune=true;this.player.immuneTimer=0.8;
    if(window.__gameState.hp<=0){this._gameOver();}
  }
  _damageEnemy(e,dmg){
    e.hp-=dmg;
    if(e.hp<=0){
      e.dead=true;
      if(e.sprite){this.tweens.add({targets:e.sprite,alpha:0,y:e.y-20,duration:300,onComplete:()=>{e.sprite.destroy();e.sprite=null;}});}
    }else{
      if(e.sprite){this.tweens.add({targets:e.sprite,alpha:0.3,duration:80,yoyo:true});}
    }
  }
  _waveComplete(){return this.enemies.every(e=>e.dead);}
  _onWaveComplete(){
    this.waveActive=false;
    if(this.wave===3){this._endBattle();}
    else if(this.wave===2&&!this.scriptedFired){
      this.scriptedFired=true;
      // Wave 2 complete → brief rest → wave 3 with scripted moment
      this.time.delayedCall(1200,()=>this._spawnWave(3));
    }else if(this.wave===1){
      this.time.delayedCall(1200,()=>this._spawnWave(2));
    }
  }
  _checkScriptedMoment(){
    // Fires mid wave 3 when enemies at 50% collective HP
    if(this.scriptedFired)return;
    const alive=this.enemies.filter(e=>!e.dead);
    if(!alive.length)return;
    const hpPct=alive.reduce((s,e)=>s+e.hp,0)/(alive.reduce((s,e)=>s+e.maxHp,0));
    if(hpPct<0.5){
      this.scriptedFired=true;
      this.waveActive=false;
      // Hide controls during the scripted beat so a stray action (e.g. STUN's
      // Dlg.show) can't overwrite this dialogue's onDone and strand the player.
      this._hideControls();
      // Freeze all enemies
      this.enemies.forEach(e=>{e.state='frozen';if(e.sprite)e.sprite.setTint(0xaaaaaa);});
      Dlg.show([
        {speaker:'NARRATOR',text:"And then Staffer 1 got close enough to see the jacket clearly."},
        {speaker:'NARRATOR',text:"It spread through the crowd like a quiet, unexpected thing."},
        {speaker:'ANTHONY',text:"Everyone. The jacket is a choice. The dog is non-negotiable. And I have a hearing. Let's all be reasonable."},
        {speaker:'NARRATOR',text:"Merlin, sensing a lull, sat down in the exact center of the crowd and offered his paw to the nearest staffer. The staffer, on instinct, shook it."},
        {speaker:'MERLIN',text:"Merlin did a meeting. Merlin is good at meetings. The sad people are less sad now."},
        {speaker:'STAFFER',text:"...wait, is the dog with him? Who processed the dog? Is there a form for the dog?"},
        {speaker:'STAFFER',text:"Nobody knows how the dog got here. It's being looked into. Just— let him through, he's clearly part of it now."},
        {speaker:'NARRATOR',text:"The staffers stepped aside. Not out of defeat. Out of something like procedure. Merlin had, somehow, become part of the process."},
      ],()=>this._endBattle());
    }
  }
  _endBattle(){
    this.waveCleared=true;
    this.enemies.forEach(e=>{e.dead=true;if(e.sprite){e.sprite.destroy();e.sprite=null;}});
    this.projectiles.forEach(p=>{if(p.sprite){p.sprite.destroy();p.sprite=null;}});
    this.projectiles=[];
    document.getElementById('beat-controls').style.display='none';
    document.getElementById('hp-bar-wrap').style.display='none';
    showWinOverlay("Capitol perimeter: CLEARED\nThe cheetah jacket did the rest.",()=>{
      showTitleCard('CHAPTER FOUR','THE OPERATIVE',()=>this.scene.start('Operative'));
    });
  }
  _gameOver(){
    this.gameOver=true;
    document.getElementById('beat-controls').style.display='none';
    showDamageOverlay("HP hit zero. The staffers were too many.\nThe cheetah jacket alone cannot win a war.",()=>{
      window.__gameState.hp=100;window.__gameState.maxHp=100;
      this.scene.restart();
    });
  }
}

/* ── SCENE: OPERATIVE ── */
class OperativeScene extends Phaser.Scene{
  constructor(){super('Operative');}
  create(){
    setScene('operative');hideAllUI();
    this.add.image(GW/2,GH/2,'bg-corridor');
    this.anthony=this.add.image(GW*0.28,GH*0.58,'anthony-idle').setDepth(3);
    this.operative=this.add.image(GW*0.7,GH*0.56,'operative-stern').setDepth(3);
    this.merlinHidden=true;
    this.add.text(GW*0.28,GH*0.73,'ANTHONY',{fontFamily:'Press Start 2P,monospace',fontSize:'5px',color:'#ffd700'}).setOrigin(0.5).setDepth(5);
    this.add.text(GW*0.7,GH*0.73,'OPERATIVE',{fontFamily:'Press Start 2P,monospace',fontSize:'5px',color:'#cc4444'}).setOrigin(0.5).setDepth(5);
    this._intro();
  }
  _intro(){
    Dlg.show([
      {speaker:'NARRATOR',text:"The final checkpoint before the Senate chamber corridor. A man in a black suit. Earpiece. Arms at his sides. Not Capitol Police. Not Senate security. Something else."},
      {speaker:'OPERATIVE',text:"ID and congressional access credentials."},
      {speaker:'ANTHONY',text:"Absolutely. Anthony Corso, VP Public Policy, Veeva. I'm here for the HELP Committee — Bernie Sanders' office sent the invitation. I can have the confirmation up in four seconds."},
      {speaker:'OPERATIVE',text:"I've seen 14 forged Sanders invitations this week."},
      {speaker:'ANTHONY',text:"That is—okay. Valid. But mine is real."},
    ],()=>this._choice1());
  }
  _choice1(){
    showChoices([
      {text:"📱 Show the original email chain with Bernie's office"},
      {text:"🏛️  Name-drop Peter Gassner and Veeva's FDA work"},
      {text:"📋  Walk through the FDA RFI submission on the spot"},
    ],(i)=>{
      const resps=[
        [{speaker:'OPERATIVE',text:"The email chain is consistent with forgeries from the past 72 hours. Software can produce this."}],
        [{speaker:'OPERATIVE',text:"I'm familiar with Veeva. I'm also familiar with people claiming to be from Veeva."}],
        [{speaker:'OPERATIVE',text:"I don't doubt the policy knowledge. I doubt the appointment."}],
      ];
      Dlg.show([...resps[i],
        {speaker:'ANTHONY',text:"Okay. What would it take to—"},
        {speaker:'NARRATOR',text:"Something rustled in Anthony's tote bag."},
      ],()=>this._merlinMoment());
    });
  }
  _merlinMoment(){
    // CRT aesthetic makes one last attempt to reassert
    flashScreen('',0);
    this.cameras.main.flash(200,0,255,65,true);// green flash
    this.time.delayedCall(300,()=>{
      // Fully concedes to warm
      window.__gameState.aesthetic='chaos';
      this.merlin=this.add.image(GW*0.28,GH*0.62,'merlin-sit').setScale(0.44).setDepth(4);
      this.add.text(GW*0.28,GH*0.74,'MERLIN',{fontFamily:'Fredoka One,sans-serif',fontSize:'11px',color:'#88ee88'}).setOrigin(0.5).setDepth(5);
      Audio.boof();
      Dlg.show([
        {speaker:'NARRATOR',text:"Merlin emerged from the tote bag."},
        {speaker:'MERLIN',text:"Hello. Merlin is here also. Merlin smells very good dogs on this man. Three of them. Golden dogs. Merlin approves."},
        {speaker:'NARRATOR',text:"The operative went very still."},
        {speaker:'OPERATIVE',text:"...Is that a black lab."},
        {speaker:'ANTHONY',text:"Yes. His name is Merlin. I cannot fully explain why he's here."},
        {speaker:'MERLIN',text:"The golden dogs. Merlin can smell them. On your jacket. On your hands. THREE of them. This man is very rich in dogs."},
        {speaker:'NARRATOR',text:"The operative reached into his inner jacket pocket. Produced a dog treat. He had been carrying it all day."},
        {speaker:'OPERATIVE',text:"...I have three goldens. Murphy, Franklin, and Rose."},
        {speaker:'MERLIN',text:"Murphy. Franklin. Rose. These are EXCELLENT names. These are very serious and good dogs. Merlin would like to meet them immediately."},
      ],()=>{
        this.operative.setTexture('operative-soft');
        Dlg.show([
          {speaker:'OPERATIVE',text:"Senate chamber is on the left. You have a 12-minute window before the session opens."},
          {speaker:'ANTHONY',text:"Appreciated. And the dog comes with me — he's part of the delegation now."},
          {speaker:'OPERATIVE',text:"Officially, no animals past this point."},
          {speaker:'MERLIN',text:"Merlin is not an animal. Merlin is a colleague. Merlin is here on smell business."},
          {speaker:'OPERATIVE',text:"...Unofficially — he read three goldens off me through a sealed tote. That's not a pet, that's an asset. Dog exception. He's cleared. By vibes."},
          {speaker:'ANTHONY',text:"Did you just clear my dog faster than you cleared me?"},
          {speaker:'OPERATIVE',text:"Yes. I'll note it in the file."},
          {speaker:'ANTHONY',text:"There's a file?"},
          {speaker:'OPERATIVE',text:"There's always a file. ITEM: subject canine. Origin unestablished. Residence exit unexplained. Federal inquiry ongoing. We're aware. We're just not stopping it."},
          {speaker:'MERLIN',text:"Merlin has not volunteered this information. Merlin is also allowed inside. Both things are true."},
          {speaker:'NARRATOR',text:"Somewhere, the game's old gray-green seriousness quietly gave up. Anthony and Merlin walked toward the chamber together — one credentialed, one cleared by charisma, both federally unexplained."},
          {speaker:'ANTHONY',text:"I argued us to the one-yard line. He scored on smell. I'll take the assist."},
        ],()=>showTitleCard('CHAPTER FIVE','THE SENATE SHUFFLE',()=>this.scene.start('DDR')));
      });
    });
  }
}

/* ── SCENE: DDR (SENATE SHUFFLE) ── */
// Black Merlin paw — replaces the old blue circular-arrows (🔄) icon.
const PAW_SVG='<svg viewBox="0 0 24 24" width="26" height="26" style="display:block;margin:0 auto"><g fill="#0a0a0a"><ellipse cx="12" cy="16" rx="6.2" ry="5.2"/><ellipse cx="5.5" cy="9.5" rx="2.3" ry="3"/><ellipse cx="9.8" cy="6.4" rx="2.3" ry="3.3"/><ellipse cx="14.2" cy="6.4" rx="2.3" ry="3.3"/><ellipse cx="18.5" cy="9.5" rx="2.3" ry="3"/></g></svg>';
function ddrSetIcon(el,icon){if(typeof icon==='string'&&icon.charAt(0)==='<')el.innerHTML=icon;else el.textContent=icon;}
const DDR_LANES=[
  {key:'L',icon:'👈',label:'LEFT'},
  {key:'R',icon:'👉',label:'RIGHT'},
  {key:'C',icon:'👏',label:'CLAP'},
  {key:'S',icon:PAW_SVG,label:'MERLIN'},
  {key:'T',icon:'🦶',label:'STOMP'},
];
// Beat sequence: {beat, lane} — beat * 600ms = arrival time (offset from startTime)
const DDR_SEQ=[
  {b:0,l:0},{b:1,l:1},{b:2,l:2},{b:3,l:0},{b:4,l:1},{b:5,l:4},{b:6,l:2},{b:7,l:3},
  {b:8,l:1},{b:9,l:0},{b:10,l:4},{b:10.5,l:2},{b:11,l:1},{b:12,l:3},
  {b:13,l:0},{b:13.5,l:4},{b:14,l:2},{b:15,l:1},
  {b:16,l:0},{b:16.5,l:2},{b:17,l:4},{b:18,l:1},{b:18.5,l:3},
  {b:19,l:0},{b:20,l:2},{b:20.5,l:1},{b:21,l:4},{b:22,l:3},{b:23,l:0},
  // Final chord (must hit all 8)
  {b:24,l:0},{b:25,l:4},{b:26,l:2},{b:27,l:1},{b:28,l:3},{b:29,l:0},{b:30,l:4},{b:31,l:2},
];
const BEAT_MS=600,TRAVEL_MS=1200,START_OFFSET_MS=1500;

class DDRScene extends Phaser.Scene{
  constructor(){super('DDR');}
  create(){
    setScene('ddr');hideAllUI();
    this.add.image(GW/2,GH/2,'bg-senate');
    this.anthony=this.add.image(GW*0.35,GH*0.72,'anthony-idle').setDepth(4);
    this.merlin=this.add.image(GW*0.62,GH*0.72,'merlin-idle').setScale(0.5).setDepth(4);
    this.mscho=this.add.image(GW*0.5,GH*0.52,'mscho').setDepth(3);
    this.add.text(GW*0.5,GH*0.69,'MS. PATRICIA CHO',{fontFamily:'Press Start 2P,monospace',fontSize:'5px',color:'#ffd700',align:'center'}).setOrigin(0.5).setDepth(5);
    this._choDlg();
  }
  _choDlg(){
    Dlg.show([
      {speaker:'MS. CHO',text:"I need to explain the access protocol."},
      {speaker:'ANTHONY',text:"...okay."},
      {speaker:'MS. CHO',text:"In 2019, the biometric security system for this chamber was replaced following the contractor dispute."},
      {speaker:'ANTHONY',text:"I remember that actually."},
      {speaker:'MS. CHO',text:"The replacement system was installed during the August recess by a temporary placement named Dylan."},
      {speaker:'ANTHONY',text:"A temp."},
      {speaker:'MS. CHO',text:"The system uses TikTok audio fingerprinting to verify congressional access. The only pattern that reads as 'authorized visitor' is audio from a 1994 bipartisan retreat line dance video."},
      {speaker:'ANTHONY',text:"..."},
      {speaker:'MS. CHO',text:"Senator Sanders is aware. He finds it consistent with his broader critique of government contractor culture."},
      {speaker:'ANTHONY',text:"Does Dylan know what he did?"},
      {speaker:'MS. CHO',text:"Dylan is at Google. He does not know."},
      {speaker:'MS. CHO',text:"One administrative note. There is an open federal inquiry into how your dog departed your residence. It remains unresolved. The chamber will log it as a pending matter and proceed regardless."},
      {speaker:'ANTHONY',text:"Honestly? That's the most reassuring sentence I've heard all day. I'll take 'pending.' I work great with pending."},
      {speaker:'MERLIN',text:"Merlin wants to dance. Merlin is very good at dancing. Or maybe not. But Merlin is very willing."},
      {speaker:'ANTHONY',text:"Then we dance. Watch my feet, follow the beat, I'll count it out. We've improvised worse today."},
    ],()=>this._startDDR());
  }
  _startDDR(){
    this.mscho.setVisible(false);
    this.anthony.setPosition(GW*0.25,GH*0.85);
    this.merlin.setPosition(GW*0.65,GH*0.85);
    // Build DDR UI
    const cont=document.getElementById('ddr-container');
    cont.style.display='flex';
    const lanes=document.getElementById('ddr-lanes');
    lanes.innerHTML='';
    this.laneEls=[];this.targetEls=[];
    DDR_LANES.forEach((ld,i)=>{
      const lane=document.createElement('div');
      lane.className='ddr-lane';lane.id='ddrlane-'+i;
      const target=document.createElement('div');
      target.className='ddr-target-zone';ddrSetIcon(target,ld.icon);
      const lbl=document.createElement('div');
      lbl.style.cssText='position:absolute;bottom:62px;width:100%;text-align:center;font-family:Press Start 2P,monospace;font-size:5px;color:#555';
      lbl.textContent=ld.label;
      lane.appendChild(target);lane.appendChild(lbl);
      lanes.appendChild(lane);
      this.laneEls.push(lane);this.targetEls.push(target);
      target.addEventListener('click',()=>this._tap(i));
      target.addEventListener('touchend',(e)=>{e.preventDefault();this._tap(i);},{passive:false});
    });
    // Initialize tracking
    this.arrows=[];this.hits=0;this.total=DDR_SEQ.length;
    this.finalChordHits=0;this.finalChordTotal=8;
    window.__gameState.ddrHits=0;window.__gameState.ddrTotal=this.total;
    document.getElementById('ddr-score').textContent='HITS: 0/'+this.total;
    this.startTime=Date.now();
    // Spawn arrows
    this._scheduleArrows();
    // DDR bg music (simple loop)
    this._playBeat();
    // Check end condition
    this.endTimer=this.time.delayedCall((DDR_SEQ.length*BEAT_MS+START_OFFSET_MS+TRAVEL_MS+1000),()=>this._checkEnd());
  }
  _scheduleArrows(){
    DDR_SEQ.forEach((s,idx)=>{
      const arrivalMs=s.b*BEAT_MS+START_OFFSET_MS;
      const spawnMs=arrivalMs-TRAVEL_MS;
      const isFinal=idx>=DDR_SEQ.length-8;
      this.time.delayedCall(Math.max(0,spawnMs),()=>this._spawnArrow(s.l,arrivalMs,isFinal,idx));
    });
  }
  _spawnArrow(lane,arrivalMs,isFinal,idx){
    const laneEl=this.laneEls[lane];if(!laneEl)return;
    const el=document.createElement('div');
    el.className='ddr-arrow';
    ddrSetIcon(el,DDR_LANES[lane].icon);
    el.style.top='-40px';
    if(isFinal)el.style.filter='drop-shadow(0 0 6px gold)';
    laneEl.appendChild(el);
    const obj={el,lane,arrivalMs,isFinal,idx,hit:false,missed:false,removed:false};
    this.arrows.push(obj);
    // Animate with CSS
    el.style.transition=`top ${TRAVEL_MS}ms linear`;
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        const laneH=laneEl.clientHeight||500;
        el.style.top=(laneH-65)+'px';
      });
    });
    // Auto-remove after window
    this.time.delayedCall(TRAVEL_MS+200,()=>{
      if(!obj.hit&&!obj.missed){
        obj.missed=true;
        if(!isFinal){}// just miss
        if(el.parentNode)el.parentNode.removeChild(el);
        obj.removed=true;
      }
    });
  }
  _tap(lane){
    const now=Date.now()-this.startTime;
    // Find closest pending arrow in this lane
    let best=null,bestDiff=9999;
    this.arrows.forEach(a=>{
      if(a.lane!==lane||a.hit||a.missed||a.removed)return;
      const diff=Math.abs(a.arrivalMs-now);
      if(diff<bestDiff){bestDiff=diff;best=a;}
    });
    const target=this.targetEls[lane];
    if(!best||bestDiff>250){
      // Miss
      Audio.ddrMiss();
      if(target){target.classList.add('hit-miss');setTimeout(()=>target.classList.remove('hit-miss'),200);}
      this._showFeedback('MISS','miss');
      return;
    }
    best.hit=true;
    if(best.el&&best.el.parentNode)best.el.parentNode.removeChild(best.el);
    best.removed=true;
    const isPerfect=bestDiff<=50;
    this.hits++;
    if(best.isFinal)this.finalChordHits++;
    window.__gameState.ddrHits=this.hits;
    document.getElementById('ddr-score').textContent='HITS: '+this.hits+'/'+this.total;
    if(isPerfect){
      Audio.ddrPerfect();
      if(target){target.classList.add('hit-perfect');setTimeout(()=>target.classList.remove('hit-perfect'),200);}
      this._showFeedback('PERFECT!','perfect');
    }else{
      Audio.ddrGood();
      if(target){target.classList.add('hit-good');setTimeout(()=>target.classList.remove('hit-good'),200);}
      this._showFeedback('GOOD','good');
    }
    // Animate anthony/merlin
    const which=Math.random()<0.6?this.anthony:this.merlin;
    this.tweens.add({targets:which,y:which.y-12,duration:100,yoyo:true});
  }
  _showFeedback(text,cls){
    const fb=document.getElementById('ddr-feedback');
    fb.textContent=text;fb.className='ddr-feedback show '+cls;
    setTimeout(()=>fb.classList.remove('show'),500);
  }
  _playBeat(){
    // Simple procedural DDR-ish beat
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)();
      const playKick=(t)=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);o.type='sine';
        o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(40,t+0.2);
        g.gain.setValueAtTime(0.35,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
        o.start(t);o.stop(t+0.25);
      };
      const playSnare=(t)=>{
        const n=ctx.sampleRate*0.15,buf=ctx.createBuffer(1,n,ctx.sampleRate),d=buf.getChannelData(0);
        for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n)*0.4;
        const src=ctx.createBufferSource();src.buffer=buf;
        const g=ctx.createGain();src.connect(g);g.connect(ctx.destination);
        g.gain.setValueAtTime(0.25,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
        src.start(t);
      };
      const totalBeats=36;
      const bpm=100,bps=bpm/60;
      const beatDur=1/bps;
      const startT=ctx.currentTime+0.1;
      for(let i=0;i<totalBeats;i++){
        const t=startT+i*beatDur;
        if(i%4===0||i%4===2)playKick(t);
        if(i%4===1||i%4===3)playSnare(t);
      }
    }catch(e){}
  }
  _checkEnd(){
    document.getElementById('ddr-container').style.display='none';
    const acc=this.total>0?this.hits/this.total:0;
    const finalOk=this.finalChordHits>=6;// need 6/8 of final chord
    window.__gameState.ddrScore=Math.round(acc*100);
    if(acc>=0.55&&finalOk){this._win();}
    else{this._fail();}
  }
  _win(){
    Audio.ddrWin();flashScreen('gold',600);
    // Doors swing open animation
    this.cameras.main.flash(400,255,200,50);
    // Ms. Cho reappears
    if(this.mscho){this.mscho.setVisible(true).setPosition(GW*0.5,GH*0.5);}
    Dlg.show([
      {speaker:'MS. CHO',text:"Access granted. Senator Sanders has been notified."},
      {speaker:'ANTHONY',text:"There it is. Read the room, hit the beats, close the deal. That's the job."},
      {speaker:'MS. CHO',text:"For the record, the building has begun... adjusting. Two members asked for the dog's read on a markup this morning. The cafeteria added a 'smells correct' line item. Internally we're calling it the Merlin Standard."},
      {speaker:'MERLIN',text:"Merlin was very good at that. Merlin danced the best. The whole city agrees now."},
      {speaker:'ANTHONY',text:"You were spectacular, objectively. I did the counting. We're a team — I run the plan, you run the vibes."},
      {speaker:'MERLIN',text:"Merlin knows."},
    ],()=>showTitleCard('CHAPTER SIX','ANTHONY MEETS BERNIE',()=>this.scene.start('Ending')));
  }
  _fail(){
    flashScreen('red',400);
    Dlg.show([
      {speaker:'MS. CHO',text:"The system did not register sufficient biometric enthusiasm. You may try again."},
      {speaker:'MERLIN',text:"Merlin will try harder. Merlin was not at full enthusiasm. Merlin has more."},
    ],()=>{
      document.getElementById('ddr-container').style.display='none';
      showDamageOverlay("TikTok fingerprint not matched.\nMs. Cho is waiting.",()=>{this.scene.restart();});
    });
  }
}

/* ── SCENE: ENDING ── */
class EndingScene extends Phaser.Scene{
  constructor(){super('Ending');}
  create(){
    setScene('ending');hideAllUI();
    this.add.image(GW/2,GH/2,'bg-ending');
    this.cameras.main.fadeIn(1200,0,0,0);
    const el=document.getElementById('ending-screen');
    el.style.display='flex';
    el.innerHTML=`
      <div class="ending-text">
        Anthony and Merlin stood at the entrance to the Senate HELP Committee chamber.
      </div>
      <div class="ending-text" style="animation-delay:0.8s">
        Merlin did not know what HELP Committee meant.<br>
        He assumed they were going to help him.<br>
        He was not entirely wrong.
      </div>
      <div class="ending-text" style="animation-delay:1.6s">
        Anthony straightened his cheetah jacket.<br>
        He had come a long way from the FDA RFI.
      </div>
      <div class="ending-text" style="animation-delay:2.4s">
        ...so had the dog.
      </div>
      <div class="ending-text" style="animation-delay:3.0s">
        Washington had quietly begun to operate on dog logic.<br>
        If it smells correct, proceed. Nobody fought it.
      </div>
      <div class="ending-inquiry" style="animation-delay:3.6s">
        FEDERAL INQUIRY STATUS: ONGOING<br>
        <span>(how Merlin left the house remains unexplained)</span>
      </div>
      <div class="ending-tbc">TO BE CONTINUED</div>
      <div class="ending-credits" style="animation-delay:1.5s">
        ANTHONY CORSO — VP Public Policy, Veeva; ran the plan<br>
        MERLIN — excellent dog, chaotic good, ran the vibes<br>
        THE CHEETAH JACKET — never in doubt<br>
        BERNIE SANDERS — waiting patiently<br>
        CYNDIE — very confused, call her back<br>
        MS. PATRICIA CHO — a professional; coined "the Merlin Standard"<br>
        THE THREE GOLDENS — Murphy, Franklin, and Rose<br>
        THE FEDERAL INQUIRY — ongoing<br>
        NICK — black v-neck, still asking how the dog got out
      </div>
    `;
    this.time.delayedCall(2000,()=>Audio.endChime());
    // Tap to restart
    this.time.delayedCall(6000,()=>{
      const restart=this.add.text(GW/2,GH-60,'▶ TAP TO PLAY AGAIN',{fontFamily:'Press Start 2P,monospace',fontSize:'7px',color:'#336633',align:'center'}).setOrigin(0.5).setDepth(10);
      this.tweens.add({targets:restart,alpha:0,duration:800,yoyo:true,repeat:-1});
      this.input.once('pointerdown',()=>{
        el.style.display='none';
        el.innerHTML='';
        window.__gameState.hp=100;window.__gameState.maxHp=100;
        window.__gameState.aesthetic='crt';
        this.scene.start('Title');
      });
    });
  }
}

/* ── PHASER CONFIG ── */
const config={
  type:Phaser.AUTO,
  parent:'phaser-container',
  width:GW,height:GH,
  backgroundColor:'#050f05',
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[BootScene,TitleScene,PrologueScene,PlaneScene,HotelScene,RevealTitleScene,RoutingScene,BeatEmUpScene,OperativeScene,DDRScene,EndingScene],
};

window.__anthonyMerlinBootGame=()=>{
  window.__phaserGame=new Phaser.Game(config);
};
