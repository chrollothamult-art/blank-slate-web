# ThouArt - Feature Roadmap & Bug Fixes

## 🚀 Suggested Feature Additions

### High Priority
- [ ] **User Dashboard** - Personal dashboard showing reading progress, achievements, and activity summary
- [ ] **Book Reading Tracker** - Track pages read per session with time-based analytics
- [x] **Push Notifications** - Real-time browser push notifications via Service Worker (PWA)
- [x] **Advanced Search** - Full-text search across books, almanac entries, and community content
- [x] **Offline Mode** - PWA support with service worker caching for offline access

### Community Features
- [x] **@Mentions in Replies** - Tag users in forum and submission replies
- [x] **Reply Editing/Deleting** - Edit and delete your own replies
- [ ] **Direct Messaging** - Private messaging between users
- [ ] **User Badges Display** - Show earned badges on user profiles and submissions
- [ ] **Community Challenges** - Weekly/monthly reading or art challenges
- [ ] **Submission Collections** - Allow users to create curated collections of submissions
- [x] **Polls in Discussions** - Add polling feature to forum discussions
- [ ] **User Reputation Levels** - Visual rank progression based on activity

### Almanac & Lore
- [ ] **Interactive World Map** - Clickable map showing kingdoms, locations, and character origins
- [ ] **Timeline Filtering** - Filter chronology by era, character, or event type
- [ ] **Character Comparison** - Side-by-side character stat comparison
- [ ] **Lore Quiz Mode** - Interactive quizzes about the ThouArt universe
- [ ] **Audio Narration** - Text-to-speech for almanac articles

### Reading Experience
- [ ] **Reading Themes** - Sepia, dark, and custom color themes for e-reader
- [x] **Highlight & Notes** - Save highlights and notes while reading
- [ ] **Reading Goals** - Set and track daily/weekly reading goals
- [x] **Book Clubs** - Create and join book discussion groups
- [ ] **Annotation Sharing** - Share highlighted passages with the community

### Admin Features
- [ ] **Bulk Content Import** - CSV/JSON import for almanac entries
- [ ] **Analytics Dashboard** - Detailed user engagement and content metrics
- [ ] **Content Scheduling** - Schedule almanac entries and announcements
- [ ] **A/B Testing** - Test different layouts and features
- [ ] **Moderation Queue** - Enhanced moderation tools for submissions

### Technical Improvements
- [ ] **Image Optimization** - Implement lazy loading and WebP conversion
- [x] **Caching Strategy** - Service worker caching via PWA for faster loads
- [ ] **SEO Enhancements** - Dynamic meta tags and structured data
- [ ] **Performance Monitoring** - Add analytics for Core Web Vitals
- [ ] **Accessibility Audit** - Full WCAG 2.1 compliance review

---

## 🐛 Known Bugs & Fixes Needed

### Critical
- [ ] Fix intermittent bun install timeout during builds
- [ ] Ensure RLS policies are correctly applied to all tables

### UI/UX
- [ ] Dropdown menus occasionally transparent on certain pages
- [ ] Mobile navigation menu doesn't close on route change
- [ ] Image aspect ratios inconsistent in submission cards
- [ ] Dark mode color contrast issues on some badges

### Functionality
- [ ] Forum reply notifications not always triggering
- [ ] Bookmark labels not persisting after page refresh
- [ ] Reading progress sometimes resets when switching devices
- [ ] Search results pagination resets filter state

### Performance
- [ ] Large almanac pages slow to render with many images
- [x] Relationship map performance degrades with 50+ characters (fixed SVG rendering)
- [ ] Community page initial load could be faster

---

## ✅ Recently Completed

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
