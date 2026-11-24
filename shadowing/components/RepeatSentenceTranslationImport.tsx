import { useMemo, useRef, useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { missingTranslationRows, previewTranslations, translationBatches, TranslationItem } from '../lib/repeatSentenceTranslations';
import * as XLSX from 'xlsx';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';

export default function RepeatSentenceTranslationImport({ items, loading, onSaved }: {
  items: TranslationItem[]; loading: boolean; onSaved: (updates: Map<string, string>) => void;
}) {
  const [input, setInput] = useState(''), [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const lock = useRef(false);
  const [page, setPage] = useState(0);
  const missing = useMemo(() => missingTranslationRows(items), [items]);
  function exportMissing() {
    try {
      const sheet = XLSX.utils.json_to_sheet(missing);
      sheet['!cols'] = [{ wch: 30 }, { wch: 80 }, { wch: 80 }, { wch: 16 }];
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, 'Missing translations');
      XLSX.writeFile(book, `repeat_sentences_missing_translation_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setMessage(`Đã xuất ${missing.length} câu chưa có nghĩa.`);
    } catch { setMessage('Không thể xuất Excel. Vui lòng thử lại.'); }
  }
  const rows = useMemo(() => previewTranslations(input, items, overwrite), [input, items, overwrite]);
  const ready = rows.filter(r => !r.error && !r.skip && r.item);
  const blocked = busy || loading || !ready.length || rows.some(r => r.error);
  async function save() {
    if (blocked || lock.current) return;
    lock.current = true; setBusy(true); setMessage('');
    let saved = 0;
    try {
      for (const batch of translationBatches(ready)) {
      await runTransaction(db, async tx => {
        const changes = batch.map(r => ({ ...r, ref: doc(db, 'repeatsentence', r.item!.id) }));
        const snapshots = await Promise.all(changes.map(r => tx.get(r.ref)));
        changes.forEach((r, i) => {
          const current = snapshots[i].data();
          if (!current || current.isHidden !== false || current.ID !== r.item!.ID || current.text !== r.item!.text || (current.vietnameseTranslation ?? '') !== (r.item!.vietnameseTranslation ?? '')) {
            throw new Error(`Câu ${r.code} đã thay đổi. Hãy tải lại danh sách và đối chiếu lại.`);
          }
          tx.update(r.ref, { vietnameseTranslation: r.translation });
        });
      });
      onSaved(new Map(batch.map(r => [r.item!.id, r.translation])));
      saved += batch.length; setMessage(`Đã lưu ${saved}/${ready.length} bản dịch.`);
      }
      setMessage(`Đã lưu ${saved} bản dịch, bỏ qua ${rows.length - saved} dòng.`); setInput(''); setOverwrite(false); setPage(0);
    } catch (err) {
      if (saved) { setInput(ready.slice(saved).map(r => `${r.code}\t${r.translation}`).join('\n')); setPage(0); }
      setMessage(`Đã lưu ${saved}/${ready.length} bản dịch. Còn ${ready.length - saved} dòng cần lưu. ${err instanceof Error ? err.message : 'Kiểm tra kết nối và quyền truy cập.'}`);
    }
    finally { lock.current = false; setBusy(false); }
  }
  return <Card className="space-y-4"><h2 className="text-lg font-semibold">Nhập hàng loạt nghĩa tiếng Việt</h2>
    <Button variant="secondary" disabled={loading || busy || !missing.length} onClick={exportMissing}>Xuất Excel: câu thiếu nghĩa tiếng Việt ({missing.length})</Button>
    <p id="rs-vi-help" className="text-sm text-textGlass-secondary">File gồm tất cả câu công khai chưa có nghĩa, không phụ thuộc bộ lọc. Điền nghĩa ở cột B rồi sao chép hai cột A–B (không lấy tiêu đề) và dán bên dưới. Có thể dùng mã RS thay Document ID. Không cần chia danh sách: hệ thống tự lưu theo nhóm.</p>
    <label className="block">Dữ liệu cần nhập<Input multiline rows={5} disabled={busy} value={input} aria-describedby="rs-vi-help" placeholder={'#170 RS\tSinh viên nên kiểm tra giờ mở cửa của thư viện.'} onChange={e => { setInput(e.target.value); setMessage(''); setPage(0); }} /></label>
    <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" disabled={busy} checked={overwrite} onChange={e => setOverwrite(e.target.checked)} />Cho phép ghi đè nghĩa đã có</label>
    {rows.length > 0 && <><h3 className="font-semibold">Xem trước · {ready.length}/{rows.length} dòng cần lưu</h3><ol className="max-h-64 space-y-2 overflow-y-auto">{rows.slice(page * 100, (page + 1) * 100).map(r => <li key={r.line} className="rounded-xl border border-glass-border p-3 text-sm break-words"><strong>Dòng {r.line} · {r.code}</strong> — {r.error || r.skip || 'Sẽ lưu'}{r.item && <p lang="en">{r.item.text}</p>}{r.item?.vietnameseTranslation && <p>Hiện tại: {r.item.vietnameseTranslation}</p>}<p>Nhập: {r.translation}</p></li>)}</ol>
      {rows.length > 100 && <div className="flex flex-wrap items-center gap-3"><Button variant="secondary" disabled={!page} onClick={() => setPage(page - 1)}>Trang trước</Button>Trang {page + 1}/{Math.ceil(rows.length / 100)}<Button variant="secondary" disabled={(page + 1) * 100 >= rows.length} onClick={() => setPage(page + 1)}>Trang sau</Button></div>}{rows.some(r => r.error) && <p role="alert">Sửa các dòng lỗi trước khi lưu.</p>}</>}
    <Button disabled={blocked} onClick={save}>{busy ? 'Đang lưu…' : `Lưu ${ready.length} bản dịch`}</Button><p role="status">{message}</p></Card>;
}