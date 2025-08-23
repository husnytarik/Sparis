// ===== Helpers =====
const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));
const root = document.documentElement;
const fmtTL = n => (n||0).toLocaleString('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2});
const fmtDT = ts => new Date(ts).toLocaleString('tr-TR');
const gToKgText = g => `${(g/1000).toFixed(2)} kg`;
const normalizePhone = p => String(p||'').replace(/\D/g,''); // sadece rakamlar

// ===== Theme =====
const themeToggle = $('#themeToggle');
function setTheme(mode){ if(mode==='light'||mode==='dark'){root.setAttribute('data-theme',mode);} else root.removeAttribute('data-theme'); localStorage.setItem('theme',mode); renderThemeIcon(); }
function renderThemeIcon(){ const m=localStorage.getItem('theme')||'dark'; const i=themeToggle.querySelector('.icon'); i.textContent = m==='light'?'☀︎':'☾'; themeToggle.setAttribute('aria-label',`Temayı değiştir (${m==='light'?'Koyu':'Açık'})`); }
themeToggle.addEventListener('click',()=>{ const cur=localStorage.getItem('theme')||'dark'; setTheme(cur==='dark'?'light':'dark'); });
setTheme(localStorage.getItem('theme')||'dark');
$('#year').textContent = new Date().getFullYear();

// ===== Toast =====
const toastEl = $('#toast');
function toast(msg, type='ok', t=2600){ const n = document.createElement('div'); n.className = `t ${type}`; n.textContent = msg; toastEl.appendChild(n); setTimeout(()=> n.remove(), t); }

// ===== Catalog (price & stock) =====
const DEFAULT_CATALOG = {
  'etiyopya-yirgacheffe': { price: 950,  stock: 5000 },
  'kenya-aa':              { price: 980,  stock: 4000 },
  'tanzanya-peaberry':     { price: 820,  stock: 3500 },
  'kolombiya-supremo':     { price: 720,  stock: 6000 },
  'brezilya-santos':       { price: 650,  stock: 8000 },
  'guatemala-antigua':     { price: 780,  stock: 3000 },
  'kosta-rika-tarrazu':    { price: 840,  stock: 4200 },
  'sumatra-mandheling':    { price: 700,  stock: 4800 },
  'hindistan-monsooned-malabar': { price: 680, stock: 4500 },
  'papua-yeni-gine':       { price: 760,  stock: 2600 },
  'panama-geisha':         { price: 3200, stock: 1200 },
  'yemen-mocha':           { price: 2100, stock: 1800 }
};
function loadCatalog(){
  const raw = localStorage.getItem('catalog');
  if(!raw){ localStorage.setItem('catalog', JSON.stringify(DEFAULT_CATALOG)); return structuredClone(DEFAULT_CATALOG); }
  try{
    const data = JSON.parse(raw);
    const migrated = {};
    for(const [k,v] of Object.entries(data)){ migrated[k] = typeof v==='number' ? {price:v,stock:3000} : {price:+v.price||0, stock:+v.stock||0}; }
    for(const [k,v] of Object.entries(DEFAULT_CATALOG)){ if(!migrated[k]) migrated[k] = structuredClone(v); }
    return migrated;
  }catch{ return structuredClone(DEFAULT_CATALOG); }
}
function saveCatalog(c){ localStorage.setItem('catalog', JSON.stringify(c)); }
let CATALOG = loadCatalog();

// ===== Product Cards =====
function slugify(str=''){ return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function attachAutoImage(container, baseName, explicitPath=null){
  const fallback = 'assets/img/products/placeholder.svg';
  const list = explicitPath ? [explicitPath] : [
    `assets/img/products/${baseName}.webp`,
    `assets/img/products/${baseName}.jpg`,
    `assets/img/products/${baseName}.png`,
    `assets/img/products/${baseName}.jpeg`,
  ];
  const img = new Image(); img.alt=''; img.decoding='async'; img.loading='lazy';
  let i=0; function tryNext(){ if(i>=list.length){ container.innerHTML=''; const p=new Image(); p.src=fallback; container.appendChild(p); return; } img.src=list[i++]; }
  img.onload=()=>{ container.innerHTML=''; container.appendChild(img); }; img.onerror=tryNext; tryNext();
}
const cards = $$('#cards .card');
function mountCards(){
  cards.forEach(card=>{
    const name = card.querySelector('h3,h2,h4')?.textContent.trim() || '';
    const slug = slugify(name);
    const media = card.querySelector('.card__media');
    const priceEl = card.querySelector('[data-price]');
    const stockEl = card.querySelector('[data-stock]');
    attachAutoImage(media, slug);
    const entry = CATALOG[slug] ?? { price:0, stock:0 };
    priceEl.textContent = `${fmtTL(entry.price)} / kg`;
    stockEl.textContent = `Stok: ${gToKgText(entry.stock)}`;
    card.addEventListener('click', ()=> openQtyModal(card, {name, slug, price: entry.price, stock: entry.stock}));
  });
}
mountCards();

// ===== Filters =====
const filterBtns = $$('[data-filter]');
filterBtns.forEach(b=> b.addEventListener('click', ()=>{
  const cat = b.getAttribute('data-filter');
  filterBtns.forEach(x=>x.classList.remove('is-active')); b.classList.add('is-active');
  cards.forEach(card=>{ const match = cat==='all' || card.dataset.cat===cat; card.style.display = match ? '' : 'none'; });
}));

// ===== Auth & nav =====
const viewAuth = $('#viewAuth'), viewStore = $('#viewStore'), viewDash = $('#viewDashboard'), viewMyOrders = $('#viewMyOrders');
function showView(id){ [viewAuth,viewStore,viewDash,viewMyOrders].forEach(v=>v.classList.add('is-hidden')); id.classList.remove('is-hidden'); }
const authArea = $('#authArea');

function getSession(){ try{ return JSON.parse(localStorage.getItem('session')||'null'); }catch{ return null; } }
function setSession(s){ localStorage.setItem('session', JSON.stringify(s)); renderAuthArea(); updatePanelToggle(); }
function logout(){ localStorage.removeItem('session'); renderAuthArea(); updatePanelToggle(); showView(viewAuth); }

function renderAuthArea(){
  const s = getSession();
  authArea.innerHTML = '';
  const btnPanel = $('#panelToggle');
  if(!s){
    const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = 'Giriş';
    btn.addEventListener('click', ()=> showView(viewAuth));
    authArea.appendChild(btn);
    $('#panelLabel').textContent = 'Sepet';
    btnPanel.title = 'Sepet';
    showView(viewAuth);
    return;
  }
  const info = document.createElement('span'); info.className = 'muted fs-sm';
  if(s.role==='buyer'){
    info.textContent = `Müşteri: ${s.phone}`;
    const ordersBtn = document.createElement('button'); ordersBtn.className='btn btn--ghost'; ordersBtn.textContent='Siparişlerim';
    ordersBtn.addEventListener('click', ()=>{ renderMyOrders(currentMyOrdersFilter); showView(viewMyOrders); });
    const storeBtn = document.createElement('button'); storeBtn.className='btn btn--ghost'; storeBtn.textContent='Mağaza';
    storeBtn.addEventListener('click', ()=> showView(viewStore));
    const out = document.createElement('button'); out.className='btn'; out.textContent='Çıkış'; out.addEventListener('click', logout);
    authArea.append(info, ordersBtn, storeBtn, out);
    $('#panelLabel').textContent = 'Sepet'; btnPanel.title = 'Sepet';
    showView(viewStore);
  }else{
    info.textContent = `Üretici: ${s.user}`;
    const dashBtn = document.createElement('button'); dashBtn.className='btn btn--ghost'; dashBtn.textContent='Dashboard';
    dashBtn.addEventListener('click', ()=>{ selectDashTab('orders'); renderProducerOrdersStatus(currentProdStatus); showView(viewDash); });
    const out = document.createElement('button'); out.className='btn'; out.textContent='Çıkış'; out.addEventListener('click', logout);
    authArea.append(info, dashBtn, out);
    $('#panelLabel').textContent = 'Gelen Siparişler'; btnPanel.title = 'Gelen Siparişler';
    selectDashTab('orders'); renderProducerOrdersStatus(currentProdStatus); showView(viewDash);
  }
}
renderAuthArea();

// Auth tabs
$$('.auth-tabs .tab').forEach(t=>{
  t.addEventListener('click', ()=>{
    $$('.auth-tabs .tab').forEach(x=>x.classList.remove('is-active'));
    t.classList.add('is-active');
    const which = t.getAttribute('data-tab');
    $$('#viewAuth .panel').forEach(p=>p.classList.add('is-hidden'));
    $('#'+(which==='buyer'?'buyerForm':'producerForm')).classList.remove('is-hidden');
  });
});

// Buyer login
$('#buyerLoginBtn').addEventListener('click', ()=>{
  const phoneRaw = $('#buyerPhone').value.trim();
  const phone = normalizePhone(phoneRaw);
  if(!phone){ toast('Telefon giriniz','warn'); return; }
  setSession({ role:'buyer', phone });
  toast('Giriş yapıldı (Müşteri).'); showView(viewStore);
});

// Producer login
$('#producerLoginBtn').addEventListener('click', ()=>{
  const u = $('#producerUser').value.trim();
  const p = $('#producerPass').value;
  if(u==='producer' && p==='1234'){
    setSession({ role:'producer', user:u });
    toast('Giriş yapıldı (Üretici).');
    selectDashTab('orders'); renderProducerOrdersStatus(currentProdStatus); showView(viewDash);
  }else{ toast('Geçersiz kullanıcı/şifre','err'); }
});

// ===== Qty Modal =====
const qtyModal = $('#qtyModal');
const qtyRange = $('#qtyRange'), qtyLabel = $('#qtyLabel'), qtyKg = $('#qtyKg'), qtyImg = $('#qtyImg');
const qtyName = $('#qtyName'), qtyDesc = $('#qtyDesc'), qtyUnitPrice = $('#qtyUnitPrice'), qtyLineTotal = $('#qtyLineTotal');
const qtyWarn = $('#qtyWarn'), qtyStockText = $('#qtyStockText');
let activeProduct = null;
let lastFocusModal = null;

function openQtyModal(card, meta){
  lastFocusModal = document.activeElement;
  activeProduct = { card, ...meta };
  const desc = card.querySelector('p')?.textContent.trim() || '';
  qtyName.textContent = meta.name; qtyDesc.textContent = desc;
  qtyUnitPrice.textContent = fmtTL(meta.price);
  qtyImg.src = card.querySelector('.card__media img')?.src || 'assets/img/products/placeholder.svg';
  qtyStockText.textContent = `${gToKgText(meta.stock)} (${meta.stock} g)`;
  const step = parseInt(card.getAttribute('data-step-grams') || '100',10);
  const maxKg = parseInt(card.getAttribute('data-max-kg') || '5',10);
  qtyRange.step = step; qtyRange.min = step; qtyRange.max = maxKg*1000; qtyRange.value = step;
  updateQtyLabelsAndTotal();
  qtyModal.removeAttribute('inert'); qtyModal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden'; $('#qtyRange')?.focus();
}
function closeQtyModal(){
  if(qtyModal.contains(document.activeElement)){ $('#themeToggle')?.focus(); }
  qtyModal.setAttribute('aria-hidden','true'); qtyModal.setAttribute('inert','');
  document.body.style.overflow='';
  if(lastFocusModal && document.contains(lastFocusModal)) lastFocusModal.focus();
  activeProduct=null;
}
function updateQtyLabelsAndTotal(){
  const grams = parseInt(qtyRange.value||'0',10);
  qtyLabel.textContent = grams; qtyKg.textContent = (grams/1000).toFixed(2);
  const up = activeProduct?.price || 0; const line = (grams/1000)*up;
  qtyLineTotal.textContent = fmtTL(line);
  const stock = activeProduct?.stock ?? 0;
  if(grams > stock){ qtyWarn.classList.remove('is-hidden'); } else { qtyWarn.classList.add('is-hidden'); }
}
qtyRange.addEventListener('input', updateQtyLabelsAndTotal);
$$('[data-close-modal]').forEach(x=> x.addEventListener('click', closeQtyModal));
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && qtyModal.getAttribute('aria-hidden')==='false') closeQtyModal(); });

