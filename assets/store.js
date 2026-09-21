/* =========================================================================
   Nila Handcrafts — shared store
   One data/cart/auth/admin layer, reused by every page so the cart, login
   state and product catalogue stay in sync across the whole site.
   Persistence: localStorage (this is a static-site prototype — see the
   "Backend & Payments" guide for what a production build needs instead).
   ========================================================================= */
(function (global) {
  "use strict";

  const LS = {
    products: "nila_products_v1",
    cart: "nila_cart_v1",
    users: "nila_users_v1",
    currentUser: "nila_current_user_v1",
    reviews: "nila_reviews_v1"
  };

  const ADMIN_PASSWORD = "coconut123"; // demo only — never ship a hard-coded password

  /* ---------------- Default catalogue ---------------- */
  const defaultProducts = [
    {
      id: 1, name: "Coconut Shell Bowl Set", category: "Coconut Shell", price: 2500, discount: 20,
      stock: 15, tag: "", img: "assets/prod-bowls.jpg",
      desc: "Beautifully handcrafted coconut shell bowls, perfect for your home, décor or everyday use. Each piece is naturally unique.",
      material: "Polished coconut shell, food-safe natural oil finish", dimensions: "Set of 3 — 11cm, 9cm, 7cm diameter",
      care: "Hand wash only; avoid soaking. Re-oil occasionally to keep the shine.",
      rating: 4.8, reviewCount: 24
    },
    {
      id: 2, name: "Handwoven Storage Basket", category: "Woven", price: 3200, discount: 0,
      stock: 8, tag: "New", img: "assets/prod-basket.jpg",
      desc: "A warm, practical woven basket made by hand from natural fibers. Ideal for storage while adding texture to your space.",
      material: "Wild reed and natural fiber, unbleached", dimensions: "30cm W × 22cm D × 24cm H",
      care: "Wipe with a dry cloth. Keep away from prolonged direct moisture.",
      rating: 4.6, reviewCount: 12
    },
    {
      id: 3, name: "Wooden Serving Tray", category: "Wood", price: 4500, discount: 15,
      stock: 6, tag: "", img: "assets/prod-tray.jpg",
      desc: "A sturdy handcrafted wooden tray with natural grain and comfortable handles for serving or styling.",
      material: "Reclaimed mango wood, food-safe beeswax finish", dimensions: "40cm × 26cm × 4cm",
      care: "Hand wash and dry immediately. Not dishwasher safe.",
      rating: 4.9, reviewCount: 31
    },
    {
      id: 4, name: "Carved Coconut Lamp", category: "Home Decor", price: 3800, discount: 0,
      stock: 0, tag: "", img: "assets/prod-lamp.jpg",
      desc: "A sculptural coconut-shell lamp that casts a warm patterned glow.",
      material: "Coconut shell shade, mango-wood base, E14 fitting (bulb not included)", dimensions: "18cm diameter × 24cm height",
      care: "Dust with a soft, dry cloth. Indoor use only.",
      rating: 4.7, reviewCount: 9
    },
    {
      id: 5, name: "Coconut Shell Earrings", category: "Jewellery", price: 1200, discount: 10,
      stock: 25, tag: "", img: "assets/prod-earrings.jpg",
      desc: "Lightweight statement earrings crafted from coconut shell for a natural, distinctive finish.",
      material: "Coconut shell, hypoallergenic stainless steel hooks", dimensions: "4.5cm drop",
      care: "Keep dry. Store in the pouch provided.",
      rating: 4.5, reviewCount: 18
    }
  ];

  const categoryImg = {
    "Coconut Shell": "assets/cat-coconut.jpg", "Wood": "assets/cat-wood.jpg", "Woven": "assets/cat-woven.jpg",
    "Home Decor": "assets/cat-decor.jpg", "Jewellery": "assets/cat-jewelry.jpg"
  };
  function galleryFor(p) { return [p.img, categoryImg[p.category] || p.img, "assets/story.jpg"]; }

  const defaultReviews = {
    1: [
      { name: "Amaya P.", rating: 5, date: "2026-06-02", text: "Gorgeous finish and exactly the size shown. Have already ordered a second set as a gift." },
      { name: "Ruwan D.", rating: 5, date: "2026-05-14", text: "Really impressed with the natural grain on each bowl — no two are alike." },
      { name: "Kavindi S.", rating: 4, date: "2026-04-30", text: "Lovely bowls, packaging could be a touch sturdier but nothing arrived damaged." }
    ],
    2: [
      { name: "Nadeesha W.", rating: 5, date: "2026-06-10", text: "Sturdier than I expected and looks even better in person." },
      { name: "Chamod J.", rating: 4, date: "2026-05-02", text: "Great texture, slightly smaller than I pictured but still very happy with it." }
    ],
    3: [
      { name: "Tharindu L.", rating: 5, date: "2026-06-15", text: "The handles make it so easy to carry. Beautiful grain, use it daily." },
      { name: "Ishara F.", rating: 5, date: "2026-03-22", text: "Bought this for my mother and she loves it. Very well made." }
    ],
    4: [
      { name: "Sanduni R.", rating: 5, date: "2026-05-28", text: "The light pattern it casts on the wall at night is stunning." }
    ],
    5: [
      { name: "Oshadi K.", rating: 4, date: "2026-06-01", text: "Very light to wear, comfortable all day. Wish there were more colour options." },
      { name: "Dulani M.", rating: 5, date: "2026-04-11", text: "Get compliments every time I wear these. True to the photos." }
    ]
  };

  /* ---------------- Persistence ---------------- */
  function readLS(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable — fails silently */ }
  }

  let products = readLS(LS.products, null) || defaultProducts.map(p => ({ ...p }));
  let cart = readLS(LS.cart, []);
  let users = readLS(LS.users, [{ name: "Demo Shopper", email: "demo@nila.lk", password: "demo123" }]);
  let currentUser = readLS(LS.currentUser, null);
  let reviews = readLS(LS.reviews, defaultReviews);
  let isAdminAuthed = false;

  function saveProducts() { writeLS(LS.products, products); }
  function saveCart() { writeLS(LS.cart, cart); }
  function saveUsers() { writeLS(LS.users, users); }
  function saveCurrentUser() { writeLS(LS.currentUser, currentUser); }

  /* ---------------- Helpers ---------------- */
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const money = n => "LKR " + Math.round(n).toLocaleString("en-LK");
  const nextId = () => (products.length ? Math.max(...products.map(p => p.id)) + 1 : 1);
  const finalPrice = p => p.price * (1 - (Number(p.discount) || 0) / 100);
  const findProduct = id => products.find(p => p.id === Number(id));
  const LOW_STOCK_LIMIT = 5;
  const isSoldOut = p => !(Number(p.stock) > 0);
  const inCartQty = id => { const it = cart.find(x => x.id === Number(id)); return it ? it.qty : 0; };
  const reviewsFor = id => reviews[id] || [];
  function stockNote(p) {
    if (isSoldOut(p)) return `<div class="stock-note out">Out of stock</div>`;
    if (p.stock <= LOW_STOCK_LIMIT) return `<div class="stock-note low">Only ${p.stock} left</div>`;
    return `<div class="stock-note">${p.stock} in stock</div>`;
  }
  function badgeFor(p) {
    if (isSoldOut(p)) return `<span class="badge soldout">Sold Out</span>`;
    if (Number(p.discount) > 0) return `<span class="badge">${p.discount}% OFF</span>`;
    if (p.tag) return `<span class="badge">${p.tag}</span>`;
    return "";
  }
  function starRow(rating) {
    const full = Math.round(rating);
    let s = "";
    for (let i = 1; i <= 5; i++) s += i <= full ? "★" : "☆";
    return s;
  }
  function ratingHtml(p) {
    if (!p.reviewCount) return "";
    return `<span class="rating"><span class="stars">${starRow(p.rating)}</span><span class="rating-count">${p.rating.toFixed(1)} (${p.reviewCount})</span></span>`;
  }
  function toast(msg, ms = 2600) {
    let t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove("show"), ms);
  }
  function productUrl(id) { return path("product.html") + "?id=" + id; }
  // Resolve a root-relative asset/page path correctly whether the current
  // page lives at /  or one level deep (kept flat here, but future-proof).
  function path(p) { return p; }

  /* ---------------- Cart ---------------- */
  function cartQty() { return cart.reduce((s, x) => s + x.qty, 0); }
  function addToCart(id, qty = 1) {
    const p = findProduct(id);
    if (!p) return false;
    if (isSoldOut(p)) { toast("This item is currently out of stock"); return false; }
    const room = p.stock - inCartQty(id);
    if (room <= 0) { toast(`You already have all ${p.stock} available in your cart`); return false; }
    if (qty > room) { toast(`Only ${room} more available`); return false; }
    const item = cart.find(x => x.id === Number(id));
    if (item) item.qty += qty; else cart.push({ id: Number(id), qty });
    saveCart();
    renderCartWidgets();
    toast(`${p.name} added to cart`);
    return true;
  }
  function removeFromCart(id) { cart = cart.filter(x => x.id !== Number(id)); saveCart(); renderCartWidgets(); }
  function changeCartQty(id, delta) {
    const item = cart.find(x => x.id === Number(id));
    const p = findProduct(id);
    if (!item || !p) return;
    if (delta > 0 && item.qty + delta > p.stock) { toast(`Only ${p.stock} in stock`); return; }
    item.qty += delta;
    if (item.qty <= 0) { removeFromCart(id); return; }
    saveCart();
    renderCartWidgets();
  }
  function syncCartWithStock() {
    let changed = false;
    cart = cart.filter(x => {
      const p = findProduct(x.id);
      if (!p || isSoldOut(p)) { changed = true; return false; }
      if (x.qty > p.stock) { x.qty = p.stock; changed = true; }
      return true;
    });
    return changed;
  }
  function renderCartWidgets() {
    syncCartWithStock();
    saveCart();
    const count = cartQty();
    $$("#cartCount,#drawerCount").forEach(el => { if (el.id === "cartCount") el.textContent = count; });
    const cc = $("#cartCount"); if (cc) cc.textContent = count;
    const dc = $("#drawerCount"); if (dc) dc.textContent = count;

    const itemsBox = $("#cartItems");
    if (itemsBox) {
      if (!cart.length) {
        itemsBox.innerHTML = `<div style="padding:50px 10px;text-align:center;color:#718496">Your cart is empty.<br><br><button class="btn primary" id="emptyShopBtn" type="button">Start Shopping</button></div>`;
      } else {
        itemsBox.innerHTML = cart.map(x => {
          const p = findProduct(x.id);
          const fp = finalPrice(p);
          return `<div class="cart-item">
            <img src="${p.img}" alt="${p.name}">
            <div>
              <h4>${p.name}</h4>
              <div class="item-price">${money(fp)}</div>
              <div class="mini-qty"><button data-dec="${p.id}" type="button">−</button><span>${x.qty}</span><button data-inc="${p.id}" type="button" ${x.qty >= p.stock ? "disabled" : ""}>+</button></div>
            </div>
            <button class="remove" data-remove="${p.id}" type="button" aria-label="Remove ${p.name}">✕</button>
          </div>`;
        }).join("");
      }
      const subtotal = cart.reduce((s, x) => { const p = findProduct(x.id); return s + (p ? p.price * x.qty : 0); }, 0);
      const discountTotal = cart.reduce((s, x) => { const p = findProduct(x.id); return s + (p ? (p.price - finalPrice(p)) * x.qty : 0); }, 0);
      const sub = $("#subtotal"); if (sub) sub.textContent = money(subtotal);
      const disc = $("#discount"); if (disc) disc.textContent = "− " + money(discountTotal);
      const tot = $("#total"); if (tot) tot.textContent = money(subtotal - discountTotal);
    }
  }
  function checkout() {
    if (!cart.length) { toast("Your cart is empty"); return; }
    if (syncCartWithStock()) { renderCartWidgets(); toast("Some items changed availability — please review your cart", 3500); return; }
    let units = 0, total = 0;
    cart.forEach(x => { const p = findProduct(x.id); p.stock -= x.qty; units += x.qty; total += finalPrice(p) * x.qty; });
    cart = [];
    saveProducts(); saveCart();
    renderCartWidgets();
    if (global.NILA_onProductsChanged) global.NILA_onProductsChanged();
    closeCartDrawer();
    toast(`Order placed! ${units} item${units === 1 ? "" : "s"} · ${money(total)}. Thank you! (Demo checkout — no real payment was taken.)`, 4500);
  }
  function openCart() { const d = $("#cartDrawer"); if (d) d.classList.add("open"); renderCartWidgets(); }
  function closeCartDrawer() { const d = $("#cartDrawer"); if (d) d.classList.remove("open"); }

  /* ---------------- Partials (header / footer / drawers) ---------------- */
  function headerHtml(active) {
    const link = (href, label, key) => `<a class="${active === key ? "active" : ""}" href="${href}">${label}</a>`;
    return `
    <div class="container nav">
      <a class="brand" href="index.html" aria-label="Nila Handcrafts home">
        <span class="brand-mark">◈</span>
        <span><strong>Nila</strong><small>HANDCRAFTS</small></span>
      </a>
      <nav class="main-nav" aria-label="Primary navigation">
        ${link("index.html", "Home", "home")}
        ${link("shop.html", "Shop", "shop")}
        ${link("index.html#story", "Our Story", "story")}
        ${link("index.html#how", "How It's Made", "how")}
        ${link("contact.html", "Contact", "contact")}
      </nav>
      <div class="nav-actions">
        <form class="search" action="shop.html" method="get">
          <span>⌕</span><input name="q" id="searchInput" type="search" placeholder="Search handmade products…">
        </form>
        <button class="icon-btn cart-trigger" id="cartBtn" title="Cart" type="button">🛒<b id="cartCount">0</b></button>
        <div class="user-chip" id="userChip" hidden>
          <span id="userChipName"></span>
          <button id="logoutBtn" title="Log out" type="button">⇥</button>
        </div>
        <button class="admin-btn" id="adminBtn" type="button">⚙ Admin</button>
      </div>
    </div>`;
  }

  function footerHtml() {
    return `
    <div class="container footer-inner">
      <div class="footer-brand"><strong>Nila Handcrafts</strong><p>Natural pieces. Human hands. Timeless beauty.</p></div>
      <div class="footer-col">
        <b>Shop</b>
        <a href="shop.html">All Products</a>
        <a href="shop.html?category=Coconut+Shell">Coconut Shell</a>
        <a href="shop.html?category=Home+Decor">Home Decor</a>
        <a href="index.html#story">Our Story</a>
      </div>
      <div class="footer-col">
        <b>Support</b>
        <a href="contact.html">Contact Us</a>
        <a href="shipping.html">Shipping Policy</a>
        <a href="returns.html">Returns &amp; Refunds</a>
        <a href="terms.html">Terms &amp; Conditions</a>
        <a href="privacy.html">Privacy Policy</a>
      </div>
      <div class="footer-col">
        <b>Find Us</b>
        <a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a>
        <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
        <a href="https://wa.me/94712345678" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </div>
    <div class="container footer-bottom"><small>© 2026 Nila Handcrafts. Built for handmade living.</small></div>`;
  }

  function cartDrawerHtml() {
    return `
    <aside class="cart-drawer" id="cartDrawer" aria-label="Shopping cart">
      <div class="drawer-head"><h3>Your Cart (<span id="drawerCount">0</span>)</h3><button class="close" id="closeCart" type="button">×</button></div>
      <div class="cart-items" id="cartItems"></div>
      <div class="cart-summary">
        <div><span>Subtotal</span><strong id="subtotal">LKR 0</strong></div>
        <div><span>Discount</span><strong id="discount">− LKR 0</strong></div>
        <div class="total"><span>Total</span><strong id="total">LKR 0</strong></div>
        <button class="btn primary full" id="checkoutBtn" type="button">Proceed to Checkout →</button>
        <button class="btn secondary full" id="continueBtn" type="button">Continue Shopping</button>
      </div>
    </aside>`;
  }

  function authGateHtml() {
    return `
    <div class="auth-gate" id="authGate" hidden>
      <div class="auth-box">
        <div class="auth-brand"><span>◈</span><b>Nila<small>HANDCRAFTS</small></b></div>
        <p class="eyebrow center">WELCOME</p>
        <div class="auth-tabs">
          <button class="auth-tab active" data-auth-tab="signin" type="button">Sign In</button>
          <button class="auth-tab" data-auth-tab="signup" type="button">Sign Up</button>
        </div>
        <form class="auth-form" id="signInForm" novalidate>
          <label>Email<input required type="email" id="siEmail" placeholder="you@example.com"></label>
          <label>Password<input required type="password" id="siPassword" placeholder="Enter password"></label>
          <p class="auth-error" id="signInError" hidden>Incorrect email or password.</p>
          <button class="btn primary full" type="submit">Sign In →</button>
          <p class="auth-hint">Demo account: demo@nila.lk / demo123 <button type="button" class="auth-fill-link" id="fillDemoBtn">(use it)</button></p>
          <button type="button" class="auth-admin-link" id="gateAdminBtn">⚙ Store Admin? Sign in here</button>
        </form>
        <form class="auth-form" id="signUpForm" hidden novalidate>
          <label>Full Name<input required id="suName" placeholder="Your name"></label>
          <label>Email<input required type="email" id="suEmail" placeholder="you@example.com"></label>
          <label>Password<input required type="password" id="suPassword" placeholder="Create a password (min 4 chars)" minlength="4"></label>
          <p class="auth-error" id="signUpError" hidden></p>
          <button class="btn primary full" type="submit">Create Account →</button>
        </form>
      </div>
    </div>`;
  }

  function adminHtml() {
    return `
    <div class="admin-overlay" id="adminPanel">
      <div class="admin-shell">
        <button class="admin-close" id="closeAdmin" type="button">×</button>
        <div class="admin-login-screen" id="adminLoginScreen">
          <div class="admin-login-box">
            <div class="admin-brand center"><span>◈</span><b>Nila<small>HANDCRAFTS</small></b></div>
            <p class="eyebrow">STORE MANAGEMENT</p>
            <h2>Admin Login</h2>
            <p class="login-hint">Enter the admin password to manage products.</p>
            <label>Password<input type="password" id="adminPassword" placeholder="Enter admin password"></label>
            <button class="btn primary full" id="adminLoginBtn" type="button">Sign In →</button>
            <p class="login-error" id="loginError" hidden>Incorrect password. Please try again.</p>
            <p class="auth-hint">Demo password: coconut123 <button type="button" class="auth-fill-link" id="fillAdminDemoBtn">(use it)</button></p>
          </div>
        </div>
        <div class="admin-authed" id="adminAuthed" hidden>
          <aside class="admin-sidebar">
            <div class="admin-brand"><span>◈</span><b>Nila<small>HANDCRAFTS</small></b></div>
            <a class="selected" data-admin-nav="top">▣ Dashboard</a>
            <a data-admin-nav="products">▤ Products</a>
            <a id="adminLogoutBtn">↪ Logout</a>
          </aside>
          <section class="admin-main" id="adminMain">
            <div class="admin-top"><div><p class="eyebrow">STORE MANAGEMENT</p><h2>Admin Dashboard</h2></div><button class="btn primary" id="addProductTopBtn" type="button">＋ Add New Product</button></div>
            <div class="stat-grid">
              <div><span>◈</span><small>Total Products</small><strong id="statTotal">0</strong></div>
              <div><span>▦</span><small>Units in Stock</small><strong id="statUnits">0</strong></div>
              <div><span>♡</span><small>Sold Out</small><strong id="statSoldOut">0</strong></div>
              <div><span>♧</span><small>Discounted</small><strong id="statDiscounted">0</strong></div>
              <div><span>▤</span><small>Stock Value</small><strong id="statValue">LKR 0</strong></div>
            </div>
            <div class="admin-card" id="productsAnchor">
              <div class="card-head"><h3>Manage Products</h3><button class="btn tiny primary" id="addProductBtn" type="button">＋ Add New Product</button></div>
              <div class="table-wrap"><table><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Discount</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody id="adminRows"></tbody></table></div>
            </div>
            <form class="admin-card add-product" id="productForm">
              <h3 id="productFormTitle">Add Product</h3>
              <input type="hidden" id="editProductId">
              <div class="form-grid">
                <label>Product Image
                  <div class="upload" id="uploadTrigger">
                    <img id="imagePreview" hidden>
                    <span id="uploadLabel">☁<small>Click to upload<br>or paste an image URL below</small></span>
                  </div>
                  <input type="file" id="pImageFile" accept="image/*" hidden>
                  <input type="text" id="pImageUrl" placeholder="or paste an image URL…">
                </label>
                <div>
                  <label>Product Name<input required id="pName" placeholder="Enter product name"></label>
                  <label>Description<textarea id="pDesc" placeholder="Enter product description"></textarea></label>
                  <div class="two">
                    <label>Category
                      <select id="pCategory">
                        <option>Coconut Shell</option><option>Wood</option><option>Woven</option><option>Home Decor</option><option>Jewellery</option>
                      </select>
                    </label>
                    <label>Price (LKR)<input required type="number" min="0" step="1" id="pPrice" placeholder="Enter price"></label>
                  </div>
                  <div class="two">
                    <label>Stock Count<input required type="number" min="0" step="1" id="pStock" placeholder="e.g. 10"></label>
                    <label>Discount (%)<input type="number" min="0" max="100" step="1" id="pDiscount" placeholder="0"></label>
                  </div>
                  <div class="two">
                    <label>Material<input id="pMaterial" placeholder="e.g. Coconut shell, natural oil finish"></label>
                    <label>Dimensions / Size<input id="pDimensions" placeholder="e.g. 20cm × 12cm"></label>
                  </div>
                  <label>Badge (optional)<input id="pTag" placeholder="e.g. New, Bestseller, Limited"></label>
                  <div class="form-actions">
                    <button type="button" class="btn secondary" id="cancelProductBtn">Cancel</button>
                    <button type="submit" class="btn primary">Save Product</button>
                  </div>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>`;
  }

  /* ---------------- Admin logic ---------------- */
  function openAdmin() { const p = $("#adminPanel"); if (!p) return; p.classList.add("open"); isAdminAuthed ? showAdminDashboard() : showAdminLogin(); }
  function closeAdmin() { const p = $("#adminPanel"); if (p) p.classList.remove("open"); }
  function showAdminLogin() { $("#adminLoginScreen").hidden = false; $("#adminAuthed").hidden = true; $("#loginError").hidden = true; $("#adminPassword").value = ""; }
  function showAdminDashboard() { $("#adminLoginScreen").hidden = true; $("#adminAuthed").hidden = false; closeProductForm(); renderAdminStats(); renderAdminTable(); }
  function attemptLogin() {
    const val = $("#adminPassword").value;
    if (!val) { $("#loginError").textContent = "Please enter the admin password."; $("#loginError").hidden = false; return; }
    if (val === ADMIN_PASSWORD) { isAdminAuthed = true; showAdminDashboard(); }
    else { $("#loginError").textContent = "Incorrect password. Please try again."; $("#loginError").hidden = false; }
  }
  function logoutAdmin() { isAdminAuthed = false; showAdminLogin(); toast("Logged out of admin"); }
  function renderAdminStats() {
    $("#statTotal").textContent = products.length;
    $("#statUnits").textContent = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
    $("#statSoldOut").textContent = products.filter(isSoldOut).length;
    $("#statDiscounted").textContent = products.filter(p => Number(p.discount) > 0).length;
    $("#statValue").textContent = money(products.reduce((s, p) => s + finalPrice(p) * (Number(p.stock) || 0), 0));
  }
  function renderAdminTable() {
    $("#adminRows").innerHTML = products.map(p => `<tr>
      <td><img src="${p.img}" alt=""></td><td>${p.name}</td><td>${p.category}</td><td>${money(p.price)}</td>
      <td>${Number(p.discount) ? p.discount + "%" : "—"}</td><td><strong>${p.stock}</strong></td>
      <td>${isSoldOut(p) ? `<span class="status out">Out of Stock</span>` : p.stock <= LOW_STOCK_LIMIT ? `<span class="status low">Low Stock</span>` : `<span class="status in">In Stock</span>`}</td>
      <td><button class="action" data-edit="${p.id}" type="button">Edit</button><button class="action delete" data-delete="${p.id}" type="button">Delete</button></td>
    </tr>`).join("");
  }
  let uploadedImageData = "";
  function openProductForm(product) {
    const form = $("#productForm"); form.classList.add("open");
    $("#productFormTitle").textContent = product ? "Edit Product" : "Add Product";
    $("#editProductId").value = product ? product.id : "";
    $("#pName").value = product ? product.name : "";
    $("#pDesc").value = product ? (product.desc || "") : "";
    $("#pCategory").value = product ? product.category : "Coconut Shell";
    $("#pPrice").value = product ? product.price : "";
    $("#pDiscount").value = product ? (product.discount || 0) : 0;
    $("#pStock").value = product ? product.stock : "";
    $("#pMaterial").value = product ? (product.material || "") : "";
    $("#pDimensions").value = product ? (product.dimensions || "") : "";
    $("#pTag").value = product ? (product.tag || "") : "";
    uploadedImageData = ""; $("#pImageFile").value = ""; $("#pImageUrl").value = product ? product.img : "";
    updateImagePreview(product ? product.img : "");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function closeProductForm() { $("#productForm").classList.remove("open"); $("#productForm").reset(); $("#editProductId").value = ""; uploadedImageData = ""; updateImagePreview(""); }
  function updateImagePreview(src) {
    const img = $("#imagePreview"), label = $("#uploadLabel");
    if (src) { img.src = src; img.hidden = false; label.hidden = true; } else { img.hidden = true; img.src = ""; label.hidden = false; }
  }
  function handleProductFormSubmit(e) {
    e.preventDefault();
    const img = uploadedImageData || $("#pImageUrl").value.trim();
    if (!img) { toast("Please upload an image or paste an image URL"); return; }
    const name = $("#pName").value.trim();
    const price = Number($("#pPrice").value);
    if (!name) { toast("Please enter a product name"); return; }
    if (!(price >= 0)) { toast("Please enter a valid price"); return; }
    const id = $("#editProductId").value ? Number($("#editProductId").value) : null;
    const data = {
      name, desc: $("#pDesc").value.trim(), category: $("#pCategory").value, price,
      discount: Math.min(100, Math.max(0, Number($("#pDiscount").value) || 0)),
      stock: Math.max(0, Math.floor(Number($("#pStock").value) || 0)),
      material: $("#pMaterial").value.trim(), dimensions: $("#pDimensions").value.trim(),
      tag: $("#pTag").value.trim(), img
    };
    if (id) { const idx = products.findIndex(p => p.id === id); if (idx > -1) products[idx] = { ...products[idx], ...data }; }
    else { products.push({ id: nextId(), rating: 5, reviewCount: 0, ...data }); }
    saveProducts();
    if (global.NILA_onProductsChanged) global.NILA_onProductsChanged();
    renderAdminStats(); renderAdminTable(); closeProductForm();
    toast(id ? "Product updated" : "Product added");
  }
  function deleteProduct(id) {
    const p = findProduct(id); if (!p) return;
    if (!confirm(`Remove "${p.name}" from the catalogue?`)) return;
    products = products.filter(x => x.id !== Number(id));
    cart = cart.filter(x => x.id !== Number(id));
    saveProducts(); saveCart();
    if (global.NILA_onProductsChanged) global.NILA_onProductsChanged();
    renderCartWidgets(); renderAdminStats(); renderAdminTable();
    toast("Product removed");
  }

  /* ---------------- Customer auth ---------------- */
  function showAuthTab(tab) {
    $$(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.authTab === tab));
    $("#signInForm").hidden = tab !== "signin"; $("#signUpForm").hidden = tab !== "signup";
    $("#signInError").hidden = true; $("#signUpError").hidden = true;
  }
  function openAuthGate() { const g = $("#authGate"); if (g) g.hidden = false; }
  function closeAuthGate() { const g = $("#authGate"); if (g) g.hidden = true; }
  function updateUserChip() {
    const chip = $("#userChip"); if (!chip) return;
    if (currentUser) { chip.hidden = false; $("#userChipName").textContent = "Hi, " + currentUser.name.split(" ")[0]; }
    else chip.hidden = true;
  }
  function handleSignIn(e) {
    e.preventDefault();
    const email = $("#siEmail").value.trim().toLowerCase(), password = $("#siPassword").value;
    if (!email || !password) { $("#signInError").textContent = "Please enter your email and password."; $("#signInError").hidden = false; return; }
    const match = users.find(u => u.email.toLowerCase() === email && u.password === password);
    if (!match) { $("#signInError").textContent = "Incorrect email or password."; $("#signInError").hidden = false; return; }
    currentUser = match; saveCurrentUser(); updateUserChip(); closeAuthGate();
    toast(`Welcome back, ${match.name.split(" ")[0]}!`);
  }
  function handleSignUp(e) {
    e.preventDefault();
    const name = $("#suName").value.trim(), email = $("#suEmail").value.trim().toLowerCase(), password = $("#suPassword").value;
    if (!name || !email || !password) { $("#signUpError").textContent = "Please fill in all fields."; $("#signUpError").hidden = false; return; }
    if (password.length < 4) { $("#signUpError").textContent = "Password must be at least 4 characters."; $("#signUpError").hidden = false; return; }
    if (users.some(u => u.email.toLowerCase() === email)) { $("#signUpError").textContent = "An account with that email already exists."; $("#signUpError").hidden = false; return; }
    const newUser = { name, email, password };
    users.push(newUser); saveUsers();
    currentUser = newUser; saveCurrentUser(); updateUserChip(); closeAuthGate();
    toast(`Account created — welcome, ${name.split(" ")[0]}!`);
  }
  function logoutUser() {
    currentUser = null; saveCurrentUser(); cart = []; saveCart();
    renderCartWidgets(); updateUserChip();
    const si = $("#signInForm"), su = $("#signUpForm");
    if (si) si.reset(); if (su) su.reset();
    showAuthTab("signin"); openAuthGate();
  }

  /* ---------------- Site init (call on every page) ---------------- */
  function initSite(active) {
    const headerMount = $("#site-header"), footerMount = $("#site-footer");
    if (headerMount) headerMount.innerHTML = headerHtml(active);
    if (footerMount) footerMount.innerHTML = footerHtml();
    const cartMount = $("#cart-drawer-root"); if (cartMount) cartMount.innerHTML = cartDrawerHtml();
    const authMount = $("#auth-gate-root"); if (authMount) authMount.innerHTML = authGateHtml();
    const adminMount = $("#admin-root"); if (adminMount) adminMount.innerHTML = adminHtml();
    if (!$("#toast")) { const t = document.createElement("div"); t.className = "toast"; t.id = "toast"; document.body.appendChild(t); }

    // Pre-fill search box from ?q= on shop.html
    const params = new URLSearchParams(location.search);
    const si = $("#searchInput"); if (si && params.get("q")) si.value = params.get("q");

    renderCartWidgets();
    updateUserChip();
    if (!currentUser) openAuthGate(); // visitors must sign in or sign up before checking out

    document.addEventListener("click", e => {
      const add = e.target.closest("[data-add]"); if (add) { addToCart(add.dataset.add); return; }
      const view = e.target.closest("[data-product]"); if (view) { location.href = productUrl(view.dataset.product); return; }
      const inc = e.target.closest("[data-inc]"); if (inc) { changeCartQty(inc.dataset.inc, 1); return; }
      const dec = e.target.closest("[data-dec]"); if (dec) { changeCartQty(dec.dataset.dec, -1); return; }
      const rem = e.target.closest("[data-remove]"); if (rem) { removeFromCart(rem.dataset.remove); return; }
      const startShop = e.target.closest("#emptyShopBtn"); if (startShop) { closeCartDrawer(); location.href = "shop.html"; return; }
      const editBtn = e.target.closest("[data-edit]"); if (editBtn) { openProductForm(findProduct(editBtn.dataset.edit)); return; }
      const delBtn = e.target.closest("[data-delete]"); if (delBtn) { deleteProduct(delBtn.dataset.delete); return; }
      const navBtn = e.target.closest("[data-admin-nav]");
      if (navBtn) {
        $$("[data-admin-nav]").forEach(a => a.classList.remove("selected"));
        navBtn.classList.add("selected");
        if (navBtn.dataset.adminNav === "products") $("#productsAnchor").scrollIntoView({ behavior: "smooth" });
        else $("#adminMain").scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    const cartBtn = $("#cartBtn"); if (cartBtn) cartBtn.onclick = openCart;
    const closeCart = $("#closeCart"); if (closeCart) closeCart.onclick = closeCartDrawer;
    const continueBtn = $("#continueBtn"); if (continueBtn) continueBtn.onclick = closeCartDrawer;
    const checkoutBtn = $("#checkoutBtn"); if (checkoutBtn) checkoutBtn.onclick = checkout;

    const adminBtn = $("#adminBtn"); if (adminBtn) adminBtn.onclick = openAdmin;
    const closeAdminBtn = $("#closeAdmin"); if (closeAdminBtn) closeAdminBtn.onclick = closeAdmin;
    const adminLoginBtn = $("#adminLoginBtn"); if (adminLoginBtn) adminLoginBtn.onclick = attemptLogin;
    const adminPasswordInput = $("#adminPassword");
    if (adminPasswordInput) {
      adminPasswordInput.addEventListener("keydown", e => { if (e.key === "Enter") attemptLogin(); });
      adminPasswordInput.addEventListener("input", e => { if (e.target.value === ADMIN_PASSWORD) attemptLogin(); });
    }
    const adminLogoutBtn = $("#adminLogoutBtn"); if (adminLogoutBtn) adminLogoutBtn.onclick = logoutAdmin;
    const addTop = $("#addProductTopBtn"); if (addTop) addTop.onclick = () => openProductForm(null);
    const addBtn = $("#addProductBtn"); if (addBtn) addBtn.onclick = () => openProductForm(null);
    const cancelBtn = $("#cancelProductBtn"); if (cancelBtn) cancelBtn.onclick = closeProductForm;
    const pForm = $("#productForm"); if (pForm) pForm.addEventListener("submit", handleProductFormSubmit);
    const uploadTrigger = $("#uploadTrigger"); if (uploadTrigger) uploadTrigger.onclick = () => $("#pImageFile").click();
    const pImageFile = $("#pImageFile");
    if (pImageFile) pImageFile.addEventListener("change", e => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast("Please choose an image smaller than 2 MB"); e.target.value = ""; return; }
      const reader = new FileReader();
      reader.onload = ev => { uploadedImageData = ev.target.result; $("#pImageUrl").value = ""; updateImagePreview(uploadedImageData); };
      reader.readAsDataURL(file);
    });
    const pImageUrl = $("#pImageUrl");
    if (pImageUrl) pImageUrl.addEventListener("input", () => {
      const val = pImageUrl.value.trim();
      if (val) { uploadedImageData = ""; $("#pImageFile").value = ""; updateImagePreview(val); } else updateImagePreview("");
    });

    $$(".auth-tab").forEach(t => t.onclick = () => showAuthTab(t.dataset.authTab));
    const signInForm = $("#signInForm"); if (signInForm) signInForm.addEventListener("submit", handleSignIn);
    const signUpForm = $("#signUpForm"); if (signUpForm) signUpForm.addEventListener("submit", handleSignUp);
    const logoutBtn = $("#logoutBtn"); if (logoutBtn) logoutBtn.onclick = logoutUser;
    const gateAdminBtn = $("#gateAdminBtn"); if (gateAdminBtn) gateAdminBtn.onclick = openAdmin;
    const fillDemoBtn = $("#fillDemoBtn");
    if (fillDemoBtn) fillDemoBtn.onclick = () => { $("#siEmail").value = "demo@nila.lk"; $("#siPassword").value = "demo123"; $("#signInError").hidden = true; };
    const fillAdminDemoBtn = $("#fillAdminDemoBtn");
    if (fillAdminDemoBtn) fillAdminDemoBtn.onclick = () => { $("#adminPassword").value = ADMIN_PASSWORD; $("#loginError").hidden = true; };
  }

  global.NILA = {
    get products() { return products; }, get cart() { return cart; }, get currentUser() { return currentUser; },
    reviewsFor, money, finalPrice, isSoldOut, stockNote, badgeFor, findProduct, inCartQty, LOW_STOCK_LIMIT,
    addToCart, removeFromCart, changeCartQty, cartQty, renderCartWidgets, openCart, closeCartDrawer,
    toast, productUrl, galleryFor, starRow, ratingHtml, initSite, categoryImg
  };
})(window);
