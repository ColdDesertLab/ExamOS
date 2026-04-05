#!/usr/bin/env node
/**
 * ExamOS Bootstrap — generates fresh weighted plan and pushes to Supabase
 * Usage: node bootstrap.js
 */

const SUPABASE_URL = 'https://gtnextikrykzowqvlxkb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bmV4dGlrcnlrem93cXZseGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzAyMTgsImV4cCI6MjA5MDg0NjIxOH0.T9ibJ3Cy5xRIBGYaIbLEXuOCbkDnXKTMCsfkfGxOzvM';

const DEFAULT_SUBJECTS = [
  { id: 'hist',  name: 'Geschiedenis', priority: 'med',  color: 'hist', grade: 6.4, examDate: '2026-05-11', examTime: '09:00-12:00', examDuration: 180 },
  { id: 'phys',  name: 'Natuurkunde',  priority: 'high', color: 'phys', grade: 5.4, examDate: '2026-05-11', examTime: '13:30-16:30', examDuration: 180 },
  { id: 'nl',    name: 'Nederlands',   priority: 'med',  color: 'nl',   grade: 7.5, examDate: '2026-05-12', examTime: '13:30-16:30', examDuration: 180 },
  { id: 'math',  name: 'Wiskunde B',   priority: 'high', color: 'math', grade: 4.9, examDate: '2026-05-13', examTime: '13:30-16:30', examDuration: 180 },
  { id: 'chem',  name: 'Scheikunde',   priority: 'high', color: 'chem', grade: 5.4, examDate: '2026-05-19', examTime: '13:30-16:30', examDuration: 180 },
  { id: 'eng',   name: 'Engels',       priority: 'med',  color: 'eng',  grade: 6.7, examDate: '2026-05-20', examTime: '13:30-16:00', examDuration: 150 },
  { id: 'bio',   name: 'Biologie',     priority: 'high', color: 'bio',  grade: 5.8, examDate: '2026-05-22', examTime: '13:30-16:30', examDuration: 180 },
  { id: 'esp',   name: 'Spaans',       priority: 'med',  color: 'esp',  grade: 6.5, examDate: '2026-05-27', examTime: '13:30-16:00', examDuration: 150 },
];

const DEFAULT_TOPICS = {
  math: ['Functies en grafieken','Differentiëren','Integreren','Goniometrie','Logaritmen','Exponenten','Meetkunde','Statistiek','Kansen','Rijen & reeksen'],
  phys: ['Krachten & beweging','Energie & arbeid','Golven','Elektriciteit','Magnetisme','Quantumfysica','Warmteleer','Optica','Kern & straling','Relativiteit'],
  chem: ['Molberekeningen','Reactievergelijkingen','Zuren & basen','Redox','Evenwichten','Organische chemie','Gassen','Bindingen','Elektrolyse','Reactiesnelheid'],
  bio: ['Cellen & transport','DNA & erfelijkheid','Evolutie','Ecosystemen','Hormonen & zenuwen','Fotosynthese','Celademhaling','Bloedstolling','Immuniteit','Voortplanting'],
  hist: ['Tijdvakken','Bronnenleer','Eerste Wereldoorlog','Tweede Wereldoorlog','Koude Oorlog','Dekolonisatie','Europese integratie','Nederlandse politiek','Thema\'s','Begrippen'],
  eng: ['Reading comprehension','Writing skills','Grammar','Vocabulary','Listening','Speaking','Idioms','Text types','Argumentation','Summary writing'],
  nl: ['Tekstbegrip','Schrijfvaardigheid','Grammatica','Woordenschat','Argumenteren','Samenvatten','Brief schrijven','Literatuur','Spelling','Zinsbouw'],
  esp: ['Comprensión lectora','Gramática','Vocabulario','Escritura','Conversación','Expresiones','Tiempos verbales','Subjuntivo','Textos','Cultura'],
};

