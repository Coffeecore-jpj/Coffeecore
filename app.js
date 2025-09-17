// ---- Basic storefront with cart + Razorpay ----
const PRODUCTS = {
  stickers: [
    { id:'st1', name:'Sticker Pack 1', price:99,  img:'sticker1.svg' },
    { id:'st2', name:'Sticker Pack 2', price:149, img:'sticker2.svg' },
  ],
  cases: [
    { id:'c1', name:'Case Design 1', price:299, img:'case1.svg' },
    { id:'c2', name:'Case Design 2', price:349, img:'case2.svg' },
  ]
};

let cart = JSON.parse(localStorage.getItem('coffeecore_cart') || '[]');

function saveCart(){ localStorage.setItem('coffeecore_cart', JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((n,i)=>n+i.qty,0); }

function updateCartCount(){ document.getElementById('cart-count').textContent = cartCount(); }

function addToCart(id, name, price){
  const item = cart.find(i=>i.id===id);
  if(item){ item.qty++; } else { cart.push({id,name,price,qty:1}); }
  saveCart(); renderCart(); updateCartCount();
}

function changeQty(id, delta){
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0){ cart = cart.filter(i=>i.id!==id); }
  saveCart(); renderCart(); updateCartCount();
}

function clearCart(){ cart = []; saveCart(); renderCart(); updateCartCount(); }

function renderCart(){
  const ul = document.getElementById('cart-items');
  ul.innerHTML = '';
  let total = 0;
  cart.forEach(i=>{
    total += i.price * i.qty;
    const li = document.createElement('li');
    li.innerHTML = \`
      <span>\${i.name} — ₹\${i.price}</span>
      <span class="qty">
        <button class="btn" style="padding:.2rem .6rem" onclick="changeQty('\${i.id}',-1)">−</button>
        <span>\${i.qty}</span>
        <button class="btn" style="padding:.2rem .6rem" onclick="changeQty('\${i.id}',1)">+</button>
      </span>\`;
    ul.appendChild(li);
  });
  document.getElementById('cart-total').innerHTML = '<strong>Total:</strong> ₹' + total;
}

function renderGrid(key, elId){
  const wrap = document.getElementById(elId);
  wrap.innerHTML = '';
  PRODUCTS[key].forEach(p=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = \`
      <img src="\${p.img}" alt="\${p.name}">
      <div class="pad">
        <h3>\${p.name}</h3>
        <div class="price">₹\${p.price}</div>
        <button class="btn" onclick="addToCart('\${p.id}','\${p.name}',\${p.price})">Add to Cart</button>
      </div>\`;
    wrap.appendChild(card);
  });
} 

function checkout(){
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  if(total<=0){ alert('Cart is empty'); return; }
  alert("Checkout temporarily disabled.");
}

  const options = {
    key: "rzp_test_yourkeyhere",   // TODO: replace with your real Razorpay Key ID
    amount: total * 100,           // in paise
    currency: "INR",
    name: "Coffeecore",
    description: "Coffeecore Order",
    theme: { color: "#ff7f50" },
    handler: function (response) {
      alert("Payment success: " + response.razorpay_payment_id);
      clearCart();
    },
    prefill: { name: "", email: "" }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

// initial render
renderGrid('stickers','stickers-grid');
renderGrid('cases','cases-grid');
renderCart();
updateCartCount();
