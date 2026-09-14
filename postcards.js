/* Samarkand postcard quests. Incumbent pixel atlas, paper correspondence and local details.
 * Three discoveries complete a triptych; the earned artwork becomes a personal letter.
 * Guest progress stays on this device. No pretend social authentication or posting.
 */
(() => {
  'use strict';
  const quests={
    registan:{key:'silk-road.registan-postcards.v1',scene:'plaza',slug:'registan',place:'雷吉斯坦',placeFull:'雷吉斯坦广场',postmark:'REGISTAN',art:'assets/registan-postcard-blue.webp',backdrop:'assets/samarkand-pixel-scene.webp',tasks:[
      {id:'tile',name:'带走一片蓝',hint:'去画面右侧，找一块蓝色釉砖。',question:'这座城市留在你手里的颜色是？',answers:['蓝与青绿','只有沙土色'],correct:0,reply:'收好这片蓝。胖鸭检查过了，不掉色，也不超重。'},
      {id:'merchant',name:'听见远方',hint:'画面左侧的旅人，口袋里不只有货物。',question:'刚才的旅人觉得，最珍贵的是什么？',answers:['一路听来的故事','行李越重越好'],correct:0,reply:'故事装进行李，居然没有增加重量。这门生意我喜欢。'},
      {id:'registan_tiger',name:'抬头找太阳',hint:'看看广场门廊上的动物与太阳纹样。',question:'谢尔多尔门廊上，太阳有什么特别之处？',answers:['它戴着帽子','它带有人的面孔'],correct:1,reply:'连太阳都有人脸。看来今天负责上镜的不止我们。'}
    ],designs:[
      {title:'蓝色来信',subtitle:'骆驼说，它很上镜。',color:'#126571',image:'assets/registan-postcard-blue.webp',blessing:'愿你的日常，也有一小片值得抬头的蓝。'},
      {title:'商队来信',subtitle:'猫咪也加入了旅行。',color:'#95522e',image:'assets/registan-postcard-caravan.webp',blessing:'愿好故事一路与你相遇，也愿下一段旅程有你同行。'},
      {title:'日落来信',subtitle:'把这一刻的笑，寄给你。',color:'#574264',image:'assets/registan-postcard-sunset.webp',blessing:'愿忙碌暂时停一停，我们总有时间一起看一场日落。'}
    ]},
    bibi:{key:'silk-road.bibi-postcards.v1',scene:'bibi',slug:'bibi-khanym',place:'比比哈努姆',placeFull:'比比哈努姆清真寺',postmark:'BIBI-KHANYM',art:'assets/bibi-khanym-postcards.png',backdrop:'assets/bibi-khanym-scene.webp',tasks:[
      {id:'bibi_portal',name:'量一量野心',hint:'抬头找那座几乎装不进画面的帝国门廊。',question:'这座清真寺的巨大门廊想让人首先感到什么？',answers:['帝国尺度与权力','小型住宅的亲密'],correct:0,reply:'门廊太高，胖鸭的帽子都得抬头看。帝国野心已收入拼图。'},
      {id:'bibi_stand',name:'找到巨书的位置',hint:'庭院中央，有一座曾托举巨幅古兰经的石架。',question:'庭院中央的石质书架原来用来托举什么？',answers:['商人的秤','巨幅古兰经'],correct:1,reply:'不是普通书架，是一座给巨书准备的舞台。线索收好。'},
      {id:'bibi_kiss',name:'分清传说与史实',hint:'去画面右侧，听听王后、建筑师与一个吻的传说。',question:'“王后与建筑师之吻”应该怎样理解？',answers:['后世地方传说','可靠的施工档案'],correct:0,reply:'浪漫故事可以记住，但不能冒充施工记录。胖鸭批准入册。'}
    ],designs:[
      {title:'门廊来信',subtitle:'把宏伟装进一封信。',color:'#176a78',image:'assets/bibi-khanym-postcards.png',blessing:'愿你拥有抬头看世界的勇气，也有走进宏大之后的从容。'},
      {title:'庭院来信',subtitle:'巨书与旅人在此相遇。',color:'#9a592f',image:'assets/bibi-khanym-postcards.png',blessing:'愿每一次阅读，都为你打开一座比想象更大的庭院。'},
      {title:'传说来信',subtitle:'夕阳替故事保留余温。',color:'#70435e',image:'assets/bibi-khanym-postcards.png',blessing:'愿真实给你方向，传说给旅途留下一点温柔。'}
    ]}
  };
  const makeState=q=>({started:false,found:[],design:0,to:'亲爱的朋友',from:'一位丝路旅人',message:q.designs[0].blessing});
  const states=Object.fromEntries(Object.entries(quests).map(([id,q])=>[id,makeState(q)]));
  let questId='registan',quest=quests[questId],state=states[questId],tasks=quest.tasks,designs=quest.designs,images=[],scenicBackdrop=new Image();
  let storageOK = true, preparedFile = null, drawing = 0;
  let account=null,loginAvailable=false,syncTimer;
  // Selfies and local cutouts remain in memory, never in localStorage or account sync.
  let portraits=[],processing=false,segmenterPromise=null,faceDetectorPromise=null,photoMode='original',photoStatus='';
  const filePreview=location.protocol==='file:';
  const mark = i => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${['<path d="M5 5h22v22H5zM16 7l9 9-9 9-9-9zM13 13h6v6h-6z"/>','<path d="M3 7h26v18H3zM3 8l13 10L29 8M3 25l9-10m17 10L20 15"/>','<path d="M12 9h8v3h3v8h-3v3h-8v-3H9v-8h3zM16 1v5m0 20v5M1 16h5m20 0h5M5 5l4 4m14 14 4 4M5 27l4-4M23 9l4-4"/>'][i]}</svg>`;
  try {for(const [id,q] of Object.entries(quests)){const saved=JSON.parse(localStorage.getItem(q.key)||'null'),target=states[id];if(!saved||typeof saved!=='object')continue;target.started=saved.started===true;target.found=[...new Set(Array.isArray(saved.found)?saved.found:[])].filter(key=>q.tasks.some(t=>t.id===key));target.design=[0,1,2].includes(saved.design)?saved.design:0;for(const field of ['to','from','message'])if(typeof saved[field]==='string')target[field]=saved[field].slice(0,field==='message'?100:24);}}catch{storageOK=false;}
  function activate(id){questId=id;quest=quests[id];state=states[id];tasks=quest.tasks;designs=quest.designs;if(!quest.images)quest.images=designs.map(d=>{const img=new Image();img.src=d.image;return img;});if(!quest.backdropImage){quest.backdropImage=new Image();quest.backdropImage.src=quest.backdrop;}images=quest.images;scenicBackdrop=quest.backdropImage;}
  activate(questId);
  const unlocked = () => tasks.every(t=>state.found.includes(t.id));
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // A local-file visitor can carry their progress to the HTTP preview without uploading it.
  if(location.hostname==='127.0.0.1'&&location.hash.includes('-resume=')){
    try{
      const id=location.hash.startsWith('#bibi-khanym-resume=')?'bibi':'registan';activate(id);const resume=JSON.parse(decodeURIComponent(location.hash.slice(location.hash.indexOf('=')+1)));
      state.found=[...new Set(Array.isArray(resume.found)?resume.found:[])].filter(id=>tasks.some(t=>t.id===id));
      state.started=resume.started===true;
      if([0,1,2].includes(resume.design))state.design=resume.design;
      for(const field of ['to','from','message'])if(typeof resume[field]==='string')state[field]=resume[field].slice(0,field==='message'?100:24);
      localStorage.setItem(quest.key,JSON.stringify(state));
    }catch{}
    history.replaceState(null,'',location.pathname+location.search+`#${quest.slug}-quest`);
  }
  function save(){try{localStorage.setItem(quest.key,JSON.stringify(state));}catch{storageOK=false;} updateScene(currentScene);if(account){clearTimeout(syncTimer);syncTimer=setTimeout(sync,600);}}
  async function sync(){try{const response=await fetch('/api/progress',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});if(!response.ok)throw Error();}catch{if(dialog.open)notice('云端暂未保存，进度仍保留在本机。');}}
  const dialog = document.createElement('dialog');
  dialog.id='postcard-dialog'; dialog.setAttribute('aria-labelledby','postcard-heading'); document.body.append(dialog);
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  const entry = document.createElement('button');
  entry.className='quest-entry'; entry.type='button'; entry.addEventListener('click',()=>{activate('registan');open();});
  document.querySelector('#world .topbar').append(entry);
  const sceneEntry = entry.cloneNode();sceneEntry.addEventListener('click',()=>open());
  document.querySelector('#city .citybar-actions').prepend(sceneEntry);
  function updateScene(name){
    if(name==='plaza')activate('registan');else if(name==='bibi')activate('bibi');
    entry.textContent=`景点明信片 · ${states.registan.found.length+states.bibi.found.length}/6`;
    sceneEntry.textContent=unlocked()?'我的明信片':'寻宝拼图 · '+state.found.length+'/3';
    sceneEntry.hidden=!['plaza','bibi'].includes(name);
    document.querySelectorAll('#scene-hotspots [data-story]').forEach(b=>{
      b.classList.toggle('quest-found',state.found.includes(b.dataset.story));
      b.classList.toggle('quest-target',state.started && tasks.some(t=>t.id===b.dataset.story) && !state.found.includes(b.dataset.story));
    });
  }
  function open(editor=false){
    closeModal();
    const editing=editor && unlocked();
    dialog.dataset.view=editing?'editor':'quest';
    dialog.dataset.quest=questId;
    dialog.style.setProperty('--quest-art',`url('${quest.art}')`);dialog.innerHTML=`<!-- THESIS: An unfolding pixel postcard, not a dashboard. OWN-WORLD: lapis, apricot, cream postal paper and stepped edges. STORY: follow three clues, restore a smiling souvenir, write to a friend. --><header class="postcard-header"><div><h2 id="postcard-heading">${editing?'把这一刻，寄给你。':'寻找城市碎片，获取独家记忆'}</h2><p>${editing?'选一款，写祝福。也可以加入自己的照片。':`跟着线索，在${quest.placeFull}找找看。`}</p></div>${editing?`<div class="postal-stamp" aria-hidden="true">${mark(2)}<small>SAMARKAND</small></div>`:''}<button type="button" class="postcard-close" aria-label="关闭明信片窗口">×</button></header><div class="postcard-body"></div><p id="postcard-status" role="status" aria-live="polite"></p>`;
    dialog.querySelector('.postcard-close').onclick=()=>dialog.close();
    if(editor && unlocked()) renderEditor();else renderQuest();
    if(!dialog.open)dialog.showModal();
  }
  function notice(text){dialog.querySelector('#postcard-status').textContent=text;}
  function toast(text){dialog.querySelector('.postcard-toast')?.remove();const message=document.createElement('div');message.className='postcard-toast';message.setAttribute('role','status');message.textContent=text;dialog.append(message);setTimeout(()=>message.remove(),2200);}
  function renderQuest(){
    dialog.querySelector('.postcard-body').innerHTML=`<div class="quest-layout"><section class="quest-notes"><div class="quest-progress"><strong>${state.found.length} / 3 块线索</strong><div class="fragment-track" aria-hidden="true">${tasks.map(t=>`<i class="${state.found.includes(t.id)?'collected':''}"></i>`).join('')}</div></div><ol aria-label="${quest.placeFull}寻宝线索">${tasks.map((t,i)=>`<li class="${state.found.includes(t.id)?'note-found':''}" style="--piece:${i}"><small>${state.found.includes(t.id)?'已找到':'未找到'}</small><div><h4>${t.name}</h4><p>${t.hint}</p></div></li>`).join('')}</ol><div class="quest-actions"><button type="button" class="postcard-primary" id="quest-primary">${unlocked()?'打开打卡照片':`进入${quest.place}`} <span aria-hidden="true">→</span></button><div class="quest-minor">${state.found.length?'<button type="button" class="postcard-text" id="quest-reset">↻ 重置寻宝</button>':''}<button type="button" class="postcard-text" id="quest-account">账号收藏</button></div></div></section><img class="quest-duck-pop" src="assets/fat-duck-halfbody.webp" alt="胖鸭在面板前近距离介绍寻宝线索"></div>`;
    dialog.querySelector('#quest-primary').onclick=()=>unlocked()?open(true):go();
    const reset=dialog.querySelector('#quest-reset');if(reset)reset.onclick=()=>{if(confirm('清除已找到的拼图，重新寻宝？')){state.started=false;state.found=[];save();renderQuest();notice('拼图已清除。');}};
    const accountButton=dialog.querySelector('#quest-account');
    accountButton.textContent=account?`${account.nickname} · 退出微信账号`:loginAvailable?'微信快捷登录，收藏旅行进度':'账号与跨设备收藏';
    accountButton.onclick=async()=>{
      if(account){
        clearTimeout(syncTimer);await sync();
        try{const response=await fetch('/api/logout',{method:'POST'});if(!response.ok)throw Error();account=null;localStorage.removeItem(quest.key);location.reload();}
        catch{notice('暂时无法退出账号，请稍后重试。');}
      }else if(loginAvailable){save();location.assign('/auth/wechat');}
      else notice('微信快捷登录正在接入中，目前可用访客身份完整寻宝、领卡和分享；收藏暂存本机。');
    };
  }
  function go(id){
    const targetScene=quest.scene;state.started=true;save();dialog.close();enterCity('samarkand');showScene(targetScene);
    if(id){const hotspot=document.querySelector(`#scene-hotspots [data-story="${id}"]`);hotspot?.focus();}
  }
  function attachChallenge(key){
    const id=currentScene==='bibi'?'bibi':currentScene==='plaza'?'registan':null;if(!id)return;activate(id);
    const task=tasks.find(t=>t.id===key);if(!task)return;
    const bubble=document.querySelector('.duck-bubble');if(!bubble)return;
    const challenge=document.createElement('section');challenge.className='quest-challenge';
    const found=state.found.includes(key);
    challenge.innerHTML=found?`<p>这块「${task.name}」已收入拼图。</p><button type="button" class="postcard-text">查看我的拼图 →</button>`:`<h3>胖鸭想确认一件小事</h3><p>${task.question}</p><div>${task.answers.map((a,i)=>`<button type="button" data-answer="${i}">${a}</button>`).join('')}</div><p class="quest-feedback" role="status"></p>`;
    bubble.append(challenge);
    if(found){challenge.querySelector('button').onclick=()=>open();return;}
    challenge.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
      if(Number(b.dataset.answer)!==task.correct){challenge.querySelector('.quest-feedback').textContent='再看看刚才的故事。胖鸭允许我们多看一眼。';return;}
      if(!state.found.includes(key))state.found.push(key);
      state.started=true;save();
      challenge.innerHTML=`<p>${task.reply}</p><p class="quest-collected">拼图 +1 · ${state.found.length}/3</p><button type="button" class="postcard-primary">${unlocked()?'拼图完整，领取明信片':'收进拼图，继续寻找'}</button>`;
      challenge.querySelector('button').onclick=()=>open(unlocked());
    });
  }
  function renderEditor(){
    dialog.querySelector('.postcard-body').innerHTML=`<div class="postcard-editor"><div class="postcard-preview"><canvas id="postcard-canvas" width="1080" height="1350" role="img" aria-label="个性化${quest.placeFull}明信片预览"></canvas><p>1080 × 1350 · 可保存到相册，也可打开手机分享面板</p></div><form id="postcard-form"><h3>三款风景，选一封</h3><div class="postcard-designs" role="group" aria-label="明信片款式">${designs.map((d,i)=>`<button type="button" data-design="${i}" aria-pressed="${state.design===i}" style="--card-accent:${d.color};--card-image:url('${d.image}');--card-size:${d.crop==null?'cover':'300% 100%'};--card-position:${d.crop==null?'center':d.crop*50+'% center'}"><span>${d.title}</span><small>${d.subtitle}</small></button>`).join('')}</div><label for="postcard-to">送给</label><input id="postcard-to" name="to" maxlength="24" value="${escape(state.to)}"><label for="postcard-message">想对朋友说的话 <small id="message-count">${state.message.length}/100</small></label><textarea id="postcard-message" name="message" maxlength="100" rows="4">${escape(state.message)}</textarea><button type="button" class="postcard-text" id="default-blessing">换用这款卡片的默认祝福</button><label for="postcard-from">落款</label><input id="postcard-from" name="from" maxlength="24" value="${escape(state.from)}"><div class="postcard-share"><button type="button" class="postcard-primary" id="download-card" disabled>正在绘制明信片…</button><button type="button" id="share-card" disabled>选择微信 / Instagram 分享</button><button type="button" id="copy-invitation">复制祝福与探索链接</button></div><details class="postcard-help"><summary>分享时会发生什么？</summary><p>点击分享后，手机会打开系统分享面板，由你选择微信好友、朋友圈或 Instagram。某个 App 若没有出现，请先保存明信片，再从相册发布。</p><p>浏览器不允许网页替你选定联系人或直接发送。探索链接不携带姓名、祝福或自拍。</p></details><button type="button" class="postcard-text" id="back-to-puzzle">← 回看旅行拼图</button></form></div>`;
    const form=dialog.querySelector('form');form.onsubmit=e=>e.preventDefault();
    dialog.querySelector('#postcard-heading').textContent=`把${quest.place}，寄给你。`;
    dialog.querySelector('.postcard-header p').textContent='一面是风景，一面是想对你说的话。';
    dialog.querySelector('.postcard-preview>p').textContent='正反两面一起保存 · 1080 × 1350 PNG';
    dialog.querySelector('#postcard-canvas').setAttribute('aria-label',`${quest.placeFull}大图背景上的双面明信片：上方祝福、下方合照`);
    dialog.querySelector('.postcard-designs').insertAdjacentHTML('afterend',`<section class="selfie-section"><div class="photo-mode" role="group" aria-label="照片选择"><button type="button" data-photo-mode="original" aria-pressed="${photoMode==='original'}">使用原版</button><button type="button" data-photo-mode="personal" aria-pressed="${photoMode==='personal'}">加入我的照片</button></div>${filePreview?'<p class="file-preview-note">直接打开文件时，浏览器会限制照片处理和下载。请从本地网页继续。</p><a id="open-local-postcards" class="local-preview-link" href="#">打开可上传与下载的版本 →</a>':photoMode==='original'?'<p class="selfie-privacy">无需上传照片，写下祝福即可保存或分享。</p>':`<div class="selfie-upload-wrap"><button type="button" class="selfie-upload" id="upload-selfie" ${portraits.length===3||processing?'disabled':''}>${processing?'正在制作像素合影…':portraits.length===3?'已加入 3 人':`上传自拍 · ${portraits.length}/3`} <span aria-hidden="true">＋</span></button><input id="selfie-file" type="file" multiple accept="image/*" ${portraits.length===3||processing?'disabled':''} aria-label="选择最多三张自拍"></div><p class="selfie-privacy">每人一张 · 最多 3 人 · 免费，照片仅在本机处理。</p>${portraits.length?`<div class="selfie-list">${portraits.map((p,i)=>`<span><img src="${p.url}" alt="已加入的第 ${i+1} 位旅人"><button type="button" data-remove-selfie="${i}" ${processing?'disabled':''} aria-label="移除第 ${i+1} 位旅人">×</button></span>`).join('')}</div>`:''}<div class="fusion-progress" ${processing?'':'hidden'} aria-hidden="true"><i></i><span>正在处理，完成后合影会自动刷新。</span></div><p id="selfie-status" role="status" aria-live="polite">${escape(photoStatus)}</p>`}</section>`);
    dialog.querySelectorAll('[data-photo-mode]').forEach(button=>button.onclick=()=>{if(button.dataset.photoMode==='personal'){toast('加入我的照片功能开发中');return;}photoMode=button.dataset.photoMode;renderEditor();});
    const input=dialog.querySelector('#selfie-file');
    if(input){input.onchange=loadSelfie;dialog.querySelector('#upload-selfie').onclick=()=>input.click();}
    const localLink=dialog.querySelector('#open-local-postcards');
    if(localLink)localLink.href=`http://127.0.0.1:4173/?v=postcard-quests-1#${quest.slug}-resume=`+encodeURIComponent(JSON.stringify(state));
    dialog.querySelectorAll('[data-remove-selfie]').forEach(button=>button.onclick=()=>removeSelfie(Number(button.dataset.removeSelfie)));
    if(photoMode==='personal'&&portraits.length){
      dialog.querySelector('.selfie-list').insertAdjacentHTML('afterend',`<details class="portrait-framing"><summary>微调人脸与发型</summary><p>每张照片一人。保留原照表情；调整取景，不上传照片。</p>${portraits.map((p,i)=>`<fieldset ${processing?'disabled':''}><legend>旅人 ${i+1}${p.detected?'':' · 请调整到脸部'}</legend>${[['x','左右',0,100,1],['y','上下',0,100,1],['zoom','取景大小',60,160,1],['roll','扶正角度',-45,45,1]].map(([key,label,min,max,step])=>`<label>${label}<input type="range" data-framing="${key}" data-person="${i}" min="${min}" max="${max}" step="${step}" value="${p.framing[key]}"></label>`).join('')}</fieldset>`).join('')}</details>`);
      dialog.querySelectorAll('[data-framing]').forEach(input=>input.oninput=()=>{const p=portraits[Number(input.dataset.person)];p.framing[input.dataset.framing]=Number(input.value);p.head=makeHead(p);paint();});
    }
    form.addEventListener('input',e=>{if(['to','from','message'].includes(e.target.name)){state[e.target.name]=e.target.value;save();dialog.querySelector('#message-count').textContent=state.message.length+'/100';paint();}});
    dialog.querySelectorAll('[data-design]').forEach(b=>b.onclick=()=>{
      const oldDefault=designs[state.design].blessing;
      state.design=Number(b.dataset.design);
      if(state.message===oldDefault)state.message=designs[state.design].blessing;
      save();renderEditor();
    });
    dialog.querySelector('#default-blessing').onclick=()=>{state.message=designs[state.design].blessing;save();renderEditor();};
    dialog.querySelector('#back-to-puzzle').onclick=()=>open();
    dialog.querySelector('#download-card').onclick=download;
    dialog.querySelector('#share-card').onclick=share;
    dialog.querySelector('#copy-invitation').onclick=copy;
    paint();
  }
  function removeSelfie(index){if(processing)return;URL.revokeObjectURL(portraits[index].url);portraits.splice(index,1);photoStatus=portraits.length?'合影已刷新。':'可以重新选择照片。';renderEditor();}
  function deadline(promise,ms){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('照片处理暂时不可用。')),ms);promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});}
  function loadSegmenter(){
    if(segmenterPromise)return segmenterPromise;
    segmenterPromise=deadline(new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='assets/selfie_segmentation.js';script.onload=async()=>{
        try{const instance=new SelfieSegmentation({locateFile:file=>new URL('assets/'+file,document.baseURI).href});instance.setOptions({modelSelection:0,selfieMode:false});await instance.initialize();resolve(instance);}catch(error){reject(error);}
      };script.onerror=()=>reject(Error('本地抠图模型加载失败。'));document.head.append(script);
    }),15000).catch(error=>{segmenterPromise=null;throw error;});return segmenterPromise;
  }
  function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function loadFaceDetector(){
    if(faceDetectorPromise)return faceDetectorPromise;
    faceDetectorPromise=deadline(new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='assets/face_detection.js';
      script.onload=async()=>{try{const model=new FaceDetection({locateFile:f=>new URL('assets/'+f,document.baseURI).href});model.setOptions({model:'short',minDetectionConfidence:.4,selfieMode:false});await model.initialize();resolve(model);}catch(e){reject(e);}};
      script.onerror=()=>reject(Error('人脸定位暂不可用'));document.head.append(script);
    }),15000).catch(e=>{faceDetectorPromise=null;throw e;});return faceDetectorPromise;
  }
  async function locateHead(source){
    const detector=await loadFaceDetector();
    const detect=image=>deadline(new Promise((resolve,reject)=>{
      let faces=[];detector.onResults(r=>{faces=r.detections||[];});
      detector.send({image}).then(()=>resolve(faces.sort((a,b)=>b.boundingBox.width*b.boundingBox.height-a.boundingBox.width*a.boundingBox.height)[0]),reject);
    }),15000);
    const face=await detect(source);if(face)return face;
    // ponytail: one upper-center retry for distant faces, then manual framing;
    // a full multiscale detector is unnecessary for the intended single selfies.
    const size=Math.round(Math.min(source.width,source.height)*.6),x=Math.round((source.width-size)/2),y=Math.round(source.height*.1),crop=surface(size,size);
    crop.getContext('2d').drawImage(source,x,y,size,size,0,0,size,size);
    const retry=await detect(crop);
    if(!retry)throw Error('请用取景微调对齐人脸。');
    const box=retry.boundingBox;
    return {...retry,boundingBox:{...box,xCenter:(x+box.xCenter*size)/source.width,yCenter:(y+box.yCenter*size)/source.height,width:box.width*size/source.width,height:box.height*size/source.height},landmarks:retry.landmarks.map(p=>({...p,x:(x+p.x*size)/source.width,y:(y+p.y*size)/source.height}))};
  }
  // A small, image-derived palette retains skin/hair identity without photographing
  // a whole body onto the scene. Edge-aware smoothing removes camera grain first.
  function styleHead(canvas){
    const c=canvas.getContext('2d'),im=c.getImageData(0,0,canvas.width,canvas.height),raw=new Uint8ClampedArray(im.data),colors=[];
    const w=canvas.width,h=canvas.height;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4;if(raw[i+3]<150){im.data[i+3]=0;continue;}
      const sum=[0,0,0];let count=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const j=(ny*w+nx)*4;
        if(raw[j+3]<150||[0,1,2].reduce((s,k)=>s+(raw[j+k]-raw[i+k])**2,0)>2400)continue;
        count++;for(let k=0;k<3;k++)sum[k]+=raw[j+k];
      }
      const rgb=sum.map(v=>v/count),l=rgb[0]*.299+rgb[1]*.587+rgb[2]*.114;
      // Stronger illustrated light/dark separation, with apricot light and cool
      // shadows rather than gray camera shading. Keep each portrait's own palette.
      const tone=(l-128)*1.24+138,side=7*(.5-x/w);
      for(let k=0;k<3;k++)im.data[i+k]=Math.max(0,Math.min(255,tone+(rgb[k]-l)*1.3+[10,0,-7][k]+side));
      im.data[i+3]=255;colors.push([im.data[i],im.data[i+1],im.data[i+2]]);
    }
    if(!colors.length)return canvas;
    let boxes=[colors];
    while(boxes.length<18){
      let best=-1,axis=0,score=0;
      boxes.forEach((box,i)=>{if(box.length<2)return;for(let k=0;k<3;k++){let min=255,max=0;for(const p of box){min=Math.min(min,p[k]);max=Math.max(max,p[k]);}const s=(max-min)*Math.sqrt(box.length);if(s>score){best=i;axis=k;score=s;}}});
      if(best<0)break;const box=boxes.splice(best,1)[0].sort((a,b)=>a[axis]-b[axis]),mid=Math.floor(box.length/2);boxes.push(box.slice(0,mid),box.slice(mid));
    }
    const palette=boxes.map(box=>[0,1,2].map(k=>Math.round(box.reduce((s,p)=>s+p[k],0)/box.length)));
    for(let i=0;i<im.data.length;i+=4){if(!im.data[i+3])continue;let best=palette[0],distance=Infinity;for(const p of palette){const d=(p[0]-im.data[i])**2+(p[1]-im.data[i+1])**2+(p[2]-im.data[i+2])**2;if(d<distance){best=p;distance=d;}}im.data.set([...best,255],i);}
    // Ink only high-contrast dark edges (eyes, hair and silhouette), not skin noise.
    const graded=new Uint8ClampedArray(im.data);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const i=(y*w+x)*4;if(!graded[i+3])continue;
      const l=(graded[i]+graded[i+1]+graded[i+2])/3;let edge=false;
      for(const j of [i-4,i+4,i-w*4,i+w*4])if(!graded[j+3]||(graded[j]+graded[j+1]+graded[j+2])/3-l>64)edge=true;
      if(edge&&l<170)for(let k=0;k<3;k++)im.data[i+k]=graded[i+k]*.73;
    }
    c.putImageData(im,0,0);return canvas;
  }
  function makeHead(p){
    const out=surface(96,120),c=out.getContext('2d'),f=p.framing;
    const cw=p.faceWidth*1.65*f.zoom/100,ch=p.faceHeight*1.9*f.zoom/100;
    // The crop ends at the chin; no original shirt or shoulders survive the mask.
    c.beginPath();c.moveTo(48,0);c.bezierCurveTo(2,0,0,28,1,57);c.bezierCurveTo(2,83,17,113,48,120);c.bezierCurveTo(79,113,94,83,95,57);c.bezierCurveTo(96,28,94,0,48,0);c.clip();
    c.translate(48,60);c.scale(96/cw,120/ch);c.rotate(-f.roll*Math.PI/180);
    c.drawImage(p.masked,-p.source.width*f.x/100,-p.source.height*f.y/100);
    return styleHead(out);
  }
  async function preparePortrait(source,url){
    let face=null,masked=source,fallback=false;
    try{face=await locateHead(source);}catch{fallback=true;}
    try{masked=await cutout(source);}catch{fallback=true;}
    const box=face?.boundingBox;
    const faceWidth=box?box.width*source.width:Math.min(source.width*.5,source.height*.4),faceHeight=box?box.height*source.height:faceWidth*1.1;
    const eyes=face?.landmarks?.slice(0,2).sort((a,b)=>a.x-b.x);
    const roll=eyes?Math.atan2((eyes[1].y-eyes[0].y)*source.height,(eyes[1].x-eyes[0].x)*source.width)*180/Math.PI:0;
    const p={source,masked,url,faceWidth,faceHeight,detected:!!face,framing:{x:(box?.xCenter??.5)*100,y:((box?.yCenter??.4)*source.height-faceHeight*.25)/source.height*100,zoom:100,roll:Math.max(-45,Math.min(45,roll))}};
    p.head=makeHead(p);
    const skin=p.head.getContext('2d').getImageData(37,76,12,8).data;let count=0,sum=[0,0,0];
    for(let i=0;i<skin.length;i+=4)if(skin[i+3]){count++;sum=sum.map((v,k)=>v+skin[i+k]);}
    p.skin=count?sum.map(v=>Math.round(v/count)):[192,137,94];
    return {portrait:p,fallback};
  }
  async function cutout(source){
    const segmenter=await loadSegmenter();
    return deadline(new Promise((resolve,reject)=>{
      segmenter.onResults(results=>{
        try{
          const w=source.width,h=source.height;
          const masked=document.createElement('canvas');masked.width=w;masked.height=h;const c=masked.getContext('2d');
          c.drawImage(results.segmentationMask,0,0,w,h);c.globalCompositeOperation='source-in';c.drawImage(source,0,0,w,h);c.globalCompositeOperation='source-over';
          const pixels=c.getImageData(0,0,w,h),data=pixels.data;let left=w,top=h,right=0,bottom=0;
          for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){const alpha=data[(y*w+x)*4+3];if(alpha>150){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
          if(right<=left||bottom<=top)throw Error('没有识别到人像。');
          resolve(masked);
        }catch(error){reject(error);}
      });segmenter.send({image:source}).catch(reject);
    }),15000).catch(error=>{segmenterPromise=null;try{Promise.resolve(segmenter.close()).catch(()=>{});}catch{}throw error;});
  }
  async function loadSelfie(e){
    if(processing)return;const files=[...e.target.files].slice(0,3-portraits.length);if(!files.length)return;
    e.target.value='';
    if(files.some(file=>file.size>12*1024*1024||(!file.type.startsWith('image/')&&!/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name)))){photoStatus='每张照片需是不超过 12 MB 的图片。';renderEditor();return;}
    processing=true;photoStatus='';renderEditor();let fallback=false;
    try{
      for(const file of files){
        const url=URL.createObjectURL(file),img=new Image();img.src=url;
        try{
          try{await deadline(img.decode(),10000);}catch{throw Error('这张照片无法读取，请换用 JPG、PNG 或 WebP；iPhone 原片可先导出为 JPEG。');}
          if(img.naturalWidth*img.naturalHeight>30000000)throw Error('图片超过 3000 万像素，请缩小后重试。');
          const source=document.createElement('canvas'),scale=Math.min(1,900/Math.max(img.naturalWidth,img.naturalHeight));
          source.width=Math.max(1,Math.round(img.naturalWidth*scale));source.height=Math.max(1,Math.round(img.naturalHeight*scale));source.getContext('2d').drawImage(img,0,0,source.width,source.height);
          const result=await preparePortrait(source,url);fallback ||= result.fallback;portraits.push(result.portrait);
        }
        catch(error){URL.revokeObjectURL(url);throw error;}
      }
      photoStatus=`${portraits.length} 人已加入合影。${fallback?'自动定位或抠图暂不可用，已用像素肖像拼贴；请展开微调对齐脸部，可能保留部分背景。':'已对齐头部角度，换上旅行装；可展开微调。'}`;
    }catch(error){photoStatus=error.message||'照片处理失败，请换一张重试。';}
    finally{processing=false;if(dialog.dataset.view==='editor')renderEditor();}
  }
  function wrap(ctx,text,x,y,maxWidth,lineHeight){
    let line='';for(const character of Array.from(text)){if(character==='\n'||ctx.measureText(line+character).width>maxWidth){ctx.fillText(line,x,y);y+=lineHeight;line=character==='\n'?'':character;}else line+=character;}ctx.fillText(line,x,y);return y+lineHeight;
  }
  let personalAssets=null;
  function loadPersonalAssets(){
    if(personalAssets)return personalAssets;
    personalAssets=Promise.all(['blue','caravan','sunset','outfit'].map(async name=>{const im=new Image();im.src=`assets/registan-personal-${name}.webp`;await deadline(im.decode(),15000);return im;})).then(art=>{
      // The reusable outfit has a deliberate magenta matte, absent from clothing.
      // Chroma-key is local canvas composition, not a generated user photograph.
      const im=art[3],sprite=surface(im.width,im.height),c=sprite.getContext('2d');c.drawImage(im,0,0);
      const pixels=c.getImageData(0,0,sprite.width,sprite.height),d=pixels.data;
      for(let i=0;i<d.length;i+=4)if(d[i]-d[i+1]>70&&d[i+2]-d[i+1]>55){d[i+3]=0;}
      c.putImageData(pixels,0,0);art[3]=sprite;return art;
    }).catch(e=>{personalAssets=null;throw e;});return personalAssets;
  }
  function drawPortraits(c,assets,design,x=48,y=126,w=984,h=656){
    // One shared pixel grid and a chest-up camera plane, not a whole-body sticker.
    const stage=surface(492,328),s=stage.getContext('2d');s.drawImage(assets[design],0,0,492,328);
    const layouts=portraits.length===1?[[.81,.56,140,-5]]:portraits.length===2?[[.71,.50,111,-7],[.90,.59,115,5]]:[[.71,.44,98,-7],[.90,.48,98,6],[.81,.73,108,-3]];
    portraits.forEach((p,i)=>{
      const [px,py,headH,lean]=layouts[i],headW=headH*.8,bodyW=headW*1.6;
      const avatar=surface(240,520),a=avatar.getContext('2d'),k=bodyW/240;
      // Crop the sprite's empty head space; face, neck and collar share one anchor.
      a.fillStyle=`rgb(${p.skin.join(',')})`;a.beginPath();a.moveTo(93,132);a.lineTo(142,132);a.lineTo(143,190);a.lineTo(110,204);a.lineTo(91,179);a.fill();
      a.drawImage(assets[3],0,170,assets[3].width,assets[3].height-170,0,145,240,380);
      a.imageSmoothingEnabled=false;a.drawImage(p.head,42,0,150,187.5);
      // Match the plate's light as well as its pixel size; no detached drop shadow.
      a.globalCompositeOperation='source-atop';const light=a.createLinearGradient(0,0,240,280);
      light.addColorStop(0,['#ffd07120','#ffa54c30','#ffc4a32c'][design]);light.addColorStop(1,['#12397018','#76351d24','#49356638'][design]);a.fillStyle=light;a.fillRect(0,0,240,520);
      s.save();s.translate(Math.round(px*492),Math.round(py*328));s.rotate(lean*Math.PI/180);s.imageSmoothingEnabled=false;
      // The eyes sit around .63 of the head crop, at the group selfie eye line.
      s.drawImage(avatar,-117*k,-118*k,240*k,520*k);s.restore();
    });
    c.imageSmoothingEnabled=false;c.drawImage(stage,x,y,w,h);
  }
  function cover(c,image,x,y,w,h){const scale=Math.max(w/image.width,h/image.height),sw=w/scale,sh=h/scale;c.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,x,y,w,h);}
  function paper(c,x,y,w,h){
    c.save();c.shadowColor='#071b3266';c.shadowBlur=22;c.shadowOffsetY=14;c.fillStyle='#fcf1da';c.beginPath();c.roundRect(x,y,w,h,18);c.fill();c.restore();
  }
  function brandMark(c,x,y,size){
    const path=(d,fill,stroke)=>{const p=new Path2D(d);c.fillStyle=fill;c.fill(p);if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke(p);}};
    c.save();c.translate(x,y);c.scale(size/48,size/48);
    c.fillStyle='#0f5173';c.strokeStyle='#8de0d7';c.lineWidth=2;c.fillRect(1,1,46,46);c.strokeRect(1,1,46,46);
    path('M16 17c1-7 5-11 8-11s7 4 8 11z','#5fcfc6','#f2cf58');
    path('M15 40V18h18v22h-5V27c0-3-2-6-4-6s-4 3-4 6v13z','#123047','#f2cf58');
    path('M8 40V16h5v24zm27 0V16h5v24z','#2c8da0','#f2cf58');
    path('M4 5h4v4H4zm36 0h4v4h-4zM5 11h3v3H5zm35 0h3v3h-3zM4 42h7v2H4zm33 0h7v2H37z','#f2cf58');
    path('M22 40V29c0-2 1-4 2-4s2 2 2 4v11z','#07151e');c.restore();
  }
  function correspondence(c,d){
    paper(c,66,54,948,538);const ink='#274864';
    c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.moveTo(534,104);c.lineTo(534,550);c.stroke();
    c.fillStyle=d.color;c.font='700 60px serif';c.fillText(d.title,118,256);
    c.font='italic 29px Georgia,serif';c.fillText('A little joy,',120,315);c.fillText('from Samarkand.',120,356);
    c.fillStyle=ink;c.font='700 23px serif';c.fillText(`撒马尔罕 · ${quest.place}`,118,454);
    c.font='17px monospace';c.fillText(`SAMARKAND / ${quest.postmark}`,118,491);
    c.font='700 20px sans-serif';c.fillText('鸭群专用 · 丝绸之路城市志',118,544);
    c.fillStyle=d.color;c.fillRect(855,91,104,110);c.strokeStyle='#fcf1da';c.setLineDash([3,6]);c.lineWidth=4;c.strokeRect(861,97,92,98);c.setLineDash([]);
    brandMark(c,882,114,50);
    c.font='12px monospace';c.fillText('SILK ROAD',874,181);
    c.save();c.translate(847,167);c.rotate(-.19);c.strokeStyle='#274864aa';c.lineWidth=2;c.beginPath();c.arc(0,0,48,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,41,0,Math.PI*2);c.stroke();c.fillStyle=ink;c.textAlign='center';c.font='12px monospace';c.fillText(quest.postmark,0,-7);c.fillText('POSTCARD',0,13);for(let y=-18;y<30;y+=12){c.beginPath();c.moveTo(-123,y);c.bezierCurveTo(-99,y-10,-80,y+10,-57,y);c.stroke();}c.restore();
    c.fillStyle=ink;c.font='22px sans-serif';wrap(c,'致 '+(state.to.trim()||'亲爱的朋友'),580,249,376,29);
    c.strokeStyle='#27486425';c.lineWidth=1;for(let y=317;y<=479;y+=27){c.beginPath();c.moveTo(580,y);c.lineTo(958,y);c.stroke();}
    c.fillStyle=d.color;c.font='24px "Kaiti SC","STKaiti",serif';wrap(c,state.message.replace(/\s+/gu,' ').trim()||d.blessing,580,310,376,27);
    c.fillStyle=ink;c.font='21px sans-serif';wrap(c,'FROM  '+(state.from.trim()||'一位丝路旅人'),580,532,376,27);
  }
  async function paint(){
    const turn=++drawing; preparedFile=null;
    const oldExport=dialog.querySelector('#saved-card');if(oldExport){const oldUrl=oldExport.dataset.url;setTimeout(()=>URL.revokeObjectURL(oldUrl),60000);dialog.querySelector('#saved-card-panel').remove();}
    const canvas=dialog.querySelector('#postcard-canvas');if(!canvas)return;
    const buttons=[dialog.querySelector('#download-card'),dialog.querySelector('#share-card')];buttons.forEach(b=>b.disabled=true);
    try{
      const design=state.design,personal=photoMode==='personal'&&portraits.length>0;
      const image=images[design];
      const assets=personal?await loadPersonalAssets():null;
      await Promise.all([image.decode(),scenicBackdrop.decode()]);if(turn!==drawing)return;
      const c=canvas.getContext('2d'),d=designs[state.design];
      c.imageSmoothingEnabled=false;cover(c,scenicBackdrop,0,0,1080,1350);c.fillStyle='#1632491a';c.fillRect(0,0,1080,1350);
      correspondence(c,d);
      paper(c,66,660,948,644);
      // Quest cards reveal thirds; the finished postcard restores the complete selfie.
      if(d.crop==null)c.drawImage(image,82,676,916,610.67);
      else{const sw=image.naturalWidth/3;c.drawImage(image,sw*d.crop,0,sw,image.naturalHeight,82,676,916,610.67);}
      if(personal)drawPortraits(c,assets,design,82,676,916,610.67);
      if(filePreview){buttons[0].textContent='请打开本地网页后下载';return;}
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片导出失败')),'image/png'));
      if(turn!==drawing)return;
      preparedFile=new File([blob],`Samarkand-${quest.postmark}-${state.design+1}.png`,{type:'image/png'});
      const readyToSend=photoMode==='original'||(!processing&&portraits.length>0);
      buttons.forEach(b=>b.disabled=!readyToSend);buttons[0].textContent=readyToSend?'下载到本地':processing?'正在制作像素合影…':'请上传照片，或选择使用原版';
    }catch{if(turn===drawing){notice('图片暂时没有加载成功，请检查网络后重新选择卡片款式。');buttons[0].textContent='图片未就绪';}}
  }
  function download(){
    if(!unlocked()||!preparedFile)return;
    const url=URL.createObjectURL(preparedFile),a=document.createElement('a');a.href=url;a.download=preparedFile.name;a.click();
    let output=dialog.querySelector('#saved-card');if(!output){const fallback=document.createElement('details');fallback.id='saved-card-panel';const summary=document.createElement('summary');summary.textContent='下载未开始？展开并长按保存';output=document.createElement('img');output.id='saved-card';output.alt='导出的明信片，可长按保存';fallback.append(summary,output);dialog.querySelector('.postcard-preview').append(fallback);}
    if(output.dataset.url)URL.revokeObjectURL(output.dataset.url);output.dataset.url=url;output.src=url;
    notice('图片已准备好。若下载未开始，可展开预览下方的“长按保存”，再从微信或 Instagram 相册发送。');
  }
  async function share(){
    if(!unlocked()||!preparedFile)return;
    const data={title:`我的${quest.placeFull}明信片`,text:`${state.to}：${state.message}`,files:[preparedFile]};
    if(navigator.canShare?.(data)){
      try{await navigator.share(data);notice('系统分享面板已打开；选择微信好友、朋友圈或 Instagram 完成发送。');}
      catch(e){if(e.name!=='AbortError')notice('当前浏览器无法分享图片，请使用“保存明信片”。');}
    }else{download();notice('此浏览器没有图片分享面板，请保存图片后，在微信或 Instagram 中选择相册发送。');}
  }
  async function copy(){
    const base=location.protocol.startsWith('http')?location.origin+location.pathname:'https://carine7777.github.io/silk-road-city-atlas/';
    const text=`${state.to}：${state.message}\n——${state.from}\n我在${quest.placeFull}收集了三段故事，你也来找一封信吧。\n${base}#${quest.slug}-quest`;
    try{await navigator.clipboard.writeText(text);notice('祝福与探索链接已复制。粘贴给朋友，就能邀请她来寻宝。');}
    catch{notice('无法自动复制，请选中下面的文字手动复制。');const area=document.createElement('textarea');area.value=text;area.readOnly=true;area.setAttribute('aria-label','可复制的邀请文字');dialog.querySelector('#postcard-status').append(area);area.select();}
  }
  window.RegistanQuest={attachChallenge,updateScene,open};updateScene(currentScene);
  if(location.hash==='#registan-quest'){activate('registan');open();}
  if(location.hash==='#bibi-khanym-quest'){activate('bibi');open();}
  if(location.hash.startsWith('#registan-auth-')){open();notice('微信登录尚未完成，请重试或先以访客身份继续。');}
  if(location.protocol.startsWith('http'))fetch('/api/session').then(r=>r.ok?r.json():null).then(session=>{
    if(!session)return;loginAvailable=session.available===true;account=session.user;
    if(account && session.progress){const p=session.progress;
      if(!state.started){for(const field of ['to','from','message'])if(typeof p[field]==='string')state[field]=p[field].slice(0,field==='message'?100:24);if([0,1,2].includes(p.design))state.design=p.design;}
      state.found=[...new Set([...state.found,...(p.found||[])])].filter(id=>tasks.some(t=>t.id===id));state.started=true;}
    if(account)save();
    if(dialog.open && !dialog.querySelector('#postcard-canvas'))renderQuest();
  }).catch(()=>{});
})();
