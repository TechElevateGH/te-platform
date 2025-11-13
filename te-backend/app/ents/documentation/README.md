# TechElevate Documentation Module

## Overview

This module serves comprehensive platform documentation with a modern, React-inspired design featuring a sidebar navigation, dark/light theme toggle, and smooth scrolling.

## Features

### 🎨 Design
- **React documentation-style aesthetic** with clean, minimal interface
- **Sticky sidebar navigation** for easy section access
- **Responsive mobile design** with collapsible sidebar
- **Dark/light theme** with localStorage persistence
- **Smooth scroll** with active section highlighting
- **Progress bar** showing scroll position

### 📚 Content Coverage

The documentation covers:
1. **Platform Overview** - Mission, vision, user personas
2. **Architecture** - Technology stack, frontend/backend structure
3. **Database Design** - MongoDB collections and relationships
4. **File Storage** - Google Drive integration details
5. **Features** - Authentication, resumes, applications, referrals, companies, learning
6. **API Reference** - Complete endpoint documentation with examples
7. **Development** - Setup instructions, coding guidelines, testing
8. **Deployment** - Production deployment guides
9. **Operations** - Monitoring, security, troubleshooting

### 🔧 Technical Details

- **Single HTML file**: `content.html` with embedded CSS and JavaScript
- **No external dependencies**: All styles and scripts inline
- **Lighthouse scores**: Optimized for performance
- **Accessibility**: Semantic HTML and ARIA labels

## File Structure

```
documentation/
├── __init__.py
├── endpoints.py       # FastAPI router
├── content.html       # Main documentation HTML
├── content-backup.html # Previous version backup
└── README.md          # This file
```

## API Endpoint

```
GET /v1/documentation
```

Returns the documentation as a standalone HTML page that can be:
- Viewed directly in browser at `http://localhost:8000/v1/documentation`
- Embedded in React via iframe at `/documentation` route
- Downloaded for offline viewing

## Accessing Documentation

### From React Frontend
Navigate to `/documentation` in the app, or click "Docs" in the navbar.

### Direct Access
Visit `http://localhost:8000/v1/documentation` in your browser.

### Interactive API Docs
For API-specific documentation, visit:
- Swagger UI: `http://localhost:8000/v1/docs`
- ReDoc: `http://localhost:8000/v1/redoc`

## Updating Documentation

### Content Updates
1. Edit `content.html` with your changes
2. Keep the existing HTML structure and CSS classes
3. Test locally before committing
4. Content is automatically served - no build step needed

### Adding New Sections
1. Add section to HTML:
```html
<section id="new-section">
  <h2>New Section</h2>
  <p>Content here...</p>
</section>
```

2. Add sidebar link:
```html
<a href="#new-section">New Section</a>
```

3. JavaScript will automatically handle smooth scroll and highlighting

### Styling Changes
Modify the `<style>` block in `content.html`. Key CSS variables:
- `--bg`: Background color
- `--surface`: Card/surface background
- `--text`: Primary text color
- `--accent`: Brand accent color (cyan/teal)
- `--border`: Border color

## Design System

### Colors (Dark Mode)
- Background: `#23272f`
- Surface: `#2d333b`
- Text: `#ebecf0`
- Accent: `#087ea4` (React cyan)

### Colors (Light Mode)
- Background: `#fff`
- Surface: `#f6f7f9`
- Text: `#23272f`
- Accent: `#087ea4`

### Typography
- Font: System fonts (-apple-system, Segoe UI, etc.)
- Base size: 17px
- Line height: 1.7
- Headings: Bold, larger sizes with consistent hierarchy

### Components
- **Cards**: Grid layout with hover effects
- **Tables**: Rounded borders, hover highlighting
- **Code blocks**: Syntax highlighting with dark background
- **Notes**: Colored left border with background tint
- **Buttons**: Rounded, with shadow and hover animations

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Page size**: ~50KB (HTML + CSS + JS combined)
- **Load time**: <100ms (local) / <500ms (production)
- **No external requests**: Everything embedded
- **Smooth scrolling**: 60fps with passive event listeners

## Maintenance

### Regular Updates
- Update API examples when endpoints change
- Add new features as they're developed
- Keep deployment instructions current
- Update troubleshooting based on common issues

### Version History
- **v1.0** (Nov 2025): Initial comprehensive documentation with sidebar
- Previous: Simple documentation without sidebar navigation

## Contributing

When updating documentation:
1. Test in both dark and light modes
2. Verify responsive design on mobile
3. Check all links work correctly
4. Ensure code examples are accurate
5. Update this README if structure changes

## Questions?

Contact the TechElevate engineering team or open a GitHub issue.
