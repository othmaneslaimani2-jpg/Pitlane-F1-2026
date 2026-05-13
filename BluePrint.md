# Project Blueprint: Pitlane 2026 (F1 Fan Companion)
**Project ID: Pitlane-2026-F1**

## 1. Project Vision & Context
Pitlane is a high-performance React application designed for the revolutionary 2026 F1 season. It serves as a data-rich, immersive companion for fans, featuring 24 races, 11 teams (including Cadillac), and sustainable 100% fuel technology. The design language is "Technical Drama" — aggressive, fast, and data-driven, utilizing GSAP for fluid, meaningful transitions.

## 2. Technical Stack
- **Framework:** React + React Router v7
- **Animations:** GSAP (ScrollTrigger, Flip, useGSAP)
- **Styling:** Tailwind CSS (consistent with Pitlane 2026 Design System)
- **Data:** JSON-based race/team/stats storage
- **AI Tooling:** Optimized for Cursor/Windsurf with `greensock/gsap-skills`

## 3. Information Architecture & Routing (React Router v7)
| Route | Page Name | Primary Logic & State |
| :--- | :--- | :--- |
| `/` | **Le Paddock** (Home) | `CountdownTimer` component; Real-time seconds decrement until next GP start. |
| `/calendrier` | **The Grid** (Calendar) | `filterState` (Continent, Weekend Type); `GSAP Flip` for card reordering. |
| `/calendrier/:raceId` | **Circuit Detail** | `useParams` hook; dynamic data fetching based on `raceId`. |
| `/mongarage` | **My Garage** | `localStorage` or `Context` for bookmarks; smooth removal animations. |
| `/masaison` | **My Track Log** | User-specific "Watched" history; chronologically sorted timeline. |

## 4. Design Foundations (from Pitlane Design System)
- **Primary Color:** `#e10600` (F1 Racing Red)
- **Background:** `#131313` (Carbon Fiber / Deep Matte)
- **Typography:** Titillium Web (Primary), Technical Mono for telemetry data.
- **Visual Style:** Glassmorphism, aggressive border-radius (`ROUND_FULL` for buttons), and high-contrast labels.

## 5. Animation Specification (GSAP)
### Global Patterns
- **Page Transitions:** Fade-in with a slight "shutter" slide up for new routes.
- **Hover States:** Scale 1.05 with a glowing red box-shadow pulse (`shadow.1`).

### Component-Specific
- **Home Countdown:** Numbers should "flip" or roll like a mechanical leaderboard on change.
- **Calendar Filters:** Use `GSAP Flip` to transition cards between grid positions when filtering continents.
- **Timeline:** Nodes in `/masaison` should glow sequentially as the user scrolls (`ScrollTrigger`).

## 6. Implementation Prompt for AI Agents
**System Prompt:** "You are an expert React/GSAP developer. Build the 'Pitlane' F1 2026 app. Use React Router v7 and the official `useGSAP` hook. Follow the Pitlane Design System: Surface #131313, Accent #e10600. Install GSAP skills via `npx skills add https://github.com/greensock/gsap-skills`."

**Page Prompt (Home):** "Generate the Home component ('Le Paddock'). Include a dramatic hero section with a countdown timer to the Australian GP (March 6, 2026). Use a large-scale font for the timer. Add a 'Featured Race' card at the bottom. Animate the entrance of all elements using GSAP stagger."

**Page Prompt (Calendar):** "Create the Calendar page. Implement a filter bar for Continents and Weekend Types. Use the provided JSON schema for 24 races. When filters are applied, use GSAP Flip to animate the layout change of the GP cards."

## 7. Project Identifier
- **Stitch Project ID:** Pitlane-2026-F1
