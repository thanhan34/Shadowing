import { randomUUID } from 'node:crypto';
import { firebaseAdmin } from '../firebaseAdmin';
import { advanceMastery, MasteryQuestion } from './mastery';
import { evaluateWriteFromDictation } from '../../utils/writefromdictationScoring';
import { ACHIEVEMENTS, calendar, calculateWfdXp, Challenge, challengeIncrement, compareRanks, dayDistance,
  emptyProfile, MILESTONES, Profile, visibleStreak, WeeklyEntry, XP_RULES } from './rules';

export class WfdError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const root = () => firebaseAdmin().db.collection('_wfd');
const userRef = (uid: string) => root().doc('users').collection('profiles').doc(uid);
const weekRef = (week: string) => root().doc('weeks').collection('items').doc(week);
export const challengeRef = (week: string) => root().doc('challenges').collection('items').doc(week);
export async function startAttempt(uid: string, questionId: string) {
  const db = firebaseAdmin().db;
  const id = randomUUID();
  const pRef = userRef(uid);
  await db.runTransaction(async tx => {
    const [question, profile] = await Promise.all([
      tx.get(db.collection('writefromdictation').doc(questionId)), tx.get(pRef),
    ]);
    if (!question.exists || question.data()?.isHidden !== false || !question.data()?.text) throw new WfdError(404, 'Không tìm thấy câu WFD.');
    const now = Date.now();
    if (now - (profile.data()?.lastStartAt || 0) < 1000) throw new WfdError(429, 'Vui lòng chờ trước khi bắt đầu lượt mới.');
    tx.set(pRef, { lastStartAt: now }, { merge: true });
    tx.create(pRef.collection('tickets').doc(id), { questionId, startedAt: now });
  });
  return { attemptId: id };
}

