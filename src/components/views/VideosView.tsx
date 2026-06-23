'use client';
// Vídeos (treinamentos / sugeridos). Extraído de AppClient (Fase 2).
import Avatar from '../Avatar';
import { IconRefresh, IconPlus, IconPlay, IconCheck, IconX } from '../icons';
import { miniBtn } from '../ui/formKit';
import { youtubeThumb, timeAgo } from '@/lib/present';
import { useApp } from '../AppProvider';

export function VideosView() {
  const { me, videoTab, setVideoTab, loadVideos, syncVideos, syncingVideos, setEditingVideo, setVideoFormOpen, videos, playVideo, toggleWatched, reclassifyVideo, deleteVideo } = useApp();
  const tab = (k: 'treinamento' | 'sugerido', label: string) => (
    <button key={k} onClick={() => { setVideoTab(k); loadVideos(k); }} style={{ padding: '9px 16px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", background: videoTab === k ? 'var(--accent-soft)' : 'transparent', color: videoTab === k ? 'var(--accent)' : 'var(--fg2)' }}>{label}</button>
  );
  return (
    <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <div>
          <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Vídeos</h1>
          <p style={{ margin: 0, color: 'var(--fg2)', fontSize: 15 }}>Treinamentos e vídeos sugeridos pela consultoria.</p>
        </div>
        {me.canConsultor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={syncVideos} disabled={syncingVideos} title="Importar/atualizar os vídeos da categoria Consultoria do ClassRoom" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: syncingVideos ? 'default' : 'pointer', opacity: syncingVideos ? 0.6 : 1, whiteSpace: 'nowrap' }}><IconRefresh size={15} sw={2.4} /> {syncingVideos ? 'Sincronizando…' : 'Sincronizar ClassRoom'}</button>
            <button onClick={() => { setEditingVideo({ title: '', description: '', url: '', tab: videoTab }); setVideoFormOpen(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 5px 14px var(--accent-soft)', whiteSpace: 'nowrap' }}><IconPlus size={16} sw={2.6} /> Adicionar vídeo</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 13, padding: 4, marginBottom: 22, width: 'fit-content' }}>
        {tab('treinamento', 'Treinamentos')}
        {tab('sugerido', 'Vídeos sugeridos')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
        {videos.map((v) => (
          <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 1px 3px var(--shadow)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => playVideo(v)} style={{ position: 'relative', border: 'none', padding: 0, cursor: 'pointer', background: '#000', display: 'block' }}>
              {(v.youtubeId || v.thumbUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.youtubeId ? youtubeThumb(v.youtubeId) : v.thumbUrl!} alt={v.title} style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '16 / 9', background: 'linear-gradient(135deg,#ff5c89,#fda8bf)' }} />
              )}
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.12)' }}>
                <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,92,137,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}><IconPlay size={26} fill="#fff" stroke="#fff" /></span>
              </span>
            </button>
            <div style={{ padding: '15px 17px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div className="font-grotesk" onClick={() => playVideo(v)} style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, color: 'var(--fg)', cursor: 'pointer' }}>{v.title}</div>
              {v.description && <div style={{ fontSize: 13, color: 'var(--fg2)', lineHeight: 1.5 }}>{v.description}</div>}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => toggleWatched(v)}
                title={v.source === 'classroom' ? 'Marca como assistido também no ClassRoom' : undefined}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '9px 12px', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", marginTop: 6, border: v.watched ? '1px solid #1f9d6b' : '1px solid var(--border)', background: v.watched ? 'rgba(31,157,107,0.12)' : 'var(--surface2)', color: v.watched ? '#1f9d6b' : 'var(--fg2)' }}
              >
                <IconCheck size={15} sw={v.watched ? 3 : 2.4} /> {v.watched ? 'Assistido' : 'Marcar como assistido'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                {v.source === 'classroom' ? (
                  <span style={{ fontSize: 12, color: 'var(--fg3)', flex: 1, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 10.5 }}>ClassRoom</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.courseTitle || 'Consultoria'}</span>
                  </span>
                ) : (
                  <>
                    <Avatar name={v.author?.name || 'Consultoria'} avatar={v.author?.avatar || null} size={24} role="consultor" font={10} />
                    <span style={{ fontSize: 12, color: 'var(--fg3)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.author?.name || 'Consultoria'} · {timeAgo(v.createdAt)}</span>
                  </>
                )}
                {me.canConsultor && (
                  <>
                    {v.tab === 'sugerido'
                      ? <button onClick={() => reclassifyVideo(v, 'treinamento')} title="Marcar como treinamento" style={miniBtn}>Treinamento</button>
                      : <button onClick={() => reclassifyVideo(v, 'sugerido')} title="Mover para vídeos sugeridos" style={miniBtn}>Sugerido</button>}
                    {v.source !== 'classroom' && (
                      <button onClick={() => { setEditingVideo({ id: v.id, title: v.title, description: v.description || '', url: v.url, tab: v.tab as 'treinamento' | 'sugerido' }); setVideoFormOpen(true); }} style={miniBtn}>Editar</button>
                    )}
                    <button onClick={() => deleteVideo(v.id)} title="Excluir" style={{ ...miniBtn, color: '#e0457a' }}><IconX size={13} sw={2.4} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {videos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
          <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>Nenhum vídeo {videoTab === 'treinamento' ? 'de treinamento' : 'sugerido'} ainda</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>{me.canConsultor ? 'Clique em "Adicionar vídeo" para incluir.' : 'Em breve a consultoria publicará vídeos aqui.'}</div>
        </div>
      )}
    </div>
  );
}