// ===== Drawer (only buyer) / Panel Toggle =====
const panelToggle = $('#panelToggle');
const mainDrawer = $('#mainDrawer');
const cartBody = $('#cartBody');
const cartTotalPriceEl = $('#cartTotalPrice');
const storeNameInput = $('#storeNameInput');
let lastFocusDrawer = null;

panelToggle.addEventListener('click', ()=>{
  const s = getSession();
  if(s?.role === 'producer'){
    // Üretici: sayfaya geç, Siparişler sekmesini aç
    selectDashTab('orders'); renderProducerOrdersStatus(currentProdStatus); showView(viewDash);
  }else{
    // Müşteri: sepet çekmecesini aç
    openMainDrawer();
  }
});
$$('[data-close-drawer]').forEach(x=> x.addEventListener('click', closeMainDrawer));
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && mainDrawer.getAttribute('aria-hidden')==='false') closeMainDrawer(); });

function openMainDrawer(){
  lastFocusDrawer = document.activeElement;
  // Son kullanılan mağaza adını getir
  storeNameInput.value = localStorage.getItem('storeName') || '';
  renderCart();
  mainDrawer.removeAttribute('inert'); mainDrawer.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  $('#confirmOrderBtn')?.focus();
}
function closeMainDrawer(){
  $('#panelToggle')?.focus();
  mainDrawer.setAttribute('aria-hidden','true'); mainDrawer.setAttribute('inert','');
  document.body.style.overflow='';
  if(lastFocusDrawer && document.contains(lastFocusDrawer)) lastFocusDrawer.focus();
}

