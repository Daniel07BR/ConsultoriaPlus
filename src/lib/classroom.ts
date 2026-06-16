// Cliente server-to-server do ClassRoom. A chave NUNCA vai ao browser.
// O ClassRoom é a fonte da verdade dos vídeos da categoria "Consultoria"; este
// módulo ingere esses vídeos na página Vídeos (espelho fiel):
//  - upsert por sourceRef (id do vídeo no ClassRoom); novo entra na aba "sugerido";
//  - a aba é PRESERVADA em updates (promoção a "treinamento" gruda);
//  - título/url/curso re-sincronizam do ClassRoom (edição local bloqueada);
//  - vídeo que sumiu da origem (excluído ou curso recategorizado) é REMOVIDO aqui.
import 'server-only';
import { prisma } from '@/lib/db';
import { youtubeId } from '@/lib/present';

const BASE = (process.env.CLASSROOM_BASE_URL ?? '').replace(/\/+$/, '');
const KEY = process.env.CLASSROOM_INTEGRATION_KEY ?? '';

export interface ClassroomVideoDTO {
  sourceRef: string;
  title: string;
  youtubeUrl: string;
  courseId?: string;
  courseTitle?: string;
  courseThumbnail?: string | null;
  courseUrl?: string | null;
  order?: number;
  createdAt?: string;
}

/** Upsert de UM vídeo do ClassRoom. Retorna 'created' | 'updated' | 'skipped'. */
export async function upsertClassroomVideo(
  dto: ClassroomVideoDTO,
): Promise<'created' | 'updated' | 'skipped'> {
  const sourceRef = String(dto?.sourceRef || '').trim();
  const title = String(dto?.title || '').trim();
  const url = String(dto?.youtubeUrl || '').trim();
  if (!sourceRef || !title || !url) return 'skipped';

  // YouTube e Google Drive são embutíveis. Para YouTube a capa é a thumb do vídeo;
  // para Drive/outros usamos a capa do curso (courseThumbnail) como capa do card.
  const yid = youtubeId(url); // pode ser null (ex.: Google Drive)

  const existing = await prisma.video.findUnique({ where: { sourceRef } });
  const common = {
    title,
    url,
    youtubeId: yid,
    thumbUrl: dto.courseThumbnail || null,
    courseTitle: dto.courseTitle?.trim() || null,
    sourceUrl: dto.courseUrl || null,
  };

  if (existing) {
    // Preserva a aba (promoção local a treinamento) — só re-sincroniza metadados.
    await prisma.video.update({ where: { sourceRef }, data: common });
    return 'updated';
  }

  const max = await prisma.video.aggregate({ where: { tab: 'sugerido' }, _max: { position: true } });
  await prisma.video.create({
    data: {
      ...common,
      tab: 'sugerido', // padrão: vídeos ingeridos entram como sugeridos
      source: 'classroom',
      sourceRef,
      authorId: null,
      position: (max._max.position ?? 0) + 1,
    },
  });
  return 'created';
}

/** Puxa todos os vídeos atuais da categoria Consultoria no ClassRoom. */
export async function fetchClassroomVideos(): Promise<ClassroomVideoDTO[]> {
  if (!BASE || !KEY) throw new Error('CLASSROOM_BASE_URL/CLASSROOM_INTEGRATION_KEY ausentes');
  const res = await fetch(`${BASE}/api/integrations/consultoria/videos`, {
    headers: { 'X-Integration-Key': KEY },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`ClassRoom /consultoria/videos ${res.status}`);
  const json = (await res.json().catch(() => null)) as
    | { ok: boolean; data?: ClassroomVideoDTO[] }
    | null;
  if (!json?.ok || !Array.isArray(json.data)) throw new Error('resposta inválida do ClassRoom');
  return json.data;
}

/**
 * Marca/desmarca um vídeo como assistido no ClassRoom em nome do usuário
 * (auto-matrícula + XP, decisão do dono). Fire-and-forget; nunca lança.
 * Retorna true se o ClassRoom confirmou.
 */
export async function pushWatchedToClassroom(
  nexusUserId: string,
  sourceRef: string,
  watched: boolean,
): Promise<boolean> {
  if (!BASE || !KEY || !nexusUserId || !sourceRef) return false;
  try {
    const res = await fetch(`${BASE}/api/integrations/consultoria/watched`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Integration-Key': KEY },
      body: JSON.stringify({ nexusUserId, sourceRef, watched }),
    });
    if (!res.ok) {
      console.error(`[classroom] push de assistido falhou (${res.status})`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[classroom] erro de rede ao marcar assistido:', e);
    return false;
  }
}

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  total: number;
}

/**
 * Sincronização de espelho fiel: upserta todos os vídeos vindos do ClassRoom e
 * REMOVE os vídeos de origem 'classroom' que não vieram mais (sumiram da categoria).
 */
export async function syncClassroomVideos(): Promise<SyncResult> {
  const videos = await fetchClassroomVideos();
  const res: SyncResult = { created: 0, updated: 0, skipped: 0, deleted: 0, total: videos.length };

  const seen: string[] = [];
  for (const v of videos) {
    const r = await upsertClassroomVideo(v);
    res[r] += 1;
    if (r !== 'skipped') seen.push(String(v.sourceRef).trim());
  }

  // Espelho fiel: apaga os ingeridos que não estão mais na origem.
  const del = await prisma.video.deleteMany({
    where: { source: 'classroom', sourceRef: { notIn: seen.length ? seen : ['__none__'] } },
  });
  res.deleted = del.count;
  return res;
}