export async function submitAttempt(uid: string, identity: { name: string; avatar: string }, attemptId: string, answer: string) {
  const db = firebaseAdmin().db;
  const pRef = userRef(uid);
  return db.runTransaction(async tx => {
    const ticketRef = pRef.collection('tickets').doc(attemptId);
    const aRef = pRef.collection('attempts').doc(attemptId);
    const [ticketDoc, previous, profileDoc] = await Promise.all([tx.get(ticketRef), tx.get(aRef), tx.get(pRef)]);
    if (previous.exists) return { ...previous.data(), duplicate: true };
    if (!ticketDoc.exists) throw new WfdError(400, 'Lượt luyện không hợp lệ. Hãy thử lại.');
    const ticket = ticketDoc.data()!;
    const now = Date.now();
    const { day, week } = calendar(now);
    const p: Profile = { ...emptyProfile(), ...profileDoc.data() };
    const dRef = pRef.collection('days').doc(day);
    const qRef = pRef.collection('questions').doc(ticket.questionId);
    const wRef = weekRef(week).collection('entries').doc(uid);
    const progressRef = pRef.collection('challenges').doc(week);
    const mRef = pRef.collection('mastery').doc('summary');
    const [questionDoc, dayDoc, questionProgress, weeklyDoc, challengeDoc, progressDoc, masteryDoc] = await Promise.all([
      tx.get(db.collection('writefromdictation').doc(ticket.questionId)), tx.get(dRef), tx.get(qRef),
      tx.get(wRef), tx.get(challengeRef(week)), tx.get(progressRef), tx.get(mRef),
    ]);
    if (!questionDoc.exists || questionDoc.data()?.isHidden !== false) throw new WfdError(404, 'Câu WFD không còn khả dụng.');
    const question = questionDoc.data()!;
    const scored = evaluateWriteFromDictation(question.text, answer);
    // Penalize extra words for gamification only; preserve the existing WFD score UI.
    const accuracy = scored.maxScore ? 100 * scored.score / Math.max(scored.maxScore, scored.normalizedInputWords.length) : 0;
    const d = { goal: p.goal, practiced: 0, rewarded: false, ...dayDoc.data() };
    const qp = { day, count: 0, mastered: false, ...questionProgress.data() };
    const count = qp.day === day ? qp.count : 0;
    const reason = !scored.normalizedInputWords.length ? 'empty' : now - ticket.startedAt < XP_RULES.minimumMs || now - p.lastSubmitAt < XP_RULES.minimumMs
      ? 'too-fast' : now - ticket.startedAt > 2 * 3600000 ? 'expired' : count >= XP_RULES.maxPerQuestion ? 'daily-limit' : null;
    const eligible = reason === null;
    const mastery = eligible && accuracy === 100 && !qp.mastered;
    const practiceXp = calculateWfdXp(accuracy, eligible, mastery);
    let xp = practiceXp;
    const celebrations: string[] = [];
    const newBadges: string[] = [];
    const w: WeeklyEntry = { userId: uid, ...identity, xp: 0, practiced: 0, attempts: 0, accuracySum: 0,
      reachedAt: now, currentStreak: 0, lastCompletedDate: '', ...weeklyDoc.data() };
    w.attempts++;
    if (eligible) {
      const questions = { ...(masteryDoc.data()?.questions || {}) } as Record<string, MasteryQuestion>;
      // Bounded Phase 1 summary. Separate from the historical one-perfect-answer XP flag.
      if (questions[ticket.questionId] || Object.keys(questions).length < 2000) {
        const previousMastery = questions[ticket.questionId];
        questions[ticket.questionId] = advanceMastery(previousMastery, accuracy === 100, now);
        tx.set(mRef, { questions, updatedAt: now,
          lastReviewedAt: previousMastery && previousMastery.nextReviewAt <= now ? now : masteryDoc.data()?.lastReviewedAt || 0 });
      }
      const comeback = p.lastActiveDate ? dayDistance(day, p.lastActiveDate) - 1 : 0;
      p.practiced++;
      p.perfectRun = accuracy === 100 ? p.perfectRun + 1 : 0;
      d.practiced++;
      if (d.practiced >= d.goal && !d.rewarded) {
        d.rewarded = true;
        xp += XP_RULES.dailyGoal;
        p.currentStreak = p.lastCompletedDate && dayDistance(day, p.lastCompletedDate) === 1 ? p.currentStreak + 1 : 1;
        p.longestStreak = Math.max(p.longestStreak, p.currentStreak);
        p.lastCompletedDate = day;
        celebrations.push('🎉 Daily Goal Completed');
        if (MILESTONES.includes(p.currentStreak) && !p.milestones.includes(p.currentStreak)) {
          p.milestones.push(p.currentStreak);
          xp += XP_RULES.streakRewards[p.currentStreak] || 0;
          celebrations.push(`🔥 ${p.currentStreak} DAY STREAK — Bạn đã hoàn thành goal ${p.currentStreak} ngày liên tiếp!`);
        }
      }
      const values = { practiced: p.practiced, perfectRun: p.perfectRun, streak: visibleStreak(p, day), comeback };
      for (const badge of ACHIEVEMENTS) {
        if (!p.unlocked[badge.id] && values[badge.requirementType] >= badge.requirementValue) {
          p.unlocked[badge.id] = new Date(now).toISOString();
          xp += badge.xpReward;
          newBadges.push(badge.title);
        }
      }
      if (challengeDoc.exists) {
        const challenge = challengeDoc.data() as Challenge;
        const progress = { value: 0, rewarded: false, unlockedAt: '', lastDay: '', ...progressDoc.data() };
        progress.value += challengeIncrement(challenge, { accuracy, topic: question.topic || 'General', xp: practiceXp, firstDay: progress.lastDay !== day, mastery });
        progress.lastDay = day;
        if (!progress.rewarded && progress.value >= challenge.target) {
          progress.rewarded = true;
          progress.unlockedAt = new Date(now).toISOString();
          xp += challenge.rewardXp;
          celebrations.push(`🏆 ${challenge.title} hoàn thành!`);
        }
        tx.set(progressRef, { ...progress, badgeTitle: challenge.badgeTitle });
      }
      p.lastActiveDate = day;
      w.practiced++;
      w.accuracySum += accuracy;
      w.xp += xp;
      w.reachedAt = now;
      tx.set(qRef, { day, count: count + 1, mastered: qp.mastered || mastery });
    }
    p.lastSubmitAt = now;
    p.totalXp += xp;
    w.currentStreak = visibleStreak(p, day);
    w.lastCompletedDate = p.lastCompletedDate;
    w.name = identity.name;
    w.avatar = identity.avatar;
    const result = { attemptId, questionId: ticket.questionId, day, week, createdAt: now, answer,
      accuracy, xp, practiceXp, eligible, reason, celebrations, newBadges, ruleVersion: XP_RULES.version };
    tx.create(aRef, result);
    tx.set(pRef, p, { merge: true });
    tx.set(dRef, d);
    tx.set(wRef, w);
    return { ...result, duplicate: false };
  });
}

