import Head from 'next/head';
import Link from 'next/link';
import AppShellBackground from '../../components/ui/AppShellBackground';
import Button from '../../components/ui/Button';
import { Leaderboard } from '../../components/writefromdictation/GamificationPanel';
import { useWfdGamification } from '../../hooks/useWfdGamification';
export default function WfdLeaderboard() {
  const game = useWfdGamification();
  return <AppShellBackground><Head><title>WFD Leaderboard · PTE Intensive</title></Head><main className="mx-auto max-w-5xl space-y-6 px-4 py-24 text-white/90">
    <Link className="inline-block p-3 accent-ring rounded-lg text-primaryHover" href="/writefromdictation">← Luyện WFD</Link>
    <h1 className="text-3xl font-bold">Weekly Leaderboard</h1>
    <p className="text-white/70">Tất cả học viên có lượt nộp bài WFD được ghi nhận trong tuần đều có mặt, kể cả khi chưa nhận XP. Luyện đều. Cùng nhau tiến bộ.</p>
    {game.error && <p role="alert">{game.error}</p>}{!game.data && !game.error && <p role="status">Đang tải…</p>}
    {game.data && <Leaderboard data={game.data} />}<Button variant="secondary" onClick={() => void game.refresh()}>Làm mới</Button>
  </main></AppShellBackground>;
}