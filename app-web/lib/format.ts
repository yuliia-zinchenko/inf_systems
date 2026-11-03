export const formatTimecode = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatBytesAsMB = (bytes: number): string =>
  `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const formatDateUk = (input: string | Date): string =>
  new Date(input).toLocaleDateString('uk-UA');
