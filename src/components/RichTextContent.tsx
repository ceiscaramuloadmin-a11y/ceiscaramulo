import React, { useMemo } from 'react';

import { sanitizeRichTextHtml } from '../lib/richText';

type RichTextContentProps = {
  html?: string | null;
  className?: string;
};

export default function RichTextContent({ html, className = '' }: RichTextContentProps) {
  const safeHtml = useMemo(() => sanitizeRichTextHtml(html || ''), [html]);

  return <div className={`rich-text-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
