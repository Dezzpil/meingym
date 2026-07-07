# Shared Components

<cite>
**Referenced Files**
- [src/components/Layout.tsx](file://src/components/Layout.tsx)
- [src/components/AuthProvider.tsx](file://src/components/AuthProvider.tsx)
- [src/components/BootstrapJS.tsx](file://src/components/BootstrapJS.tsx)
- [src/components/Loader.tsx](file://src/components/Loader.tsx)
- [src/components/approaches/](file://src/components/approaches/)
- [src/components/recharts/](file://src/components/recharts/)
</cite>

## Introduction

The `src/components/` directory contains reusable UI components shared across multiple pages. These range from the root layout wrapper and authentication provider to feature-specific components like approach management and chart customizations.

## Component Inventory

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| Layout | `Layout.tsx` | Client | Root layout with navbar, session guard, navigation links |
| AuthProvider | `AuthProvider.tsx` | Client | NextAuth.js `SessionProvider` wrapper |
| BootstrapJS | `BootstrapJS.tsx` | Client | Lazy-loads Bootstrap JS bundle |
| Loader | `Loader.tsx` | Client | Reusable spinner/loading indicator |
| NumberDiffViz | `NumberDiffViz.tsx` | Client | Visualizes numeric differences with color coding |
| PurposeText | `PurposeText.tsx` | Client | Renders purpose (MASS/STRENGTH/LOSS) with styling |
| SetsStats | `SetsStats.tsx` | Client | Displays aggregated set statistics |
| NameOfTheDay | `NameOfTheDay.tsx` | Client | Date-based name display |
| TrainingsPicker | `TrainingsPicker.tsx` | Client | Training selection with date picker |
| Managment | `approaches/Managment.tsx` | Client | Approach group editing and management |
| ManagmentElement | `approaches/ManagmentElement.tsx` | Client | Individual approach row editor |
| CustomizedAxisTick | `recharts/CustomizedAxisTick.tsx` | Client | Custom Recharts axis tick rendering |

## Core Components

### Layout

The `Layout` component wraps all authenticated pages. It provides:

- **Navigation bar** with links to Trainings, Exercises (Упражнения), Equipment (Оборудование), Muscle Groups (Группы), and Muscles (Мышцы)
- **Session guard** — shows a login prompt for unauthenticated users, a spinner while loading, and renders children only when authenticated
- **Version badge** linking to the CHANGELOG
- **User name** link to `/profile`

```typescript
// Layout checks session.status and conditionally renders:
// - "loading" → spinner
// - "authenticated" → children
// - "unauthenticated" → login prompt
```

**Sources**: [src/components/Layout.tsx:1-81](file://src/components/Layout.tsx#L1-L81)

### AuthProvider

A thin client wrapper around NextAuth.js `SessionProvider`. Placed in the root layout (`src/app/layout.tsx`) to make session data available to all client components via `useSession()`.

**Sources**: [src/components/AuthProvider.tsx:1-12](file://src/components/AuthProvider.tsx#L1-L12)

### BootstrapJS

Dynamically imports Bootstrap's JavaScript bundle on the client side. This is loaded in the root layout after the `<body>` tag to enable Bootstrap interactive components (modals, dropdowns, tooltips).

**Sources**: [src/components/BootstrapJS.tsx](file://src/components/BootstrapJS.tsx)

## Feature Components

### Approaches Management

The `approaches/Managment.tsx` and `ManagmentElement.tsx` components provide an interactive editor for approach groups (planned sets). Used in training execution and exercise state management to add, remove, and reorder sets with weight/count inputs.

**Sources**: [src/components/approaches/Managment.tsx](file://src/components/approaches/Managment.tsx)

### Recharts Customization

`recharts/CustomizedAxisTick.tsx` provides custom axis tick rendering for Recharts charts, used in training history and score visualization pages.

**Sources**: [src/components/recharts/CustomizedAxisTick.tsx](file://src/components/recharts/CustomizedAxisTick.tsx)

## Conclusion

Shared components are minimal and focused. The Layout component acts as both a navigation shell and authentication gate. Feature-specific components (approaches, charts) are kept in `src/components/` when used across multiple pages, while page-specific components live in their respective `src/app/<feature>/components/` directories.
