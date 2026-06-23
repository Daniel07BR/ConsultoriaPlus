import React from 'react';

type P = { size?: number; fill?: string; stroke?: string; sw?: number; style?: React.CSSProperties };

function S({ size = 18, fill = 'none', stroke = 'currentColor', sw = 2, style, children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (<S {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></S>);
export const IconTicket = (p: P) => (<S {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></S>);
export const IconBookmark = (p: P) => (<S {...p}><path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z" /></S>);
export const IconBell = (p: P) => (<S {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></S>);
export const IconPlus = (p: P) => (<S {...p}><path d="M12 5v14M5 12h14" /></S>);
export const IconRefresh = (p: P) => (<S {...p}><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></S>);
export const IconHeart = (p: P) => (<S {...p}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></S>);
export const IconThumbsUp = (p: P) => (<S {...p}><path d="M7 22V11" /><path d="M2 13a2 2 0 0 1 2-2h3v11H4a2 2 0 0 1-2-2v-7z" /><path d="M7 11l4-8a2 2 0 0 1 3.6 1.3V9h5.4a2 2 0 0 1 2 2.3l-1.4 8.4A2 2 0 0 1 18.6 22H7" /></S>);
export const IconComment = (p: P) => (<S {...p}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></S>);
export const IconFile = (p: P) => (<S {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></S>);
export const IconLink = (p: P) => (<S {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></S>);
export const IconSearch = (p: P) => (<S {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></S>);
export const IconArrowRight = (p: P) => (<S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>);
export const IconArrowLeft = (p: P) => (<S {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></S>);
export const IconCheck = (p: P) => (<S {...p}><path d="M20 6L9 17l-5-5" /></S>);
export const IconSun = (p: P) => (<S {...p}><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></S>);
export const IconMoon = (p: P) => (<S {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></S>);
export const IconLayout = (p: P) => (<S {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></S>);
export const IconSend = (p: P) => (<S {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></S>);
export const IconLogout = (p: P) => (<S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></S>);
export const IconQuestion = (p: P) => (<S {...p}><circle cx="12" cy="12" r="9.5" /><path d="M9.2 9a2.8 2.8 0 0 1 5.4 1c0 1.9-2.8 2.5-2.8 2.5" /><path d="M12 17h.01" /></S>);
export const IconX = (p: P) => (<S {...p}><path d="M18 6L6 18M6 6l12 12" /></S>);
export const IconClip = (p: P) => (<S {...p}><path d="M21.4 11.05l-9 9a5 5 0 0 1-7.07-7.07l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.66 1.66 0 0 1-2.35-2.35l8.3-8.28" /></S>);
export const IconEdit = (p: P) => (<S {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></S>);
export const IconPlay = (p: P) => (<S {...p}><path d="M8 5v14l11-7z" /></S>);
export const IconVideo = (p: P) => (<S {...p}><rect x="2" y="5" width="15" height="14" rx="2" /><path d="M17 9l5-3v12l-5-3z" /></S>);
export const IconImage = (p: P) => (<S {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></S>);
export const IconExternal = (p: P) => (<S {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14L21 3" /></S>);
