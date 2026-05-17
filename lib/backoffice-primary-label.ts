/** Rótulo consistente para botões principais enquanto `busy` está activo. */
export function backofficePrimaryActionLabel(busy: boolean, idleLabel: string): string {
  return busy ? 'A guardar…' : idleLabel;
}
