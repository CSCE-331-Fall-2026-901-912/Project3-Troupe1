let menuItems = [];
let addOns = [];

const screens = {
  menu: document.getElementById("menuScreen"),
  addon: document.getElementById("addonScreen"),
  cart: document.getElementById("cartScreen"),
  confirm: document.getElementById("confirmScreen")
};
const drinkGrid = document.getElementById("drinkGrid");
const addonList = document.getElementById("addonList");
const cartList = document.getElementById("cartList");
const categoryButtons = document.querySelectorAll(".category");

let currentCategory = "Milk Tea";
let selectedDrink = null;
let cart = [];
let favoriteItems = [];
let translations = {};
let weatherState = "loading";
let textAssistanceMode = false;

const categoryLabels = { Seasonal: "Seasonal Drink" };
const assistanceMessages = {
  menu: "Step 1: Select a drink category, then choose your preferred drink from the menu.",
  addon: "Step 2: Choose any additional toppings. Check the total price before adding your drink to the cart.",
  cart: "Step 3: Review your drinks, quantities, and total price. Select Checkout when you are ready.",
  confirm: "Your order has been received. Please keep your order number and use it to identify your order at the pickup counter."
};

function t(text) {
  return translations[text] || text;
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
}

async function setLanguage(lang) {
  const note = document.getElementById("languageNote");
  let loaded = {};
  note.textContent = "";

  if (lang !== "en") {
    try {
      const response = await fetch("/api/kiosk/translations?lang=" + lang);
      if (!response.ok) throw new Error("Request failed");
      loaded = (await response.json()).translations;
    } catch (error) {
      note.textContent = "Translation unavailable";
      lang = "en";
    }
  }

  translations = loaded;
  document.documentElement.lang = lang;
  document.querySelectorAll(".lang").forEach(button => {
    button.classList.toggle("active", button.dataset.lang === lang);
  });
  applyLanguage();
  showCategory(currentCategory);
  renderWeatherRecommendations(weatherState);
}

function showScreen(name) {
  Object.keys(screens).forEach(key => {
    screens[key].style.display = key === name ? "flex" : "none";
  });
  updateAssistanceMessage(name);
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.total * item.qty, 0);
}

function updateCartBar() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cartCount").textContent = t("Cart") + " (" + count + ")";
  document.getElementById("cartBarTotal").textContent = "$" + cartTotal().toFixed(2);
}

function showCategory(category) {
  currentCategory = category;
  document.getElementById("categoryHeading").textContent = t(categoryLabels[category] || category);
  drinkGrid.innerHTML = "";

  categoryButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.category === category);
  });

  const visibleItems = category === "Favorites"
    ? favoriteItems
    : menuItems.filter(item => item.category === category);

  if (category === "Favorites" && visibleItems.length === 0) {
    drinkGrid.innerHTML = "<p>" + t("Favorites are unavailable right now.") + "</p>";
  }

  visibleItems
    .forEach(item => {
      const drink = document.createElement("button");
      drink.className = "item";
      drink.innerHTML = `<img src="../images/${item.id}.png" alt="${esc(t(item.name))}" onerror="this.remove()"><strong>${esc(t(item.name))}</strong><span>$${item.price.toFixed(2)}</span>`;
      drink.addEventListener("click", () => showAddOns(item));
      drinkGrid.appendChild(drink);
    });

  updateCartBar();
  showScreen("menu");
}

function showAddOns(item) {
  selectedDrink = item;
  document.getElementById("drinkName").textContent = t(item.name);
  document.getElementById("basePrice").textContent = t("Base Price") + ": $" + item.price.toFixed(2);
  addonList.innerHTML = "";

  const available = addOns.filter(addOn => addOn.menuItemIds.includes(item.id));

  if (available.length === 0) {
    addonList.innerHTML = "<p>" + t("No optional add-ons for this drink.") + "</p>";
  }

  available.forEach(addOn => {
    const label = document.createElement("label");
    label.className = "addon-option";
    label.innerHTML = `
      <input type="checkbox" value="${addOn.id}">
      <span>${esc(t(addOn.name))}</span>
      <span>+$${addOn.price.toFixed(2)}</span>
    `;
    label.querySelector("input").addEventListener("change", updateCustomTotal);
    addonList.appendChild(label);
  });

  updateCustomTotal();
  showScreen("addon");
}

function getSelectedAddOns() {
  return Array.from(addonList.querySelectorAll("input:checked")).map(input => {
    return addOns.find(addOn => addOn.id === Number(input.value));
  });
}

function updateCustomTotal() {
  const total = getSelectedAddOns().reduce((sum, addOn) => sum + addOn.price, selectedDrink.price);
  document.getElementById("customTotal").textContent = t("Total") + ": $" + total.toFixed(2);
}

