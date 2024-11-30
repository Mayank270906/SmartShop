require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(cors());

// Database Setup
const db = new sqlite3.Database('./smartshop.db', err => {
  if (err) console.error('Database error:', err.message);
  console.log('Connected to SQLite database.');
});

// Initialize Tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      delivery_regions TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      shop_id INTEGER NOT NULL,
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);
});

// Routes
// Fetch all shops
app.get('/shops', (req, res) => {
  db.all('SELECT * FROM shops', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new shop
app.post('/shops', (req, res) => {
  const { name, location, delivery_regions } = req.body;
  const query = `INSERT INTO shops (name, location, delivery_regions) VALUES (?, ?, ?)`;
  db.run(query, [name, location, delivery_regions], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Shop added', id: this.lastID });
  });
});

// Remove a shop and its items
app.delete('/shops/:id', (req, res) => {
  const shopId = req.params.id;
  const deleteItemsQuery = `DELETE FROM items WHERE shop_id = ?`;
  const deleteShopQuery = `DELETE FROM shops WHERE id = ?`;

  db.run(deleteItemsQuery, [shopId], err => {
    if (err) return res.status(500).json({ error: err.message });
    db.run(deleteShopQuery, [shopId], err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Shop and associated items deleted' });
    });
  });
});

// Update a shop
app.put('/shops/:id', (req, res) => {
  const shopId = req.params.id;
  const { name, location } = req.body;

  const query = `UPDATE shops SET name = ?, location = ? WHERE id = ?`;
  db.run(query, [name, location, shopId], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Shop updated successfully' });
  });
});

// Inserting new items in inventory
app.post('/items', (req, res) => {
  const { name, price, stock, shop_id } = req.body;
  const query = `INSERT INTO items (name, price, stock, shop_id) VALUES (?, ?, ?, ?)`;
  db.run(query, [name, price, stock, shop_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Item added', id: this.lastID });
  });
});


// Update an item in inventory
app.put('/items/:id', (req, res) => {
    const itemId = req.params.id;
    const { name, price, stock } = req.body;
    const query = `UPDATE items SET name = ?, price = ?, stock = ? WHERE id = ?`;
    db.run(query, [name, price, stock, itemId], err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item updated successfully.' });
    });
  });

// Fetch all items
app.get('/items', (req, res) => {
  db.all('SELECT * FROM items', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete an item from inventory
app.delete('/items/:id', (req, res) => {
    const itemId = req.params.id;
    const query = `DELETE FROM items WHERE id = ?`;
    db.run(query, [itemId], err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item deleted from inventory.' });
    });
  });

  

// Search items
app.get('/search', (req, res) => {
  const { query } = req.query;
  const sql = `SELECT items.*, shops.name AS shop_name FROM items 
               JOIN shops ON items.shop_id = shops.id 
               WHERE items.name LIKE ? OR shops.name LIKE ?`;
  const params = [`%${query}%`, `%${query}%`];
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add item to cart
app.post('/cart', (req, res) => {
  const { item_id, quantity } = req.body;
  const query = `INSERT INTO cart (item_id, quantity) VALUES (?, ?)`;
  db.run(query, [item_id, quantity], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Item added to cart', id: this.lastID });
  });
});

// Get cart items
// Get cart items with detailed information
app.get('/cart', (req, res) => {
    const sql = `
      SELECT 
        cart.id, 
        items.name AS item_name, 
        cart.quantity, 
        items.price, 
        (cart.quantity * items.price) AS total_price
      FROM cart
      JOIN items ON cart.item_id = items.id
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  

  app.delete('/cart/:id', (req, res) => {
    const cartId = req.params.id;
    const query = `DELETE FROM cart WHERE id = ?`;
    db.run(query, [cartId], err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item removed from cart' });
    });
  });  


// Checkout and reduce stock
app.post('/checkout', (req, res) => {
    const getCartQuery = `SELECT item_id, quantity FROM cart`;
    db.all(getCartQuery, [], (err, cartItems) => {
      if (err) return res.status(500).json({ error: err.message });
  
      // Reduce stock for each item in the cart
      const updateStockQuery = `UPDATE items SET stock = stock - ? WHERE id = ?`;
      const reduceStockTasks = cartItems.map(item =>
        new Promise((resolve, reject) => {
          db.run(updateStockQuery, [item.quantity, item.item_id], err => {
            if (err) reject(err);
            else resolve();
          });
        })
      );
  
      Promise.all(reduceStockTasks)
        .then(() => {
          // Clear the cart after successful stock reduction
          const clearCartQuery = `DELETE FROM cart`;
          db.run(clearCartQuery, [], err => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Checkout completed, stock updated.' });
          });
        })
        .catch(err => res.status(500).json({ error: err.message }));
    });
  });
  
  

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