// mağaza adı değişince sakla
storeNameInput.addEventListener('change', ()=> localStorage.setItem('storeName', storeNameInput.value.trim()));

// ===== Cart =====
let cart = loadCart();
function loadCart(){ try{ return JSON.parse(localStorage.getItem('cart')||'[]'); }catch{ return []; } }
function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); renderCart(); updatePanelToggle(); }
function addToCart(item){ const ex = cart.find(x=> x.slug===item.slug); if(ex){ ex.grams += item.grams; ex.line = (ex.grams/1000)*ex.pricePerKg; } else cart.push(item); saveCart(); }
function removeFromCart(slug){ cart = cart.filter(x=>x.slug!==slug); saveCart(); }
function clearCart(){ cart = []; saveCart(); }
function cartTotal(){ return cart.reduce((s,x)=> s + x.line, 0); }

function renderCart(){
  cartBody.innerHTML='';
  if(cart.length===0){ cartBody.innerHTML = `<div class="muted">Sepetiniz boş.</div>`; }
  cart.forEach(i=>{
    const row = document.createElement('div'); row.className='cart-item';
    row.innerHTML = `
      <img src="${i.img}" alt="">
      <div>
        <div class="cart-item__name">${i.name}</div>
        <div class="cart-item__meta">${i.grams} g • ${fmtTL(i.pricePerKg)}/kg</div>
      </div>
      <div class="cart-item__actions">
        <div class="cart-item__meta"><strong>${fmtTL(i.line)}</strong></div>
        <button class="cart-item__btn" data-remove="${i.slug}">Kaldır</button>
      </div>`;
    cartBody.appendChild(row);
  });
  $$('#cartBody [data-remove]').forEach(b=> b.addEventListener('click', ()=> removeFromCart(b.getAttribute('data-remove'))));
  cartTotalPriceEl.textContent = fmtTL(cartTotal());
}
renderCart();

