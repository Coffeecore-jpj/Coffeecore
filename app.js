// ======= EDIT THESE =======
const RAZORPAY_KEY_ID = 'PASTE_YOUR_RAZORPAY_KEY_ID_HERE'; // e.g. rzp_test_xxxxx
const STORE_NAME = 'coffeecore';
const STORE_LOGO = 'assets/logo.svg'; // shown in checkout
// Products you can edit (add/remove). Put your image paths after you upload into /images.
const PRODUCTS = [
  {id:'st01', name:'Coffee Cat Sticker', price:99, img:'images/sticker1.jpg', category:'stickers'},
  {id:'st02', name:'Cafe Vibes Sticker', price:89, img:'images/sticker2.jpg', category:'stickers'},
  {id:'pc01', name:'Mocha Phone Case', price:299, img:'images/case1.jpg', category:'phone-cases'},
  {id:'pc02', name:'Latte Phone Case', price:349, img:'images/case2.jpg', category:'phone-cases'},
  {id:'kc01', name:'Bean Keychain', price:149, img:'images/keychain1.jpg', category:'keychains'},
  {id:'kc02', name:'Cup Keychain', price:129, img:'images/keychain2.jpg', category:'keychains'},
];
// ===== END EDITS =====

const formatINR = (n)=> n.toLocaleString('en-IN');

// Render products into grids
const render = () => {
  const grids = {
    'stickers': document.getElementById('grid-stickers'),
    'phone-cases': document.getElementById('grid-phone-cases'),
    'keychains': document.getElementById('grid-keychains'),
  };
  Object.values(grids).forEach(g=> g.innerHTML='');
  PRODUCTS.forEach(p=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `
      <div class="thumb">${p.img ? `<img src="${p.img}" alt="${p.name}">` : 'Add your image'}</div>
      <div class="info">
        <div class="title">${p.name}</div>
        <div class="price">₹ ${formatINR(p.price)}</div>
        <div class="actions">
          <button class="btn add" data-id="${p.id}">Add</button>
          <button class="btn buy" data-id="${p.id}">Buy</button>
        </div>
      </div>`;
    grids[p.category]?.appendChild(card);
  });
  document.getElementById('year').textContent = new Date().getFullYear();
};
render();

// Simple cart in memory + localStorage
let cart = JSON.parse(localStorage.getItem('cc_cart')||'[]');
const saveCart = ()=> localStorage.setItem('cc_cart', JSON.stringify(cart));
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const cartItems = document.getElementById('cartItems');

const updateCartUI = ()=>{
  cartCount.textContent = cart.reduce((a,i)=>a+i.qty,0);
  const total = cart.reduce((a,i)=> a + (i.price*i.qty), 0);
  cartTotal.textContent = formatINR(total);
  cartItems.innerHTML = '';
  cart.forEach(item=>{
    const line = document.createElement('div');
    line.className='cart-line';
    line.innerHTML = `
      <div class="thumb">${item.img ? `<img src="${item.img}" alt="${item.name}">` : ''}</div>
      <div style="min-width:0">
        <div style="font-weight:700">${item.name}</div>
        <div>₹ ${formatINR(item.price)}</div>
      </div>
      <div class="qty">
        <button data-act="dec" data-id="${item.id}">-</button>
        <span>${item.qty}</span>
        <button data-act="inc" data-id="${item.id}">+</button>
      </div>
    `;
    cartItems.appendChild(line);
  });
};
updateCartUI();

// Add & Buy buttons
document.body.addEventListener('click', (e)=>{
  if(e.target.matches('.btn.add')){
    const id = e.target.dataset.id;
    const p = PRODUCTS.find(x=>x.id===id);
    const existing = cart.find(x=>x.id===id);
    if(existing) existing.qty += 1;
    else cart.push({...p, qty:1});
    saveCart(); updateCartUI();
  }
  if(e.target.matches('.btn.buy')){
    const id = e.target.dataset.id;
    const p = PRODUCTS.find(x=>x.id===id);
    cart = [{...p, qty:1}]; saveCart(); updateCartUI();
    openCart();
  }
  if(e.target.dataset.act === 'inc' || e.target.dataset.act === 'dec'){
    const id = e.target.dataset.id;
    const line = cart.find(x=>x.id===id);
    if(!line) return;
    if(e.target.dataset.act === 'inc') line.qty += 1;
    if(e.target.dataset.act === 'dec') line.qty = Math.max(0, line.qty-1);
    cart = cart.filter(x=>x.qty>0);
    saveCart(); updateCartUI();
  }
});

// Cart drawer open/close
const drawer = document.getElementById('cartDrawer');
const openCartBtn = document.getElementById('openCart');
const closeCartBtn = document.getElementById('closeCart');
const openCart = ()=> drawer.classList.add('open');
const closeCart = ()=> drawer.classList.remove('open');
openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);

// Checkout with Razorpay (client-side)
document.getElementById('checkoutBtn').addEventListener('click', ()=>{
  const amount = cart.reduce((a,i)=> a + (i.price*i.qty), 0);
  if(amount <= 0){ alert('Your cart is empty.'); return; }
  if(RAZORPAY_KEY_ID.startsWith('PASTE_')){
    alert('Add your Razorpay Key ID in app.js to enable checkout.'); return;
  }
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100, // in paise
    currency: 'INR',
    name: STORE_NAME,
    description: 'Order from coffeecore',
    image: STORE_LOGO,
    handler: function (response){
      // You receive payment id here. For now, show success and clear cart.
      alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
      cart = []; saveCart(); updateCartUI(); closeCart();
    },
    prefill: {
      name: '',
      email: '',
      contact: ''
    },
    notes: { items: JSON.stringify(cart.map(i=>({id:i.id,qty:i.qty}))) },
    theme: { color: '#0ea5e9' }
  };
  const rzp = new Razorpay(options);
  rzp.open();
});

