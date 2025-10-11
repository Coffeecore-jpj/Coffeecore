// ---------- Products ----------
const PRODUCTS = {
  stickers: [
    { id:'st1', name:'CuteCoffee', price:129, img:'CuteCoffee.svg' },
    { id:'st2', name:'HandpaintedPastries', price:170, img:'HandPaintedPastries.svg' },
    { id:'st3', name:'CoffeeLove', price:149, img:'CoffeeLove.svg' }
  ],
  cases: [
    { id:'c1', name:'Case Design 1', price:299, img:'images/case1.svg' },
    { id:'c2', name:'Case Design 2', price:349, img:'images/case2.svg' }
  ],
  sleeves: [
    { id:'l1', name:'Laptop Sleeve 1', price:499, img:'images/sleeve1.svg' },
    { id:'l2', name:'Laptop Sleeve 2', price:549, img:'images/sleeve2.svg' },
    { id:'l3', name:'Laptop Sleeve 3', price:599, img:'images/sleeve3.svg' }
  ]
};

// ---------- Cart ----------
let cart = JSON.parse(localStorage.getItem('coffeecore_cart') || '[]');

function saveCart(){ localStorage.setItem('coffeecore_cart', JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((n,i)=>n+i.qty,0); }
function updateCartCount(){ 
  const el = document.getElementById('cart-count');
  if(el) el.textContent = cartCount(); 
}

function addToCart(id, name, price){
  const item = cart.find(i=>i.id===id);
  if(item) item.qty++; 
  else cart.push({id,name,price,qty:1});
  saveCart(); renderCart(); updateCartCount();
}

function changeQty(id, delta){
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(i=>i.id!==id);
  saveCart(); renderCart(); updateCartCount();
}

function clearCart(){ cart = []; saveCart(); renderCart(); updateCartCount(); }

function renderCart(){
  const ul = document.getElementById('cart-items');
  if(!ul) return;
  ul.innerHTML = '';
  let total = 0;
  cart.forEach(i=>{
    total += i.price * i.qty;
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${i.name} — ₹${i.price}</span>
      <span class="qty">
        <button class="btn" style="padding:.2rem .6rem" onclick="changeQty('${i.id}',-1)">−</button>
        <span>${i.qty}</span>
        <button class="btn" style="padding:.2rem .6rem" onclick="changeQty('${i.id}',1)">+</button>
      </span>`;
    ul.appendChild(li);
  });
  const totalEl = document.getElementById('cart-total');
  if(totalEl) totalEl.innerHTML = '<strong>Total:</strong> ₹' + total;
}

function checkout(){
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  if(total <= 0){ alert('Cart is empty'); return; }

  const options = {
    key: "rzp_test_yourkeyhere",
    amount: total * 100,
    currency: "INR",
    name: "Coffeecore",
    description: "Coffeecore Order",
    theme: { color: "#ff7f50" },
    handler: function(response){ 
      alert("Payment success: " + response.razorpay_payment_id);
      clearCart(); 
    },
    prefill: { name:"", email:"" }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

// ---------- Render Product Grid ----------
function renderGrid(category, elId){
  const wrap = document.getElementById(elId);
  if(!wrap || !PRODUCTS[category]) return;
  wrap.innerHTML = '';
  PRODUCTS[category].forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <div class="pad">
        <h3>${p.name}</h3>
        <div class="price">₹${p.price}</div>
        <button class="btn" onclick="addToCart('${p.id}','${p.name}',${p.price})">Add to Cart</button>
      </div>`;
    wrap.appendChild(card);
  });
}

// ---------- Review System ----------
function initReviews(productId){
  if(!productId) return;
  const reviewListEl = document.getElementById('review-list');
  const ratingStars = document.querySelectorAll('#rating-stars span');
  let rating = 0;

  // Load existing reviews
  let reviews = JSON.parse(localStorage.getItem(`reviews_${productId}`) || '[]');
  function renderReviews(){
    if(!reviewListEl) return;
    reviewListEl.innerHTML = '';
    if(reviews.length === 0){
      reviewListEl.innerHTML = '<p>No reviews yet. Be the first to share your thoughts!</p>';
      return;
    }
    reviews.forEach(r=>{
      const div = document.createElement('div');
      div.classList.add('review-item');
      div.innerHTML = `
        <strong>${r.name || 'Anonymous'}</strong>
        <div class="stars">${'⭐'.repeat(r.rating)}</div>
        <p>${r.text}</p>
      `;
      reviewListEl.appendChild(div);
    });
    updateAverage();
  }

  function updateAverage(){
    const avgEl = document.getElementById('avg-stars');
    const avgText = document.getElementById('avg-rating');
    if(!avgEl || !avgText) return;
    if(reviews.length === 0){
      avgEl.textContent = '⭐️⭐️⭐️⭐️⭐️';
      avgText.textContent = '(5.0 / 5)';
      return;
    }
    const avg = reviews.reduce((s,r)=>s+r.rating,0)/reviews.length;
    avgEl.textContent = '⭐'.repeat(Math.round(avg)) + '☆'.repeat(5-Math.round(avg));
    avgText.textContent = `(${avg.toFixed(1)} / 5)`;
  }

  renderReviews();

  // Star click
  ratingStars.forEach(star=>{
    star.addEventListener('click', ()=>{
      rating = parseInt(star.dataset.value);
      ratingStars.forEach(s=>s.classList.remove('active','sparkle'));
      for(let i=0;i<rating;i++){
        ratingStars[i].classList.add('active','sparkle');
      }
      setTimeout(()=>ratingStars.forEach(s=>s.classList.remove('sparkle')),600);
    });
  });

  // Submit review
  const reviewForm = document.getElementById('review-form');
  if(reviewForm){
    reviewForm.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('reviewer-name').value.trim() || 'Anonymous';
      const text = document.getElementById('review-text').value.trim();
      if(!rating || !text){ alert('Please select a rating and write a review.'); return; }
      const newReview = { name, rating, text };
      reviews.push(newReview);
      localStorage.setItem(`reviews_${productId}`, JSON.stringify(reviews));
      reviewForm.reset();
      ratingStars.forEach(s=>s.classList.remove('active'));
      rating = 0;
      renderReviews();
    });
  }
}