// ═══ Helpers ═══
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function buildExamMaps(subjects) {
  const examDayMap = {};
  const examEveMap = {};
  subjects.forEach(s => {
    if (!s.examDate) return;
    if (!examDayMap[s.examDate]) examDayMap[s.examDate] = [];
    examDayMap[s.examDate].push(s.id);
    const eve = addDays(s.examDate, -1);
    if (!examEveMap[eve]) examEveMap[eve] = [];
    examEveMap[eve].push(s.id);
  });
  return { examDayMap, examEveMap };
}

function getDayContext(cursor, d, subjects, examDayMap, examEveMap) {
  const dow = d.getDay();
  const isSaturday = dow === 6;
  const examsToday = examDayMap[cursor] || [];
  const isExamDay = examsToday.length > 0;
  const isDoubleExamDay = examsToday.length >= 2;
  const yesterday = addDays(cursor, -1);
  const examsYesterday = examDayMap[yesterday] || [];
  const isPostExamDay = examsYesterday.length > 0;
  const isPostDoubleExam = examsYesterday.length >= 2;
  const eveSubjects = examEveMap[cursor] || [];
  const closestExamDays = Math.min(...subjects.map(s => {
    const ed = new Date((s.examDate||'2026-05-31')+'T12:00:00');
    return Math.max(0, (ed - d) / 86400000);
  }).filter(x => x > 0));

  let maxSlots, sessionMins, reason;
  if (isDoubleExamDay) { maxSlots = 0; sessionMins = 0; reason = 'Dubbel examendag'; }
  else if (isExamDay) { maxSlots = 1; sessionMins = 45; reason = 'Examendag'; }
  else if (isPostDoubleExam) { maxSlots = 1; sessionMins = 45; reason = 'Hersteldag na dubbel examen'; }
  else if (isPostExamDay) { maxSlots = 2; sessionMins = 45; reason = 'Na examen'; }
  else if (eveSubjects.length >= 2) { maxSlots = 2; sessionMins = 60; reason = 'Morgen dubbel examen'; }
  else if (eveSubjects.length === 1) { maxSlots = 2; sessionMins = 60; reason = 'Morgen examen'; }
  else if (isSaturday) { maxSlots = 2; sessionMins = 75; reason = 'Zaterdag'; }
  else if (dow === 0) { maxSlots = 1; sessionMins = 60; reason = 'Zondag — lichte sessie'; }
  else if (closestExamDays <= 7) { maxSlots = 2; sessionMins = 55; reason = 'Examenweek'; }
  else { maxSlots = 1; sessionMins = 90; reason = ''; }

  return { maxSlots, sessionMins, eveSubjects, examsToday, isExamDay, isPostExamDay, closestExamDays, reason };
}

function calcUrgency(subj, onDate) {
  const examD = new Date((subj.examDate || '2026-05-31') + 'T12:00:00');
  const refD  = new Date(onDate + 'T12:00:00');
  const daysLeft = Math.max(1, (examD - refD) / 86400000);
  const gradeScore = subj.grade || 6;
  const priorityMult = subj.priority === 'high' ? 1.4 : 1.0;
  return (gradeScore / priorityMult) * Math.log(daysLeft + 1);
}

