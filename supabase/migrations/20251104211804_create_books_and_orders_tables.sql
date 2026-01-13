/*
  # Books, Orders, and Customers Management System

  ## New Tables
  
  ### books
  - `id` (uuid, primary key)
  - `title` (text)
  - `author` (text)
  - `category` (text)
  - `description` (text)
  - `cover_image_url` (text, nullable)
  - `isbn` (text, nullable)
  - `published_date` (date, nullable)
  - `pages` (integer, nullable)
  - `language` (text, default 'English')
  - `rating` (decimal, nullable)
  - `status` (text, one of: active, draft, discontinued)
  - `stock` (integer, default 0)
  - `sales` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### book_versions
  - `id` (uuid, primary key)
  - `book_id` (uuid, foreign key to books)
  - `version_type` (text, one of: ebook, paperback, hardcover)
  - `price` (decimal)
  - `available` (boolean, default true)
  - `created_at` (timestamptz)

  ### customers
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users, nullable)
  - `email` (text)
  - `full_name` (text)
  - `phone` (text, nullable)
  - `address` (text, nullable)
  - `city` (text, nullable)
  - `country` (text, nullable)
  - `postal_code` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### orders
  - `id` (uuid, primary key)
  - `customer_id` (uuid, foreign key to customers)
  - `order_number` (text, unique)
  - `status` (text, one of: pending, processing, shipped, delivered, cancelled)
  - `subtotal` (decimal)
  - `tax` (decimal)
  - `total` (decimal)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### order_items
  - `id` (uuid, primary key)
  - `order_id` (uuid, foreign key to orders)
  - `book_id` (uuid, foreign key to books)
  - `version_type` (text)
  - `quantity` (integer)
  - `price` (decimal)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users and admins
*/

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  category text NOT NULL,
  description text,
  cover_image_url text,
  isbn text,
  published_date date,
  pages integer,
  language text DEFAULT 'English',
  rating decimal(3,2),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'discontinued')),
  stock integer DEFAULT 0,
  sales integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active books"
  ON books FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage all books"
  ON books FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Book versions table
CREATE TABLE IF NOT EXISTS book_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  version_type text NOT NULL CHECK (version_type IN ('ebook', 'paperback', 'hardcover')),
  price decimal(10,2) NOT NULL,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE book_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available book versions"
  ON book_versions FOR SELECT
  USING (available = true);

CREATE POLICY "Admins can manage book versions"
  ON book_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  address text,
  city text,
  country text,
  postal_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customer data"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal decimal(10,2) NOT NULL,
  tax decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  version_type text NOT NULL CHECK (version_type IN ('ebook', 'paperback', 'hardcover')),
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN customers ON customers.id = orders.customer_id
      WHERE orders.id = order_items.order_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_book_versions_book_id ON book_versions(book_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);