$('#addToCartBtn').addEventListener('click', ()=>{
  if(!activeProduct) return;
  const grams = parseInt(qtyRange.value||'0',10);
  if(grams<=0){ toast('Miktar seçiniz','warn'); return; }
  const img = $('#qtyImg').src;
  const item = { slug:activeProduct.slug, name:activeProduct.name, grams, pricePerKg:activeProduct.price, img, line:(grams/1000)*activeProduct.price };
  addToCart(item);
  toast('Sepete eklendi.');
  closeQtyModal(); openMainDrawer();
});

// ===== Orders store =====
function loadOrders(){ try{ return JSON.parse(localStorage.getItem('orders')||'[]'); }catch{ return []; } }
function saveOrders(arr){ localStorage.setItem('orders', JSON.stringify(arr)); updatePanelToggle(); }

// ===== Place order (no payment) =====
$('#confirmOrderBtn').addEventListener('click', ()=>{
  const session = getSession();
  if(!session || session.role!=='buyer'){ toast('Sipariş için önce müşteri girişi yapınız.','warn'); showView(viewAuth); return; }
  if(cart.length===0){ toast('Sepet boş.','warn'); return; }

  // Mağaza / teslimat metni
  const storeName = (storeNameInput.value || '').trim();
  localStorage.setItem('storeName', storeName);

  const orderId = 'ORD-' + Date.now().toString(36);
  const total = cartTotal();
  const order = {
    id: orderId,
    buyerPhone: normalizePhone(session.phone),
    storeName, // <<< YENİ
    items: cart,
    totalPrice: total,
    status: 'pending', // pending → approved → preparing → in_transit → delivered
    timeline: [{ s:'pending', t: Date.now() }],
    invoiceDataUrl: null
  };
  const orders = loadOrders(); orders.unshift(order); saveOrders(orders);

  // bildirimler (storeName’i ekle)
  const suffix = storeName ? ` • ${storeName}` : '';
  notifySMS('producer', `Yeni sipariş: ${orderId} • ${fmtTL(total)}${suffix}`);
  notifyInApp('Üreticiye yeni sipariş bildirildi.');
  notifySMS(session.phone, `Siparişiniz alındı: ${orderId} • ${fmtTL(total)}${suffix}`);

  toast('Sipariş onaylandı. Durum takibi ekranına geçiliyor...');
  clearCart();
  closeMainDrawer();
  setTimeout(()=>{ currentMyOrdersFilter = 'active'; renderMyOrders(currentMyOrdersFilter); showView(viewMyOrders); }, 0);
});

