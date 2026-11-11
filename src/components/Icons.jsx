// Small inline SVG icons. They use currentColor, so they take the text color.
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export const MenuIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const SearchIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5" />
  </svg>
);

export const BagIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const HeartIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);

export const PlusIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const CheckCircleIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.2l2.4 2.4 4.6-4.8" />
  </svg>
);

export const ArrowRightIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const CalendarIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </svg>
);

export const StarIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" />
  </svg>
);

export const TruckIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h10A1.5 1.5 0 0 1 15 6.5V8h3.2a1.5 1.5 0 0 1 1.2.6l2.3 3a1.5 1.5 0 0 1 .3.9v3a1.5 1.5 0 0 1-1.5 1.5h-.6a2.9 2.9 0 0 1-5.6 0H9.7a2.9 2.9 0 0 1-5.6 0h-.6A1.5 1.5 0 0 1 2 15.5v-9zM6.9 15.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zm10 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z" />
  </svg>
);

export const LeafIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M20 4c-9 0-15 4.2-15 11a6 6 0 0 0 1 3.3L4.3 20a.9.9 0 0 0 1.3 1.3l1.7-1.7A6 6 0 0 0 10.6 21C17 21 20 14 20 4zm-9.2 10.6l4.4-4.4a.9.9 0 0 1 1.3 1.3l-4.4 4.4a.9.9 0 0 1-1.3-1.3z" />
  </svg>
);

export const FlowerIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M12 2.5a3 3 0 0 1 2.9 2.2 3 3 0 0 1 2.7 4.7A3 3 0 0 1 15 13.8 3 3 0 0 1 9 13.8a3 3 0 0 1-2.6-4.4A3 3 0 0 1 9.1 4.7 3 3 0 0 1 12 2.5zm0 6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z" />
    <path d="M11.2 15.6h1.6v2.1c1.6-1.9 3.8-2.8 6.7-2.7-.3 3.7-2.8 6-6.7 6h-3.6c-3.9 0-6.4-2.3-6.7-6 2.9-.1 5.1.8 6.7 2.7v-2.1z" />
  </svg>
);
