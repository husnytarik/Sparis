// ===== Helpers =====
const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));
const root = document.documentElement;
const fmtTL = n => (n||0).toLocaleString('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2});
const fmtDT = ts => new Date(ts).toLocaleString('tr-TR');
const gToKgText = g => `${(g/1000).toFixed(2)} kg`;
const normalizePhone = p => String(p||'').replace(/\D/g,'');
const genId = ()=> 'p-' + Math.random().toString(36).slice(2,10);
const titleize = (s='') => s.replace(/\s+/g,' ').trim();

// ===== Theme =====
const themeToggle = $('#themeToggle');
function setTheme(mode){ if(mode==='light'||mode==='dark'){root.setAttribute('data-theme',mode);} else root.removeAttribute('data-theme'); localStorage.setItem('theme',mode); renderThemeIcon(); }
function renderThemeIcon(){ const m=localStorage.getItem('theme')||'dark'; const i=themeToggle?.querySelector('.icon'); if(i){ i.textContent = m==='light'?'☀︎':'☾'; } if(themeToggle){ themeToggle.setAttribute('aria-label',`Temayı değiştir (${m==='light'?'Koyu':'Açık'})`); } }
themeToggle?.addEventListener('click',()=>{ const cur=localStorage.getItem('theme')||'dark'; setTheme(cur==='dark'?'light':'dark'); });
setTheme(localStorage.getItem('theme')||'dark');
$('#year') && ($('#year').textContent = new Date().getFullYear());

// ===== Toast =====
const toastEl = $('#toast');
function toast(msg, type='ok', t=2600){ const n = document.createElement('div'); n.className = `t ${type}`; n.textContent = msg; toastEl.appendChild(n); setTimeout(()=> n.remove(), t); }

// ===== Placeholder image (no auto lookup) =====
const DEFAULT_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#2b2f36"/><stop offset="1" stop-color="#1f2329"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g fill="#8a94a7"><path d="M320 140c-30 0-54 24-54 54s24 54 54 54 54-24 54-54-24-54-54-54zm0 24c17 0 30 13 30 30s-13 30-30 30-30-13-30-30 13-30 30-30z"/></g>
  <text x="320" y="350" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#b4bcc9">Ürün görseli yok</text>
</svg>`);
const productImage = p => p.imgDataUrl ? p.imgDataUrl : DEFAULT_IMG;

// ===== Default products =====
const DEFAULT_PRODUCTS = [
  { name:'Etiyopya Yirgacheffe',           cat:'afrika',  price:950,  stock:5000, desc:'Çiçeksi, narenciye; hafif gövde.' },
  { name:'Kenya AA',                        cat:'afrika',  price:980,  stock:4000, desc:'Siyah frenk üzümü, limon; canlı asidite.' },
  { name:'Tanzanya Peaberry',               cat:'afrika',  price:820,  stock:3500, desc:'Dengeli, tatlı, meyvemsi bitiş.' },
  { name:'Kolombiya Supremo',               cat:'amerika', price:720,  stock:6000, desc:'Karamel, fındık; dengeli gövde.' },
  { name:'Brezilya Santos',                 cat:'amerika', price:650,  stock:8000, desc:'Çikolata, fındık; düşük asidite.' },
  { name:'Guatemala Antigua',               cat:'amerika', price:780,  stock:3000, desc:'Kakao, baharat; parlak asidite.' },
  { name:'Kosta Rika Tarrazú',              cat:'amerika', price:840,  stock:4200, desc:'Narenciye, bal; temiz bitiş.' },
  { name:'Sumatra Mandheling',              cat:'asya',    price:700,  stock:4800, desc:'Toprak tonları, koyu çikolata.' },
  { name:'Hindistan Monsooned Malabar',     cat:'asya',    price:680,  stock:4500, desc:'Yoğun gövde, baharat notaları.' },
  { name:'Papua Yeni Gine',                 cat:'asya',    price:760,  stock:2600, desc:'Meyvemsi, çiçeksi; dengeli.' },
  { name:'Panama Geisha',                   cat:'ozel',    price:3200, stock:1200, desc:'Yasemin, bergamot; kompleks.' },
  { name:'Yemen Mocha',                     cat:'ozel',    price:2100, stock:1800, desc:'Şarap benzeri gövde, kakao.' },
];

// ===== Catalog Store (Array) =====
/* Product: { id, name, cat, price, stock, desc, imgDataUrl } */
function loadCatalog(){
  const raw = localStorage.getItem('catalog');
  if(!raw){
    const arr = DEFAULT_PRODUCTS.map(p=> ({ id: genId(), ...p, imgDataUrl:'' }));
    localStorage.setItem('catalog', JSON.stringify(arr));
    return arr;
  }
  try{
    const data = JSON.parse(raw);
    if(!Array.isArray(data)){
      const arr = Object.values(data).map(val=>{
        if(typeof val === 'number') return { id:genId(), name:'Yeni Ürün', cat:'ozel', price:val, stock:3000, desc:'', imgDataUrl:'' };
        return { id:genId(), name:val.name||'Yeni Ürün', cat:val.cat||'ozel', price:+val.price||0, stock:+val.stock||0, desc:val.desc||'', imgDataUrl:val.imgDataUrl||'' };
      });
      localStorage.setItem('catalog', JSON.stringify(arr));
      return arr;
    }
    return data.map(p=> ({ id:p.id||genId(), name:p.name||'Yeni Ürün', cat:p.cat||'ozel', price:+p.price||0, stock:Math.max(0,+p.stock||0), desc:p.desc||'', imgDataUrl:p.imgDataUrl||'' }));
  }catch{
    const arr = DEFAULT_PRODUCTS.map(p=> ({ id: genId(), ...p, imgDataUrl:'' }));
    localStorage.setItem('catalog', JSON.stringify(arr));
    return arr;
  }
}
function saveCatalog(arr){ localStorage.setItem('catalog', JSON.stringify(arr)); }
let CATALOG = loadCatalog();

// ===== Store grid =====
let currentFilter = 'all';
function renderStoreGrid(){
  const grid = $('#cards'); if(!grid) return;
  grid.innerHTML = '';
  const list = [...CATALOG].sort((a,b)=> a.name.localeCompare(b.name,'tr'));
  list.forEach(prod=>{
    if(currentFilter!=='all' && prod.cat!==currentFilter) return;
    const art = document.createElement('article'); art.className='card'; art.dataset.id = prod.id;
    art.innerHTML = `
      <figure class="card__media"><img src="${productImage(prod)}" alt=""></figure>
      <h3 class="h4">${prod.name}</h3>
      <p>${prod.desc || 'Tat notları yakında.'}</p>
      <div class="price-row"><span class="price">${fmtTL(prod.price)} / kg</span><span class="stock">Stok: ${gToKgText(prod.stock)}</span></div>
    `;
    art.addEventListener('click', ()=> openQtyModal(art, { id:prod.id, name:prod.name, price:prod.price, stock:prod.stock, desc:prod.desc || '' }));
    grid.appendChild(art);
  });
}
$$('[data-filter]').forEach(b=> b.addEventListener('click', ()=>{
  currentFilter = b.getAttribute('data-filter');
  $$('[data-filter]').forEach(x=>x.classList.remove('is-active')); b.classList.add('is-active');
  renderStoreGrid();
}));

// ===== Auth & Views =====
const viewAuth = $('#viewAuth'), viewStore = $('#viewStore'), viewDash = $('#viewDashboard'), viewMyOrders = $('#viewMyOrders');
function showView(id){ [viewAuth,viewStore,viewDash,viewMyOrders].forEach(v=>v?.classList.add('is-hidden')); id?.classList.remove('is-hidden'); }
const authArea = $('#authArea');

function getSession(){ try{ return JSON.parse(localStorage.getItem('session')||'null'); }catch{ return null; } }
function setSession(s){ localStorage.setItem('session', JSON.stringify(s)); renderAuthArea(); updatePanelToggle(); }
function logout(){ localStorage.removeItem('session'); renderAuthArea(); updatePanelToggle(); showView(viewAuth); }

function renderCustomerBar(){
  const bar = $('#customerBar'); if(!bar) return;
  const s = getSession();
  if(s?.role === 'buyer'){
    bar.innerHTML = `<span class="customer-id">Müşteri: <strong>${s.phone}</strong></span>`;
    bar.classList.remove('is-hidden');
  }else{
    bar.classList.add('is-hidden'); bar.innerHTML='';
  }
}

function renderAuthArea(){
  const s = getSession();
  if(!authArea) return;
  authArea.innerHTML = '';
  const btnPanel = $('#panelToggle');

  if(!s){
    const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = 'Giriş';
    btn.addEventListener('click', ()=> showView(viewAuth));
    authArea.appendChild(btn);
    $('#panelLabel') && ($('#panelLabel').textContent = 'Sepet');
    if(btnPanel) btnPanel.title = 'Sepet';
    renderCustomerBar();
    showView(viewAuth);
    return;
  }

  if(s.role==='buyer'){
    const ordersBtn = document.createElement('button'); ordersBtn.className='btn btn--ghost'; ordersBtn.textContent='Siparişlerim';
    ordersBtn.addEventListener('click', ()=>{ renderMyOrders(currentMyOrdersFilter); showView(viewMyOrders); });

    const storeBtn = document.createElement('button'); storeBtn.className='btn btn--ghost'; storeBtn.textContent='Mağaza';
    storeBtn.addEventListener('click', ()=> showView(viewStore));

    const out = document.createElement('button'); out.className='btn'; out.textContent='Çıkış';
    out.addEventListener('click', logout);

    authArea.append(ordersBtn, storeBtn, out);

    $('#panelLabel') && ($('#panelLabel').textContent = 'Sepet');
    if(btnPanel) btnPanel.title = 'Sepet';

    renderCustomerBar();
    showView(viewStore);
  }else{
    const dashBtn = document.createElement('button'); dashBtn.className='btn btn--ghost'; dashBtn.textContent='Dashboard';
    dashBtn.addEventListener('click', ()=>{ selectDashTab('orders'); renderProducerOrdersStatus(currentProdStatus); showView(viewDash); });

    const out = document.createElement('button'); out.className='btn'; out.textContent='Çıkış';
    out.addEventListener('click', logout);

    authArea.append(dashBtn, out);

    $('#panelLabel') && ($('#panelLabel').textContent = 'Gelen Siparişler');
    if(btnPanel) btnPanel.title = 'Gelen Siparişler';

    renderCustomerBar();
    selectDashTab('orders'); renderProducerOrdersStatus(currentProdStatus); showView(viewDash);
  }
}
renderAuthArea();

$$('.auth-tabs .tab').forEach(t=>{
  t.addEventListener('click', ()=>{
    $$('.auth-tabs .tab').forEach(x=>x.classList.remove('is-active'));
    t.classList.add('is-active');
    const which = t.getAttribute('data-tab');
    $$('#viewAuth .panel').forEach(p=>p.classList.add('is-hidden'));
    $('#'+(which==='buyer'?'buyerForm':'producerForm')).classList.remove('is-hidden');
  });
});

$('#buyerLoginBtn')?.addEventListener('click', ()=>{
  const phoneRaw = $('#buyerPhone').value.trim();
  const phone = normalizePhone(phoneRaw);
  if(!phone){ toast('Telefon giriniz','warn'); return; }
  setSession({ role:'buyer', phone });
  toast('Giriş yapıldı (Müşteri).'); showView(viewStore);
  renderStoreGrid();
});
$('#producerLoginBtn')?.addEventListener('click', ()=>{
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
let activeProduct = null, lastFocusModal = null;

function openQtyModal(card, meta){
  lastFocusModal = document.activeElement;
  activeProduct = { card, ...meta };
  qtyName.textContent = meta.name;
  qtyDesc.textContent = meta.desc || card.querySelector('p')?.textContent.trim() || '';
  qtyUnitPrice.textContent = fmtTL(meta.price);
  qtyImg.src = card.querySelector('.card__media img')?.src || DEFAULT_IMG;

  qtyStockText.textContent = `${gToKgText(meta.stock)} (${meta.stock} g)`;
  const step = 100, maxKg = 5;
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
qtyRange?.addEventListener('input', updateQtyLabelsAndTotal);
$$('[data-close-modal]').forEach(x=> x.addEventListener('click', closeQtyModal));
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && qtyModal?.getAttribute('aria-hidden')==='false') closeQtyModal(); });

// ===== Drawer / Cart =====
const panelToggle = $('#panelToggle');
const mainDrawer = $('#mainDrawer');
const cartBody = $('#cartBody');
const cartTotalPriceEl = $('#cartTotalPrice');
const storeNameInput = $('#storeNameInput');
let lastFocusDrawer = null;

panelToggle?.addEventListener('click', ()=>{
  const s = getSession();
  if(s?.role === 'producer'){
    selectDashTab('orders'); renderProducerOrdersStatus(currentProdStatus); showView(viewDash);
  }else{
    openMainDrawer();
  }
});
$$('[data-close-drawer]').forEach(x=> x.addEventListener('click', closeMainDrawer));
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && mainDrawer?.getAttribute('aria-hidden')==='false') closeMainDrawer(); });

function openMainDrawer(){
  lastFocusDrawer = document.activeElement;
  storeNameInput && (storeNameInput.value = localStorage.getItem('storeName') || '');
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
storeNameInput?.addEventListener('change', ()=> localStorage.setItem('storeName', storeNameInput.value.trim()));

// Cart store
let cart = loadCart();
function loadCart(){ try{ return JSON.parse(localStorage.getItem('cart')||'[]'); }catch{ return []; } }
function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); renderCart(); updatePanelToggle(); }
function addToCart(item){ const ex = cart.find(x=> x.id===item.id); if(ex){ ex.grams += item.grams; ex.line = (ex.grams/1000)*ex.pricePerKg; } else cart.push(item); saveCart(); }
function removeFromCart(id){ cart = cart.filter(x=>x.id!==id); saveCart(); }
function clearCart(){ cart = []; saveCart(); }
function cartTotal(){ return cart.reduce((s,x)=> s + x.line, 0); }

function renderCart(){
  if(!cartBody) return;
  cartBody.innerHTML='';
  if(cart.length===0){ cartBody.innerHTML = `<div class="muted">Sepetiniz boş.</div>`; }
  cart.forEach(i=>{
    const row = document.createElement('div'); row.className='cart-item';
    row.innerHTML = `
      <img src="${i.img || DEFAULT_IMG}" alt="">
      <div>
        <div class="cart-item__name">${i.name}</div>
        <div class="cart-item__meta">${i.grams} g • ${fmtTL(i.pricePerKg)}/kg</div>
      </div>
      <div class="cart-item__actions">
        <div class="cart-item__meta"><strong>${fmtTL(i.line)}</strong></div>
        <button class="cart-item__btn" data-remove="${i.id}">Kaldır</button>
      </div>`;
    cartBody.appendChild(row);
  });
  $$('#cartBody [data-remove]').forEach(b=> b.addEventListener('click', ()=> removeFromCart(b.getAttribute('data-remove'))));
  cartTotalPriceEl && (cartTotalPriceEl.textContent = fmtTL(cartTotal()));
}

$('#addToCartBtn')?.addEventListener('click', ()=>{
  if(!activeProduct) return;
  const grams = parseInt(qtyRange.value||'0',10);
  if(grams<=0){ toast('Miktar seçiniz','warn'); return; }
  const img = $('#qtyImg').src || DEFAULT_IMG;
  const item = { id:activeProduct.id, name:activeProduct.name, grams, pricePerKg:activeProduct.price, img, line:(grams/1000)*activeProduct.price };
  addToCart(item);
  toast('Sepete eklendi.');
  closeQtyModal(); openMainDrawer();
});

// ===== Orders store =====
function loadOrders(){ try{ return JSON.parse(localStorage.getItem('orders')||'[]'); }catch{ return []; } }
function saveOrders(arr){ localStorage.setItem('orders', JSON.stringify(arr)); updatePanelToggle(); }

// Place order
$('#confirmOrderBtn')?.addEventListener('click', async ()=>{
  const session = getSession();
  if(!session || session.role!=='buyer'){ toast('Sipariş için önce müşteri girişi yapınız.','warn'); showView(viewAuth); return; }
  if(cart.length===0){ toast('Sepet boş.','warn'); return; }

  const storeName = (storeNameInput?.value || '').trim();
  localStorage.setItem('storeName', storeName);

  const orderId = 'ORD-' + Date.now().toString(36);
  const total = cartTotal();
  const order = {
    id: orderId,
    buyerPhone: normalizePhone(session.phone),
    storeName,
    items: cart,
    totalPrice: total,
    status: 'pending',
    timeline: [{ s:'pending', t: Date.now() }],
    invoiceDataUrl: null
  };
  const orders = loadOrders(); orders.unshift(order); saveOrders(orders);

  await remoteUpsertOrder(order); // REMOTE (varsa)

  const suffix = storeName ? ` • ${storeName}` : '';
  notifySMS('producer', `Yeni sipariş: ${orderId} • ${fmtTL(total)}${suffix}`);
  notifyInApp('Üreticiye yeni sipariş bildirildi.');
  notifySMS(session.phone, `Siparişiniz alındı: ${orderId} • ${fmtTL(total)}${suffix}`);

  toast('Sipariş oluşturuldu. Takip ekranına geçiliyor...');
  clearCart();
  closeMainDrawer();
  currentMyOrdersFilter = 'active'; renderMyOrders(currentMyOrdersFilter); showView(viewMyOrders);
});

// Notifications (demo)
function notifySMS(to, message){ console.log('SMS →', to, message); }
function notifyInApp(msg){ toast(msg, 'ok'); }

// ===== Buyer: My Orders =====
let currentMyOrdersFilter = 'active';
$('#myOrdersTabs')?.addEventListener('click', (e)=>{
  const b = e.target.closest('.tab'); if(!b) return;
  $$('#myOrdersTabs .tab').forEach(x=>x.classList.remove('is-active'));
  b.classList.add('is-active');
  currentMyOrdersFilter = b.getAttribute('data-mtab');
  renderMyOrders(currentMyOrdersFilter);
});
const isPastStatus = s => s==='delivered';
const isActiveStatus = s => !isPastStatus(s);
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
  const s = getSession(); const box = $('#myOrdersList'); if(!box) return; box.innerHTML='';
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

// ===== Producer: Dashboard =====
const dashTabs = $('#dashTabs');
dashTabs?.addEventListener('click', (e)=>{
  const b = e.target.closest('.tab'); if(!b) return;
  $$('#dashTabs .tab').forEach(x=>x.classList.remove('is-active'));
  b.classList.add('is-active');
  const which = b.getAttribute('data-dtab');
  selectDashTab(which);
});
function selectDashTab(which='orders'){
  const ordersPanel = $('#dOrders'), catalogPanel = $('#dCatalog');
  if(which==='catalog'){
    ordersPanel?.classList.add('is-hidden');
    catalogPanel?.classList.remove('is-hidden');
    renderCatalogUI();
  }else{
    catalogPanel?.classList.add('is-hidden');
    ordersPanel?.classList.remove('is-hidden');
    renderProducerOrdersStatus(currentProdStatus);
  }
}

// Orders status tabs
let currentProdStatus = 'pending';
const ordersStatusTabs = $('#ordersStatusTabs');
ordersStatusTabs?.addEventListener('click', (e)=>{
  const b = e.target.closest('.tab'); if(!b) return;
  $$('#ordersStatusTabs .tab').forEach(x=>x.classList.remove('is-active'));
  b.classList.add('is-active');
  currentProdStatus = b.getAttribute('data-ostatus');
  renderProducerOrdersStatus(currentProdStatus);
});

function renderProducerOrdersStatus(status='pending'){
  const box = $('#prodOrdersList'); if(!box) return; box.innerHTML='';
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

  $$('[data-apply-status]').forEach(b=> b.addEventListener('click', async ()=>{
    const id = b.getAttribute('data-apply-status'); const sel = document.querySelector(`select[data-status-for="${id}"]`);
    if(!sel) return;
    const orders = loadOrders();
    const o = orders.find(x=>x.id===id); if(!o) return;
    if(o.status === sel.value){ toast('Durum değişmedi.','warn'); return; }
    o.status = sel.value; o.timeline.push({ s:o.status, t: Date.now() });
    saveOrders(orders);
    await remoteUpdateStatus(o); // REMOTE
    notifySMS(o.buyerPhone, `Sipariş ${id} durumu: ${labelStatus(o.status)}`);
    notifyInApp(`Sipariş ${id} ${labelStatus(o.status)}.`);
    renderProducerOrdersStatus(currentProdStatus);
    const s = getSession(); if(s?.role==='buyer'){ renderMyOrders(currentMyOrdersFilter); }
  }));

  $$('[data-invoice]').forEach(inp=> inp.addEventListener('change', async (e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    if(file.type!=='application/pdf'){ toast('PDF seçiniz','warn'); return; }
    const id = e.target.getAttribute('data-invoice');
    const reader = new FileReader();
    reader.onload = async ()=>{
      const dataUrl = reader.result;
      const orders = loadOrders();
      const o = orders.find(x=>x.id===id); if(!o) return;
      o.invoiceDataUrl = dataUrl; saveOrders(orders);
      toast('Fatura yüklendi.');
      await remoteUpdateInvoice(o); // REMOTE
      renderProducerOrdersStatus(currentProdStatus);
      notifySMS(o.buyerPhone, `Sipariş ${id} faturası hazır.`);
      const s = getSession(); if(s?.role==='buyer'){ renderMyOrders(currentMyOrdersFilter); }
    };
    reader.readAsDataURL(file);
  }));
}

// ===== Catalog UI (table + mobile cards) =====
function renderCatalogTable(){
  const wrap = $('#catalogTableWrap'); if(!wrap) return; wrap.innerHTML='';
  const table = document.createElement('table'); table.className='table';
  const header = `<tr>
    <th>Ürün</th><th>Kat.</th><th>₺/kg</th><th>Stok (g)</th><th>Açıklama</th><th>Görsel</th><th class="actions">İşlem</th>
  </tr>`;

  const rows = [...CATALOG]
    .sort((a,b)=> a.name.localeCompare(b.name,'tr'))
    .map(p=> {
      return `<tr data-id="${p.id}">
        <td><input type="text" value="${p.name}"></td>
        <td>
          <select>
            <option value="afrika" ${p.cat==='afrika'?'selected':''}>Afrika</option>
            <option value="amerika" ${p.cat==='amerika'?'selected':''}>Orta & Güney Amerika</option>
            <option value="asya" ${p.cat==='asya'?'selected':''}>Asya & Pasifik</option>
            <option value="ozel" ${p.cat==='ozel'?'selected':''}>Özel</option>
          </select>
        </td>
        <td><input type="number" min="0" step="10" value="${p.price}"></td>
        <td><input type="number" min="0" step="50" value="${p.stock}"></td>
        <td><input type="text" value="${p.desc||''}"></td>
        <td>
          <div class="stack">
            <img src="${productImage(p)}" alt="" style="width:120px;height:80px;object-fit:cover;border:1px solid var(--border);border-radius:8px;" />
            <div class="row wrap">
              <label class="btn btn--ghost">
                Görsel Yükle
                <input type="file" accept="image/*" data-img-upload="${p.id}" hidden>
              </label>
              ${p.imgDataUrl ? `<button class="btn btn--ghost" data-img-del="${p.id}">Görseli Sil</button>` : ''}
            </div>
          </div>
        </td>
        <td class="actions">
          <button class="btn btn--ghost" data-del="${p.id}">Sil</button>
        </td>
      </tr>`;
    }).join('');

  table.innerHTML = `<thead>${header}</thead><tbody>${rows}</tbody>`;
  wrap.appendChild(table);

  // Sil
  $$('[data-del]', table).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-del');
      if(!confirm('Bu ürünü silmek istiyor musun?')) return;
      CATALOG = CATALOG.filter(p=> p.id!==id);
      cart = cart.filter(i=> i.id!==id); saveCart();
      saveCatalog(CATALOG);
      renderCatalogUI();
      renderStoreGrid();
      toast('Ürün silindi.');
    });
  });

  // Alan değişiklikleri
  $$('tbody tr', table).forEach(tr=>{
    const id = tr.getAttribute('data-id');
    const inputs = $$('input,select', tr);
    inputs.forEach(inp=>{
      inp.addEventListener('change', ()=>{
        const [nameEl, catEl, priceEl, stockEl, descEl] = $$('input,select', tr);
        const newObj = {
          name: titleize(nameEl.value||'Yeni Ürün'),
          cat:  catEl.value,
          price: +priceEl.value || 0,
          stock: Math.max(0, Math.round(+stockEl.value || 0)),
          desc:  (descEl?.value || '').trim()
        };
        const ix = CATALOG.findIndex(p=> p.id===id); if(ix>-1){ CATALOG[ix] = { ...CATALOG[ix], ...newObj }; saveCatalog(CATALOG); renderStoreGrid(); }
      });
    });
  });

  // Görsel yükle
  $$('[data-img-upload]', table).forEach(inp=>{
    inp.addEventListener('change', e=>{
      const file = e.target.files?.[0]; if(!file) return;
      if(!file.type.startsWith('image/')){ toast('Bir resim dosyası seçiniz','warn'); return; }
      const id = e.target.getAttribute('data-img-upload');
      const reader = new FileReader();
      reader.onload = ()=>{
        const ix = CATALOG.findIndex(p=> p.id===id); if(ix>-1){
          CATALOG[ix].imgDataUrl = reader.result;
          saveCatalog(CATALOG);
          toast('Görsel yüklendi.');
          renderCatalogUI();
          renderStoreGrid();
        }
      };
      reader.readAsDataURL(file);
    });
  });

  // Görsel sil
  $$('[data-img-del]', table).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-img-del');
      const ix = CATALOG.findIndex(p=> p.id===id); if(ix>-1){
        CATALOG[ix].imgDataUrl = '';
        saveCatalog(CATALOG);
        toast('Görsel silindi.');
        renderCatalogUI();
        renderStoreGrid();
      }
    });
  });
}

function renderCatalogCards(){
  const wrap = $('#catalogCardsWrap'); if(!wrap) return; wrap.innerHTML='';
  const list = [...CATALOG].sort((a,b)=> a.name.localeCompare(b.name,'tr'));

  list.forEach(p=>{
    const card = document.createElement('div'); card.className='catalog-card'; card.dataset.id = p.id;
    card.innerHTML = `
      <label class="control">
        <span>Ürün Adı</span>
        <input class="c-name" type="text" value="${p.name}">
      </label>
      <label class="control">
        <span>Kategori</span>
        <select class="c-cat">
          <option value="afrika" ${p.cat==='afrika'?'selected':''}>Afrika</option>
          <option value="amerika" ${p.cat==='amerika'?'selected':''}>Orta & Güney Amerika</option>
          <option value="asya" ${p.cat==='asya'?'selected':''}>Asya & Pasifik</option>
          <option value="ozel" ${p.cat==='ozel'?'selected':''}>Özel</option>
        </select>
      </label>
      <div class="row wrap">
        <label class="control grow">
          <span>₺/kg</span>
          <input class="c-price" type="number" min="0" step="10" value="${p.price}">
        </label>
        <label class="control grow">
          <span>Stok (g)</span>
          <input class="c-stock" type="number" min="0" step="50" value="${p.stock}">
        </label>
      </div>
      <label class="control">
        <span>Açıklama</span>
        <input class="c-desc" type="text" value="${p.desc||''}">
      </label>

      <div class="stack">
        <img src="${productImage(p)}" alt="" style="width:100%;max-width:320px;height:180px;object-fit:cover;border:1px solid var(--border);border-radius:8px;" />
        <div class="row wrap">
          <label class="btn btn--ghost">
            Görsel Yükle
            <input type="file" accept="image/*" data-cimg-upload="${p.id}" hidden>
          </label>
          ${p.imgDataUrl ? `<button class="btn btn--ghost" data-cimg-del="${p.id}">Görseli Sil</button>` : ''}
        </div>
      </div>

      <div class="actions">
        <button class="btn btn--ghost" data-del="${p.id}">Ürünü Sil</button>
      </div>
    `;
    wrap.appendChild(card);
  });

  // Değişiklikler
  wrap.addEventListener('change', (e)=>{
    const card = e.target.closest('.catalog-card'); if(!card) return;
    const id = card.dataset.id;
    const newObj = {
      name: titleize($('.c-name', card).value || 'Yeni Ürün'),
      cat:  $('.c-cat',  card).value,
      price: +$('.c-price',card).value || 0,
      stock: Math.max(0, Math.round(+$('.c-stock',card).value || 0)),
      desc:  ($('.c-desc', card).value || '').trim()
    };
    const ix = CATALOG.findIndex(p=> p.id===id); if(ix>-1){ CATALOG[ix] = { ...CATALOG[ix], ...newObj }; saveCatalog(CATALOG); renderStoreGrid(); }
  });

  // Görsel upload
  wrap.addEventListener('change', (e)=>{
    const inp = e.target.closest('[data-cimg-upload]'); if(!inp) return;
    const file = e.target.files?.[0]; if(!file) return;
    if(!file.type.startsWith('image/')){ toast('Bir resim dosyası seçiniz','warn'); return; }
    const id = e.target.getAttribute('data-cimg-upload');
    const reader = new FileReader();
    reader.onload = ()=>{
      const ix = CATALOG.findIndex(p=> p.id===id); if(ix>-1){
        CATALOG[ix].imgDataUrl = reader.result;
        saveCatalog(CATALOG);
        toast('Görsel yüklendi.');
        renderCatalogUI();
        renderStoreGrid();
      }
    };
    reader.readAsDataURL(file);
  });

  // Görsel sil
  wrap.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-cimg-del]'); if(!btn) return;
    const id = btn.getAttribute('data-cimg-del');
    const ix = CATALOG.findIndex(p=> p.id===id); if(ix>-1){
      CATALOG[ix].imgDataUrl = '';
      saveCatalog(CATALOG);
      toast('Görsel silindi.');
      renderCatalogUI();
      renderStoreGrid();
    }
  });

  // Ürün sil
  wrap.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-del]'); if(!btn) return;
    const id = btn.getAttribute('data-del');
    if(!confirm('Bu ürünü silmek istiyor musun?')) return;
    CATALOG = CATALOG.filter(p=> p.id!==id);
    cart = cart.filter(i=> i.id!==id); saveCart();
    saveCatalog(CATALOG);
    renderCatalogUI();
    renderStoreGrid();
    toast('Ürün silindi.');
  });
}

function renderCatalogUI(){ renderCatalogTable(); renderCatalogCards(); }

// Yeni ürün ekle
$('#addProductBtn')?.addEventListener('click', ()=>{
  const name = $('#newName').value.trim();
  const cat = $('#newCat').value;
  const price = +$('#newPrice').value || 0;
  const stock = Math.max(0, Math.round(+$('#newStock').value || 0));
  const desc = ($('#newDesc').value || '').trim();

  if(!name){ toast('Ürün adı gerekli','warn'); return; }

  CATALOG.push({ id:genId(), name:titleize(name), cat, price, stock, desc, imgDataUrl:'' });
  saveCatalog(CATALOG);

  $('#newName').value=''; $('#newPrice').value='0'; $('#newStock').value='0'; $('#newDesc').value='';
  $('#newCat').value='ozel';

  renderCatalogUI();
  renderStoreGrid();
  toast('Ürün eklendi.');
});

$('#saveCatalogBtn')?.addEventListener('click', ()=>{
  saveCatalog(CATALOG);
  const note = $('#catalogSavedNote'); if(note){ note.textContent = 'Kaydedildi.'; setTimeout(()=> note.textContent='', 1500); }
});

// Panel badge
function activeOrderCount(){ return loadOrders().filter(o=> o.status!=='delivered').length; }
function updatePanelToggle(){
  const s = getSession(); const badge = $('#panelBadge');
  if(!badge) return;
  if(s?.role==='producer'){ $('#panelLabel') && ($('#panelLabel').textContent = 'Gelen Siparişler'); badge.textContent = String(activeOrderCount()); }
  else{ $('#panelLabel') && ($('#panelLabel').textContent = 'Sepet'); badge.textContent = String(cart.length); }
}
updatePanelToggle();

// Storage sync
window.addEventListener('storage', (e)=>{
  if(e.key === 'orders'){
    const s = getSession();
    if(s?.role === 'producer'){ renderProducerOrdersStatus(currentProdStatus); updatePanelToggle(); }
    if(s?.role === 'buyer'){ renderMyOrders(currentMyOrdersFilter); updatePanelToggle(); }
  }
  if(e.key === 'catalog'){
    CATALOG = loadCatalog(); renderStoreGrid();
    if(!$('#dCatalog')?.classList.contains('is-hidden')) renderCatalogUI();
  }
});

function selectFirstView(){
  const s = getSession();
  if(s?.role==='buyer'){ showView(viewStore); }
  else if(s?.role==='producer'){ showView(viewDash); }
  else showView(viewAuth);
}

// ===== REMOTE (Supabase) – otomatik opsiyonel =====
const SUPABASE_URL = (window.ENV && window.ENV.SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (window.ENV && window.ENV.SUPABASE_ANON_KEY) || '';
const SB = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

async function remoteUpsertOrder(order){
  if(!SB) return;
  const header = {
    id: order.id,
    buyer_phone: order.buyerPhone,
    store_name: order.storeName || null,
    total_price: order.totalPrice,
    status: order.status,
    timeline: order.timeline,
    invoice_url: order.invoiceDataUrl || null,
    created_at: new Date(order.timeline?.[0]?.t || Date.now()).toISOString(),
  };
  await SB.from('orders').upsert(header, { onConflict: 'id' });

  await SB.from('order_items').delete().eq('order_id', order.id);
  const rows = (order.items||[]).map(i=>({
    order_id: order.id,
    name: i.name,
    grams: i.grams,
    price_per_kg: i.pricePerKg,
    line: i.line,
    img_url: i.img || null
  }));
  if(rows.length) await SB.from('order_items').insert(rows);
}
async function remoteUpdateStatus(order){
  if(!SB) return;
  await SB.from('orders').update({ status: order.status, timeline: order.timeline }).eq('id', order.id);
}
async function remoteUpdateInvoice(order){
  if(!SB) return;
  await SB.from('orders').update({ invoice_url: order.invoiceDataUrl }).eq('id', order.id);
}
async function remoteFetchAllOrders(){
  if(!SB) return [];
  const { data } = await SB.from('orders').select('*').order('created_at', { ascending:false });
  return (data||[]).map(r=>({
    id: r.id,
    buyerPhone: r.buyer_phone,
    storeName: r.store_name || '',
    items: [],
    totalPrice: r.total_price,
    status: r.status,
    timeline: r.timeline || [],
    invoiceDataUrl: r.invoice_url || null
  }));
}
async function remoteFetchItemsFor(orderIds){
  if(!SB || !orderIds.length) return {};
  const { data } = await SB.from('order_items').select('*').in('order_id', orderIds);
  const m = {};
  (data||[]).forEach(r=>{
    (m[r.order_id] ||= []).push({ name:r.name, grams:r.grams, pricePerKg:r.price_per_kg, line:r.line, img:r.img_url||null });
  });
  return m;
}
async function initRealtimeSync(){
  if(!SB) return;

  // İlk yükleme
  const headers = await remoteFetchAllOrders();
  const ids = headers.map(h=>h.id);
  const itemsMap = await remoteFetchItemsFor(ids);
  const merged = headers.map(h=> ({ ...h, items: itemsMap[h.id] || [] }));
  localStorage.setItem('orders', JSON.stringify(merged));

  updatePanelToggle();
  const s = getSession();
  if(s?.role==='producer'){ renderProducerOrdersStatus(currentProdStatus); }
  if(s?.role==='buyer'){ renderMyOrders(currentMyOrdersFilter); }

  // Realtime
  SB.channel('orders-rt')
    .on('postgres_changes', { event:'*', schema:'public', table:'orders' }, async (payload)=>{
      const id = payload.new?.id || payload.old?.id;
      if(!id) return;
      const { data: hdr } = await SB.from('orders').select('*').eq('id', id).single();
      const { data: it }  = await SB.from('order_items').select('*').eq('order_id', id);
      const o = {
        id: hdr.id,
        buyerPhone: hdr.buyer_phone,
        storeName: hdr.store_name || '',
        items: (it||[]).map(r=>({ name:r.name, grams:r.grams, pricePerKg:r.price_per_kg, line:r.line, img:r.img_url||null })),
        totalPrice: hdr.total_price,
        status: hdr.status,
        timeline: hdr.timeline || [],
        invoiceDataUrl: hdr.invoice_url || null
      };
      const curr = loadOrders();
      const ix = curr.findIndex(x=> x.id===id);
      if(ix>-1) curr[ix]=o; else curr.unshift(o);
      saveOrders(curr);
      const s = getSession();
      if(s?.role==='producer'){ renderProducerOrdersStatus(currentProdStatus); }
      if(s?.role==='buyer'){ renderMyOrders(currentMyOrdersFilter); }
    })
    .subscribe();
}

// ===== Init =====
function boot(){
  renderStoreGrid();
  selectFirstView();
  initRealtimeSync(); // Supabase ayarlıysa uzak veriyi açar
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once:true });
} else {
  boot();
}

// Nav brand
$$('[data-nav="store"]').forEach(a=> a.addEventListener('click', e=>{ e.preventDefault(); showView(viewStore); }));
