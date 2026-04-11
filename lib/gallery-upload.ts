export const MAX_INLINE_AUDIO_UPLOAD_BYTES = 4 * 1024 * 1024;

export function isInlineAudioUploadTooLarge(file: Pick<File, 'size'> | null | undefined, type: string) {
  if (type !== 'audio' || !file) {
    return false;
  }

  return file.size > MAX_INLINE_AUDIO_UPLOAD_BYTES;
}

export function getInlineAudioUploadErrorMessage() {
  return 'Ficheiros de áudio grandes devem ser enviados por URL. Para upload direto, usa um áudio até 4 MB.';
}
