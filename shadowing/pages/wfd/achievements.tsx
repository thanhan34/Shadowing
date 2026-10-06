import Head from 'next/head';
import Link from 'next/link';
import AppShellBackground from '../../components/ui/AppShellBackground';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ACHIEVEMENTS } from '../../lib/wfd/rules';
import { useWfdGamification } from '../../hooks/useWfdGamification';
export default function WfdAchievements() {
  const game = useWfdGamification();
  const unlocked = game.data?.profile.unlocked || {};
  return <AppShellBackground><Head><title>WFD Achievements · PTE Intensive</title></Head><main className="mx-auto max-w-5xl space-y-6 px-4 py-24 text-white/90">
    <Link className="inline-block p-3 accent-ring rounded-lg text-primaryHover" href="/writefromdictation">← Luyện WFD</Link>
    <h1 className="text-3xl font-bold">Achievements</h1>
    {game.error && <p role="alert">{game.error}</p>}{!game.data && !game.error && <p role="status">Đang tải…</p>}
    {game.data && <><p className="text-white/70">{ACHIEVEMENTS.filter(b => unlocked[b.id]).length} / {ACHIEVEMENTS.length} badges unlocked</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ACHIEVEMENTS.map(badge => <Card key={badge.id} className={unlocked[badge.id] ? 'border-primary/50' : 'opacity-70'}>
        <span className="text-3xl" aria-hidden="true">{unlocked[badge.id] ? badge.icon : '🔒'}</span><h2 className="mt-4 text-lg font-semibold">{badge.title}</h2><p className="mt-2 text-sm text-white/70">{badge.description}</p>
        <p className="mt-4 text-xs text-primaryHover">{unlocked[badge.id] ? `Unlocked · ${new Date(unlocked[badge.id]).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` : 'Chưa mở khóa'}</p>
      </Card>)}</div>
      {game.data.challengeAwards.length > 0 && <><h2 className="text-xl font-semibold">Weekly Challenge Badges</h2><div className="grid gap-4 sm:grid-cols-2">{game.data.challengeAwards.map(badge => <Card key={badge.week}><h3 className="font-semibold">🏆 {badge.title}</h3><p className="mt-2 text-sm text-white/70">Tuần {badge.week} · {new Date(badge.unlockedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p></Card>)}</div></>}
      </>}
    <Button variant="secondary" onClick={() => void game.refresh()}>Làm mới</Button>
  </main></AppShellBackground>;
}