// ===== Notifications (demo) =====
function notifySMS(to, message){ console.log('SMS →', to, message); }
function notifyInApp(msg){ toast(msg, 'ok'); }

// ===== Buyer: My Orders =====
let currentMyOrdersFilter = 'active'; // active | past | all
$('#myOrdersTabs')?.addEventListener('click', (e)=>{
  const b = e.target.closest('.tab'); if(!b) return;
  $$('#myOrdersTabs .tab').forEach(x=>x.classList.remove('is-active'));
  b.classList.add('is-active');
  currentMyOrdersFilter = b.getAttribute('data-mtab');
  renderMyOrders(currentMyOrdersFilter);
});
function isPastStatus(s){ return s==='delivered'; }
function isActiveStatus(s){ return !isPastStatus(s); }
function labelStatus(s){
  return s==='pending'   ? 'Yeni Sipariş'
       : s==='approved'  ? 'Onaylandı'
       : s==='preparing' ? 'Hazırlanıyor'
       : s==='in_transit'? 'Sevkiyatta'
       : s==='delivered' ? 'Teslim Edildi'
       : s;
}
function renderTimeline(tl=[]){
  if(!tl?.length) return '';
  return `<ul class="timeline">` + tl.map(x=> `<li><strong>${labelStatus(x.s)}</strong> — <time>${fmtDT(x.t)}</time></li>`).join('') + `</ul>`;
}
function renderMyOrders(filter='active'){
  const s = getSession(); const box = $('#myOrdersList'); box.innerHTML='';
  const all = loadOrders().filter(o=> o.buyerPhone===normalizePhone(s?.phone));
  let list = all; if(filter==='active') list = all.filter(o=> isActiveStatus(o.status)); else if(filter==='past') list = all.filter(o=> isPastStatus(o.status));
  if(list.length===0){ box.innerHTML = `<div class="muted">Kayıt bulunamadı.</div>`; return; }
  list.forEach(o=>{
    const div = document.createElement('div'); div.className='panel';
    div.innerHTML = `
      <div class="row"><strong>${o.id}</strong><span>${fmtTL(o.totalPrice)}</span></div>
      <div class="row">
        <span class="status status--${o.status}">${labelStatus(o.status)}</span>
        <span class="muted fs-sm">Oluşturma: ${fmtDT(o.timeline[0]?.t || Date.now())}</span>
      </div>
      ${o.storeName ? `<div class="note mt-1">Teslimat / Mağaza: <strong>${o.storeName}</strong></div>` : ''}
      <div class="stack mt-1">
        ${o.items.map(i=>`<div class="row"><span>${i.name} — ${i.grams} g</span><span>${fmtTL(i.line)}</span></div>`).join('')}
      </div>
      ${renderTimeline(o.timeline)}
      <div class="row mt-1">
        <div class="muted fs-sm">Fatura: ${o.invoiceDataUrl ? 'Yüklendi' : 'Yok'}</div>
        ${o.invoiceDataUrl ? `<a class="btn btn--ghost" href="${o.invoiceDataUrl}" download="${o.id}.pdf">Faturayı İndir (PDF)</a>` : ''}
      </div>`;
    box.appendChild(div);
  });
}

