'use client';

import { useMemo, useRef, useState } from 'react';
import { FileText, Maximize2, Pause, Play, Search, SearchX, Volume2, X } from 'lucide-react';
import type { GalleryMediaItem } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  items: GalleryMediaItem[];
};

type TabId = 'photo' | 'video' | 'audio' | 'document';

export default function GalleryTabs({ items }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('photo');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const photos = useMemo(() => items.filter((item) => item.type === 'photo'), [items]);
  const videos = useMemo(() => items.filter((item) => item.type === 'video'), [items]);
  const audios = useMemo(() => items.filter((item) => item.type === 'audio'), [items]);
  const documents = useMemo(() => items.filter((item) => item.type === 'document'), [items]);

  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;
  const activePhotoSource = activePhoto?.source || activePhoto?.thumbnail || '/placeholder.svg';

  const resetViewer = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
  };

  const closeViewer = () => {
    setActivePhotoIndex(null);
    resetViewer();
  };

  const openPhoto = (index: number) => {
    setActivePhotoIndex(index);
    resetViewer();
  };

  const nextPhoto = () => {
    if (!photos.length || activePhotoIndex === null) return;
    setActivePhotoIndex((current) => (current === null ? 0 : (current + 1) % photos.length));
    resetViewer();
  };

  const prevPhoto = () => {
    if (!photos.length || activePhotoIndex === null) return;
    setActivePhotoIndex((current) => (current === null ? 0 : (current - 1 + photos.length) % photos.length));
    resetViewer();
  };

  const toggleVideoPlayback = async (id: string) => {
    const video = videoRefs.current[id];

    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play();
      setPlayingVideos((current) => ({ ...current, [id]: true }));
      return;
    }

    video.pause();
    setPlayingVideos((current) => ({ ...current, [id]: false }));
  };

  const openVideoFullscreen = async (id: string) => {
    const video = videoRefs.current[id];

    if (!video || typeof video.requestFullscreen !== 'function') {
      return;
    }

    await video.requestFullscreen();
  };

  return (
    <>
      <div className="rounded-xl border border-stone-200 bg-white p-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(
            [
              { id: 'photo', label: `Fotos (${photos.length})` },
              { id: 'video', label: `Vídeos (${videos.length})` },
              { id: 'audio', label: `Áudios (${audios.length})` },
              { id: 'document', label: `Documentos (${documents.length})` },
            ] as Array<{ id: TabId; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm transition-colors',
                activeTab === tab.id ? 'bg-[#27441d] text-white' : 'bg-transparent text-stone-700 hover:bg-stone-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'photo' ? (
        <section className="mt-8">
          {photos.length === 0 ? (
            <p className="rounded-lg bg-muted p-8 text-center text-muted-foreground">Sem fotos publicadas.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openPhoto(index)}
                  className="group overflow-hidden rounded-xl border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {item.thumbnail || item.source ? (
                    <img
                      src={item.thumbnail || item.source}
                      alt={item.title}
                      className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-stone-100 px-4 text-center text-sm text-stone-500">
                      Sem imagem associada
                    </div>
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-stone-800">{item.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'video' ? (
        <section className="mt-8 space-y-5">
          {videos.length === 0 ? (
            <p className="rounded-lg bg-muted p-8 text-center text-muted-foreground">Sem vídeos publicados.</p>
          ) : (
            videos.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="aspect-video bg-black">
                  {item.source ? (
                    <video
                      ref={(node) => {
                        videoRefs.current[item.id] = node;
                      }}
                      src={item.source}
                      poster={item.thumbnail || undefined}
                      className="h-full w-full bg-black object-cover"
                      playsInline
                      controls={false}
                      onPlay={() => setPlayingVideos((current) => ({ ...current, [item.id]: true }))}
                      onPause={() => setPlayingVideos((current) => ({ ...current, [item.id]: false }))}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/80">
                      Sem vídeo associado
                    </div>
                  )}
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <h3 className="text-base font-semibold text-stone-800">{item.title}</h3>
                    {item.description ? <p className="mt-1 text-sm text-stone-600">{item.description}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void toggleVideoPlayback(item.id)}
                      disabled={!item.source}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#27441d] px-4 py-2 text-sm font-medium text-white"
                    >
                      {playingVideos[item.id] ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {playingVideos[item.id] ? 'Pausar' : 'Reproduzir'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void openVideoFullscreen(item.id)}
                      disabled={!item.source}
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700"
                    >
                      <Maximize2 className="h-4 w-4" />
                      Ecrã inteiro
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}

      {activeTab === 'audio' ? (
        <section className="mt-8 space-y-4">
          {audios.length === 0 ? (
            <p className="rounded-lg bg-muted p-8 text-center text-muted-foreground">Sem áudios publicados.</p>
          ) : (
            audios.map((item) => (
              <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4ec] text-[#27441d]">
                      <Volume2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-stone-800">{item.title}</h3>
                      {item.description ? <p className="mt-1 text-sm text-stone-600">{item.description}</p> : null}
                    </div>
                  </div>
                  <div className="w-full md:max-w-[420px]">
                    {item.source ? <audio controls preload="metadata" className="w-full" src={item.source} /> : <p className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-500">Sem áudio associado.</p>}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}

      {activeTab === 'document' ? (
        <section className="mt-8 space-y-4">
          {documents.length === 0 ? (
            <p className="rounded-lg bg-muted p-8 text-center text-muted-foreground">Sem documentos publicados.</p>
          ) : (
            documents.map((item) => (
              <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4ec] text-[#27441d]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-stone-800">{item.title}</h3>
                      {item.description ? <p className="mt-1 text-sm text-stone-600">{item.description}</p> : null}
                    </div>
                  </div>
                  {item.source ? (
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-[#27441d] px-4 py-2 text-sm font-medium text-white"
                    >
                      Abrir ficheiro
                    </a>
                  ) : (
                    <p className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-500">Sem ficheiro associado.</p>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}

      {activePhoto ? (
        <div className="fixed inset-0 z-[80] bg-black/90">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <button onClick={prevPhoto} className="rounded bg-white/10 px-3 py-2 text-white">Anterior</button>
            <button onClick={nextPhoto} className="rounded bg-white/10 px-3 py-2 text-white">Seguinte</button>
          </div>

          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <button
              type="button"
              className="rounded bg-white/10 px-3 py-2 text-white"
              onClick={() => setZoom((value) => Math.min(4, Number((value + 0.25).toFixed(2))))}
              aria-label="Aumentar zoom"
              title="Aumentar zoom"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded bg-white/10 px-3 py-2 text-white"
              onClick={() => setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))}
              aria-label="Diminuir zoom"
              title="Diminuir zoom"
            >
              <SearchX className="h-4 w-4" />
            </button>
            <button type="button" className="rounded bg-white/10 p-2 text-white" onClick={closeViewer}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="flex h-full w-full cursor-grab items-center justify-center overflow-hidden"
            onMouseDown={(event) => {
              setDragging(true);
              setDragStart({ x: event.clientX - offset.x, y: event.clientY - offset.y });
            }}
            onMouseMove={(event) => {
              if (!dragging || zoom <= 1) return;
              setOffset({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onWheel={(event) => {
              event.preventDefault();
              setZoom((value) => {
                const next = event.deltaY > 0 ? value - 0.1 : value + 0.1;
                return Math.max(1, Math.min(4, Number(next.toFixed(2))));
              });
            }}
          >
            <img
              src={activePhotoSource}
              alt={activePhoto.title}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: dragging ? 'none' : 'transform 120ms ease-out',
              }}
              className="max-h-[92vh] max-w-[92vw] select-none object-contain"
              draggable={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
