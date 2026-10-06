import { FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import AppShellBackground from '../../components/ui/AppShellBackground';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { calendar, Challenge, ChallengeType } from '../../lib/wfd/rules';

export default function WfdChallenges() {
  const [form, setForm] = useState<Challenge>({ week: calendar().week, title: 'WFD Weekly Challenge', type: 'questions', target: 150, rewardXp: 300, topic: '', minimumAccuracy: 90, badgeTitle: 'Weekly Warrior' });
  const [items, setItems] = useState<Challenge[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    try { const response = await fetch('/api/admin/wfd-challenge'); const data = await response.json(); if (!response.ok) throw new Error(data.error); setItems(data.challenges); }
    catch (error) { setMessage((error as Error).message); }
  }
  useEffect(() => { void load(); }, []);
  async function publish(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/wfd-challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setMessage('Đã công bố challenge.'); await load();
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  return <AppShellBackground><Head><title>WFD Challenges · Admin</title></Head><main className="mx-auto max-w-3xl space-y-6 px-4 py-24 text-white/90">
    <h1 className="text-3xl font-bold">Weekly Challenge</h1>
    <p className="text-white/70">Một challenge mỗi tuần. Cấu hình đã công bố không thể sửa để bảo vệ tiến độ và reward. Challenge tạo giữa tuần chỉ tính lượt luyện sau khi công bố.</p>
    <Card><form onSubmit={publish} className="space-y-4">
      <label className="block">Ngày thứ Hai (Asia/Ho_Chi_Minh)<Input required type="date" value={form.week} onChange={e => setForm({ ...form, week: e.target.value })} /></label>
      <label className="block">Tên challenge<Input required maxLength={100} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
      <label className="block">Loại mục tiêu<select className="ui-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ChallengeType })}>{[
        ['questions', 'Số lượt WFD hợp lệ'], ['xp', 'XP từ luyện tập (không gồm bonus)'], ['topic', 'Số lượt theo topic'], ['accuracy', 'Số lượt đạt accuracy tối thiểu'], ['days', 'Số ngày luyện'], ['mastery', 'Số câu mastery lần đầu'],
      ].map(([value, label]) => <option className="bg-appBg-deep2" key={value} value={value}>{label}</option>)}</select></label>
      {form.type === 'topic' && <label className="block">Topic (khớp chính xác)<Input required value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} /></label>}
      {form.type === 'accuracy' && <label className="block">Accuracy tối thiểu (%)<Input type="number" min={0} max={100} required value={form.minimumAccuracy} onChange={e => setForm({ ...form, minimumAccuracy: Number(e.target.value) })} /></label>}
      <div className="grid gap-4 sm:grid-cols-2"><label>Mục tiêu<Input required type="number" min={1} max={100000} value={form.target} onChange={e => setForm({ ...form, target: Number(e.target.value) })} /></label>
        <label>Reward XP<Input required type="number" min={0} max={10000} value={form.rewardXp} onChange={e => setForm({ ...form, rewardXp: Number(e.target.value) })} /></label></div>
      <label className="block">Tên badge (tùy chọn)<Input maxLength={100} value={form.badgeTitle} onChange={e => setForm({ ...form, badgeTitle: e.target.value })} /></label>
      <Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Công bố challenge'}</Button><p role="status">{message}</p>
    </form></Card>
    <h2 className="text-xl font-semibold">Challenge đã công bố</h2>{items.map(item => <Card key={item.week}><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm text-white/70">{item.week} · {item.type}: {item.target} · +{item.rewardXp} XP</p></Card>)}
  </main></AppShellBackground>;
}