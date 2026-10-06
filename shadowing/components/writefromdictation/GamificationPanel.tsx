import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { GOALS } from '../../lib/wfd/rules';
import { Dashboard, useWfdGamification, wfdRequest } from '../../hooks/useWfdGamification';

export function Leaderboard({ data }: { data: Dashboard }) {
  const rows = [...data.leaderboard];
  if (data.me && data.me.rank > 10) rows.push(data.me);
  return <Card><h2 className="text-xl font-semibold">Weekly Leaderboard</h2>
    <p className="mt-2 text-sm text-white/70">Tuần bắt đầu {data.week} · Thứ Hai–Chủ nhật · Asia/Ho_Chi_Minh</p>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm">
      <caption className="sr-only">Xếp hạng theo XP, độ chính xác, ít attempt hơn và thời điểm đạt XP.</caption>
      <thead className="text-white/70"><tr>{['Rank', 'Student', 'XP', 'Practiced', 'Accuracy', 'Streak'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.userId} className={row.userId === data.me?.userId ? 'bg-primary/20' : 'border-t border-white/10'}>
        <td className="p-3">{['🥇', '🥈', '🥉'][row.rank - 1] || `#${row.rank}`}</td>
        <td className="p-3"><div className="flex items-center gap-2">{row.avatar ? <Image unoptimized src={row.avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" /> : <span aria-hidden="true">👤</span>}
          <span>{row.name}{row.userId === data.me?.userId && <strong className="ml-2 text-primaryHover">YOU</strong>}</span></div></td>
        <td className="p-3 font-semibold text-primaryHover">{row.xp.toLocaleString()}</td><td className="p-3">{row.practiced}</td>
        <td className="p-3">{row.accuracy.toFixed(1)}%</td><td className="p-3">🔥 {row.currentStreak}</td>
      </tr>)}</tbody></table></div>
    {!rows.length && <p className="py-6 text-white/70">Chưa có lượt luyện trong tuần này. Hãy bắt đầu!</p>}
    {!data.me && <p className="mt-4 text-white/70">Bạn chưa có hạng tuần này.</p>}
    {data.me && data.previousRank && <p className="mt-4">Snapshot gần nhất: #{data.previousRank} → #{data.me.rank}</p>}
    {data.nextRank && <p className="mt-4 text-primaryHover">Còn {data.nextRank.xpNeeded} XP để vượt {data.nextRank.name}.</p>}
    <p className="mt-4 text-xs text-white/55">Practiced và accuracy dùng lượt đủ điều kiện thưởng. Khi đồng XP: accuracy cao hơn → ít attempt hơn → đạt XP sớm hơn.</p>
  </Card>;
}

export default function GamificationPanel({ game, summary, onCloseSummary }: {
  game: ReturnType<typeof useWfdGamification>; summary: boolean; onCloseSummary: () => void;
}) {
  const { data } = game;
  const [detail, setDetail] = useState('goal');
  const [saving, setSaving] = useState(false);
  const [settingMessage, setSettingMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const showDialog = summary || game.celebrations.length > 0;
  useEffect(() => {
    if (showDialog && !dialog.current?.open) dialog.current?.showModal();
    if (!showDialog) dialog.current?.close();
  }, [showDialog]);
  const close = () => { game.setCelebrations([]); onCloseSummary(); };
  return <div className="w-full max-w-5xl space-y-4 text-white/90">
    {game.error && <Card><p role="alert">{game.error}</p><div className="mt-3 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => void game.refresh()}>Tải lại</Button>{game.hasRetry && <Button disabled={game.pending} onClick={game.retrySubmit}>Đồng bộ lại attempt</Button>}</div></Card>}
    {!data && !game.error && <Card><p role="status">Đang tải tiến độ WFD…</p></Card>}
    {data && <>
      <Card><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Your WFD journey</h2><Link className="accent-ring rounded-lg p-3 text-sm text-primaryHover" href="/wfd/achievements">Achievements →</Link></div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[
          ['streak', '🔥 Daily Streak', `${data.profile.currentStreak} ngày`], ['rank', '🏆 Weekly Rank', data.me ? `#${data.me.rank}` : 'Chưa xếp hạng'],
          ['xp', '⚡ Total XP', data.profile.totalXp.toLocaleString()], ['goal', '🎯 Today', `${data.today.practiced} / ${data.today.goal}`],
        ].map(([key, label, value]) => <Button key={key} variant="secondary" aria-pressed={detail === key} onClick={() => setDetail(key)} className="text-left"><span className="block text-xs text-white/70">{label}</span><strong className="mt-2 block text-xl">{value}</strong></Button>)}</div>
        <div className="mt-4" aria-live="polite">
          {detail === 'goal' && <><p className="text-sm font-semibold">TODAY’S GOAL</p><progress className="wfd-progress mt-3" max={data.today.goal} value={Math.min(data.today.practiced, data.today.goal)} aria-label="Tiến độ Daily Goal" />
            <p className="mt-2 text-sm text-white/70">{data.today.rewarded ? '🎉 Daily Goal Completed · +20 XP đã nhận' : `Còn ${Math.max(0, data.today.goal - data.today.practiced)} câu hợp lệ để hoàn thành mục tiêu hôm nay.`}</p></>}
          {detail === 'streak' && <p>Kỷ lục: {data.profile.longestStreak} ngày · Hoàn thành goal mỗi ngày để giữ streak. Mốc: 3, 7, 14, 30, 60, 100 ngày.</p>}
          {detail === 'xp' && <p>Tuần này: {data.me?.xp || 0} XP · +5 XP/lượt hợp lệ, bonus accuracy +1/+3/+5, mastery lần đầu +2. Tối đa 5 lượt nhận XP/câu/ngày.</p>}
          {detail === 'rank' && <Link href="/wfd/leaderboard" className="inline-block min-h-[44px] p-3 text-primaryHover accent-ring rounded-lg">Xem bảng xếp hạng đầy đủ →</Link>}
        </div>
        <details className="mt-4 border-t border-white/10 pt-4"><summary className="min-h-[44px] cursor-pointer accent-ring rounded-lg p-2">Settings · Daily Goal</summary>
          <label className="block text-sm" htmlFor="wfd-goal">Mục tiêu từ ngày mai</label><select id="wfd-goal" className="ui-input mt-2" value={data.profile.goal} disabled={saving} onChange={async e => {
            setSaving(true); setSettingMessage('');
            try { await wfdRequest('goal', { goal: Number(e.target.value) }); await game.refresh(); setSettingMessage('Đã lưu. Áp dụng từ ngày mai; goal hôm nay không thay đổi.'); }
            catch (error) { setSettingMessage((error as Error).message); } finally { setSaving(false); }
          }}>{GOALS.map((goal, i) => <option className="bg-appBg-deep2" key={goal} value={goal}>{['Light', 'Standard', 'Intensive', 'Hardcore'][i]} · {goal} WFD</option>)}</select><p role="status" className="mt-2 text-sm text-white/70">{settingMessage}</p></details>
      </Card>
      {data.challenge && <Card><p className="text-xs tracking-widest text-primaryHover">WFD WEEKLY CHALLENGE</p><h2 className="mt-2 text-xl font-semibold">{data.challenge.title}</h2>
        <p className="mt-2 text-sm text-white/70">{data.challenge.type} · {data.challenge.progress} / {data.challenge.target} · +{data.challenge.rewardXp} XP {data.challenge.badgeTitle && `· ${data.challenge.badgeTitle}`}</p>
        <progress className="wfd-progress mt-4" max={data.challenge.target} value={Math.min(data.challenge.progress, data.challenge.target)} aria-label="Tiến độ Weekly Challenge" />
        {data.challenge.rewarded && <p className="mt-2 text-primaryHover">🏆 Hoàn thành · reward đã nhận</p>}</Card>}
    </>}
    <p role="status" className="text-sm text-primaryHover">{game.pending ? `Đang đồng bộ · ${game.queued} attempt còn chờ…` : game.message}</p>
    <dialog ref={dialog} className="wfd-dialog" onCancel={close} onClose={() => { if (showDialog) close(); }}>
      <h2 className="text-2xl font-bold">{summary ? 'SESSION COMPLETE' : 'Cột mốc mới!'}</h2>
      {game.celebrations.map((text, index) => <p key={`${index}-${text}`} className="mt-4 text-primaryHover">{text}</p>)}
      {summary && <div className="mt-4 space-y-3"><p>{game.session.practiced} WFD practiced</p><p>{game.session.practiced ? (game.session.accuracySum / game.session.practiced).toFixed(1) : 0}% accuracy · +{game.session.xp} XP</p>
        <p>🔥 {data?.today.rewarded ? 'Daily Goal hoàn thành · streak được duy trì' : 'Hoàn thành Daily Goal để duy trì streak'}</p>
        <p>🏆 Rank {game.initialRank ? `#${game.initialRank}` : '—'} → {data?.me ? `#${data.me.rank}` : '—'}</p>
        {game.initialRank && data?.me && game.initialRank > data.me.rank && <p>🚀 Bạn vừa vượt qua {game.initialRank - data.me.rank} học viên.</p>}
        {game.hasRetry && <p>Có attempt chưa đồng bộ. Hãy đồng bộ lại trước khi kết thúc session.</p>}
      </div>}
      <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => { close(); if (summary && !game.hasRetry && !game.pending) void game.resetSession(); }}>Continue Practice</Button><Link href="/wfd/leaderboard" className="ui-button-secondary accent-ring inline-flex items-center">View Leaderboard</Link></div>
    </dialog>
  </div>;
}