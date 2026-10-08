# Live-Abstimmung vorbereiten
1. Neues Supabase-Projekt erstellen (Region EU wählen).
2. SQL aus `supabase/schema.sql` im SQL Editor ausführen.
3. Authentication > Providers > Anonymous Sign-Ins aktivieren.
4. Project URL und **Publishable Key** (nicht secret/service_role) bereithalten.
5. Diese beiden öffentlichen Werte in ChatGPT mitteilen, damit die vorhandene Webseite auf gemeinsame Abstimmung umgestellt werden kann.
6. Für öffentlichen Betrieb: CAPTCHA / Rate-Limits gegen automatisierte Mehrfachstimmen aktivieren.
7. GitHub Pages: Settings > Pages > Deploy from main / root.

**Datenschutz:** Keine Teilnehmerliste aus dem WhatsApp-Export auf die öffentliche Seite stellen. Diese erste Datenbank speichert keine Namen; Abstimmungen sind pseudonym über Auth-IDs.
