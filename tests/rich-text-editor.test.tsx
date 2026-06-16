import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RichTextEditor from '@/components/RichTextEditor';

describe('RichTextEditor', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('removes the marked toolbar actions from every backoffice rich text form', () => {
    render(<RichTextEditor label="Descrição" value="" onChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Título 1' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Título 2' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Citação' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover link' })).not.toBeInTheDocument();
  });

  it('keeps the remaining formatting buttons wired to editor commands', () => {
    const execCommand = vi.fn();
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    render(<RichTextEditor label="Descrição" value="<p>Texto</p>" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Negrito' }));
    fireEvent.click(screen.getByRole('button', { name: 'Itálico' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sublinhado' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lista' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lista numerada' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Refazer' }));

    expect(execCommand).toHaveBeenCalledWith('bold', false, undefined);
    expect(execCommand).toHaveBeenCalledWith('italic', false, undefined);
    expect(execCommand).toHaveBeenCalledWith('underline', false, undefined);
    expect(execCommand).toHaveBeenCalledWith('insertUnorderedList', false, undefined);
    expect(execCommand).toHaveBeenCalledWith('insertOrderedList', false, undefined);
    expect(execCommand).toHaveBeenCalledWith('undo', false, undefined);
    expect(execCommand).toHaveBeenCalledWith('redo', false, undefined);
  });

  it('keeps link insertion functional through the toolbar', () => {
    const execCommand = vi.fn();
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });
    vi.spyOn(window, 'prompt').mockReturnValue('https://ceiscaramulo.pt');

    render(<RichTextEditor label="Descrição" value="<p>Texto</p>" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    expect(execCommand).toHaveBeenCalledWith('createLink', false, 'https://ceiscaramulo.pt');
  });

  it('falls back to semantic list html when the browser list command does not change the editor', () => {
    const execCommand = vi.fn((command: string) => command === 'insertUnorderedList' || command === 'insertOrderedList');
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    render(<RichTextEditor label="Descrição" value="<p>Texto</p>" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Lista' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lista numerada' }));

    const editor = document.querySelector('.rich-text-editor');

    expect(execCommand).toHaveBeenCalledWith('insertUnorderedList', false, undefined);
    expect(execCommand).toHaveBeenCalledWith('insertOrderedList', false, undefined);
    expect(editor?.querySelector('ul > li')?.textContent).toBe('Novo item');
    expect(editor?.querySelector('ol > li')?.textContent).toBe('Novo item');
  });

  it('keeps list buttons safe when execCommand is unavailable', () => {
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: undefined,
    });

    render(<RichTextEditor label="Descrição" value="<p>Texto</p>" onChange={vi.fn()} />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Lista' }))).not.toThrow();
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Lista numerada' }))).not.toThrow();

    const editor = document.querySelector('.rich-text-editor');

    expect(editor?.querySelector('ul > li')?.textContent).toBe('Novo item');
    expect(editor?.querySelector('ol > li')?.textContent).toBe('Novo item');
  });

  it('keeps unordered and ordered lists visible inside the editable area', () => {
    render(
      <RichTextEditor
        label="Descrição"
        value="<ul><li>Ponto</li></ul><ol><li>Número</li></ol>"
        onChange={vi.fn()}
      />
    );

    const editor = document.querySelector('.rich-text-editor');

    expect(editor?.querySelector('ul')).not.toBeNull();
    expect(editor?.querySelector('ol')).not.toBeNull();
  });

  it('uploads audio media and inserts the stored URL instead of an inline data URL', async () => {
    const execCommand = vi.fn();
    const uploadMedia = vi.fn().mockResolvedValue('/uploads/backoffice/rich-text-news-audio/audio.mp3');
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    render(<RichTextEditor label="Conteúdo" value="<p>Texto</p>" onChange={vi.fn()} onUploadMedia={uploadMedia} />);

    const input = document.querySelector('input[accept="audio/*"]') as HTMLInputElement;
    const file = new File(['audio'], 'audio.mp3', { type: 'audio/mpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadMedia).toHaveBeenCalledWith(file, 'audio');
      expect(execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        '<figure><audio controls src="/uploads/backoffice/rich-text-news-audio/audio.mp3"></audio><figcaption>audio.mp3</figcaption></figure>'
      );
    });
  });
});
