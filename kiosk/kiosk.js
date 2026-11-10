const menuItems = [
  { id: 1, name: "Classic Milk Tea", category: "Milk Tea", price: 5.25 },
  { id: 2, name: "Taro Milk Tea", category: "Milk Tea", price: 5.75 },
  { id: 3, name: "Matcha Milk Tea", category: "Milk Tea", price: 6.00 },
  { id: 4, name: "Brown Sugar Milk Tea", category: "Milk Tea", price: 6.25 },
  { id: 5, name: "Thai Milk Tea", category: "Milk Tea", price: 5.50 },
  { id: 6, name: "Oolong Milk Tea", category: "Milk Tea", price: 5.50 },
  { id: 7, name: "Jasmine Milk Tea", category: "Milk Tea", price: 5.50 },
  { id: 8, name: "Chocolate Milk Tea", category: "Milk Tea", price: 5.75 },
  { id: 9, name: "Mango Green Tea", category: "Fruit Tea", price: 5.75 },
  { id: 10, name: "Strawberry Green Tea", category: "Fruit Tea", price: 5.75 },
  { id: 11, name: "Passion Fruit Green Tea", category: "Fruit Tea", price: 5.75 },
  { id: 12, name: "Peach Green Tea", category: "Fruit Tea", price: 5.50 },
  { id: 13, name: "Lychee Green Tea", category: "Fruit Tea", price: 5.75 },
  { id: 14, name: "Mango Milk Tea", category: "Milk Tea", price: 6.00 },
  { id: 15, name: "Strawberry Milk Tea", category: "Milk Tea", price: 6.00 },
  { id: 16, name: "Coconut Milk Tea", category: "Milk Tea", price: 6.75 },
  { id: 17, name: "Brown Sugar Boba Coffee", category: "Coffee", price: 6.25 },
  { id: 18, name: "Yuanyang Coffee Milk Tea", category: "Coffee", price: 5.75 },
  { id: 19, name: "Thai Tea Coffee", category: "Coffee", price: 6.25 },
  { id: 20, name: "Coconut Mocha With Grass Jelly", category: "Coffee", price: 6.50 },
  { id: 21, name: "Mango Passion Fruit Smoothie", category: "Smoothie", price: 6.50 },
  { id: 22, name: "Strawberry Banana Smoothie", category: "Smoothie", price: 6.50 },
  { id: 23, name: "Peach Lychee Smoothie", category: "Smoothie", price: 6.25 },
  { id: 24, name: "Taro Coconut Smoothie", category: "Smoothie", price: 6.50 },
  { id: 25, name: "Pumpkin spice latte", category: "Seasonal Drink", price: 6.50 },
  { id: 26, name: "Pepermint Shake", category: "Seasonal Drink", price: 6.00 }
];

const addOns = [
  { id: 1, name: "Tapioca Pearls", price: 0.75 },
  { id: 2, name: "Mango Popping Boba", price: 0.75 },
  { id: 3, name: "Strawberry Popping Boba", price: 0.75 },
  { id: 4, name: "Lychee Jelly", price: 0.65 },
  { id: 5, name: "Grass Jelly", price: 0.65 },
  { id: 6, name: "Aloe Vera", price: 0.75 },
  { id: 7, name: "Pudding", price: 0.65 },
  { id: 8, name: "Red Bean", price: 0.75 }
];

const screens = {
  menu: document.getElementById("menuScreen"),
  addon: document.getElementById("addonScreen"),
  cart: document.getElementById("cartScreen")
};
const drinkGrid = document.getElementById("drinkGrid");
const addonList = document.getElementById("addonList");
const cartList = document.getElementById("cartList");
const categoryButtons = document.querySelectorAll(".category");

let currentCategory = "Milk Tea";
let selectedDrink = null;
let cart = [];

function showScreen(name) {
  Object.keys(screens).forEach(key => {
    screens[key].style.display = key === name ? "flex" : "none";
  });
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.total * item.qty, 0);
}

function updateCartBar() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cartCount").textContent = "Cart (" + count + ")";
  document.getElementById("cartBarTotal").textContent = "$" + cartTotal().toFixed(2);
}

