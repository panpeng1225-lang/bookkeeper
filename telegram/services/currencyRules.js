const RMB_MARKERS = ['人民币', 'rmb', '元', '块', '块钱'];
const VND_MARKERS = [
  '越南盾',
  '越盾',
  '越南顿',
  '遇难顿',
  'vnd',
  'dong',
];

export function detectCurrency(text, defaultCurrency = 'RMB') {
  const normalizedText = String(text || '').trim().toLowerCase();

  if (VND_MARKERS.some((marker) => normalizedText.includes(marker))) {
    return 'VND';
  }

  if (RMB_MARKERS.some((marker) => normalizedText.includes(marker))) {
    return 'RMB';
  }

  return defaultCurrency;
}

export { RMB_MARKERS, VND_MARKERS };
