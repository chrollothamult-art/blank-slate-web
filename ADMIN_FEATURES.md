# Admin Features Documentation

## Overview

The admin panel has been completely upgraded with full database integration for managing books, orders, customers, and the Witness Almanac.

## Database Tables Created

### Book Management System

1. **books** - Main book inventory
   - Stores book details: title, author, category, description, cover image
   - Tracks stock levels, sales, and status (active/draft/discontinued)
   - Supports ISBN, publication dates, ratings

2. **book_versions** - Book format pricing
   - Manages different formats: ebook, paperback, hardcover
   - Individual pricing per format
   - Availability status per format

3. **customers** - Customer database
   - Linked to user authentication
   - Stores contact and shipping information

4. **orders** - Order management
   - Order tracking with unique order numbers
   - Status tracking: pending, processing, shipped, delivered, cancelled
   - Financial calculations (subtotal, tax, total)

5. **order_items** - Order line items
   - Links orders to books
   - Tracks quantity and pricing at time of purchase

### Witness Almanac System

Seven categories with full CRUD operations:

1. **almanac_kingdoms** - Kingdoms and nations
   - Founded dates, current status
   - Full articles with images

2. **almanac_relics** - Magical artifacts and items
   - Type classification (weapon, artifact, item)
   - Power level tracking

3. **almanac_races** - Races and peoples
   - Population and homeland information

4. **almanac_titles** - Ranks and positions
   - Authority and rank information

5. **almanac_locations** - Places and landmarks
   - Location type (city, region, landmark)
   - Kingdom associations

6. **almanac_magic** - Magical systems
   - Magic type and difficulty

7. **almanac_concepts** - World concepts and lore
   - Concept type classification

## Admin Features

### Book Management
Located in: Admin Panel → Book Management Tab

Features:
- Add new books with full details
- Upload cover images
- Set pricing for 3 formats (ebook, paperback, hardcover)
- Manage stock levels
- Track sales (display only)
- Edit existing books
- Delete books (cascades to versions)
- Real-time inventory status

### Witness Almanac Manager
Located in: Admin Panel → Almanac Tab

Features:
- Tabbed interface for all 7 categories
- Add entries with:
  - Name and auto-generated slug
  - Brief description (for cards)
  - Full article content
  - Image upload support
  - Category-specific fields
- Edit existing entries
- Delete entries
- Reorder entries via order_index

### Chronology Manager
Located in: Admin Panel → Chronology Tab

Features:
- Manage timeline events
- Add/edit/delete chronology entries
- Full article support for each event
- Era classification (BGD, GD, AGD)

## Public-Facing Features

### Almanac Category Pages
URL: `/almanac/{categoryId}`

Features:
- Grid display of all entries in a category
- Image thumbnails when available
- Click to view full article
- Inline article viewer with image
- Themed styling matching the chronology

### Chronology Integration
- Sidebar shows all almanac categories
- Click to navigate to category pages
- Seamless integration with existing timeline

## Image Upload System

All image uploads use Supabase Storage:
- Bucket: `images`
- Folders:
  - `books/` - Book cover images
  - `almanac/` - Almanac entry images
- Public URL generation for display

## Security (RLS Policies)

### Books & Orders
- Public: Can view active books and available versions
- Authenticated Users: Can view own orders and purchases
- Admins: Full CRUD access to all data

### Almanac
- Public: Can view all almanac entries
- Admins: Full CRUD access to manage entries

## How to Use

### Adding a Book

1. Go to Admin Panel → Book Management
2. Click "Add Book"
3. Fill in required fields:
   - Title, Author, Category (required)
   - Description, ISBN, dates, etc. (optional)
4. Upload cover image (optional)
5. Set pricing for desired formats
6. Set initial stock level
7. Click "Add Book"

### Adding Almanac Entries

1. Go to Admin Panel → Almanac
2. Select the category tab (Kingdoms, Relics, etc.)
3. Click "Add Entry"
4. Fill in:
   - Name (slug auto-generated)
   - Description (brief, for cards)
   - Article (full content)
   - Category-specific fields
5. Upload image (optional but recommended)
6. Click "Add Entry"

### Viewing Almanac Content

1. Go to Chronology page
2. Look at "Witness Almanac" sidebar
3. Click any category
4. Browse entries in grid
5. Click an entry to read full article

## Database Migration Files

All tables are created via Supabase migrations:
- `create_books_and_orders_tables.sql` - Book management system
- `create_witness_almanac_tables.sql` - Almanac system

## Next Steps

Consider implementing:
- Order processing workflow
- Customer management tools
- Sales analytics dashboard
- Bulk import for books/almanac
- Image optimization
- Search functionality
