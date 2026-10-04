# Settings form pattern (candidate)

Source: `src/patterns/SettingsPanel.tsx`. Gallery: `/#pattern-settings`.

Uses real shared Button and TextField. One grid stack, maximum width 40rem, field fills its track, action row wraps on narrow viewports. Local mock data only. Empty save shows validation; editing clears it, valid save updates local status; Reset restores the fixture. Refresh restores initial data. No asynchronous requests, persistence or production business effects.