// ═══ Generate weighted plan ═══
function generatePlan() {
  const plan = [];
  const today = todayStr();
  const subjs = DEFAULT_SUBJECTS;
  const lastExamDate = subjs.reduce((l, s) => s.examDate > l ? s.examDate : l, '2026-05-11');
  const lastExamMs = new Date(lastExamDate + 'T12:00:00').getTime();
  const { examDayMap, examEveMap } = buildExamMaps(subjs);

  // Count total slots
  let totalSlots = 0;
  let cursor = today;
  const daySlotList = [];
  for (let day = 0; day < 90; day++) {
    const d = new Date(cursor + 'T12:00:00');
    if (d.getTime() > lastExamMs) break;
    const ctx = getDayContext(cursor, d, subjs, examDayMap, examEveMap);
    if (ctx.maxSlots > 0) {
      daySlotList.push({ date: cursor, d, ctx });
      totalSlots += ctx.maxSlots;
    }
    cursor = addDays(cursor, 1);
  }

  // Calculate weights
  const weights = {};
  let totalWeight = 0;
  subjs.forEach(s => {
    const examD = new Date((s.examDate || '2026-05-31') + 'T12:00:00');
    const daysLeft = Math.max(1, (examD - new Date(today + 'T12:00:00')) / 86400000);
    const se = s.grade ?? 6;
    const deficit = Math.max(0, 6.5 - se);
    const timePressure = Math.sqrt(36 / daysLeft);
    const w = Math.max(0.3, deficit * 1.5 + 0.5) * timePressure;
    weights[s.id] = w;
    totalWeight += w;
  });

  // Slot budgets
  const budget = {};
  const scheduled = {};
  const lastSched = {};
  subjs.forEach(s => {
    budget[s.id] = Math.round((weights[s.id] / totalWeight) * totalSlots);
    scheduled[s.id] = 0;
    lastSched[s.id] = '';
  });

  console.log('\n📊 Slot budget per vak:');
  subjs.forEach(s => {
    const pct = ((budget[s.id] / totalSlots) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(budget[s.id] / 2));
    console.log(`  ${s.name.padEnd(14)} SE ${s.grade} → ${String(budget[s.id]).padStart(2)} sessies (${pct}%) ${bar}`);
  });
  console.log(`  ${'TOTAAL'.padEnd(14)}         ${totalSlots} slots beschikbaar\n`);

  // Distribute
  let added = 0;
  daySlotList.forEach(({ date, d, ctx }) => {
    const available = subjs.filter(s => {
      const ed = new Date((s.examDate || '2026-05-31') + 'T12:00:00');
      return ed > d && !ctx.examsToday.includes(s.id) && weights[s.id] > 0;
    });
    if (!available.length) return;

    const queue = [];
    const used = new Set();

    ctx.eveSubjects.forEach(sid => {
      if (queue.length >= ctx.maxSlots || used.has(sid)) return;
      const s = subjs.find(x => x.id === sid);
      if (!s || ctx.examsToday.includes(sid)) return;
      queue.push({ subj: s, topic: 'Laatste herhaling', type: 'exam', reason: `⚡ Dag voor examen ${s.name}` });
      used.add(sid);
    });

    if (queue.length < ctx.maxSlots) {
      const candidates = available.filter(s => !used.has(s.id));
      candidates.sort((a, b) => {
        const budgetLeftA = budget[a.id] - scheduled[a.id];
        const budgetLeftB = budget[b.id] - scheduled[b.id];
        const edA = new Date((a.examDate || '2026-05-31') + 'T12:00:00');
        const edB = new Date((b.examDate || '2026-05-31') + 'T12:00:00');
        const daysA = Math.max(1, (edA - d) / 86400000);
        const daysB = Math.max(1, (edB - d) / 86400000);
        const gapA = lastSched[a.id] ? (d - new Date(lastSched[a.id] + 'T12:00:00')) / 86400000 : 999;
        const gapB = lastSched[b.id] ? (d - new Date(lastSched[b.id] + 'T12:00:00')) / 86400000 : 999;
        const idealGapA = daysA / Math.max(1, budgetLeftA);
        const idealGapB = daysB / Math.max(1, budgetLeftB);
        const overdueA = gapA >= idealGapA ? 1 : 0;
        const overdueB = gapB >= idealGapB ? 1 : 0;
        if (overdueA !== overdueB) return overdueB - overdueA;
        return calcUrgency(a, date) - calcUrgency(b, date);
      });
      candidates.forEach(s => {
        if (queue.length >= ctx.maxSlots || used.has(s.id)) return;
        if (scheduled[s.id] >= budget[s.id]) {
          const othersHaveBudget = candidates.some(c => !used.has(c.id) && scheduled[c.id] < budget[c.id]);
          if (othersHaveBudget) return;
        }
        queue.push({ subj: s });
        used.add(s.id);
      });
    }

    queue.forEach((q, slot) => {
      const subj = q.subj;
      const topics = DEFAULT_TOPICS[subj.id] || ['Algemeen'];
      const topic = q.topic || topics[scheduled[subj.id] % topics.length];
      const sessCount = scheduled[subj.id];
      const examFreq = subj.grade < 5.5 ? 3 : 4;
      const examD = new Date((subj.examDate || '2026-05-31') + 'T12:00:00');
      const daysLeft = Math.ceil((examD - d) / 86400000);
      const sessType = q.type || (daysLeft <= 5 ? 'exam' : d.getDay() === 6 ? 'exam' : (sessCount % examFreq === examFreq - 1 ? 'exam' : 'study'));
      const budgetInfo = `${scheduled[subj.id]+1}/${budget[subj.id]}`;
      let reason = q.reason || (subj.grade < 5.5 ? `⚠ Kritiek [${budgetInfo}] — ${daysLeft}d` :
                                subj.grade < 6.0 ? `Risico [${budgetInfo}] — ${daysLeft}d` :
                                `[${budgetInfo}] ${daysLeft}d tot examen`);
      if (ctx.reason) reason += ` · ${ctx.reason}`;

      plan.push({
        id: `pi_${added}_${slot}`, date, subjectId: subj.id, topic,
        type: sessType, lastScore: null, reason, done: false,
        sessionMins: ctx.sessionMins,
      });
      scheduled[subj.id]++;
      lastSched[subj.id] = date;
      added++;
    });
  });

  console.log(`✅ ${plan.length} sessies gegenereerd, startdatum: ${today}\n`);

  // Show first 7 days
  const first7 = [...new Set(plan.map(p => p.date))].slice(0, 7);
  first7.forEach(date => {
    const sessions = plan.filter(p => p.date === date);
    const dow = new Date(date + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short' });
    console.log(`  ${dow} ${date}: ${sessions.map(s => {
      const subj = subjs.find(x => x.id === s.subjectId);
      return `${subj.name} (${s.topic})`;
    }).join(' + ')}`);
  });
  console.log('  ...\n');

  return plan;
}

// ═══ Push to Supabase ═══
async function bootstrap() {
  console.log('🚀 ExamOS Bootstrap\n');
  console.log('Generating weighted study plan...');

  const plan = generatePlan();

  const freshState = {
    settings: { name: 'Student', examDate: '2026-05-11' },
    subjects: DEFAULT_SUBJECTS,
    topics: DEFAULT_TOPICS,
    studyLog: [],
    mistakeLog: [],
    examResults: [],
    notes: [],
    planning: plan,
    stars: 0,
    starLog: [],
    streak: { current: 0, best: 0, lastDate: '' },
  };

  console.log('Pushing fresh state to Supabase...');

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/examos_state?id=eq.default`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      state: freshState,
      updated_at: new Date().toISOString(),
      version: 1,
    }),
  });

  if (resp.ok) {
    console.log('✅ Supabase state reset with fresh plan');
    console.log('');
    console.log('ℹ️  Jussi moet:');
    console.log('   1. Browser openen → exam-os-three.vercel.app');
    console.log('   2. Als oude data zichtbaar: F12 → Console → localStorage.clear() → refresh');
    console.log('   3. Of: Planning → Herberekenen (herlaadt met nieuw gewogen systeem)');
    console.log('');
    console.log('🎯 Klaar! Vandaag is dag 1.');
  } else {
    console.error('❌ Supabase push failed:', resp.status, await resp.text());
  }
}

bootstrap().catch(console.error);
