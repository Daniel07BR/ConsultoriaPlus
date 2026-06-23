'use client';
// Detecta URLs no texto de uma conversa e as torna clicáveis. YouTube/Drive
// abrem no visualizador embutido; demais abrem em nova aba. Extraído (Fase 2).
import { useApp } from '../AppProvider';

export function Linkify({ text }: { text: string }) {
  const { openLink } = useApp();
  const parts = text.split(/(https?:\/\/[^\s<]+)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p)) {
          const trail = (p.match(/[).,;:!?'"»]+$/) || [''])[0];
          const url = trail ? p.slice(0, p.length - trail.length) : p;
          return (
            <span key={i}>
              <a
                href={url}
                onClick={(e) => { e.preventDefault(); openLink(url); }}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}
              >{url}</a>{trail}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
