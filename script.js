// ==== elements ====
const elements = {
  products: document.querySelector(".products"),
  cartBtn: document.querySelector(".cart-btn"),
  cartQty: document.querySelector(".cart-qty"),
  cartClose: document.querySelector(".cart-close"),
  cart: document.querySelector(".cart"),
  cartOverlay: document.querySelector(".cart-overlay"),
  cartClear: document.querySelector(".cart-clear"),
  cartBody: document.querySelector(".cart-body"),
  cartTotal: document.querySelector(".cart-total"),
  cartCheckout: document.querySelector(".checkout"),
};

// ==== state ====
let cart = [];
let products = [];

// ==== config ====
const CONFIG = {
  apiUrl: "https://fakestoreapi.com/products",
  storageKey: "online-store",
  phoneNumber: "+6281936020227",
};

// ==== utils ====
// escape html
const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// calculate total price in cart
const calculateTotal = () => {
  return cart.reduce((total, item) => total + item.price * item.qty, 0);
};

// get total qty in cart
const getCartQty = () => cart.reduce((sum, item) => sum + item.qty, 0);

// formatting price
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

// ==== local storage ====
// save cart to local storage
const saveCart = () => {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart));
};

// load cart from local storage
const loadCart = () => {
  const storedCart = localStorage.getItem(CONFIG.storageKey);
  cart = storedCart ? JSON.parse(storedCart) : [];
};

// ==== api ====
// get products from fake store api
const getProducts = async () => {
  try {
    elements.products.innerHTML =
      "<div class='loading'>Loading products...</div>";

    const response = await fetch(CONFIG.apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    const data = await response.json();
    products = data;
    renderProducts(data);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

// ==== cart functions ====
// add to cart
const addToCart = (id) => {
  // get product in cart
  const inCart = cart.find((item) => item.id === id);
  // get product from products
  const product = products.find((product) => product.id === id);

  // safety check
  if (!product) return;

  // if product is already in cart, increase qty
  if (inCart) {
    inCart.qty++;
  } else {
    // else add new product to cart
    cart.push({
      id,
      title: product.title,
      price: product.price,
      image: product.image,
      qty: 1,
    });
  }

  saveCart();
  renderCart();
  showCart();
};

// handle click add to cart
const handleAddToCart = (e) => {
  const element = e.target.closest(".product");
  if (!element) return;

  const id = parseInt(element.dataset.id);
  if (e.target.dataset.action === "add-to-cart") {
    addToCart(id);
  }
};

// render products
const renderProducts = (products) => {
  if (!products || products.length === 0) {
    elements.products.innerHTML =
      "<div class='loading'>No products found.</div>";
    return;
  }

  const render = products
    .map(
      (product) => `
      <div class="product" data-id="${product.id}">
        <img src="${product.image}" alt="${escapeHtml(product.title)}" />
        <h3>${escapeHtml(product.title)}</h3>
        <p>${formatPrice(product.price)}</p>
        <button data-action="add-to-cart">Add to Cart</button>
      </div>
    `,
    )
    .join("");

  elements.products.innerHTML = render;
};

// show cart
const showCart = () => {
  elements.cartOverlay.classList.add("show");
  elements.cart.classList.add("show");
};

// close cart
const closeCart = () => {
  elements.cartOverlay.classList.remove("show");
  elements.cart.classList.remove("show");
};

// clear cart
const clearCart = () => {
  if (!confirm("Are you sure you want to clear the cart?")) return;

  cart = [];
  saveCart();
  renderCart();
  setTimeout(closeCart, 300);
};

// increase qty cart
const increaseQty = (id) => {
  const item = cart.find((item) => item.id === id);
  if (!item) return;
  item.qty++;
};

// remove from cart, this function is work when data cart is 0
const removeFromCart = (id) => {
  // filter out item with matching id
  cart = cart.filter((item) => item.id !== id);

  // close cart if empty
  if (cart.length === 0) {
    setTimeout(closeCart, 300);
  }
};

// decrease qty cart
const decreaseQty = (id) => {
  const item = cart.find((item) => item.id === id);
  if (!item) return;
  item.qty--;

  // close cart data cart is 0
  if (item.qty === 0) {
    removeFromCart(id);
  }
};

// update cart qty when clicking incr/decr
const updateCartQty = (e) => {
  const cartItem = e.target.closest(".cart-item");
  if (!cartItem) return;

  const id = parseInt(cartItem.dataset.id);
  const action = e.target.dataset.action;

  // object lookup actions
  const actions = {
    decrease: decreaseQty,
    increase: increaseQty,
  };
  
  if (actions[action]) {
    actions[action](id);
    saveCart();
    renderCart();
  }
};

// checkout cart and move to whatsapp
const checkoutCart = () => {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  let message = "Hello, I would like to place an order:\n\n";
  cart.forEach((item) => {
    message += `${item.qty} x ${item.title} - ${formatPrice(
      item.price * item.qty,
    )}\n`;
  });
  message += `\nTotal: ${formatPrice(calculateTotal())}`;

  const whatsappUrl = `https://wa.me/${CONFIG.phoneNumber}?text=${encodeURIComponent(
    message,
  )}`;
  window.open(whatsappUrl, "_blank");
};

// close cart when clicking outside
const handleClickOutsideCart = (e) => {
  if (e.target === elements.cartOverlay) {
    closeCart();
  }
};

// render cart
const renderCart = () => {
  // show cart qty in navbar
  elements.cartQty.textContent = getCartQty();
  // toggle classlist cart qty
  elements.cartQty.classList.toggle("visible", getCartQty() > 0);

  // show cart total
  elements.cartTotal.textContent = formatPrice(calculateTotal());

  // show empty cart
  if (cart.length === 0) {
    elements.cartBody.innerHTML =
      '<div class="cart-empty">Your cart is empty.</div>';
    return;
  }

  // render cart items
  const render = cart
    .map((item) => {
      const { id, title, price, image, qty } = item;
      const amount = price * qty;

      return `
       <div class="cart-item" data-id="${id}">
          <img src="${image}" alt="${escapeHtml(title)}" />
          <div class="cart-item-detail">
            <h3>${escapeHtml(title)}</h3>
            <h5>${formatPrice(price)}</h5>
            <div class="cart-item-amount">
              <i class="bi bi-dash-lg" data-action="decrease"></i>
              <span class="qty">${qty}</span>
              <i class="bi bi-plus-lg" data-action="increase"></i>

              <span class="cart-item-price">
                ${formatPrice(amount)}
              </span>
            </div>
          </div>
        </div>`;
    })
    .join("");
  elements.cartBody.innerHTML = render;
};

// close cart when clicking escape
const handleEscapeKey = (e) => {
  if (e.key === "Escape") {
    closeCart();
  }
};

// initialize
const init = () => {
  getProducts();
  loadCart();
  renderCart();
};

// event listeners
document.addEventListener("DOMContentLoaded", () => {
  // cart btn
  elements.cartBtn.addEventListener("click", showCart);
  // cart close
  elements.cartClose.addEventListener("click", closeCart);
  // click outside cart
  elements.cartOverlay.addEventListener("click", handleClickOutsideCart);
  // escape key
  document.addEventListener("keydown", handleEscapeKey);
  // add to cart
  elements.products.addEventListener("click", handleAddToCart);
  // clear cart
  elements.cartClear.addEventListener("click", clearCart);
  // checkout cart
  elements.cartCheckout.addEventListener("click", checkoutCart);
  // update cart qty
  elements.cartBody.addEventListener("click", updateCartQty);

  // initialize
  init();
});
