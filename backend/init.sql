-- Shops Table
CREATE TABLE shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  delivery_regions TEXT
);

-- Items Table
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL,
  shop_id INTEGER NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- Cart Table
CREATE TABLE cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
