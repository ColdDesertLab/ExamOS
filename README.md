# ExamOS — VWO Eindexamen Training System

**Point Harvesting Machine** — een persoonlijk examentrainingssysteem gebouwd voor VWO eindexamens 2026.

## Live

- **App**: [exam-os-three.vercel.app](https://exam-os-three.vercel.app)
- **Login**: Jussi / Jones2026!
- **Database**: Supabase (eu-west-2, project `gtnextikrykzowqvlxkb`)

## Tech Stack

- **Frontend**: Single HTML file (~5800 regels), vanilla JS, geen frameworks
- **Styling**: CSS custom properties, dark/light/auto theme, responsive (mobile/tablet/desktop)
- **Data**: localStorage + Supabase cloud sync (auto-save elke 2s + elke 5 min)
- **AI**: Anthropic Claude API + OpenAI API (optioneel) — voor nakijken, quiz, studieassistent
- **Hosting**: Vercel (static deploy)
- **Repo**: GitHub private (ColdDesertLab/ExamOS)

## Architectuur

Alles zit in één bestand: `index.html` (= kopie van `ExamOS_v4.html`).

### 12 Pagina's

| Pagina | Nav | Functie |
|--------|-----|---------|
| Vandaag | ▶ | Dagelijkse sessie: focus topic, timer, scores, fouten, dag afsluiten |
| Dashboard | ▦ | Overzicht: cijfertabel, subject cards, weekoverzicht, foutenpatronen |
| Planning | ◫ | Examenrooster, studielast analyse, sessie-overzicht, herberekenen |
| Logboek | ◎ | Alle afgeronde sessies met scores en tijden |
| Foutenlog | ◯ | F1-F8 foutcodes, filteren per vak/code |
| Examenanalyse | ◻ | CE resultaten per vak, trend |
| AI Nakijken | ◈ | Upload examen + antwoordmodel → AI grading per vraag |
| Notities & Quiz | ▤ | Studienotities, foutherhaling (flashcards), AI quiz generator |
| Stof & Topics | ≡ | Topic configuratie per vak + AI samenvattingen |
| Links & Info | ↗ | Examenwebsites, formulebladen, benodigdheden, strategie tips |
| Handleiding | ? | Volledige gebruikershandleiding in het Nederlands |
| Instellingen | ⊡ | API keys, SE cijfers, export/import, reset |

### State Object (localStorage + Supabase)

```javascript
{
  settings: { name, examDate, apiKey, openaiKey },
  subjects: [{ id, name, priority, color, grade, examDate, examTime, examDuration }],
  topics: { [subjectId]: ['topic1', 'topic2', ...] },
  studyLog: [{ id, date, subjectId, topic, exerciseScore, examScore, timeSpentMin }],
  mistakeLog: [{ id, date, subjectId, topic, questionNum, code, description, action }],
  examResults: [{ id, subjectId, year, ceGrade, score, maxScore, weakTopics, source }],
  notes: [{ id, date, subjectId, title, body }],
  planning: [{ id, date, subjectId, topic, type, lastScore, reason, done, sessionMins }],
}
```

### Planning Engine

De planner is **examen-bewust** en **score-optimiserend**:

- **Score optimalisatie**: vakken waar de meeste eindcijfer-punten te winnen zijn krijgen prioriteit
- **Examen-eve**: dag vóór elk examen = verplicht dat vak herhalen
- **Dubbele sessies**: examenweek → 2 sessies/dag (kortere duur per sessie)
- **Examendag**: geen studie (of alleen lichte review)
- **Post-examen**: kortere sessies (minder energie)
- **Starvation-preventie**: elk vak krijgt minimaal 1 sessie per 7 dagen
- **Comprehensie feedback**: lang gestudeerd + laag resultaat → eerder herpland

### Examenrooster CSE 1e tijdvak 2026

| Datum | Vak | Tijd |
|-------|-----|------|
| ma 11 mei | Geschiedenis | 09:00-12:00 |
| ma 11 mei | Natuurkunde | 13:30-16:30 |
| di 12 mei | Nederlands | 13:30-16:30 |
| wo 13 mei | Wiskunde B | 13:30-16:30 |
| di 19 mei | Scheikunde | 13:30-16:30 |
| wo 20 mei | Engels | 13:30-16:00 |
| vr 22 mei | Biologie | 13:30-16:30 |
| wo 27 mei | Spaans | 13:30-16:00 |

### SE Cijfers (uitgangspunt)

| Vak | SE | Status |
|-----|-----|--------|
| Wiskunde B | 4.9 | ⚠ Kritiek |
| Natuurkunde | 5.4 | ⚠ Kritiek |
| Scheikunde | 5.4 | ⚠ Kritiek |
| Biologie | 5.8 | Risico |
| Geschiedenis | 6.4 | Goed |
| Spaans | 6.5 | Goed |
| Engels | 6.7 | Goed |
| Nederlands | 7.5 | Sterk |

### Supabase Setup

- **Project**: ExamOS (`gtnextikrykzowqvlxkb`)
- **Region**: eu-west-2
- **Tabel**: `examos_state` — single-row JSONB state blob
- **RLS**: open (single user, anon key)
- **Anon key**: hardcoded in HTML (acceptabel voor single-user app)

### Vercel Setup

- **Project**: exam-os
- **URL**: exam-os-three.vercel.app
- **Deploy**: `npx vercel deploy --prod` vanuit `/Users/dennisariens/exam-os/`
- **Build**: geen — static HTML

## Development

```bash
# Lokaal bewerken
cd /Users/dennisariens/exam-os/
# Bewerk ExamOS_v4.html
# Kopieer naar index.html
cp ExamOS_v4.html index.html

# Deploy
npx vercel deploy --prod

# Push naar GitHub
git add -A && git commit -m "beschrijving" && git push
```

### Bestanden

| Bestand | Functie |
|---------|---------|
| `index.html` | Live versie (Vercel serveert dit) |
| `ExamOS_v4.html` | Werkversie (bewerk dit bestand) |
| `CLAUDE.md` | Context voor Claude Code sessies |
| `README.md` | Dit bestand |

## Features Overzicht

### Timer (Pomodoro)
- 25/45/55/90 min presets + custom
- 5 min pauze elke 25 min focus
- Break overlay met stretch/water tips
- Tijd wordt gelogd bij dag afsluiten

### AI Grader
- Upload uitwerkingen (PDF/foto) + correctiemodel (PDF)
- Claude leest beide, scoort per vraag
- Berekent CE cijfer met N-term
- Voedt zwakke onderwerpen terug in planning
- Auto-populateert foutenlog

### Quiz Generator
- AI genereert meerkeuzevragen per vak
- Focust op zwakke punten uit foutenlog
- Begrippen + toepassingsvragen
- Directe feedback met uitleg

### Flashcard Review
- Automatisch uit foutenlog
- Fout → flip → juiste aanpak
- Rating: Opnieuw / Wist ik / Makkelijk
- "Opnieuw" kaarten gaan terug in de stapel

### Dag Afsluiten (2-stap)
- Stap 1: Review modal — scores, projectie, fouten, tijdsfeedback
- Stap 2: Bevestig → confetti animatie + comprehensie feedback
- Adaptieve herplanning op basis van resultaat

### Cross-device Sync
- Supabase cloud sync (auto)
- JSON export/import als backup
- Werkt op iMac, iPad, telefoon

### Login
- Session-based (per tab)
- Credentials: Jussi / Jones2026!