// ---------- Quantity Buttons ----------
function initQuantity(){
  const quantityInput = document.querySelector('.quantity-selector input');
  const increaseBtn = document.getElementById('increase');
  const decreaseBtn = document.getElementById('decrease');
  if(!quantityInput || !increaseBtn || !decreaseBtn) return;
  increaseBtn.addEventListener('click', ()=>{ quantityInput.value = parseInt(quantityInput.value)+1; });
  decreaseBtn.addEventListener('click', ()=>{
    if(parseInt(quantityInput.value) > 1) quantityInput.value = parseInt(quantityInput.value)-1;
  });
}

// ---------- Buy Now ----------
function buyNow(id,name,price){
  const quantityInput = document.querySelector('.quantity-selector input');
  const qty = quantityInput ? parseInt(quantityInput.value) : 1;
  const item = cart.find(i=>i.id===id);
  if(item) item.qty += qty;
  else cart.push({id,name,price,qty});
  saveCart(); renderCart(); updateCartCount();
  window.location.href = 'cart.html';
}

// ---------- Initial Setup ----------
document.addEventListener('DOMContentLoaded', ()=>{
  updateCartCount();
  renderCart();
  initQuantity();

  // Example: auto-init reviews if product page has data-product-id
  const productEl = document.querySelector('[data-product-id]');
  if(productEl) initReviews(productEl.dataset.productId);

  // Example: Render grids if pages have grid containers
  if(document.getElementById('stickers-grid')) renderGrid('stickers','stickers-grid');
  if(document.getElementById('cases-grid')) renderGrid('cases','cases-grid');
  if(document.getElementById('sleeves-grid')) renderGrid('sleeves','sleeves-grid');
});

// Animate cart icon and search bar
window.addEventListener("DOMContentLoaded", () => {
  const cartIcon = document.querySelector(".cart-icon");
  const searchBar = document.querySelector(".search-bar");

  if(cartIcon) {
    cartIcon.style.opacity = 0;
    cartIcon.style.transform = "translateX(50px)";
    setTimeout(() => {
      cartIcon.style.transition = "all 0.8s ease";
      cartIcon.style.opacity = 1;
      cartIcon.style.transform = "translateX(0)";
    }, 500);
  }

  if(searchBar) {
    searchBar.style.opacity = 0;
    searchBar.style.transform = "translateX(-50px)";
    setTimeout(() => {
      searchBar.style.transition = "all 0.8s ease";
      searchBar.style.opacity = 1;
      searchBar.style.transform = "translateX(0)";
    }, 700);
  }
});

