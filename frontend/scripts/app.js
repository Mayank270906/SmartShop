document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:8080/';
  
    // Fetch all shops
    const fetchShops = async () => {
      const res = await fetch(`${API_BASE}shops`);
      const shops = await res.json();
      const shopList = document.getElementById('shop-list');
      const shopSelect = document.getElementById('item-shop');
  
      shopList.innerHTML = shops.map(shop => `
        <div>
          <h3>${shop.name}</h3>
          <p>Location: ${shop.location}</p>
          <p>Delivery Regions: ${shop.delivery_regions}</p>
        </div>
      `).join('');
  
      shopSelect.innerHTML = shops.map(shop => `
        <option value="${shop.id}">${shop.name}</option>
      `).join('');
    };
  
    // Fetch inventory
    const fetchInventory = async () => {
      const res = await fetch(`${API_BASE}items`);
      const items = await res.json();
      const inventoryList = document.getElementById('inventory-list');
  
      inventoryList.innerHTML = items.map(item => `
        <div>
          <h3>${item.name}</h3>
          <p>Price: $${item.price.toFixed(2)}</p>
          <p>Stock: ${item.stock}</p>
          <p>Shop ID: ${item.shop_id}</p>
        </div>
      `).join('');
    };
  
    // Fetch cart and calculate total
    const fetchCart = async () => {
        const res = await fetch(`${API_BASE}cart`);
        const cartItems = await res.json();
        const cartList = document.getElementById('cart-items');
    
        let totalCost = 0;
  
        cartList.innerHTML = cartItems.map(item => {
          totalCost += item.price * item.quantity;
          return `
            <div>
              <h4>${item.name}</h4>
              <p>Quantity: ${item.quantity}</p>
              <p>Total: $${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          `;
        }).join('');
  
        cartList.innerHTML += `
          <div>
            <h3>Total Cost: $${totalCost.toFixed(2)}</h3>
            <button id="checkout-btn">Checkout</button>
          </div>
        `;
  
        // Attach event listener to the checkout button
        document.getElementById('checkout-btn').addEventListener('click', async () => {
          await fetch(`${API_BASE}checkout`, { method: 'POST' });
          alert('Checkout complete!');
          fetchCart(); // Refresh cart after clearing it
        });
      };
  
  
    // Add shop
    document.getElementById('shop-form').addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('shop-name').value;
      const location = document.getElementById('shop-location').value;
      const delivery_regions = document.getElementById('shop-regions').value;
  
      await fetch(`${API_BASE}shops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location, delivery_regions }),
      });
  
      fetchShops();
    });
  
    // Add item
    document.getElementById('item-form').addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('item-name').value;
      const price = parseFloat(document.getElementById('item-price').value);
      const stock = parseInt(document.getElementById('item-stock').value, 10);
      const shop_id = parseInt(document.getElementById('item-shop').value, 10);
  
      await fetch(`${API_BASE}items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, stock, shop_id }),
      });
  
      fetchInventory();
    });
  
    // Search items
    document.getElementById('search-btn').addEventListener('click', async () => {
        const query = document.getElementById('search-bar').value;
        const res = await fetch(`${API_BASE}search?query=${query}`);
        const results = await res.json();
        const searchResults = document.getElementById('search-results');
      
        searchResults.innerHTML = results.map(result => `
          <div>
            <h3>${result.name}</h3>
            <p>Shop: ${result.shop_name}</p>
            <p>Price: $${result.price.toFixed(2)}</p>
            <p>Stock: ${result.stock}</p>
            <button onclick="addToCart(${result.id}, 1)">Add to Cart</button>
          </div>
        `).join('');
      });
      
      // Add to Cart Function
      async function addToCart(itemId, quantity) {
        await fetch(`${API_BASE}cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: itemId, quantity }),
        });
        alert('Item added to cart');
      }      
  
    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', async () => {
      await fetch(`${API_BASE}checkout`, { method: 'POST' });
      fetchCart();
    });
  
    // Initialize
    fetchShops();
    fetchInventory();
    fetchCart();
  });
  