// ===== Producer: Dashboard tabs =====
const dashTabs = $('#dashTabs');
dashTabs.addEventListener('click', (e)=>{
  const b = e.target.closest('.tab'); if(!b) return;
  $$('#dashTabs .tab').forEach(x=>x.classList.remove('is-active'));
  b.classList.add('is-active');
  const which = b.getAttribute('data-dtab');
  selectDashTab(which);
});
function selectDashTab(which='orders'){
  const ordersPanel = $('#dOrders'), catalogPanel = $('#dCatalog');
  if(which==='catalog'){
    ordersPanel.classList.add('is-hidden');
    catalogPanel.classList.remove('is-hidden');
    // <<< Katalog tabı açılınca tabloyu oluştur
    renderCatalogTable();
  }else{
    catalogPanel.classList.add('is-hidden');
    ordersPanel.classList.remove('is-hidden');
    renderProducerOrdersStatus(currentProdStatus);
  }
}

// ===== Producer: Order Status Tabs & List =====
let currentProdStatus = 'pending'; // pending|approved|preparing|in_transit|delivered
const ordersStatusTabs = $('#ordersStatusTabs');
ordersStatusTabs.addEventListener('click', (e)=>{
  const b = e.target.closest('.tab'); if(!b) return;
  $$('#ordersStatusTabs .tab').forEach(x=>x.classList.remove('is-active'));
  b.classList.add('is-active');
  currentProdStatus = b.getAttribute('data-ostatus');
  renderProducerOrdersStatus(currentProdStatus);
});

function renderProducerOrdersStatus(status='pending'){
  const box = $('#prodOrdersList'); box.innerHTML='';
  const orders = loadOrders().filter(o=> o.status===status);
  if(orders.length===0){ box.innerHTML = `<div class="muted">Kayıt bulunamadı.</div>`; return; }

  orders.forEach(o=>{
    const card = document.createElement('div'); card.className='order-card';
    const buyerMasked = (o.buyerPhone||'').replace(/(\d{3})\d+(\d{2})/, '$1***$2');
    const selectId = `sel-${o.id}`;
    card.innerHTML = `
      <div class="order-head">
        <strong>${o.id}</strong>
        <span>${fmtTL(o.totalPrice)}</span>
      </div>
      <div class="row">
        <span class="muted fs-sm">Müşteri: ${buyerMasked}</span>
        <span class="status status--${o.status}">${labelStatus(o.status)}</span>
      </div>
      ${o.storeName ? `<div class="note mt-1">Teslimat / Mağaza: <strong>${o.storeName}</strong></div>` : ''}
      <div class="order-lines">
        ${o.items.map(i=>`<div class="row"><span>${i.name} — ${i.grams} g</span><span>${fmtTL(i.line)}</span></div>`).join('')}
      </div>
      ${renderTimeline(o.timeline)}
      <div class="order-actions">
        <label class="control">
          <span>Durumu Güncelle</span>
          <select id="${selectId}" data-status-for="${o.id}">
            ${['pending','approved','preparing','in_transit','delivered'].map(s=> `<option value="${s}" ${s===o.status?'selected':''}>${labelStatus(s)}</option>`).join('')}
          </select>
        </label>
        <button class="btn" data-apply-status="${o.id}">Uygula</button>
        <label class="control">
          <span>Fatura (PDF) yükle</span>
          <input type="file" accept="application/pdf" data-invoice="${o.id}">
        </label>
        ${o.invoiceDataUrl ? `<a class="btn btn--ghost" href="${o.invoiceDataUrl}" download="${o.id}.pdf">Mevcut Faturayı İndir</a>`: ''}
      </div>
    `;
    box.appendChild(card);
  });

  $$('[data-apply-status]').forEach(b=> b.addEventListener('click', ()=>{
    const id = b.getAttribute('data-apply-status'); const sel = document.querySelector(`select[data-status-for="${id}"]`);
    if(sel) updateOrderStatus(id, sel.value);
  }));
  $$('[data-invoice]').forEach(inp=> inp.addEventListener('change', handleInvoiceUpload));
}

function updateOrderStatus(id, next){
  const orders = loadOrders();
  const o = orders.find(x=>x.id===id); if(!o) return;
  if(o.status === next){ toast('Durum değişmedi.','warn'); return; }
  o.status = next; o.timeline.push({ s:next, t: Date.now() });
  saveOrders(orders);
  notifySMS(o.buyerPhone, `Sipariş ${id} durumu: ${labelStatus(next)}`);
  notifyInApp(`Sipariş ${id} ${labelStatus(next)}.`);
  // Üretici listesi ve müşteri tarafı yenile
  renderProducerOrdersStatus(currentProdStatus);
  if(getSession()?.role==='buyer'){ renderMyOrders(currentMyOrdersFilter); }
}