export async function getDashboard(uid: string) {
  const { day, week } = calendar();
  const pRef = userRef(uid);
  // Keep every weekly participant, including zero-XP attempts, in the same ranking snapshot.
  return firebaseAdmin().db.runTransaction(async tx => {
    const [profileDoc, dayDoc, entries, challengeDoc, progressDoc, snapshot, challengeAwards] = await Promise.all([
      tx.get(pRef), tx.get(pRef.collection('days').doc(day)), tx.get(weekRef(week).collection('entries')),
      tx.get(challengeRef(week)), tx.get(pRef.collection('challenges').doc(week)), tx.get(pRef.collection('ranks').doc(week)),
      tx.get(pRef.collection('challenges').where('rewarded', '==', true)),
    ]);
    const profile: Profile = { ...emptyProfile(), ...profileDoc.data() };
    profile.currentStreak = visibleStreak(profile, day);
    const ranked = entries.docs.map(doc => doc.data() as WeeklyEntry).sort(compareRanks).map((entry, index) => ({
      ...entry, rank: index + 1, accuracy: entry.practiced ? entry.accuracySum / entry.practiced : 0,
      currentStreak: entry.lastCompletedDate && dayDistance(day, entry.lastCompletedDate) <= 1 ? entry.currentStreak : 0,
    }));
    const me = ranked.find(entry => entry.userId === uid) || null;
    const above = me && me.rank > 1 ? ranked[me.rank - 2] : null;
    return { day, week, profile, today: { goal: profile.goal, practiced: 0, rewarded: false, ...dayDoc.data() },
      leaderboard: ranked, me, previousRank: snapshot.data()?.rank || null,
      nextRank: above ? { name: above.name, xpNeeded: above.xp - me!.xp + 1 } : null,
      challengeAwards: challengeAwards.docs.map(doc => ({ week: doc.id, title: doc.data().badgeTitle, unlockedAt: doc.data().unlockedAt })).filter(b => b.title),
      challenge: challengeDoc.exists ? { ...challengeDoc.data(), progress: progressDoc.data()?.value || 0, rewarded: progressDoc.data()?.rewarded || false } : null,
    };
  }, { readOnly: true });
}
export async function saveRankSnapshot(uid: string) {
  const data = await getDashboard(uid);
  if (data.me) await userRef(uid).collection('ranks').doc(data.week).set({ rank: data.me.rank, capturedAt: Date.now() });
  return { rank: data.me?.rank || null, week: data.week };
}
export async function setGoal(uid: string, goal: number) {
  const pRef = userRef(uid);
  // Freeze today's goal before updating the preference, even before the first attempt.
  await firebaseAdmin().db.runTransaction(async tx => {
    const dRef = pRef.collection('days').doc(calendar().day);
    const [p, d] = await Promise.all([tx.get(pRef), tx.get(dRef)]);
    if (!d.exists) tx.create(dRef, { goal: p.data()?.goal || 20, practiced: 0, rewarded: false });
    tx.set(pRef, { goal }, { merge: true });
  });
}