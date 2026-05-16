const RMB_MARKERS = ['人民币', 'rmb', '元', '块', '块钱'];
const VND_MARKERS = ['越盾', 'vnd', 'dong', '盾', 'đ', '₫'];

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
