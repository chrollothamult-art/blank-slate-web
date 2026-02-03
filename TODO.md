# ThouArt - Feature Roadmap & Bug Fixes

## 🚀 Suggested Feature Additions

### High Priority
- [x] **User Dashboard** - Personal dashboard showing reading progress, achievements, and activity summary
- [ ] **Book Reading Tracker** - Track pages read per session with time-based analytics
- [x] **Push Notifications** - Real-time browser push notifications via Service Worker (PWA)
- [x] **Advanced Search** - Full-text search across books, almanac entries, and community content
- [x] **Offline Mode** - PWA support with service worker caching for offline access

### Community Features
- [x] **@Mentions in Replies** - Tag users in forum and submission replies
- [x] **Reply Editing/Deleting** - Edit and delete your own replies
- [x] **Direct Messaging** - Private messaging between users
- [x] **Discussion Replies** - Fixed book club discussion replies functionality
- [ ] **User Badges Display** - Show earned badges on user profiles and submissions
- [ ] **Community Challenges** - Weekly/monthly reading or art challenges
- [ ] **Submission Collections** - Allow users to create curated collections of submissions
- [x] **Polls in Discussions** - Add polling feature to forum discussions
- [ ] **User Reputation Levels** - Visual rank progression based on activity
- [ ] **Trending Submissions** - Weekly/daily trending section based on engagement
- [ ] **Art Contests** - Time-limited community art competitions with voting
- [ ] **Submission Reactions** - Multiple reaction types beyond likes (love, wow, insightful)

### Almanac & Lore
- [x] **Interactive World Map** - Clickable map showing kingdoms, locations, and character origins
- [ ] **Timeline Filtering** - Filter chronology by era, character, or event type
- [x] **Character Comparison** - Side-by-side character stat comparison
- [ ] **Lore Quiz Mode** - Interactive quizzes about the ThouArt universe
- [ ] **Audio Narration** - Text-to-speech for almanac articles
- [ ] **Character Gallery View** - Grid view of all characters with quick filters
- [ ] **Faction/Affiliation Pages** - Dedicated pages for each faction showing members
- [ ] **Event Impact Visualization** - Show how events affected characters/locations

### Reading Experience
- [ ] **Reading Themes** - Sepia, dark, and custom color themes for e-reader
- [x] **Highlight & Notes** - Save highlights and notes while reading
- [ ] **Reading Goals** - Set and track daily/weekly reading goals
- [x] **Book Clubs** - Create and join book discussion groups
- [ ] **Annotation Sharing** - Share highlighted passages with the community
- [ ] **Read-Along Mode** - Synchronized reading sessions for book clubs
- [ ] **Chapter Progress Indicator** - Visual chapter-by-chapter progress bar
- [ ] **Reading Time Estimates** - Show estimated reading time per chapter

### E-Commerce & Books
- [ ] **Book Bundle Discounts** - Discount when purchasing multiple books together
- [ ] **Gift Cards** - Purchase and redeem gift cards for the store
- [ ] **Pre-Order System** - Allow pre-orders for upcoming books
- [ ] **Book Sample Downloads** - Free sample chapter downloads
- [ ] **Purchase Receipts via Email** - Email confirmation for orders
- [ ] **Order Tracking** - Track order status and shipping
- [ ] **Related Books Suggestions** - "Readers also bought" recommendations

### Admin Features
- [ ] **Bulk Content Import** - CSV/JSON import for almanac entries
- [x] **Analytics Dashboard** - Detailed user engagement and content metrics
- [x] **Content Scheduling** - Schedule almanac entries and announcements
- [ ] **A/B Testing** - Test different layouts and features
- [x] **Moderation Queue** - Enhanced moderation tools for submissions
- [ ] **User Management** - Admin tools for managing user accounts and roles
- [ ] **Sales Reports** - Detailed sales analytics with export options
- [ ] **Email Templates** - Customizable email templates for notifications

### Technical Improvements
- [ ] **Image Optimization** - Implement lazy loading and WebP conversion
- [x] **Caching Strategy** - Service worker caching via PWA for faster loads
- [ ] **SEO Enhancements** - Dynamic meta tags and structured data
- [ ] **Performance Monitoring** - Add analytics for Core Web Vitals
- [ ] **Accessibility Audit** - Full WCAG 2.1 compliance review
- [ ] **Rate Limiting** - Prevent spam and abuse on forms
- [ ] **Error Boundary Components** - Graceful error handling throughout app
- [ ] **Skeleton Loaders Everywhere** - Consistent loading states on all pages

---