// Invoice upload (base64)
function handleInvoiceUpload(e){
  const file = e.target.files?.[0]; if(!file) return;
  if(file.type!=='application/pdf'){ toast('PDF seçiniz','warn'); return; }
  const id = e.target.getAttribute('data-invoice');
  const reader = new FileReader();
  reader.onload = ()=>{
    const dataUrl = reader.result;
    const orders = loadOrders();
    const o = orders.find(x=>x.id===id); if(!o) return;
    o.invoiceDataUrl = dataUrl; saveOrders(orders);
    toast('Fatura yüklendi.');
    renderProducerOrdersStatus(currentProdStatus);
    notifySMS(o.buyerPhone, `Sipariş ${id} faturası hazır.`);
    if(getSession()?.role==='buyer'){ renderMyOrders(currentMyOrdersFilter); }
  };
  reader.readAsDataURL(file);
}

// ===== Catalog UI =====
function renderCatalogTable(){
  const wrap = $('#catalogTableWrap'); wrap.innerHTML='';
  const table = document.createElement('table'); table.className='table';
  const header = `<tr><th>Ürün</th><th>Slug</th><th>₺/kg</th><th>Stok (g)</th></tr>`;
  const rows = Object.keys(CATALOG).sort().map(sl=>{
    const card = Array.from(document.querySelectorAll('#cards .card')).find(c=> slugify(c.querySelector('h3,h2,h4').textContent.trim())===sl);
    const name = card ? card.querySelector('h3,h2,h4').textContent.trim() : sl;
    const val = CATALOG[sl] ?? {price:0,stock:0};
    return `<tr>
      <td>${name}</td>
      <td class="muted fs-sm">${sl}</td>
      <td><input class="cat-price" type="number" min="0" step="10" value="${val.price}" data-sl="${sl}" data-kind="price"></td>
      <td><input class="cat-stock" type="number" min="0" step="50" value="${val.stock}" data-sl="${sl}" data-kind="stock"></td>
    </tr>`;
  }).join('');
  table.innerHTML = `<thead>${header}</thead><tbody>${rows}</tbody>`;
  wrap.appendChild(table);
}
$('#saveCatalogBtn').addEventListener('click', ()=>{
  const inputs = $$('#dCatalog input');
  inputs.forEach(inp=>{
    const sl = inp.getAttribute('data-sl'); const kind = inp.getAttribute('data-kind');
    const v = parseFloat(inp.value||'0');
    if(!CATALOG[sl]) CATALOG[sl] = { price:0, stock:0 };
    if(kind==='price') CATALOG[sl].price = isFinite(v)? v : 0;
    else CATALOG[sl].stock = isFinite(v)? Math.max(0, Math.round(v)) : 0;
  });
  saveCatalog(CATALOG);
  mountCards();
  $('#catalogSavedNote').textContent = 'Kaydedildi.'; setTimeout(()=> $('#catalogSavedNote').textContent='', 1500);
});

// ===== Panel Toggle Badge =====
function activeOrderCount(){ return loadOrders().filter(o=> o.status!=='delivered').length; }
function updatePanelToggle(){
  const s = getSession(); const badge = $('#panelBadge');
  if(s?.role==='producer'){ $('#panelLabel').textContent = 'Gelen Siparişler'; badge.textContent = String(activeOrderCount()); }
  else{ $('#panelLabel').textContent = 'Sepet'; badge.textContent = String(cart.length); }
}
updatePanelToggle();

// ===== Storage sync between tabs =====
window.addEventListener('storage', (e)=>{
  if(e.key === 'orders'){
    const s = getSession();
    if(s?.role === 'producer'){ renderProducerOrdersStatus(currentProdStatus); updatePanelToggle(); }
    if(s?.role === 'buyer'){ renderMyOrders(currentMyOrdersFilter); updatePanelToggle(); }
  }
});

// ===== Nav brand =====
$$('[data-nav="store"]').forEach(a=> a.addEventListener('click', e=>{ e.preventDefault(); showView(viewStore); }));
