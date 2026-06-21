type SanitizeOptions = {
  forEditor?: boolean;
};

type RenderOptions = {
  resolveMediaUrl?: (value: string) => string;
};

const allowedTags = new Set([
  'A',
  'AUDIO',
  'B',
  'BLOCKQUOTE',
  'BR',
  'DIV',
  'EM',
  'FIGCAPTION',
  'FIGURE',
  'H1',
  'H2',
  'H3',
  'H4',
  'HR',
  'I',
  'IFRAME',
  'IMG',
  'LI',
  'OL',
  'P',
  'SOURCE',
  'STRONG',
  'U',
  'UL',
  'VIDEO',
]);

const removableTags = new Set(['SCRIPT', 'STYLE', 'META', 'LINK']);
const inlineWrapperTags = new Set(['SPAN', 'FONT', 'MARK']);

export function sanitizeRichTextHtml(html: string, options: SanitizeOptions = {}) {
  if (!html || typeof document === 'undefined') {
    return html;
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  walk(container, options);
  return normalizeHtml(container.innerHTML);
}

export function textToHtml(value: string) {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeHtml(value: string) {
  return value === '<br>' ? '' : value.trim();
}

export function stripHtmlComments(value: string) {
  return value.replace(/<!--[\s\S]*?-->/g, '').trim();
}

export function richTextToPlainText(value: string | null | undefined) {
  const normalized = stripHtmlComments(String(value ?? '').trim());

  if (!normalized) {
    return '';
  }

  const withBreaks = normalized
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|ul|ol|blockquote|h1|h2|h3|h4|figure|figcaption)>/gi, '\n');

  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ' '))
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function prepareRichTextForRender(value: string | null | undefined, options: RenderOptions = {}) {
  const normalized = stripHtmlComments(String(value ?? '').trim());

  if (!normalized) {
    return '';
  }

  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(normalized);
  const html = hasHtmlTags ? normalized : textToHtml(normalized);

  return options.resolveMediaUrl ? resolveRichTextMediaUrls(html, options.resolveMediaUrl) : html;
}

function resolveRichTextMediaUrls(html: string, resolveMediaUrl: (value: string) => string) {
  return html.replace(
    /\s(src|poster)=("([^"]*)"|'([^']*)')/gi,
    (match, attributeName: string, quotedValue: string, doubleQuotedValue?: string, singleQuotedValue?: string) => {
      const originalValue = doubleQuotedValue ?? singleQuotedValue ?? '';
      const resolvedValue = resolveMediaUrl(originalValue);

      if (!resolvedValue || resolvedValue === originalValue) {
        return match;
      }

      const quote = quotedValue.startsWith("'") ? "'" : '"';
      return ` ${attributeName}=${quote}${escapeHtml(resolvedValue)}${quote}`;
    }
  );
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function walk(root: ParentNode, options: SanitizeOptions) {
  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;

    if (removableTags.has(element.tagName)) {
      element.remove();
      return;
    }

    if (!allowedTags.has(element.tagName)) {
      unwrapElement(element);
      return;
    }

    sanitizeAttributes(element);

    if (options.forEditor && inlineWrapperTags.has(element.tagName) && element.attributes.length === 0) {
      unwrapElement(element);
      return;
    }

    walk(element, options);
  });
}

function sanitizeAttributes(element: HTMLElement) {
  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const value = attribute.value.trim();

    if (
      name.startsWith('on') ||
      name === 'style' ||
      name === 'class' ||
      name === 'id' ||
      name === 'color' ||
      name === 'bgcolor'
    ) {
      element.removeAttribute(attribute.name);
      return;
    }

    if (!isAllowedAttribute(element.tagName, name)) {
      element.removeAttribute(attribute.name);
      return;
    }

    if ((name === 'href' || name === 'src') && !isSafeUrl(value, element.tagName)) {
      element.removeAttribute(attribute.name);
    }
  });

  if (element.tagName === 'A') {
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noreferrer noopener');
  }

  if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
    element.setAttribute('alt', '');
  }

  if (element.tagName === 'VIDEO' || element.tagName === 'AUDIO') {
    element.setAttribute('controls', 'true');
    element.setAttribute('preload', 'metadata');
  }

  if (element.tagName === 'IFRAME') {
    element.setAttribute('loading', 'lazy');
    element.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    element.setAttribute('allowfullscreen', 'true');
    if (!element.getAttribute('title')) {
      element.setAttribute('title', 'Conteúdo incorporado');
    }
  }
}

function isAllowedAttribute(tagName: string, attributeName: string) {
  if (['AUDIO', 'VIDEO'].includes(tagName)) {
    return ['controls', 'preload', 'src', 'poster'].includes(attributeName);
  }

  if (tagName === 'IMG') {
    return ['src', 'alt'].includes(attributeName);
  }

  if (tagName === 'SOURCE') {
    return ['src', 'type'].includes(attributeName);
  }

  if (tagName === 'A') {
    return ['href', 'target', 'rel'].includes(attributeName);
  }

  if (tagName === 'IFRAME') {
    return ['src', 'title', 'loading', 'referrerpolicy', 'allowfullscreen', 'allow'].includes(attributeName);
  }

  return false;
}

function isSafeUrl(value: string, tagName: string) {
  if (!value) {
    return false;
  }

  if (tagName === 'A') {
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('mailto:') || value.startsWith('#');
  }

  if (['IMG', 'AUDIO', 'VIDEO', 'SOURCE'].includes(tagName)) {
    return value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/uploads/');
  }

  if (tagName === 'IFRAME') {
    return (
      value.startsWith('https://www.youtube.com/embed/') ||
      value.startsWith('https://youtube.com/embed/') ||
      value.startsWith('https://player.vimeo.com/video/') ||
      value.startsWith('https://w.soundcloud.com/player/') ||
      value.startsWith('https://open.spotify.com/embed/')
    );
  }

  return false;
}

function unwrapElement(element: Element) {
  const parent = element.parentNode;

  if (!parent) {
    element.remove();
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
}
