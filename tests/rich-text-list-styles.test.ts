/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('rich text list styles', () => {
  it('shows bullets and numbers both in public rich text and in the editor', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

    expect(source).toContain('.rich-text-content ul');
    expect(source).toContain('@apply list-disc;');
    expect(source).toContain('.rich-text-content ol');
    expect(source).toContain('@apply list-decimal;');
    expect(source).toContain('.rich-text-editor ul');
    expect(source).toContain('.rich-text-editor ol');
  });
});
