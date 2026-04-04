# ExamOS — VWO Eindexamen Training System

**Point Harvesting Machine** — een persoonlijk examentrainingssysteem gebouwd voor VWO eindexamens 2026.

## Live

- **App**: [exam-os-three.vercel.app](https://exam-os-three.vercel.app)
- **Login**: Jussi / Jones2026!
- **Database**: Supabase (eu-west-2, project `gtnextikrykzowqvlxkb`)
- **Repo**: [github.com/ColdDesertLab/ExamOS](https://github.com/ColdDesertLab/ExamOS) (private)

## Tech Stack

| Laag | Technologie |
|------|-------------|
| Frontend | Single HTML file (~5800 regels), vanilla JS, geen frameworks |
| Styling | CSS custom properties, dark/light/auto theme, responsive (mobile/tablet/desktop) |
| Data | localStorage + Supabase cloud sync (auto-save elke 2s + elke 5 min) |
| AI | Anthropic Claude API + OpenAI API (optioneel) |
| Hosting | Vercel (static deploy, gratis) |
| Database | Supabase PostgreSQL (gratis tier) |

## Architectuur

Alles zit in één bestand: `index.html` (= kopie van `ExamOS_v4.html`).

### 12 Pagina's

| Pagina | Nav | Functie |
|--------|-----|---------|
| Vandaag | ▶ | Dagelijkse sessie: focus topic, Pomodoro timer, scores, fouten, 2-stap dag afsluiten |
| Dashboard | ▦ | Cijfertabel (SE/CE/Projectie), subject cards, weekoverzicht, foutenpatronen, totale studietijd |
| Planning | ◫ | Dynamisch examenrooster, studielast analyse per vak, alle sessies t/m laatste examen |
| Logboek | ◎ | Alle afgeronde sessies met scores en tijden |
| Foutenlog | ◯ | F1-F8 foutcodes, filteren per vak/code |
| Examenanalyse | ◻ | CE resultaten per vak, trend |
| AI Nakijken | ◈ | Upload examen + antwoordmodel → AI grading per vraag → auto foutenlog |
| Notities & Quiz | ▤ | Studienotities, foutherhaling (flashcards), AI quiz generator (MC) |
| Stof & Topics | ≡ | Topic configuratie per vak, AI samenvattingen (Claude of GPT) |
| Links & Info | ↗ | Examenwebsites, oude examens per jaar, formulebladen, benodigdheden checklist, strategie tips, AI studieassistent |
| Handleiding | ? | Volledige gebruikershandleiding in het Nederlands |
| Instellingen | ⊡ | API keys (Anthropic + OpenAI), SE cijfers, export/import JSON, 2-stap reset |

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

## Planning Engine

De planner is **examen-bewust** en **score-optimiserend**:

### Score Optimalisatie
- **Punt-opbrengst model**: vakken waar 1 extra studiesessie de meeste eindcijfer-punten oplevert krijgen prioriteit
- Wiskunde B (SE 4.9) heeft de hoogste potentiële opbrengst → krijgt de meeste sessies
- Nederlands (SE 7.5) heeft lage opbrengst → krijgt onderhoudssessies

### Examen-bewuste Scheduling

| Dagtype | Slots | Duur/sessie | Logica |
|---------|-------|-------------|--------|
| Normale studiedag | 1 | 90 min | Volle focus |
| Zaterdag | 2 | 75 min | Dubbele sessie, iets korter |
| Examenweek (≤7d tot examen) | 2 | 55 min | Intensief, 2 vakken per dag |
| Dag vóór 1 examen | 2 | 60 min | Examenvak verplicht + 2e vak |
| Dag vóór dubbel examen | 2 | 60 min | Beide examenvakken herhalen |
| Examendag (1 examen) | 1 | 45 min | Alleen lichte ochtend-review |
| Dubbele examendag (11 mei) | 0 | — | Geen studie |
| Dag ná examen | 2 | 45 min | Minder energie, kortere sessies |
| Dag ná dubbel examen | 1 | 45 min | Hersteldag |
| Zondag | 0 | — | Rust |

### Adaptieve Herplanning
- **Starvation-preventie**: elk vak minimaal 1 sessie per 7 dagen
- **Comprehensie feedback**: lang gestudeerd (>60 min) + laag resultaat (<6.0) → eerder herpland
- **AI Grader integratie**: zwakke onderwerpen uit nakijken worden automatisch ingepland

## Examenrooster CSE 1e tijdvak 2026

| Datum | Vak | Tijd | SE | Status |
|-------|-----|------|----|--------|
| ma 11 mei | Geschiedenis | 09:00-12:00 | 6.4 | Goed |
| ma 11 mei | Natuurkunde | 13:30-16:30 | 5.4 | ⚠ Kritiek |
| di 12 mei | Nederlands | 13:30-16:30 | 7.5 | Sterk |
| wo 13 mei | Wiskunde B | 13:30-16:30 | 4.9 | ⚠ Kritiek |
| di 19 mei | Scheikunde | 13:30-16:30 | 5.4 | ⚠ Kritiek |
| wo 20 mei | Engels | 13:30-16:00 | 6.7 | Goed |
| vr 22 mei | Biologie | 13:30-16:30 | 5.8 | Risico |
| wo 27 mei | Spaans | 13:30-16:00 | 6.5 | Goed |

## Features

### Timer (Pomodoro)
- 25/45/55/90 min presets + custom invoer
- 5 min pauze elke 25 min focus (fullscreen break overlay)
- Tijd wordt automatisch gelogd bij dag afsluiten
- Browser title toont countdown

### AI Grader
- Upload uitwerkingen (PDF/foto) + correctiemodel (PDF van examenblad.nl)
- Claude scoort per vraag, berekent CE cijfer met N-term
- Auto-populateert foutenlog (detecteert fouttype: F1-F8)
- Voedt zwakke onderwerpen terug in planning
- Toont projected eindcijfer (SE + CE) / 2

### Quiz Generator
- AI genereert meerkeuzevragen (A/B/C/D) per vak
- Focust op zwakke punten uit foutenlog
- Begrippen + toepassingsvragen
- Directe feedback met uitleg per vraag
- Score samenvatting

### AI Studieassistent
- Chat met Claude/GPT over examenstof
- 4 modes: Leg uit / Geef voorbeeld / Maak oefenvraag / Examentip
- Gebruikt foutenpatronen als context
- Per vak beschikbaar

### Flashcard Review
- Automatisch gegenereerd uit foutenlog
- Fout → flip → juiste aanpak
- Rating: Opnieuw / Wist ik / Makkelijk
- "Opnieuw" kaarten gaan terug in de stapel

### Formulebladen
- Ingebouwde formule-overzichten voor Wiskunde B, Natuurkunde, Scheikunde, Biologie
- VWO eindexamen niveau

### Oude Examens
- Directe links naar examenblad.nl per vak per jaar (2018-2024)
- Correcte URL structuur: `examenblad.nl/{jaar}/vwo/vakken/{categorie}/{vak-vwo}`
- 2020 gemarkeerd als niet beschikbaar (COVID)
- Examenkompas links per vak

### Dag Afsluiten (2-stap)
1. Review modal: scores, projected eindcijfer, fouten, tijdsfeedback, herplanningspreview
2. Bevestig → confetti animatie + comprehensie feedback + adaptieve herplanning

### Benodigdheden Checklist
- Per categorie: schrijfmateriaal, wiskunde (GR, geodriehoek), BINAS, talen, algemeen
- Checkboxes om af te vinken

### Cross-device Sync
- Supabase cloud sync (automatisch, debounced)
- JSON export/import als backup
- Werkt op iMac, iPad, telefoon
- Sync indicator in sidebar

### Login & Beveiliging
- Session-based login (per browser tab)
- Credentials: Jussi / Jones2026!
- Uitlogknop in sidebar
- 2-stap reset (typ "RESET" om te bevestigen)

### Theme
- Dark / Light / Auto (volgt systeem)
- Pill-toggle in sidebar
- Responsive: sidebar collapse op mobile, grid stacking

### Push Notifications
- 09:00 — dagelijkse herinnering
- 14:00 — middag check als sessie niet af is
- 19:00 — avond herinnering als nog niet gedaan

## Infrastructure

### Supabase
- **Project**: ExamOS (`gtnextikrykzowqvlxkb`)
- **Region**: eu-west-2 (London)
- **Tabel**: `examos_state` — single-row JSONB state blob
- **RLS**: open (single user, anon key)
- **Kosten**: gratis tier

### Vercel
- **Project**: exam-os
- **URL**: exam-os-three.vercel.app
- **Deploy**: `npx vercel deploy --prod`
- **Build**: geen — static HTML
- **Kosten**: gratis hobby tier

### GitHub
- **Repo**: ColdDesertLab/ExamOS (private)
- **Branch**: master

## Development

```bash
cd /Users/dennisariens/exam-os/

# Bewerk het werkbestand
# (ExamOS_v4.html)

# Kopieer, commit, deploy, push
cp ExamOS_v4.html index.html
git add -A && git commit -m "beschrijving"
npx vercel deploy --prod
git push
```

### Bestanden

| Bestand | Functie |
|---------|---------|
| `index.html` | Live versie (Vercel serveert dit) |
| `ExamOS_v4.html` | Werkversie (bewerk dit bestand) |
| `CLAUDE.md` | Context voor Claude Code sessies |
| `README.md` | Dit bestand |

### Validatie Script

```bash
python3 -c "
import re
with open('ExamOS_v4.html') as f: html = f.read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
o = sum(s.count('{') for s in scripts)
c = sum(s.count('}') for s in scripts)
print(f'Braces: {o}/{c} diff={o-c}')
pages = re.findall(r'id=\"page-(\w+)\"', html)
navs = list(set(re.findall(r\"showPage\(.*?(\w+).*?\)\", html)))
print(f'Pages: {len(pages)}, Navs: {len(navs)}')
"
```

## Foutcodes

| Code | Beschrijving | Standaard actie |
|------|-------------|-----------------|
| F1 | Formule vergeten | Persoonlijk formuleblad maken |
| F2 | Rekenfout | Elke stap uitschrijven |
| F3 | Vraag verkeerd gelezen | Key data onderstrepen voor oplossen |
| F4 | Conceptueel misverstand | Theorie herlezen, hardop uitleggen |
| F5 | Tijdgebrek | Getimede oefenruns, 1 min per punt |
| F6 | Eenheden vergeten | Altijd eenheden in uitwerking |
| F7 | Grafiek verkeerd gelezen | Dagelijks grafiek oefenen |
| F8 | Afronden / significante cijfers | Significante cijfers noteren bij start |
