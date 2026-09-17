const paths:Record<string,string>={
  fill:'<path d="m9 3 10 10-8 8L1 11zM5 7l8 8M18 17s4 4 4 6a3 3 0 0 1-6 0c0-2 2-6 2-6Z"/>',
  pencil:'<path d="m4 17 12-12 4 4L8 21l-5 1zM13 8l4 4M4 17l4 4"/>',
  brush:'<path d="M14 13 22 2c1-1 2 0 1 2l-7 12zM14 14c-9-2-4 8-12 8 9 4 17-1 14-6"/>',
  crayon:'<path d="m4 16 10-10 6 6-10 10H4zM14 6l2-4 8 8-4 2M7 13l6 6M10 10l6 6"/>',
  eraser:'<path d="m3 14 10-10q1-1 2 0l7 7q1 1 0 2l-9 9H9l-6-6q-1-1 0-2ZM8 9l10 10M13 22h10"/>',
  undo:'<path d="M9 5 3 11l6 5M3 11h11a7 7 0 0 1 0 14"/>',
  redo:'<path d="m17 5 6 6-6 5M23 11H12a7 7 0 0 0 0 14"/>',
  sound:'<path d="M3 10h5l6-5v16l-6-5H3zM18 9a7 7 0 0 1 0 8M21 5a12 12 0 0 1 0 16"/>',
  lock:'<rect x="5" y="11" width="16" height="13" rx="4"/><path d="M8 11V7a5 5 0 0 1 10 0v4M13 16v3"/>',
  close:'<path d="m6 6 14 14M20 6 6 20"/>',
  right:'<path d="m10 5 8 8-8 8"/>', left:'<path d="m16 5-8 8 8 8"/>',
  book:'<path d="M13 7C9 3 4 3 2 5v17c4-2 8-1 11 2 3-3 7-4 11-2V5c-2-2-7-2-11 2ZM13 7v17"/>',
  check:'<path d="m5 14 5 5L22 7"/>', download:'<path d="M13 2v16m-6-6 6 6 6-6M3 19v5h20v-5"/>',
};
export const icon=(name:string)=>`<svg viewBox="0 0 26 28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.book}</svg>`;
