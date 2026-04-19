..6858# APMS Frontend - Project Documentation

## 📋 Project Overview
**Academic Project Monitoring System (APMS)** - A React + TypeScript frontend with Vite, Tailwind CSS, and theme switching capabilities.

--- 

## 🏗️ Project Structure

```
src/
├── pages/
│   └── Login.tsx              # Main login page with theme toggle
├── context/
│   ├── AuthContext.tsx        # Authentication state management
│   └── ThemeContext.tsx       # Theme (light/dark) state management
├── ui/
│   └── ThemeToggle.tsx        # Reusable theme toggle button component
├── utils/
│   └── api.ts                 # API utility functions
├── assets/                    # Static assets
├── App.tsx                    # Main app component with routing
├── App.css                    # App-level styles (empty, using Tailwind)
├── main.tsx                   # App entry point with providers
├── tailwind.css               # Tailwind directives + base styles
└── index.css                  # Global styles (empty, using Tailwind)
```

---

## 🎨 Theming System

### How It Works
- **Theme Storage**: Persisted in `localStorage` as `"theme"` key
- **Default Behavior**: Follows OS preference (`prefers-color-scheme`) on first load
- **DOM Implementation**: Adds/removes `dark` class on `<html>` element
- **CSS Framework**: Tailwind CSS with `darkMode: 'class'` configuration

### Usage in Components
```tsx
// Use in any component:
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Light: white background | Dark: slate-900 background */}
    </div>
  );
};
```

### Tailwind Dark Mode Classes
All UI elements use standard Tailwind `dark:` prefix for dark mode variants:
```tsx
<button className="bg-white hover:bg-slate-100 dark:bg-blue-600 dark:hover:bg-blue-500">
  Submit
</button>
```

---

## 🔑 Key Components

### 1. **ThemeToggle** (`src/ui/ThemeToggle.tsx`)
- **Purpose**: Neumorphic pill-style toggle button for theme switching
- **Features**:
  - Shows "LIGHT" or "DARK" text
  - Smooth knob animation on toggle
  - Accessible with ARIA labels
  - Compact size (h-10 w-24)
- **Usage**:
  ```tsx
  import ThemeToggle from '../ui/ThemeToggle';
  
  export const NavBar = () => <ThemeToggle />;
  ```

### 2. **ThemeContext** (`src/context/ThemeContext.tsx`)
- **Purpose**: Global theme state management using React Context API
- **Exports**:
  - `ThemeProvider`: Wrap your app with this
  - `useTheme()`: Hook to access theme state and methods
- **Methods**:
  - `theme`: Current theme ("light" | "dark")
  - `toggleTheme()`: Switch between light and dark
  - `setTheme(theme)`: Set specific theme

### 3. **Login Page** (`src/pages/Login.tsx`)
- **Layout**: 
  - Navbar with logo, theme toggle, and "Request Access" button
  - Centered card with email/password form (visual only)
  - Google OAuth integration
  - Footer with legal links
- **Theme Support**: All elements adapt to light/dark mode

---

## 🎯 Alignment & Spacing Standards

### Navbar
- **Padding**: `px-8 py-6` (32px horizontal, 24px vertical)
- **Gap**: `gap-4` between elements on right side
- **Logo Gap**: `gap-2` between icon and text

### Card (Main Form)
- **Width**: Max `420px` (responsive at `max-w-[420px]`)
- **Padding**: `p-8 sm:p-10` (32px base, 40px on tablets+)
- **Content Spacing**: `space-y-5` between form groups (20px)
- **Label Spacing**: `space-y-1.5` (6px between label and input)

### Buttons
- **Primary (Sign In)**: 
  - Padding: `py-3` (12px vertical)
  - Margin top: `mt-6` (24px spacing from password field)
  - Width: `w-full` (100% of container)

- **Secondary (Request Access)**:
  - Padding: `px-5 py-2.5`
  - No full width

### Divider
- **Vertical Spacing**: `py-4` (16px top/bottom)
- **Border Color**: 
  - Light: `border-slate-300`
  - Dark: `border-slate-700`