## 🐛 Known Bugs & Fixes Needed

### Critical
- [ ] Fix intermittent bun install timeout during builds
- [ ] Ensure RLS policies are correctly applied to all tables
- [ ] Book versions showing "Unavailable" on homepage despite data existing

### UI/UX
- [ ] Dropdown menus occasionally transparent on certain pages
- [x] Mobile navigation menu doesn't close on route change
- [ ] Image aspect ratios inconsistent in submission cards
- [x] Dark mode color contrast issues on some badges
- [ ] Community page hero section has rendering issues (faded cards visible)
- [ ] Some submission card titles show placeholder text ("d", "eeeee", "cectctc")
- [ ] Book details page shows empty ISBN field
- [ ] Price display shows $22.00 but format options all say "Unavailable"
- [x] Missing "Forum" link in main navigation (only Books & Community visible)

### Functionality
- [ ] Forum reply notifications not always triggering
- [ ] Bookmark labels not persisting after page refresh
- [ ] Reading progress sometimes resets when switching devices
- [ ] Search results pagination resets filter state
- [ ] Community stats show "0 Members" even when users exist
- [ ] Missing review count sync with actual reviews

### Performance
- [ ] Large almanac pages slow to render with many images
- [x] Relationship map performance degrades with 50+ characters (fixed SVG rendering)
- [ ] Community page initial load could be faster
- [ ] Chronology page world map image is quite large

---

## ✅ Recently Completed

- [x] Breadcrumb navigation component for detail pages
- [x] Navigation progress bar during route transitions
- [x] Empty state component with illustrations
- [x] IconButton component with tooltip support
- [x] Gallery image manager for all almanac categories
- [x] Push notifications with Service Worker support
- [x] PWA configuration with offline caching
- [x] @Mentions in forum replies with user search
- [x] Reply editing and deleting functionality
- [x] Enhanced profile dropdown component
- [x] Fixed fan art submission links (404 error)
- [x] Fixed user preferences settings persistence
- [x] Modern UI overhaul with rounded corners and softer design
- [x] Page transition animations with framer-motion
- [x] Staggered list and grid animations
- [x] Dynamic force-directed relationship map (Obsidian-style)
- [x] Particle effects on relationship map
- [x] Card hover effects with scale and glow
- [x] Staggered skeleton loading states
- [x] Featured creations section fix
- [x] Almanac image rounded corners fix
- [x] Character stats database table for comparison feature
- [x] World locations database table for interactive map

---

## 🎯 QA Testing Notes (Jan 2026)

### Homepage
- ✓ Book display loads correctly with cover image
- ✓ "Explore the Realms" button works
- ⚠ Book format selector shows all formats as "Unavailable"
- ⚠ Review count appears randomized (not from DB)

### Books Page
- ✓ Filter sidebar works correctly
- ✓ Price range slider functional
- ✓ Category checkboxes work
- ✓ Sort dropdown works
- ⚠ Could use "View as Grid/List" toggle

### Community Page
- ✓ Gallery/Discussions/Book Clubs tabs work
- ✓ Submit Creation button visible
- ✓ Search and filter options present
- ⚠ Stats show 0 for Discussions, Reviews, Members
- ⚠ Some submission cards have placeholder content

### Chronology Page
- ✓ Beautiful world map header
- ✓ Timeline with eras displays correctly
- ✓ Almanac sidebar with category links
- ✓ Events show dates in BGD format
- ⚠ Could benefit from era filtering
- ⚠ Character links in events would be nice

### Suggested UX Improvements
- [x] Add breadcrumb navigation on detail pages
- [x] Add "Back to top" button on long pages
- [x] Add loading indicators on navigation
- [x] Add empty state illustrations (not just text)
- [x] Add keyboard shortcuts for power users
- [x] Add confirmation modals before destructive actions
- [x] Add tooltips on icon-only buttons

---

## 📋 Development Notes

### Design System
- Use HSL colors from CSS variables
- Maintain consistent 2xl border radius on cards
- Follow semantic token naming (primary, secondary, muted, accent)
- Keep animations subtle (0.2-0.4s duration, easeOut)

### Code Patterns
- Create focused components (< 200 lines ideal)
- Use custom hooks for data fetching
- Prefer parallel tool calls for efficiency
- Add staggered animations to lists/grids

### Testing Checklist
- [ ] Test on mobile viewport
- [ ] Verify dark mode appearance
- [ ] Check loading states
- [ ] Validate form submissions
- [ ] Test authenticated vs guest views
- [ ] Test with empty data states
- [ ] Test with slow network (3G throttle)
