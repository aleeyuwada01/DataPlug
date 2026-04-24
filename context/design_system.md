# DataPlug Design System

## Core Aesthetic: "Premium Fintech"
The app uses a "Liquid Glass" aesthetic, combining vibrant gradients, subtle blurs, and high-contrast typography.

## Color Palette (from theme.ts)
- **Primary**: `#34A853` (Success Green).
- **Secondary**: Grays and Slate tones for text and muted elements.
- **Backgrounds**: 
    - Light: `#F0F4F8` / `#FFFFFF`.
    - Dark: `#0A0E14` / `#0F1520`.

## UI Tokens
- **Border Radius**: 
    - `lg`: 16px (Standard cards).
    - `xl`: 24px (Inputs/Containers).
    - `pill`: 999px (Buttons).
- **Spacing**: Consistent units based on an 8px grid (xs, sm, md, lg, xl, xxl).
- **Typography**: Uses a hierarchy from `hero` (40px) down to `small` (12px), defined in `constants/theme.ts`.

## Key Component Patterns
- **GlassCard**: Uses `blurView` (on supported platforms) or semi-transparent backgrounds with subtle borders to create depth.
- **Focus States**: Interactive elements (inputs) use a primary green ring and soft outer glow on focus.
- **Animations**:
    - `Animated.spring` for screen transitions.
    - Continuous pulsing `Animated.loop` for CTA buttons (e.g., "Start Exploring").