function showCart() {
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = "<p>" + t("Your cart is empty.") + "</p>";
  }

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div>
        <img src="../images/${item.id}.png" alt="${esc(t(item.name))}">
        <div class="cart-text">
          <strong>${esc(t(item.name))}</strong>
          <small>${item.addOns.length ? esc(item.addOns.map(t).join(", ")) : t("No add-ons")}</small>
        </div>
      </div>
      <div class="qty">
        <button class="qty-button minus">-</button>
        <span>${item.qty}</span>
        <button class="qty-button plus">+</button>
      </div>
      <span>$${(item.total * item.qty).toFixed(2)}</span>
      <button class="remove">${t("Remove")}</button>
    `;
    row.querySelector(".minus").addEventListener("click", () => {
      item.qty--;
      if (item.qty === 0) cart.splice(index, 1);
      showCart();
    });
    row.querySelector(".plus").addEventListener("click", () => {
      item.qty++;
      showCart();
    });
    row.querySelector(".remove").addEventListener("click", () => {
      cart.splice(index, 1);
      showCart();
    });
    cartList.appendChild(row);
  });

  document.getElementById("cartTotal").textContent = t("Total") + ": $" + cartTotal().toFixed(2);
  updateCartBar();
  showScreen("cart");
}

async function loadMenu() {
  try {
    const response = await fetch("/api/kiosk/menu");
    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();
    menuItems = data.menuItems;
    addOns = data.addOns;
  } catch (error) {
    menuItems = [];
    addOns = [];
  }
}

async function startKiosk() {
  await loadMenu();
  showCategory(currentCategory);
  if (menuItems.length === 0) {
    drinkGrid.innerHTML = "<p>" + t("The menu is unavailable right now.") + "</p>";
  }
  initializeWeather();
}

async function loadFavorites() {
  try {
    const response = await fetch("/api/kiosk/top-drinks");
    if (!response.ok) throw new Error("Request failed");
    const rows = await response.json();
    favoriteItems = rows
      .map(row => menuItems.find(item => item.id === Number(row.menuitemid)))
      .filter(Boolean);
  } catch (error) {
    favoriteItems = [];
  }
}

categoryButtons.forEach(button => {
  button.addEventListener("click", async () => {
    const category = button.dataset.category;
    if (category === "Favorites") await loadFavorites();
    showCategory(category);
  });
});

document.getElementById("addToCart").addEventListener("click", () => {
  const selected = getSelectedAddOns();
  cart.push({
    id: selectedDrink.id,
    name: selectedDrink.name,
    addOns: selected.map(addOn => addOn.name),
    addOnIds: selected.map(addOn => addOn.id),
    qty: 1,
    total: selected.reduce((sum, addOn) => sum + addOn.price, selectedDrink.price)
  });
  showCart();
});

document.getElementById("checkoutButton").addEventListener("click", async () => {
  const button = document.getElementById("checkoutButton");
  const message = document.getElementById("checkoutMessage");

  if (cart.length === 0) {
    message.textContent = t("Your cart is empty.");
    return;
  }

  button.disabled = true;
  message.textContent = t("Placing your order...");

  try {
    const response = await fetch("/api/kiosk/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map(item => ({ id: item.id, qty: item.qty, addOnIds: item.addOnIds }))
      })
    });
    const order = await response.json();
    if (!response.ok) {
      message.textContent = response.status === 409
        ? t("Sorry, some ingredients for your order are sold out.")
        : t("We couldn't place your order. Please try again.");
      return;
    }

    cart = [];
    message.textContent = "";
    document.getElementById("confirmMessage").textContent =
      t("Order number") + ": " + order.orderId + ". " + t("Total") + ": $" + Number(order.total).toFixed(2);
    updateCartBar();
    showScreen("confirm");
  } catch (error) {
    message.textContent = t("We couldn't place your order. Please try again.");
  } finally {
    button.disabled = false;
  }
});

document.getElementById("textAssistanceToggle").addEventListener("click", () => {
    textAssistanceMode = !textAssistanceMode;

    const button = document.getElementById("textAssistanceToggle");

    button.textContent = textAssistanceMode
        ? "Text Assistance: ON"
        : "Text Assistance: OFF";

    button.classList.toggle("active", textAssistanceMode);
    button.setAttribute("aria-pressed", String(textAssistanceMode));

    updateAssistanceMessage("menu");
});

document.getElementById("newOrder").addEventListener("click", () => showCategory(currentCategory));
document.getElementById("addonBack").addEventListener("click", () => showCategory(currentCategory));
document.getElementById("keepShopping").addEventListener("click", () => showCategory(currentCategory));
document.getElementById("cartLink").addEventListener("click", showCart);
const languageToggle = document.getElementById("languageToggle");
const languageList = document.getElementById("languageList");

function setLanguageMenu(open) {
  languageList.hidden = !open;
  languageToggle.setAttribute("aria-expanded", String(open));
}

languageToggle.addEventListener("click", event => {
  event.stopPropagation();
  setLanguageMenu(languageList.hidden);
});

document.addEventListener("click", () => setLanguageMenu(false));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") setLanguageMenu(false);
});

document.querySelectorAll(".lang").forEach(button => {
  button.addEventListener("click", () => {
    setLanguageMenu(false);
    setLanguage(button.dataset.lang);
  });
});


// Fixed store location: replace these coordinates if the store moves.
// This browser-only version makes no customer geolocation request.
const WEATHER_CONFIG = {
  latitude: 30.628,
  longitude: -96.334,
  cacheMs: 15 * 60 * 1000,
  timeoutMs: 5000
};
const weatherCacheKey = "jade-weather-v1:" +
  WEATHER_CONFIG.latitude + "," + WEATHER_CONFIG.longitude;

function validWeather(value) {
  return value && Number.isFinite(value.temperature_2m) &&
    Number.isFinite(value.apparent_temperature) &&
    Number.isInteger(value.weather_code);
}

function weatherDescription(code) {
  if (code === 0) return t("Clear");
  if ([1, 2, 3].includes(code)) return t("Partly cloudy / cloudy");
  if ([45, 48].includes(code)) return t("Foggy");
  if ([51, 53, 55, 56, 57].includes(code)) return t("Drizzle");
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return t("Rain");
  if ([71, 73, 75, 77, 85, 86].includes(code)) return t("Snow");
  if ([95, 96, 99].includes(code)) return t("Thunderstorms");
  return t("Current conditions");
}

function recommendationIds(weather) {
  if (!weather || weather === "loading") return [1, 4, 12];
  // Temperature takes priority; these are menu suggestions, not hot-drink options.
  if (weather.apparent_temperature >= 80) return [9, 11, 21];
  if (weather.apparent_temperature < 60) return [2, 4, 8];
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99]
    .includes(weather.weather_code)) return [1, 4, 8];
  return [1, 3, 12];
}

function renderWeatherRecommendations(weather) {
  const status = document.getElementById("weatherStatus");
  const picks = document.getElementById("weatherPicks");
  weatherState = weather;
  if (weather === "loading") {
    status.textContent = t("Checking College Station weather…");
  } else if (weather) {
    const message = weather.apparent_temperature >= 80
      ? t("Cool off with a fruity favorite.")
      : weather.apparent_temperature < 60
        ? t("Enjoy a rich milk tea today.")
        : t("Find your next favorite boba.");
    status.textContent = t("College Station") + " · " +
      Math.round(weather.temperature_2m) + "°F · " + t("Feels like") + " " +
      Math.round(weather.apparent_temperature) + "°F · " +
      weatherDescription(weather.weather_code) + ". " + message;
  } else {
    status.textContent = t("Weather unavailable — try one of these favorites.");
  }
  picks.replaceChildren();
  recommendationIds(weather).forEach(id => {
    const item = menuItems.find(drink => drink.id === id);
    if (!item) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item";
    const name = document.createElement("strong");
    name.textContent = t(item.name);
    const price = document.createElement("span");
    price.textContent = "$" + item.price.toFixed(2);
    button.append(name, price);
    button.addEventListener("click", () => showAddOns(item));
    picks.appendChild(button);
  });
}

async function initializeWeather() {
  // Keep picks usable while the request runs.
  renderWeatherRecommendations("loading");
  try {
    const cached = JSON.parse(localStorage.getItem(weatherCacheKey));
    const age = cached && Date.now() - cached.savedAt;
    if (cached && Number.isFinite(age) && age >= 0 &&
        age < WEATHER_CONFIG.cacheMs && validWeather(cached.current)) {
      renderWeatherRecommendations(cached.current);
      return;
    }
  } catch {
    // Blocked storage or invalid cache must not interrupt ordering.
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_CONFIG.timeoutMs);
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: WEATHER_CONFIG.latitude,
      longitude: WEATHER_CONFIG.longitude,
      current: "temperature_2m,apparent_temperature,weather_code",
      temperature_unit: "fahrenheit",
      timezone: "America/Chicago"
    }).toString();
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Weather request failed");
    const data = await response.json();
    if (!validWeather(data.current)) throw new Error("Invalid weather response");
    renderWeatherRecommendations(data.current);
    try {
      localStorage.setItem(weatherCacheKey,
        JSON.stringify({ savedAt: Date.now(), current: data.current }));
    } catch {
      // Weather still works if browser storage is unavailable.
    }
  } catch {
    renderWeatherRecommendations(null);
  } finally {
    clearTimeout(timeout);
  }
}

function updateAssistanceMessage(screenName) {
  const messages = {
    menu: document.getElementById("menuAssistance"),
    addon: document.getElementById("addonAssistance"),
    cart: document.getElementById("cartAssistance"),
    confirm: document.getElementById("confirmAssistance")
  };

  Object.keys(messages).forEach(key => {
    messages[key].hidden = !textAssistanceMode || key !== screenName;
    if (textAssistanceMode && key === screenName) {
      messages[key].textContent = assistanceMessages[key];
    }
  });
}

// Fetch once per page load; keep recommendations stable while a customer orders.
startKiosk();
