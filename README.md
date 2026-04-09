# ExamOS — VWO Eindexamen Training System

**Point Harvesting Machine** — een persoonlijk examentrainingssysteem gebouwd voor VWO eindexamens 2026.

[![Live](https://img.shields.io/badge/live-exam--os--three.vercel.app-6c63ff?style=flat-square)](https://exam-os-three.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Built with Claude](https://img.shields.io/badge/built%20with-Claude%20Code-9d97ff?style=flat-square)](https://claude.com/claude-code)

> Gewogen studieplanner · AI nakijken · Foutenanalyse · Sterrengamification · Cloud sync

---

## 🚀 Getting Started

Er zijn drie manieren om ExamOS te gebruiken. Kies wat bij je past:

### 1. Online (aanbevolen) — Add to Home Screen

Open **[exam-os-three.vercel.app](https://exam-os-three.vercel.app)** in je browser en voeg toe aan je startscherm. Werkt op iPad, iPhone, macOS en Android.

| Apparaat | Stappen |
|----------|---------|
| **iPad / iPhone** | Safari → Delen-knop → "Zet op beginscherm" |
| **macOS** | Chrome → ⋮ menu → "ExamOS installeren" (verschijnt als app in Launchpad en Dock) |
| **macOS (Safari)** | Bestand → "Toevoegen aan Dock" |
| **Android** | Chrome → ⋮ menu → "App installeren" |

Na installatie heb je een icoon op je beginscherm/dock dat de app in standalone mode opent (zonder browser-balk). Data synchroniseert automatisch tussen al je apparaten via Supabase.

### 2. Self-host — One-liner installer

Voor een lokale versie op je iMac of MacBook:

```bash
curl -fsSL https://raw.githubusercontent.com/ColdDesertLab/ExamOS/master/install.sh | bash
examos
```

Dit:
- Cloned de repo naar `~/.examos`
- Installeert een launcher in `~/.local/bin/examos`
- Start een lokale server (`python3 -m http.server 8765`) en opent de app in je browser
- Auto-update op elke run (uitschakelen met `EXAMOS_NO_UPDATE=1`)

### 3. Manueel clonen

```bash
git clone https://github.com/ColdDesertLab/ExamOS.git
cd ExamOS
python3 -m http.server 8000
# open http://localhost:8000/ExamOS_v4.html
```

Of run `node bootstrap.js` om een vers gewogen plan naar Supabase te pushen.

---

## 📱 PWA Setup Walkthrough

### iPad / iPhone
1. Open **exam-os-three.vercel.app** in Safari
2. Tap op de deel-knop (vierkantje met pijl omhoog)
3. Scroll omlaag en tap **"Zet op beginscherm"**
4. Tap **"Voeg toe"** rechtsboven
5. ExamOS verschijnt als native app op je beginscherm — full-screen, eigen icoon, geen Safari-balk

### macOS (Chrome / Edge / Arc)
1. Open **exam-os-three.vercel.app** in Chrome
2. Klik op het ⋮-menu rechtsboven
3. Kies **"ExamOS installeren..."** (of het install-icoon in de adresbalk)
4. App verschijnt in je **Applications-map** en **Launchpad**
5. Sleep vanuit Launchpad naar je Dock voor permanente toegang

### macOS (Safari)
1. Open **exam-os-three.vercel.app** in Safari
2. **Bestand** → **"Toevoegen aan Dock..."**
3. Geef naam "ExamOS" → **Toevoegen**

### Android
1. Open in Chrome → ⋮ → **"App installeren"** of **"Toevoegen aan startscherm"**

---

## 🔄 Cross-device Sync

Eenmaal ingelogd worden al je data automatisch gesynchroniseerd via Supabase:
- iMac → sessie afronden → iPad ziet nieuwe scores binnen seconden
- Planning aanpassen op telefoon → dashboard op MacBook updatet automatisch
- Offline werken werkt ook — wijzigingen syncen zodra je weer verbinding hebt

Sync indicator in de sidebar toont real-time status.

---

## Tech Stack

| Laag | Technologie |
|------|-------------|
| Frontend | Single HTML file (~6500 regels), vanilla JS, geen frameworks |
| Styling | CSS custom properties, dark/light/auto theme, responsive (mobile/tablet/desktop) |
| Data | localStorage + Supabase cloud sync (auto-save elke 2s + elke 5 min) |
| AI | Anthropic Claude API + OpenAI API (optioneel) |
| Hosting | Vercel (static deploy, gratis) |
| Database | Supabase PostgreSQL (gratis tier) |
| PWA | Manifest.json + dynamisch gegenereerde canvas icons |

## Architectuur

Alles zit in één bestand: `index.html` (= kopie van `ExamOS_v4.html`).

### 12 Pagina's

| Pagina | Nav | Functie |
|--------|-----|---------|
| Vandaag | ▶ | Dagelijkse sessie: focus topic, Pomodoro timer, scores, fouten, 2-stap dag afsluiten |
| Dashboard | ▦ | Cijfertabel (SE/CE/Projectie), subject cards, weekoverzicht, foutenpatronen, totale studietijd, sterren/streak |
| Planning | ◫ | Dynamisch examenrooster, studielast analyse per vak, alle sessies t/m laatste examen |
| Logboek | ◎ | Alle afgeronde sessies met scores en tijden |
| Foutenlog | ◯ | F1-F8 foutcodes, filteren per vak/code |
| Examenanalyse | ◻ | CE resultaten per vak, trend |
| AI Nakijken | ◈ | Upload examen + antwoordmodel → AI grading per vraag → auto foutenlog |
| Notities & Quiz | ▤ | Studienotities, foutherhaling (flashcards), AI quiz generator (MC) |
| Stof & Topics | ≡ | Topic configuratie per vak, AI samenvattingen (Claude of GPT) |
| Links & Info | ↗ | Examenwebsites, oude examens per jaar, formulebladen, benodigdheden checklist, strategie tips, AI studieassistent |
| Handleiding | ? | Volledige gebruikershandleiding in het Nederlands |
| Instellingen | ⊡ | API keys, SE cijfers, studie verdeling (interactieve budget tabel), setup wizard, export/import JSON, 2-stap reset |

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
  stars: 0,
  starLog: [{ date, amount, reason }],
  streak: { current, best, lastDate },
  budgetOverrides: { [subjectId]: multiplier },
  wizardCompleted: true,
}
```

## Planning Engine

De planner is **examen-bewust**, **score-optimiserend** en gebruikt een **gewogen budget-systeem**:

### Gewogen Budget Systeem
Elk vak krijgt een sessie-budget op basis van:
- **Score deficit**: `max(0, 6.5 - huidig_niveau)` — zwakkere vakken krijgen meer sessies
- **Tijdsdruk**: `√(36 / dagen_tot_examen)` — eerdere examens krijgen front-loading
- **Handmatige override**: instelbaar via Instellingen (0.2x – 3.0x multiplier)

Voorbeeld verdeling (startdatum 5 april 2026):

| Vak | SE | Budget | Aandeel |
|-----|-----|--------|---------|
| Wiskunde B | 4.9 | 19 | 27% |
| Natuurkunde | 5.4 | 15 | 21% |
| Scheikunde | 5.4 | 13 | 18% |
| Biologie | 5.8 | 9 | 13% |
| Geschiedenis | 6.4 | 4 | 6% |
| Engels | 6.7 | 3 | 4% |
| Nederlands | 7.5 | 3 | 4% |
| Spaans | 6.5 | 3 | 4% |

Na elk examen vallen slots vrij → resterende vakken vullen die automatisch.

### Examen-bewuste Scheduling

| Dagtype | Slots | Duur/sessie | Logica |
|---------|-------|-------------|--------|
| Normale studiedag | 1 | 90 min | Volle focus |
| Zaterdag | 2 | 75 min | Dubbele sessie, iets korter |
| Zondag | 1 | 60 min | Lichte sessie |
| Examenweek (≤7d tot examen) | 2 | 55 min | Intensief, 2 vakken per dag |
| Dag vóór 1 examen | 2 | 60 min | Examenvak verplicht + 2e vak |
| Dag vóór dubbel examen | 2 | 60 min | Beide examenvakken herhalen |
| Examendag (1 examen) | 1 | 45 min | Alleen lichte ochtend-review |
| Dubbele examendag (11 mei) | 0 | — | Geen studie |
| Dag ná examen | 2 | 45 min | Minder energie, kortere sessies |
| Dag ná dubbel examen | 1 | 45 min | Hersteldag |

### Adaptieve Herplanning
- **Budget-gestuurde spacing**: sessies worden gelijkmatig verdeeld over beschikbare dagen
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

### Setup Wizard
- 7-stap first-run wizard: naam, vakken, SE cijfers, examendatums, topics
- Te herstarten via **Instellingen → Wizard opnieuw doen**
- Overschrijft bestaande data met nieuwe configuratie
- Genereert automatisch een verse gewogen planning bij voltooien

### Sterren & Gamification
- **Sterren verdienen**: sessie afronden (+1), score ≥7.0 (+1), score ≥8.0 (+2), bonus activiteiten (+1)
- **Streak systeem**: consecutive dagen met afgeronde sessies, milestones op 3d (+2), 7d (+5), 14d (+10)
- **Week bonus**: alle sessies van de week af → +3 sterren
- **Sidebar**: sterren-teller + streak in eigen card
- **Dashboard**: sterren/streak stat card

### Bonus Activiteiten (na dag-klaar)
Na het afronden van de dagelijkse sessie verschijnen 4 bonus kaarten:
1. **Extra Sessie** — nieuwe sessie voor het zwakste beschikbare vak
2. **Fouten Herhaling** — interactieve review van laatste fouten, per fout "Begrepen" markeren
3. **Theorie Uitleg** — opent AI samenvatting of formulekaart
4. **Flashcard Quiz** — snelle herhaling met kaartjes

### Studie Verdeling (Instellingen)
- Interactieve tabel met per vak: SE, examendatum, budget, gedaan, resterend, aandeel-balk
- +/- knoppen om gewicht per vak aan te passen (0.2x – 3.0x)
- Herberekenen-knop past planning aan op nieuwe verdeling

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
2. Bevestig → confetti animatie + ster-toekenning + bonus kaarten + adaptieve herplanning

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
- **Repo**: ColdDesertLab/ExamOS (public)
- **Branch**: master

## Development

```bash
cd /Users/dennisariens/exam-os/

# Bewerk het werkbestand
# (ExamOS_v4.html)

# Bootstrap: vers plan genereren en naar Supabase pushen
node bootstrap.js

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
| `manifest.json` | PWA manifest voor home screen install |
| `install.sh` | One-liner self-host installer |
| `bootstrap.js` | Installer: genereert vers gewogen plan en pusht naar Supabase |
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

## Versies

| Versie | Repo | Doelgroep |
|--------|------|-----------|
| **2026** | [ColdDesertLab/ExamOS](https://github.com/ColdDesertLab/ExamOS) | Specifiek gebouwd voor Jussi (VWO 2026) — hardcoded vakken + examendatums |
| **2027+** | [ColdDesertLab/ExamOS-2027](https://github.com/ColdDesertLab/ExamOS-2027) | Clean template met setup wizard + demo data. Fork + deploy voor elke leerling |

## License

MIT
