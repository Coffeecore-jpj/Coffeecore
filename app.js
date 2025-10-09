// ---- Basic storefront with cart + Razorpay ----
const PRODUCTS = {
  stickers: [
    { id: 'st1', name: 'CuteCoffee', price: 129, img: 'CuteCoffee.svg' },
    { id: 'st2', name: 'HandpaintedPastries', price: 170, img: 'HandPaintedPastries.svg' },
    { id: 'st3', name: 'CoffeeLove', price: 149, img: 'CoffeeLove.svg' }
  ],
  cases: [
    { id: 'c1', name: 'Case Design 1', price: 299, img: 'images/case1.svg' },
    { id: 'c2', name: 'Case Design 2', price: 349, img: 'images/case2.svg' },
  ]
};

let cart = JSON.parse(localStorage.getItem('coffeecore_cart') || '[]');
function saveCart() { localStorage.setItem('coffeecore_cart', JSON.stringify(cart)); }
function cartCount() { return cart.reduce((n, i) => n + i.qty, 0); }
function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cartCount();
}

function addToCart(id, name, price, qty = 1) {
  const item = cart.find(i => i.id === id);
  if (item) { item.qty += qty; } else { cart.push({ id, name, price, qty }); }
  saveCart(); renderCart(); updateCartCount();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { cart = cart.filter(i => i.id !== id); }
  saveCart(); renderCart(); updateCartCount();
}

function clearCart() { cart = []; saveCart(); renderCart(); updateCartCount(); }

function renderCart() {
  const ul = document.getElementById('cart-items');
  if (!ul) return;
  ul.innerHTML = '';
  let total = 0;
  cart.forEach(i => {
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
  if (totalEl) totalEl.innerHTML = '<strong>Total:</strong> ₹' + total;
}

function renderGrid(key, elId) {
  const wrap = document.getElementById(elId);
  if (!wrap) return;
  wrap.innerHTML = '';
  PRODUCTS[key].forEach(p => {
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

// Checkout with Razorpay
function checkout() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (total <= 0) { alert('Cart is empty'); return; }

  const options = {
    key: "rzp_test_yourkeyhere",
    amount: total * 100,
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

// ---- Quantity Buttons (for product pages) ----
document.addEventListener('DOMContentLoaded', () => {
  const quantityInput = document.getElementById('quantity');
  const increaseBtn = document.getElementById('increase');
  const decreaseBtn = document.getElementById('decrease');

  if (increaseBtn && decreaseBtn && quantityInput) {
    increaseBtn.addEventListener('click', () => {
      quantityInput.value = parseInt(quantityInput.value) + 1;
    });

    decreaseBtn.addEventListener('click', () => {
      if (parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
      }
    });
  }

  // ---- Review System ----
  const reviewForm = document.getElementById('review-form');
  const reviewList = document.getElementById('review-list');
  const ratingStars = document.querySelectorAll('#rating-stars span');
  const avgStars = document.getElementById('avg-stars');
  const avgRatingText = document.getElementById('avg-rating');
  const sparkleSound = new Audio('sparkle.mp3'); // optional sound file in root folder

  let reviews = JSON.parse(localStorage.getItem('coffeecore_reviews') || '[]');
  let selectedRating = 0;

  function renderReviews() {
    if (!reviewList) return;
    reviewList.innerHTML = '';
    if (reviews.length === 0) {
      reviewList.innerHTML = `<p>No reviews yet. Be the first to share your thoughts!</p>`;
      avgStars.textContent = '⭐⭐⭐⭐⭐';
      avgRatingText.textContent = '(5.0 / 5)';
      return;
    }
    let totalRating = 0;
    reviews.forEach(r => {
      totalRating += r.rating;
      const div = document.createElement('div');
      div.classList.add('review-item');
      div.innerHTML = `
        <strong>${r.name}</strong> — <span class="stars">${'⭐'.repeat(r.rating)}</span>
        <p>${r.text}</p>
      `;
      reviewList.appendChild(div);
    });
    const avg = (totalRating / reviews.length).toFixed(1);
    avgStars.textContent = '⭐'.repeat(Math.round(avg));
    avgRatingText.textContent = `(${avg} / 5)`;
  }

  // Handle star rating click
  ratingStars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-value'));
      ratingStars.forEach(s => s.classList.remove('active', 'sparkle'));
      for (let i = 0; i < selectedRating; i++) {
        ratingStars[i].classList.add('active', 'sparkle');
      }
      if (selectedRating === 5 && sparkleSound) {
        sparkleSound.currentTime = 0;
        sparkleSound.play().catch(()=>{});
      }
    });
  });

  // Handle review submission
  if (reviewForm) {
    reviewForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('reviewer-name').value.trim();
      const text = document.getElementById('review-text').value.trim();
      if (!name || !text || !selectedRating) {
        alert('Please enter your name, rating, and review.');
        return;
      }
      const newReview = { name, text, rating: selectedRating };
      reviews.push(newReview);
      localStorage.setItem('coffeecore_reviews', JSON.stringify(reviews));
      document.getElementById('reviewer-name').value = '';
      document.getElementById('review-text').value = '';
      selectedRating = 0;
      ratingStars.forEach(s => s.classList.remove('active'));
      renderReviews();
    });
  }

  renderReviews();
});

// initial render
if (document.getElementById('stickers-grid')) {
  renderGrid('stickers', 'stickers-grid');
}
if (document.getElementById('cases-grid')) {
  renderGrid('cases', 'cases-grid');
}
renderCart();
updateCartCount();
