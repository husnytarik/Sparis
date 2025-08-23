// ===== Helpers =====
const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));
const root = document.documentElement;
const fmtTL = n => (n||0).toLocaleString('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2});
const fmtDT = ts => new Date(ts).toLocaleString('tr-TR');
const gToKgText = g => `${(g/1000).toFixed(2)} kg`;
const normalizePhone = p => String(p||'').replace(/\D/g,''); // sadece rakamlar
function slugify(str=''){ return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function titleize(slug=''){ return slug.split('-').map(s=> s? s[0].toUpperCase()+s.slice(1):s).join(' '); }

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

// ===== Default products (isim+kat+desc+fiyat+stok) =====
const DEFAULT_PRODUCTS = [
  { slug:'etiyopya-yirgacheffe', name:'Etiyopya Yirgacheffe', cat:'afrika', price:950,  stock:5000, desc:'Çiçeksi, narenciye; hafif gövde.' },
  { slug:'kenya-aa', name:'Kenya AA', cat:'afrika', price:980, stock:4000, desc:'Siyah frenk üzümü, limon; canlı asidite.' },
  { slug:'tanzanya-peaberry', name:'Tanzanya Peaberry', cat:'afrika', price:820, stock:3500, desc:'Dengeli, tatlı, meyvemsi bitiş.' },
  { slug:'kolombiya-supremo', name:'Kolombiya Supremo', cat:'amerika', price:720, stock:6000, desc:'Karamel, fındık; dengeli gövde.' },
  { slug:'brezilya-santos', name:'Brezilya Santos', cat:'amerika', price:650, stock:8000, desc:'Çikolata, fındık; düşük asidite.' },
  { slug:'guatemala-antigua', name:'Guatemala Antigua', cat:'amerika', price:780, stock:3000, desc:'Kakao, baharat; parlak asidite.' },
  { slug:'kosta-rika-tarrazu', name:'Kosta Rika Tarrazú', cat:'amerika', price:840, stock:4200, desc:'Narenciye, bal; temiz bitiş.' },
  { slug:'sumatra-mandheling', name:'Sumatra Mandheling', cat:'asya', price:700, stock:4800, desc:'Toprak tonları, koyu çikolata.' },
  { slug:'hindistan-monsooned-malabar', name:'Hindistan Monsooned Malabar', cat:'asya', price:680, stock:4500, desc:'Yoğun gövde, baharat notaları.' },
  { slug:'papua-yeni-gine', name:'Papua Yeni Gine', cat:'asya', price:760, stock:2600, desc:'Meyvemsi, çiçeksi; dengeli.' },
  { slug:'panama-geisha', name:'Panama Geisha', cat:'ozel', price:3200, stock:1200, desc:'Yasemin, bergamot; kompleks.' },
  { slug:'yemen-mocha', name:'Yemen Mocha', cat:'ozel', price:2100, stock:1800, desc:'Şarap benzeri gövde, kakao.' },
];
const DEFAULT_DICT = Object.fromEntries(DEFAULT_PRODUCTS.map(p => [p.slug, p]));


// ===== Catalog store (localStorage) =====
function loadCatalog(){
  const raw = localStorage.getItem('catalog');
  // İlk kurulum
  if(!raw){
    const obj = {};
    DEFAULT_PRODUCTS.forEach(p=>{
      obj[p.slug] = { name:p.name, cat:p.cat, price:p.price, stock:p.stock, desc:p.desc||'' };
    });
    localStorage.setItem('catalog', JSON.stringify(obj));
    return obj;
  }
  // Mevcut veriyi oku ve eksikleri tamamla
  try{
    const data = JSON.parse(raw);

    for(const [slug, val] of Object.entries(data)){
      const def = DEFAULT_DICT[slug];
      if(typeof val === 'number'){
        // Çok eski sürüm: yalnız fiyat
        data[slug] = {
          name: def?.name || slug.replace(/-/g,' ').replace(/\b\w/g, c=>c.toUpperCase()),
          cat:  def?.cat  || 'ozel',
          price: val,
          stock: def?.stock || 3000,
          desc: def?.desc || ''
        };
      }else{
        // Eksik alanları varsayılanla tamamla
        data[slug].name  = val.name  || def?.name || slug;
        data[slug].cat   = val.cat   || def?.cat  || 'ozel';
        data[slug].price = +val.price || (def?.price ?? 0);
        data[slug].stock = +val.stock || (def?.stock ?? 0);
        data[slug].desc  = (val.desc ?? (def?.desc ?? ''));
      }
    }

    // (İsteğe bağlı) – yeni eklediğimiz varsayılan ürünler henüz yoksa eklemek istersen:
    // DEFAULT_PRODUCTS.forEach(p=>{
    //   if(!data[p.slug]) data[p.slug] = { name:p.name, cat:p.cat, price:p.price, stock:p.stock, desc:p.desc||'' };
    // });

    return data;
  }catch{
    // bozuksa varsayılanlara dön
    const obj = {};
    DEFAULT_PRODUCTS.forEach(p=> obj[p.slug] = { name:p.name, cat:p.cat, price:p.price, stock:p.stock, desc:p.desc||'' });
    return obj;
  }
}

function saveCatalog(c){ localStorage.setItem('catalog', JSON.stringify(c)); }
let CATALOG = loadCatalog();

// ===== Image loader (sağlam + placeholder anında) =====
function attachAutoImage(container, baseName, explicitPath=null){
  const dataPlaceholder =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
      <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#2b2f36"/><stop offset="1" stop-color="#1f2329"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <g fill="#888"><path d="M320 140c-30 0-54 24-54 54s24 54 54 54 54-24 54-54-24-54-54-54zm0 24c17 0 30 13 30 30s-13 30-30 30-30-13-30-30 13-30 30-30z"/></g>
      <text x="320" y="350" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#aaa">Ürün görseli</text>
    </svg>`);
  container.innerHTML = '';
  const placeholderImg = new Image(); placeholderImg.alt=''; placeholderImg.src = dataPlaceholder; container.appendChild(placeholderImg);

  const list = explicitPath ? [explicitPath] : [
    `assets/img/products/${baseName}.webp`,
    `assets/img/products/${baseName}.jpg`,
    `assets/img/products/${baseName}.png`,
    `assets/img/products/${baseName}.jpeg`,
    `assets/img/products/${baseName}.JPG`,
    `assets/img/products/${baseName}.PNG`,
  ];

  const img = new Image(); img.alt = ''; img.decoding='async'; img.loading='lazy';
  let i = 0;
  img.onload = ()=>{ container.innerHTML=''; container.appendChild(img); };
  img.onerror = ()=>{ if(++i < list.length){ img.src = list[i]; } /* hepsi 404 ise placeholder kalır */ };
  img.src = list[i];
}

// ===== Store grid render (kartları JS ile çiz) =====
let currentFilter = 'all';
function renderStoreGrid(){
  const grid = $('#cards');
  grid.innerHTML = '';
  const entries = Object.entries(CATALOG).sort((a,b)=> a[1].name.localeCompare(b[1].name,'tr'));

  entries.forEach(([slug,prod])=>{
    if(currentFilter!=='all' && prod.cat!==currentFilter) return;
    const art = document.createElement('article'); art.className='card'; art.dataset.cat = prod.cat;
    art.innerHTML = `
      <figure class="card__media"></figure>
      <h3 class="h4">${prod.name}</h3>
      <p>${prod.desc || 'Tat notları yakında.'}</p>
      <div class="price-row"><span class="price">${fmtTL(prod.price)} / kg</span><span class="stock">Stok: ${gToKgText(prod.stock)}</span></div>
    `;
    grid.appendChild(art);
    const media = $('.card__media', art);
    attachAutoImage(media, slug);
    art.addEventListener('click', ()=> openQtyModal(art, { name:prod.name, slug, price:prod.price, stock:prod.stock, desc:prod.desc || '' }));
  });
}

// Filtre butonları (dinamik)
const filterBtns = $$('[data-filter]');
filterBtns.forEach(b=> b.addEventListener('click', ()=>{
  currentFilter = b.getAttribute('data-filter');
  filterBtns.forEach(x=>x.classList.remove('is-active')); b.classList.add('is-active');
  renderStoreGrid();
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
  renderStoreGrid();
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
  qtyName.textContent = meta.name;
  qtyDesc.textContent = meta.desc || card.querySelector('p')?.textContent.trim() || '';
  qtyUnitPrice.textContent = fmtTL(meta.price);
  // modal görseli: kart görseli ya da placeholder
  const dataPlaceholder = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="100%" height="100%" fill="#222"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#aaa">Ürün görseli</text></svg>');
  qtyImg.src = card.querySelector('.card__media img')?.src || dataPlaceholder;

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
    selectDashTab('orders'); renderProducerOrdersStatus(currentProdStatus); showView(viewDash);
  }else{
    openMainDrawer();
  }
});
$$('[data-close-drawer]').forEach(x=> x.addEventListener('click', closeMainDrawer));
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && mainDrawer.getAttribute('aria-hidden')==='false') closeMainDrawer(); });

function openMainDrawer(){
  lastFocusDrawer = document.activeElement;
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
storeNameInput?.addEventListener('change', ()=> localStorage.setItem('storeName', storeNameInput.value.trim()));

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

  const storeName = (storeNameInput.value || '').trim();
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

  const suffix = storeName ? ` • ${storeName}` : '';
  notifySMS('producer', `Yeni sipariş: ${orderId} • ${fmtTL(total)}${suffix}`);
  notifyInApp('Üreticiye yeni sipariş bildirildi.');
  notifySMS(session.phone, `Siparişiniz alındı: ${orderId} • ${fmtTL(total)}${suffix}`);

  toast('Sipariş oluşturuldu. Takip ekranına geçiliyor...');
  clearCart();
  closeMainDrawer();
  currentMyOrdersFilter = 'active'; renderMyOrders(currentMyOrdersFilter); showView(viewMyOrders);
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

// ===== Catalog UI (ekle/sil/güncelle) =====
function renderCatalogTable(){
  const wrap = $('#catalogTableWrap'); wrap.innerHTML='';
  const table = document.createElement('table'); table.className='table';
  const header = `<tr>
    <th>Ürün</th><th>Slug</th><th>Kat.</th><th>₺/kg</th><th>Stok (g)</th><th>Açıklama</th><th class="actions">İşlem</th>
  </tr>`;

  const rows = Object.entries(CATALOG)
    .sort((a,b)=> a[1].name.localeCompare(b[1].name,'tr'))
    .map(([sl,val])=> {
      return `<tr data-sl="${sl}">
        <td><input type="text" value="${val.name}"></td>
        <td class="muted fs-sm">${sl}</td>
        <td>
          <select>
            <option value="afrika" ${val.cat==='afrika'?'selected':''}>Afrika</option>
            <option value="amerika" ${val.cat==='amerika'?'selected':''}>Orta & Güney Amerika</option>
            <option value="asya" ${val.cat==='asya'?'selected':''}>Asya & Pasifik</option>
            <option value="ozel" ${val.cat==='ozel'?'selected':''}>Özel</option>
          </select>
        </td>
        <td><input type="number" min="0" step="10" value="${val.price}"></td>
        <td><input type="number" min="0" step="50" value="${val.stock}"></td>
        <td><input type="text" value="${val.desc||''}"></td>
        <td class="actions">
          <button class="btn btn--ghost" data-del="${sl}">Sil</button>
        </td>
      </tr>`;
    }).join('');

  table.innerHTML = `<thead>${header}</thead><tbody>${rows}</tbody>`;
  wrap.appendChild(table);

  // Sil
  $$('[data-del]', table).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const sl = btn.getAttribute('data-del');
      if(!confirm('Bu ürünü silmek istiyor musun?')) return;
      delete CATALOG[sl];
      // Sepetten de kaldır
      cart = cart.filter(i=> i.slug!==sl); saveCart();
      saveCatalog(CATALOG);
      renderCatalogTable();
      renderStoreGrid();
      toast('Ürün silindi.');
    });
  });

  // Tablo hücre değişimleri: blur ile yaz
  $$('tbody tr', table).forEach(tr=>{
    const sl = tr.getAttribute('data-sl');
    const inputs = $$('input,select', tr);
    inputs.forEach((inp, idx)=>{
      inp.addEventListener('change', ()=>{
        const [nameEl, , catEl, priceEl, stockEl, descEl] = $$('input,select', tr);
        const newName = nameEl.value.trim() || titleize(sl);
        const newCat = catEl.value;
        const newPrice = +priceEl.value || 0;
        const newStock = Math.max(0, Math.round(+stockEl.value || 0));
        const newDesc = (descEl?.value || '').trim();

        CATALOG[sl] = { name:newName, cat:newCat, price:newPrice, stock:newStock, desc:newDesc };
        saveCatalog(CATALOG);
        renderStoreGrid();
      });
    });
  });
}

// Yeni ürün ekle
$('#addProductBtn').addEventListener('click', ()=>{
  const name = $('#newName').value.trim();
  const cat = $('#newCat').value;
  const price = +$('#newPrice').value || 0;
  const stock = Math.max(0, Math.round(+$('#newStock').value || 0));
  const desc = ($('#newDesc').value || '').trim();

  if(!name){ toast('Ürün adı gerekli','warn'); return; }
  const sl = slugify(name);
  if(CATALOG[sl]){ toast('Bu isimde (slug) ürün var','warn'); return; }

  CATALOG[sl] = { name, cat, price, stock, desc };
  saveCatalog(CATALOG);

  // Formu temizle
  $('#newName').value=''; $('#newPrice').value='0'; $('#newStock').value='0'; $('#newDesc').value='';
  $('#newCat').value='ozel';

  renderCatalogTable();
  renderStoreGrid();
  toast('Ürün eklendi.');
});

// Katalog kaydet butonu (artık değişiklikler anlık kaydediliyor, bu düğme bilgi amaçlı)
$('#saveCatalogBtn').addEventListener('click', ()=>{
  saveCatalog(CATALOG);
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
  if(e.key === 'catalog'){
    CATALOG = loadCatalog(); renderStoreGrid(); if(!$('#dCatalog').classList.contains('is-hidden')) renderCatalogTable();
  }
});

// ===== Producer orders list refresh on nav =====
function selectFirstView(){
  const s = getSession();
  if(s?.role==='buyer'){ showView(viewStore); }
  else if(s?.role==='producer'){ showView(viewDash); }
  else showView(viewAuth);
}

// ===== Init on DOM ready =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ()=>{
    renderStoreGrid();
    selectFirstView();
  }, { once:true });
} else {
  renderStoreGrid();
  selectFirstView();
}

// ===== Nav brand =====
$$('[data-nav="store"]').forEach(a=> a.addEventListener('click', e=>{ e.preventDefault(); showView(viewStore); }));