function showCategory(category) {
  currentCategory = category;
  document.getElementById("categoryHeading").textContent = category;
  drinkGrid.innerHTML = "";

  categoryButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.category === category);
  });

  menuItems
    .filter(item => item.category === category)
    .forEach(item => {
      const drink = document.createElement("button");
      drink.className = "item";
      drink.innerHTML = `<strong>${item.name}</strong><span>$${item.price.toFixed(2)}</span>`;
      drink.addEventListener("click", () => showAddOns(item));
      drinkGrid.appendChild(drink);
    });

  updateCartBar();
  showScreen("menu");
}

function showAddOns(item) {
  selectedDrink = item;
  document.getElementById("drinkName").textContent = item.name;
  document.getElementById("basePrice").textContent = "Base Price: $" + item.price.toFixed(2);
  addonList.innerHTML = "";

  let available = addOns;
  if (item.id >= 25) {
    available = [];
  } else if (item.id === 20) {
    available = addOns.filter(addOn => addOn.name !== "Grass Jelly");
  }

  if (available.length === 0) {
    addonList.innerHTML = "<p>No optional add-ons for this drink.</p>";
  }

  available.forEach(addOn => {
    const label = document.createElement("label");
    label.className = "addon-option";
    label.innerHTML = `
      <input type="checkbox" value="${addOn.id}">
      <span>${addOn.name}</span>
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
  document.getElementById("customTotal").textContent = "Total: $" + total.toFixed(2);
}

function showCart() {
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = "<p>Your cart is empty.</p>";
  }

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <small>${item.addOns.length ? item.addOns.join(", ") : "No add-ons"}</small>
      </div>
      <div class="qty">
        <button class="qty-button minus">-</button>
        <span>${item.qty}</span>
        <button class="qty-button plus">+</button>
      </div>
      <span>$${(item.total * item.qty).toFixed(2)}</span>
      <button class="remove">Remove</button>
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

  document.getElementById("cartTotal").textContent = "Total: $" + cartTotal().toFixed(2);
  updateCartBar();
  showScreen("cart");
}

categoryButtons.forEach(button => {
  button.addEventListener("click", () => showCategory(button.dataset.category));
});

document.getElementById("addToCart").addEventListener("click", () => {
  const selected = getSelectedAddOns();
  cart.push({
    name: selectedDrink.name,
    addOns: selected.map(addOn => addOn.name),
    qty: 1,
    total: selected.reduce((sum, addOn) => sum + addOn.price, selectedDrink.price)
  });
  showCart();
});

document.getElementById("addonBack").addEventListener("click", () => showCategory(currentCategory));
document.getElementById("keepShopping").addEventListener("click", () => showCategory(currentCategory));
document.getElementById("cartLink").addEventListener("click", showCart);

showCategory(currentCategory);


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
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly cloudy / cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Current conditions";
}

function recommendationIds(weather) {
  if (!weather) return [1, 4, 12];
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
  if (weather) {
    const message = weather.apparent_temperature >= 80
      ? "Cool off with a fruity favorite."
      : weather.apparent_temperature < 60
        ? "Enjoy a rich milk tea today."
        : "Find your next favorite boba.";
    status.textContent = "College Station · " +
      Math.round(weather.temperature_2m) + "°F · Feels like " +
      Math.round(weather.apparent_temperature) + "°F · " +
      weatherDescription(weather.weather_code) + ". " + message;
  } else {
    status.textContent = "Weather unavailable — try one of these favorites.";
  }
  picks.replaceChildren();
  recommendationIds(weather).forEach(id => {
    const item = menuItems.find(drink => drink.id === id);
    if (!item) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const price = document.createElement("span");
    price.textContent = "$" + item.price.toFixed(2);
    button.append(name, price);
    button.addEventListener("click", () => showAddOns(item));
    picks.appendChild(button);
  });
}

async function initializeWeather() {
  // Keep picks usable while the request runs.
  renderWeatherRecommendations(null);
  document.getElementById("weatherStatus").textContent =
    "Checking College Station weather…";
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

// Fetch once per page load; keep recommendations stable while a customer orders.
initializeWeather();
