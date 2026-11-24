export type TranslationItem = { id: string; ID?: string; text: string; vietnameseTranslation?: string };

export function missingTranslationRows(items: TranslationItem[]) {
  return items.filter(item => !item.vietnameseTranslation?.trim()).map(item => ({
    'Document ID': item.id, 'Nghĩa tiếng Việt': '', 'Câu tiếng Anh': item.text, 'Mã RS': item.ID ?? '',
  }));
}

export function translationBatches<T>(rows: T[]) {
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += 100) batches.push(rows.slice(i, i + 100));
  return batches;
}

// Accept the displayed RS number (#170 RS, #170 or 170), never the list position.
const rsKey = (s: string) => /^#?(\d+)(?:\s+RS)?$/i.exec(s.trim())?.[1] ?? s.trim().toLowerCase();

export function previewTranslations(input: string, items: TranslationItem[], overwrite: boolean) {
  const lookup = new Map<string, TranslationItem[]>();
  for (const item of items) {
    for (const key of [`doc:${item.id}`, ...(item.ID?.trim() ? [`rs:${rsKey(item.ID)}`] : [])]) {
      lookup.set(key, [...(lookup.get(key) ?? []), item]);
    }
  }
  const seen = new Set<string>();
  return input.split(/\r?\n/).map((line, i) => {
    const cells = line.split('\t').map(s => s.trim());
    const [code, translation = ''] = cells;
    const hits = new Set([...(lookup.get(`doc:${code}`) ?? []), ...(lookup.get(`rs:${rsKey(code)}`) ?? [])]);
    const item = hits.size === 1 ? Array.from(hits)[0] : undefined;
    const error = cells.length !== 2 || !code || !translation ? 'Cần đúng hai cột không trống.'
      : !item ? (hits.size ? 'Mã không duy nhất; hãy dùng Document ID.' : 'Không tìm thấy câu đang hiển thị.')
      : seen.has(item.id) ? 'Câu xuất hiện nhiều lần trong dữ liệu nhập.' : '';
    if (item) seen.add(item.id);
    const skip = item?.vietnameseTranslation?.trim() === translation ? 'Không thay đổi.'
      : !overwrite && item?.vietnameseTranslation?.trim() ? 'Giữ bản dịch hiện tại.' : '';
    return { line: i + 1, blank: !line.trim(), code, translation, item, error, skip };
  }).filter(r => !r.blank);
}