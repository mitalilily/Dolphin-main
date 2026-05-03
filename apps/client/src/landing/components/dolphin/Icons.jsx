function Icon({ name, className = "h-5 w-5" }) {
  const icons = {
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6l-12 12" />
      </>
    ),
    chevronDown: (
      <>
        <path d="m6 9 6 6 6-6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    minus: (
      <>
        <path d="M5 12h14" />
      </>
    ),
    route: (
      <>
        <path d="M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M8 16h3a3 3 0 0 0 3-3v-2" />
        <path d="M14 11h2" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 12h4l2 3h4l2-3h4" />
        <path d="M5 5h14l1 7v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5l1-7Z" />
      </>
    ),
    rocket: (
      <>
        <path d="M6 18c1.5-.3 3.2-1.1 4.5-2.4L17 9a8.5 8.5 0 0 0 1.9-7A8.5 8.5 0 0 0 12 3.9L5.4 10.5A9 9 0 0 0 3 15c0 2.1 1 4 3 3Z" />
        <path d="M9 15l-4 4" />
        <path d="M15 9h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l7 3v5c0 4.7-2.9 8.8-7 10-4.1-1.2-7-5.3-7-10V6l7-3Z" />
        <path d="M9.5 12.5l1.8 1.8 3.6-4.1" />
      </>
    ),
    layers: (
      <>
        <path d="M12 4 4 8l8 4 8-4-8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 16 8 4 8-4" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3l1.7 4.8L18 9.5l-4.3 1.7L12 16l-1.7-4.8L6 9.5l4.3-1.7L12 3Z" />
        <path d="M19 4v4" />
        <path d="M21 6h-4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.9-3" />
        <path d="M4 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.9 3" />
        <path d="M20 20v-5h-5" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2H4V7Z" />
        <path d="M4 9h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" />
        <path d="M15.5 14h.01" />
      </>
    ),
    bolt: (
      <>
        <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18" />
        <path d="M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    store: (
      <>
        <path d="M4 9h16" />
        <path d="M5 9l1-4h12l1 4" />
        <path d="M6 9v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
    shoppingBag: (
      <>
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8a3 3 0 1 1 6 0" />
      </>
    ),
    truck: (
      <>
        <path d="M10 17H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h7v11Z" />
        <path d="M10 10h5l3 3v4h-8" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    checkCircle: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.4 2.4L15.8 9.5" />
      </>
    ),
    coins: (
      <>
        <ellipse cx="12" cy="6" rx="6" ry="3" />
        <path d="M6 6v5c0 1.7 2.7 3 6 3s6-1.3 6-3V6" />
        <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      </>
    ),
    bell: (
      <>
        <path d="M15 17H5.8a1.8 1.8 0 0 1-1.5-2.8l.7-1A5.8 5.8 0 0 0 6 10V9a6 6 0 1 1 12 0v1c0 1.2.4 2.4 1.1 3.4l.6 1A1.8 1.8 0 0 1 18.2 17H15" />
        <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
      </>
    ),
    api: (
      <>
        <path d="M8 8 4 12l4 4" />
        <path d="M16 8l4 4-4 4" />
        <path d="M13 5 11 19" />
      </>
    ),
    calculator: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h2" />
        <path d="M14 11h2" />
        <path d="M8 15h2" />
        <path d="M14 15h2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    user: (
      <>
        <path d="M18 20a6 6 0 0 0-12 0" />
        <circle cx="12" cy="8" r="4" />
      </>
    ),
    arrowUpRight: (
      <>
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 8 4.5-8 4.5L4 7.5 12 3Z" />
        <path d="M4 7.5V16.5L12 21l8-4.5V7.5" />
        <path d="M12 12v9" />
      </>
    ),
    phone: (
      <>
        <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2.2 2 18 18 0 0 1-15.6-15.6A2 2 0 0 1 5 4Z" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    map: (
      <>
        <path d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2Z" />
        <path d="M9 4v14" />
        <path d="M15 6v14" />
      </>
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.layers}
    </svg>
  );
}

export default Icon;
