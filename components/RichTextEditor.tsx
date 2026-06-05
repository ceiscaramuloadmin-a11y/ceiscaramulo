import React, { useEffect, useRef } from 'react';
import {
  AudioLines,
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
  Video,
  Globe,
} from 'lucide-react';

import { escapeHtml, normalizeHtml, sanitizeRichTextHtml, textToHtml } from '@/lib/richText';

type RichTextEditorProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

type MediaKind = 'image' | 'audio' | 'video';

export default function RichTextEditor({ label, value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const normalizedValue = sanitizeRichTextHtml(value || '', { forEditor: true });

    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [value]);

  useEffect(() => {
    const updateSelection = () => {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);

      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        selectionRef.current = range.cloneRange();
      }
    };

    document.addEventListener('selectionchange', updateSelection);
    return () => document.removeEventListener('selectionchange', updateSelection);
  }, []);

  const syncContent = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const normalizedValue = sanitizeRichTextHtml(editor.innerHTML || '', { forEditor: true });

    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }

    onChange(normalizeHtml(normalizedValue));
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    restoreSelection();
    execEditorCommand(command, commandValue);
    syncContent();
  };

  const runListCommand = (ordered: boolean) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const expectedTag = ordered ? 'OL' : 'UL';
    const beforeHtml = editor.innerHTML;

    editor.focus();
    restoreSelection();
    const command = ordered ? 'insertOrderedList' : 'insertUnorderedList';
    execEditorCommand(command);

    const listWasCreated = editor.innerHTML !== beforeHtml && !!editor.querySelector(expectedTag.toLowerCase());

    if (!listWasCreated) {
      const listHtml = buildListHtmlFromCurrentSelection(ordered);
      insertListHtml(listHtml);
    }

    syncContent();
  };

  const insertLink = () => {
    const url = window.prompt('Introduz o URL do link');

    if (!url) {
      return;
    }

    runCommand('createLink', url);
  };

  const insertEmbed = () => {
    const url = window.prompt('Introduz URL YouTube/Vimeo/SoundCloud/Spotify');

    if (!url) {
      return;
    }

    const embedHtml = buildEmbedHtml(url.trim());

    if (!embedHtml) {
      window.alert('URL não suportado para incorporação.');
      return;
    }

    editorRef.current?.focus();
    restoreSelection();
    execEditorCommand('insertHTML', embedHtml);
    syncContent();
  };

  const insertMedia = async (file: File, kind: MediaKind) => {
    const dataUrl = await fileToDataUrl(file);
    const escapedName = escapeHtml(file.name || kind);

    const htmlByKind = {
      image: `<figure><img src="${dataUrl}" alt="${escapedName}" /><figcaption>${escapedName}</figcaption></figure>`,
      audio: `<figure><audio controls src="${dataUrl}"></audio><figcaption>${escapedName}</figcaption></figure>`,
      video: `<figure><video controls src="${dataUrl}"></video><figcaption>${escapedName}</figcaption></figure>`,
    };

    editorRef.current?.focus();
    restoreSelection();
    execEditorCommand('insertHTML', htmlByKind[kind]);
    syncContent();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    const sanitized = html
      ? sanitizeRichTextHtml(html, { forEditor: true })
      : text
        ? textToHtml(text)
        : '';

    if (!sanitized) {
      return;
    }

    editorRef.current?.focus();
    restoreSelection();
    execEditorCommand('insertHTML', sanitized);
    syncContent();
  };

  return (
    <div className="space-y-3">
      {label ? <p className="text-sm text-stone-600">{label}</p> : null}

      <div className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b border-stone-200 p-3">
          <ToolbarButton label="Negrito" onClick={() => runCommand('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Itálico" onClick={() => runCommand('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Sublinhado" onClick={() => runCommand('underline')}><Underline className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Lista" onClick={() => runListCommand(false)}><List className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Lista numerada" onClick={() => runListCommand(true)}><ListOrdered className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Link" onClick={insertLink}><LinkIcon className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Incorporar URL" onClick={insertEmbed}><Globe className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Desfazer" onClick={() => runCommand('undo')}><Undo2 className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Refazer" onClick={() => runCommand('redo')}><Redo2 className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Inserir imagem" onClick={() => imageInputRef.current?.click()}><ImageIcon className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Inserir áudio" onClick={() => audioInputRef.current?.click()}><AudioLines className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Inserir vídeo" onClick={() => videoInputRef.current?.click()}><Video className="h-4 w-4" /></ToolbarButton>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rich-text-editor min-h-[320px] rounded-b-2xl bg-transparent px-4 py-4 text-black outline-none"
          onInput={syncContent}
          onBlur={syncContent}
          onFocus={rememberSelection}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onPaste={handlePaste}
        />
      </div>

      <p className="text-xs leading-6 text-stone-500">
        O conteúdo colado/incorporado remove cores, classes e fundos externos para manter o estilo visual do site.
      </p>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileChange(event.target.files?.[0], 'image', insertMedia, event.currentTarget)}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(event) => handleFileChange(event.target.files?.[0], 'audio', insertMedia, event.currentTarget)}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => handleFileChange(event.target.files?.[0], 'video', insertMedia, event.currentTarget)}
      />
    </div>
  );

  function restoreSelection() {
    const selection = window.getSelection();

    if (!selection || !selectionRef.current) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  function rememberSelection() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  }

  function execEditorCommand(command: string, commandValue?: string) {
    // Alguns browsers/dev bundles falham com execCommand; esta guarda evita quebrar o editor inteiro.
    if (typeof document.execCommand !== 'function') {
      return false;
    }

    return document.execCommand(command, false, commandValue);
  }

  function getSelectedEditorBlock() {
    const range = selectionRef.current;

    if (!range) {
      return null;
    }

    let node: Node | null = range.commonAncestorContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement && ['P', 'DIV', 'LI'].includes(node.tagName)) {
        return node;
      }

      node = node.parentNode;
    }

    return null;
  }

  function buildListHtmlFromCurrentSelection(ordered: boolean) {
    const selection = window.getSelection()?.toString().trim();
    const blockText = getSelectedEditorBlock()?.textContent?.trim();
    const source = selection || blockText || 'Novo item';
    const items = source
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');

    return ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
  }

  function insertListHtml(listHtml: string) {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const template = document.createElement('template');
    template.innerHTML = listHtml;
    const list = template.content.firstElementChild;

    if (!list) {
      return;
    }

    const block = getSelectedEditorBlock();

    if (block && block !== editor) {
      block.replaceWith(list);
      return;
    }

    const range = selectionRef.current;

    if (range && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(list);
      return;
    }

    editor.appendChild(list);
  }
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-[#3e5c32] hover:text-[#27441d]"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function buildEmbedHtml(url: string) {
  const youtubeMatch =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (youtubeMatch?.[1]) {
    return `<figure><iframe src="https://www.youtube.com/embed/${youtubeMatch[1]}" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></figure>`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return `<figure><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" title="Vimeo" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></figure>`;
  }

  const soundcloudMatch = url.includes('soundcloud.com/');
  if (soundcloudMatch) {
    const encoded = encodeURIComponent(url);
    return `<figure><iframe src="https://w.soundcloud.com/player/?url=${encoded}" title="SoundCloud"></iframe></figure>`;
  }

  const spotifyMatch =
    url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/) ||
    url.match(/spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch?.[1] && spotifyMatch?.[2]) {
    return `<figure><iframe src="https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}" title="Spotify" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></figure>`;
  }

  return null;
}

async function handleFileChange(
  file: File | undefined,
  kind: MediaKind,
  insertMedia: (file: File, kind: MediaKind) => Promise<void>,
  input: HTMLInputElement
) {
  if (!file) {
    return;
  }

  await insertMedia(file, kind);
  input.value = '';
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Formato de ficheiro inválido.'));
    };

    reader.onerror = () => reject(reader.error || new Error('Não foi possível ler o ficheiro.'));
    reader.readAsDataURL(file);
  });
}

