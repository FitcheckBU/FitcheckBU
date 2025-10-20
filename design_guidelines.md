# FitcheckBU Seller Dashboard Design Guidelines

## Design Approach

**System**: Utility-focused dashboard combining Linear's clean data presentation with Notion's approachable interface patterns. Mobile-first design prioritizing quick inventory management and status monitoring.

**Key Principles**: Information clarity, thumb-friendly interactions, consistent visual hierarchy, efficient data scanning.

---

## Core Design Elements

### A. Color Palette

**Primary Colors:**
- Dark Teal: `#1B4D4D` (headers, navigation, primary headings)
- Cream Background: `#F5E6C8` (main background)
- White: `#FFFFFF` (card backgrounds)

**Status Colors:**
- Active Blue: `200 85% 55%` (border-l-4 on active listings)
- Sold/Flagged Red: `0 75% 60%` (border-l-4 on sold/flagged items)
- Warning Amber: `35 90% 60%` (pending/review states)
- Success Green: `150 70% 45%` (confirmed sales)

**Text Colors:**
- Primary Text: `#1B4D4D` (matching dark teal)
- Secondary Text: `#1B4D4D` at 70% opacity
- Muted Text: `#1B4D4D` at 50% opacity

### B. Typography

**Font Stack**: System fonts for performance
- Primary: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

**Scale:**
- Page Titles: text-2xl font-bold (mobile), text-3xl (tablet+)
- Section Headings: text-xl font-semibold
- Card Titles: text-base font-medium
- Body Text: text-sm
- Metadata: text-xs text-opacity-70

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Card padding: p-4
- Section gaps: space-y-6
- Component margins: mb-4, mt-6
- Icon spacing: gap-2

**Container:**
- Mobile: px-4 max-w-full
- Tablet+: max-w-3xl mx-auto px-6

---

## Component Library

### Navigation Bar
- Fixed top, dark teal (#1B4D4D) background
- Height: h-14
- Logo left, profile icon right
- Center: "Seller Dashboard" text-sm font-medium in cream
- Shadow: shadow-md for depth

### Section Headers (Signature Pattern)
- Centered text-xl font-bold in dark teal
- Flanking icons (left: category/filter icon, right: add/menu icon)
- Structure: `flex items-center justify-center gap-4`
- Icons: h-5 w-5, same teal color
- Bottom margin: mb-6

### Search Bar
- Prominent placement below header
- Background: white with shadow-sm
- Rounded: rounded-lg
- Padding: px-4 py-3
- Icon: search icon left side, text-gray-400
- Input: text-sm placeholder in muted teal

### Item Cards
- Background: white
- Rounded: rounded-xl
- Shadow: shadow-sm hover:shadow-md transition
- Status border: border-l-4 (blue/red/amber based on state)
- Layout: horizontal flex on mobile
- Image: w-20 h-20 rounded-lg object-cover
- Content padding: p-4
- Title: font-medium text-base
- Price: text-lg font-bold in dark teal
- Status badge: inline-block px-2 py-1 rounded-full text-xs
- Metadata row: flex justify-between items-center text-xs opacity-70

### Quick Stats Row
- Grid: grid-cols-3 gap-4
- Cards: white bg, rounded-lg, p-4, text-center
- Stat number: text-2xl font-bold in dark teal
- Stat label: text-xs opacity-70, mt-1

### Action Buttons
- Primary: bg-[#1B4D4D] text-cream rounded-lg px-6 py-3 font-medium
- Secondary: border-2 border-[#1B4D4D] text-[#1B4D4D] rounded-lg px-6 py-3
- Icon buttons: w-10 h-10 rounded-full flex items-center justify-center

### Filter Chips
- Horizontal scroll container: flex gap-2 overflow-x-auto pb-2
- Chips: px-4 py-2 rounded-full bg-white border-2
- Active: border-[#1B4D4D] bg-[#1B4D4D] text-cream
- Inactive: border-gray-200 text-[#1B4D4D]

### Empty States
- Centered icon + text
- Icon: h-16 w-16 in muted teal
- Message: text-base font-medium
- Sub-message: text-sm opacity-70

---

## Dashboard Sections

1. **Stats Overview** (below search): 3-column stat cards showing Active, Sold, Total
2. **Filter Row**: Horizontal scrollable chips (All, Active, Sold, Pending)
3. **Item Grid**: Vertical stack of item cards with 4px colored left borders
4. **Floating Action Button**: Fixed bottom-right, large circular teal button with + icon

---

## Interactions

- Card tap: Subtle scale(0.98) transform
- Search focus: shadow-md elevation
- No animations on page load
- Smooth transitions: transition-all duration-200
- Pull-to-refresh: Native mobile gesture

---

## Responsive Behavior

**Mobile (base)**: Single column, vertical stack
**Tablet (md:640px+)**: max-w-3xl container, 2-column stat grid
**Desktop (lg:1024px+)**: Maintain mobile-optimized width for familiarity