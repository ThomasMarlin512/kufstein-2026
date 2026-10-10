# WebMCP

Optionale Browserwerkzeuge über `document.modelContext.registerTool`, mit `navigator.modelContext` als Fallback. Sie sind auf der geöffneten Haupt- und Abstimmungsseite verfügbar. Ohne unterstützten Browser arbeitet die Website wie bisher. `/gruppe/` leitet weiterhin zur Kufstein-Hauptseite weiter. Foto- und Profileinstellungen werden nicht als Werkzeuge freigegeben.

| Werkzeug | Seite / Wirkung |
| --- | --- |
| `kufstein_get_activities` | Beide Seiten: Aktivitäten und aktuelle Stimmen lesen |
| `kufstein_get_participants` | Beide Seiten: Reisegruppe und Teilnahme lesen |
| `kufstein_vote_activity` | Beide Seiten: eigene Aktivitätsstimme speichern |
| `kufstein_set_my_attendance` | Beide Seiten: eigene Reiseteilnahme speichern |
| `kufstein_get_trip_plan` | Hauptseite: bestehendes Programm, Hotel, Anreise und Reservierungsstand lesen |
| `kufstein_get_tasks` | Hauptseite: gemeinsame Organisationsaufgaben lesen |
| `kufstein_set_task_completed` | Hauptseite: gemeinsamen Aufgabenstatus speichern |

Beispiele: „Wie sieht unser Samstagsprogramm aus?“, „Wie steht die Abstimmung zum Stollen?“, „Stimme für mich bei der Festung mit Ja“, „Setze meine Teilnahme auf unsicher“.

Die normale Gruppenanmeldung ist Voraussetzung. Jeder Aufruf prüft aktuelle Sitzung und serverseitige Gruppenmitgliedschaft mit dem bestehenden Supabase-Client. RLS und Berechtigungen bleiben unverändert. Eigene Stimmen und Teilnahme nutzen ausschließlich die Sitzungsidentität. Tool-Eingaben können keine fremde Identität wählen. Keine Gruppencodes, E-Mails, Tokens oder internen Mitgliedsschlüssel werden ausgegeben. Der Aufgabenstatus ist wie bisher eine gemeinsame Gruppenfunktion.

Teilnahme wird als `source: default` (Voreinstellung) oder `source: recorded` (gespeicherter Stand) gekennzeichnet; beides darf nicht automatisch als Nachweis einer ausdrücklichen persönlichen Zusage gelten. Programm und Preise stammen aus der vorhandenen Reiseplanung, nicht aus neuen externen Abfragen.

Schreibaktionen antworten erst nach bestätigter Speicherung. `status: saved, ui_updated: false` unterscheidet eine erfolgreiche Speicherung mit anschließend gescheiterter Anzeigeaktualisierung von einem Speicherfehler (`ok: false`). Wiederholte Stimmen überschreiben die eigene vorhandene Stimme. Es werden keine Nachrichten verschickt oder Buchungen ausgeführt.

## Prüfung

```sh
node --experimental-vm-modules tests/webmcp.test.mjs
```

Die Tests simulieren Datenbank und WebMCP-Registrierung, ohne echte Daten zu ändern. Sie prüfen Anmeldung, Identitätsgrenzen, Eingaben, Speicherung, UI-Fehler, Seitennavigation und fehlende Browserunterstützung. Ein Ende-zu-Ende-Test in einem WebMCP-fähigen Browser mit echter Gruppenanmeldung bleibt separat erforderlich.