### Footer
- **Padding**: `py-6` (24px vertical)
- **Border**: `border-t` (top border for separation)

---

## 🎨 Color Palette

### Light Mode
| Element | Color | Tailwind Class |
|---------|-------|-----------------|
| Background | White | `bg-white` |
| Text | Slate 900 | `text-slate-900` |
| Inputs | Slate 50 | `bg-slate-50` |
| Borders | Slate 200 | `border-slate-200` |
| Labels | Slate 600 | `text-slate-600` |

### Dark Mode (with `dark:` prefix)
| Element | Color | Tailwind Class |
|---------|-------|-----------------|
| Background | `#0B0F19` | `dark:bg-[#0B0F19]` |
| Card | `#111625` | `dark:bg-[#111625]` |
| Text | White | `dark:text-white` |
| Inputs | `#0B0F19` | `dark:bg-[#0B0F19]` |
| Borders | Slate 700 | `dark:border-slate-700` |
| Labels | Slate 300 | `dark:text-slate-300` |

---

## ⚙️ Configuration

### Tailwind (`tailwind.config.js`)
```javascript
{
  darkMode: 'class',  // ← Enables class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: []
}
```

### PostCSS (`postcss.config.js`)
```javascript
{
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

---

## 🚀 Development Workflow

### Start Dev Server
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Run Linter
```bash
npm run lint
```

---

## 🔐 Authentication

- **Provider**: Google OAuth via `@react-oauth/google`
- **Context**: `AuthContext.tsx` manages login state
- **Protected Routes**: `ProtectedRoute` component in `App.tsx`
- **Env Variable**: `VITE_GOOGLE_CLIENT_ID` (set in `.env.local`)

---

## 📦 Dependencies

### Core
- React 19.2.0
- React Router v7
- TypeScript 5.9.3
- Vite 7.2.4

### UI & Styling
- Tailwind CSS 3.4.1
- Lucide React 0.563.0 (icons)
- PostCSS 8.5.6
- Autoprefixer 10.4.23

### Auth
- @react-oauth/google 0.13.4
- jwt-decode 4.0.0

### HTTP
- axios 1.13.4

---

## 📝 Recent Fixes

### ✅ Completed
1. **Dark/Light Theme Implementation**
   - ThemeContext with localStorage persistence
   - ThemeToggle component with smooth animation
   - All UI elements responsive to theme

2. **Alignment Fixes**
   - Removed debug badge from navbar
   - Improved spacing consistency
   - Fixed button alignment and margins
   - Better divider contrast

3. **Styling Improvements**
   - Loading spinner now respects theme
   - Better hover states on buttons
   - Consistent color usage across light/dark modes

---

## 🎯 Best Practices Applied

1. **Accessibility**
   - ARIA labels on buttons (`aria-label`, `aria-pressed`)
   - Semantic HTML structure
   - Focus states on interactive elements

2. **Responsive Design**
   - Mobile-first approach
   - Responsive padding: `p-8 sm:p-10`
   - Flexible width with max-width constraints

3. **Performance**
   - CSS-in-JS via Tailwind (no runtime overhead)
   - Theme stored in localStorage (no API calls)
   - Optimized transitions with `duration-300`

4. **Code Quality**
   - TypeScript for type safety
   - Reusable context hooks
   - Clean component structure
   - Proper error boundaries

---

## 🔗 Related Files

- **Configuration**: `tailwind.config.js`, `postcss.config.js`, `vite.config.ts`
- **Styling Entry**: `src/tailwind.css`
- **App Entry**: `src/main.tsx`

---

## ❓ Common Tasks

### Add a New Page with Theme Support
```tsx
import { useTheme } from '../context/ThemeContext';

export const MyPage = () => {
  const { theme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Your page content */}
    </div>
  );
};
```

### Create a New Reusable Component
Place in `src/ui/` and import theme utilities if needed:
```tsx
// src/ui/MyButton.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
}

export const MyButton: React.FC<Props> = ({ children, onClick }) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
  >
    {children}
  </button>
);
```

---

**Last Updated**: January 29, 2026  
**Maintainer**: Frontend Team  
**Status**: ✅ Production Ready
