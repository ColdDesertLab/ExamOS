# ExamOS — Claude Code Context

## Wat is dit project?

ExamOS is een VWO eindexamen trainingssysteem voor een leerling (Jussi) die in mei 2026 eindexamen doet. Het is een single-page HTML app met vanilla JS, geen frameworks. Data wordt opgeslagen in localStorage + Supabase cloud sync.

## Bestanden

- `ExamOS_v4.html` — de werkversie, bewerk dit bestand
- `index.html` — kopie voor Vercel deployment (altijd `cp ExamOS_v4.html index.html` na wijzigingen)
- `README.md` — volledige documentatie
- `CLAUDE.md` — dit bestand (context voor Claude Code)

## Architectuur

**Single HTML file** (~5800 regels) met inline CSS + JS. Geen build step, geen dependencies.

### Structuur in het bestand:
1. `<style>` — CSS variabelen (dark/light), componenten, responsive media queries
2. Login gate HTML
3. Sidebar nav (12 pagina's)
4. 12 `<div class="page">` secties
5. Modals (dag review, skip, add session, add log, add mistake, add exam)
6. Break overlay
7. `<script>` — alle JS:
   - Data layer (localStorage + Supabase sync)
   - DEFAULT_SUBJECTS, DEFAULT_TOPICS, MISTAKE_CODES
   - Plan generators (generateInitialPlan + regeneratePlan override)
   - Page renderers (renderToday, renderDashboard, renderPlanning, etc.)
   - Timer system (Pomodoro)
   - AI Grader (Anthropic API)
   - Notes + Flashcards + Quiz
   - Formula sheets
   - Topics page met AI samenvattingen
   - Theme toggle, Login/Logout
   - Cloud sync functions

### Belangrijk: twee plan generators
1. `generateInitialPlan()` — wordt aangeroepen bij eerste load (geen data). Gebruikt `DEFAULT_SUBJECTS` en `calcUrgency()`.
2. `regeneratePlan()` (override onderaan) — wordt aangeroepen door "Herberekenen" knop. Gebruikt `state.subjects` en `enhancedUrgency()` (score-optimalisatie model).

Beide gebruiken `buildExamMaps()` en `getDayContext()` voor examen-bewuste scheduling.

### State object
Zie README.md voor volledige shape. Opgeslagen in `localStorage['examos_v4']` + Supabase tabel `examos_state`.

## Supabase

- Project ID: `gtnextikrykzowqvlxkb`
- URL: `https://gtnextikrykzowqvlxkb.supabase.co`
- Anon key: hardcoded in HTML
- Tabel: `examos_state` (id TEXT PK, state JSONB, updated_at, version)
- RLS: open (single user)

## Vercel

- Project: exam-os
- URL: exam-os-three.vercel.app
- Deploy: `npx vercel deploy --prod` vanuit projectmap
- Team: dennisariens-projects

## Veelvoorkomende taken

### Feature toevoegen
1. Lees het huidige bestand (`ExamOS_v4.html`)
2. Voeg HTML toe aan de juiste `<div class="page">` sectie
3. Voeg JS functies toe vóór de `init()` functie
4. Update `showPage()` override als er een nieuwe pagina is
5. Valideer: braces balanced, alle functies bestaan
6. `cp ExamOS_v4.html index.html && git add -A && git commit && npx vercel deploy --prod && git push`

### Planning aanpassen
- `buildExamMaps()` — bouwt exam-day en exam-eve maps
- `getDayContext()` — bepaalt slots, duur, energieniveau per dag
- `enhancedUrgency()` — score-optimalisatie (punt-opbrengst model)
- `generateInitialPlan()` — initiële planning
- `regeneratePlan()` — herberekening met live scores

### Validatie
```bash
python3 -c "
import re
with open('ExamOS_v4.html') as f: html = f.read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
o = sum(s.count('{') for s in scripts)
c = sum(s.count('}') for s in scripts)
print(f'Braces: {o}/{c} diff={o-c}')
pages = re.findall(r'id=\"page-(\w+)\"', html)
navs = list(set(re.findall(r\"showPage\('(\w+)'\)\", html)))
print(f'Pages: {len(pages)}, Navs: {len(navs)}')
print('Missing:', set(pages)-set(navs), set(navs)-set(pages))
"
```

## Examenrooster

| Datum | Vak | Tijd | SE |
|-------|-----|------|----|
| ma 11 mei | Geschiedenis | 09:00-12:00 | 6.4 |
| ma 11 mei | Natuurkunde | 13:30-16:30 | 5.4 |
| di 12 mei | Nederlands | 13:30-16:30 | 7.5 |
| wo 13 mei | Wiskunde B | 13:30-16:30 | 4.9 |
| di 19 mei | Scheikunde | 13:30-16:30 | 5.4 |
| wo 20 mei | Engels | 13:30-16:00 | 6.7 |
| vr 22 mei | Biologie | 13:30-16:30 | 5.8 |
| wo 27 mei | Spaans | 13:30-16:00 | 6.5 |

## Login

- User: `Jussi`
- Pass: `Jones2026!`
- Opgeslagen in `_AUTH` object in JS (session-based, geen echte auth)

## API Keys (in te stellen door gebruiker)

- Anthropic: `sk-ant-...` — voor AI Grader, Quiz, Studieassistent
- OpenAI: `sk-...` — optioneel, voor GPT topic samenvattingen
- Worden opgeslagen in `state.settings.apiKey` / `state.settings.openaiKey`
