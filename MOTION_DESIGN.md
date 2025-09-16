# Indcric Motion Design System
**Version:** v1.0
**Owner:** Indcric Design & Engineering
**Last Updated:** September 16, 2024

This document outlines the core principles and standard values for animations to ensure a cohesive, fluid, and intuitive user experience across the Indcric app.

---

## 1. Core Principles

-   **Clarity over Complexity:** Animation should guide the user's attention and provide clear feedback, not distract or confuse.
-   **Responsiveness:** UI elements should react immediately to user input (`whileTap`), even if the resulting content animation takes longer.
-   **Consistency:** Similar interactions should produce similar animations, creating a predictable and learnable interface.
-   **Polish & Performance:** Animations should feel smooth and natural, avoiding abrupt transitions. They must be performant, primarily using hardware-accelerated properties like `opacity`, `transform: scale`, and `transform: translate`.

---

## 2. Standard Timings & Easing

| Duration | Value | Usage                                                                                             |
| :------- | :---- | :------------------------------------------------------------------------------------------------ |
| **Fast** | 0.2s  | Micro-interactions on direct input (e.g., switch toggles, button feedback).                       |
| **Medium** | 0.3s  | **Default.** Content transitions, tab switches, dialog reveals. Noticeable but not sluggish.      |
| **Slow** | 0.5s+ | Large-scale page transitions or significant layout shifts where the user needs time to re-orient. |

| Easing Type         | Value                                  | Usage                                                                                        |
| :------------------ | :------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Standard Easing** | `[0.4, 0, 0.2, 1]`                     | **Default.** The primary `ease-in-out` curve for all UI transitions.                           |
| **Bouncy Easing**   | `type: "spring", stiffness: 500, damping: 30` | **Sparingly.** For confirming a significant, positive user action (e.g., successful submission). |

---

## 3. Common Animation Patterns

### a. Content Reveal (Fade & Slide Up)

Used for loading pages, switching tabs, or bringing new content into view.

-   **Enter Animation:** The content gracefully appears and settles into place, guiding the eye without being jarring.
-   **Exit Animation:** The content mirrors the entrance by fading and sliding out in the opposite direction.

```jsx
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

<AnimatePresence mode="wait">
  <motion.div
    key={contentKey} // A unique key to trigger the animation
    initial={{ opacity: 0, y: 10 }}
    variants={variants}
    animate="enter"
    exit="exit"
  >
    {/* ... content ... */}
  </motion.div>
</AnimatePresence>
```

### b. Attention-Drawing Pulse (Breathing Effect)

Used for persistent state indicators that need to be noticeable but not annoying (e.g., the "Standard" quiz badge).

-   **Rationale:** The `reverse` repeat type creates a smooth "breathing" effect. The slow duration keeps it from being distracting.

```jsx
<motion.div
  animate={{
    scale: [1, 1.05, 1],
    opacity: [1, 0.7, 1],
  }}
  transition={{
    duration: 2,
    ease: [0.4, 0, 0.2, 1],
    repeat: Infinity,
    repeatType: "reverse",
  }}
>
  {/* ... Badge or Icon ... */}
</motion.div>
```

### c. Feedback Pop (Button & Interaction)

Used for providing immediate, tactile feedback on user taps.

-   **Rationale:** Gives a physical feel to interactive elements, confirming to the user that their input was registered.

```jsx
<motion.div
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.98 }}
>
  <Button>Click Me</Button>
</motion.div>
```

---

## 4. Hierarchy & Staggering

### a. Z-Axis / Depth Guidance

Animations should reinforce the spatial model of the UI. Elements with higher elevation (like dialogs) should feel like they are coming "forward."

-   **Dialogs & Modals:** Should use a subtle scale and slide-in effect to create a sense of depth.

```jsx
// From radix-ui/dialog and tailwindcss-animate
// data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-[48%]
```

### b. List Staggering

When rendering a list of items, animate them sequentially to guide the user's eye down the list.

-   **Rule of Thumb:** Use a short delay (`staggerChildren`) between each item. 40-60ms is good for small, quick lists.

```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.content}
    </motion.li>
  ))}
</motion.ul>
```

---

## 5. Accessibility

### Reduced Motion

Always respect the user's OS-level preference for reduced motion. Bouncy or complex animations should be replaced with simple fades.

-   **Implementation:** Use the `useReducedMotion` hook from `framer-motion` or a CSS media query.

```jsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

const variants = {
  bouncy: { scale: [1, 1.1, 1], transition: { type: 'spring' } },
  simple: { opacity: [0, 1], transition: { duration: 0.3 } }
};

<motion.div animate={shouldReduceMotion ? "simple" : "bouncy"} variants={variants}>
  ...
</motion.div>
```

---

## 6. Do & Don’t

✅ **Do** keep animations between **0.2s – 0.5s** for responsiveness.  
✅ **Do** mirror exit transitions with their enter transitions.  
✅ **Do** use easing `[0.4, 0, 0.2, 1]` unless explicitly specified.  

❌ **Don’t** use bouncy easing for every interaction (reserve it for big, positive actions).  
❌ **Don’t** animate layout-affecting properties (like `width`, `height`) directly — use `transform` and `opacity`.  
❌ **Don’t** exceed 0.7s for standard UI animations unless it’s onboarding or a tutorial.  

---

## 7. Global Motion Tokens

| Token                  | Value                                         |
|------------------------|-----------------------------------------------|
| `DURATION_FAST`        | `0.2s`                                        |
| `DURATION_MEDIUM`      | `0.3s`                                        |
| `DURATION_SLOW`        | `0.5s+`                                       |
| `EASING_STANDARD`      | `[0.4, 0, 0.2, 1]`                            |
| `EASING_BOUNCY`        | `{ type: "spring", stiffness: 500, damping: 30 }` |

---

## 8. Code Helpers

A `motion.ts` helper file in `app/lib/` can expose reusable configs like `fadeInUp`, `pulse`, and `buttonTap`.  
Developers should import from here instead of rewriting transitions in every component.