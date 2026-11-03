# Bloc 5 · Mode jury, replay et démo (environ 2 h 30)

**Mode Cursor :** Agent, nouvelle conversation.
**À joindre (glisser les PNG) :** `design/maquettes/png/J1-Jury.png`, `J2-Desktop.png`.
**Avant de lancer :** les 3 notes vocales sont dans `public/jury/` (voir plus bas pour la conversion), avec leur transcription de référence et leur traduction anglaise.
**But :** qu'un juge anglophone, en navigation privée et sans compte, voie en 60 secondes que tout marche en live sur les modèles Meta.

## Prompt à coller

```
Lis AGENTS.md, .cursor/rules/, docs/demo-et-mode-jury.md (en entier) et docs/parcours-et-interfaces.md section 7.
Les PNG joints sont les écrans à reproduire, le HTML de chaque planche donne les valeurs exactes.
Commence par un plan court, puis exécute-le.

1. ?jury=1 et la pastille « Mode jury » ouvrent la planche Jury (JuryFrame 1440, tout en anglais) : persona Fatima (profil pré-rempli, sans connexion), 3 chiffres d'impact avec leur source, 3 scénarios avec les vrais fichiers audio de public/jury (scenario-1-istanbul.wav, scenario-2-paris.wav, scenario-3-sea.wav), leur transcription darija, leur traduction anglaise et leur badge de statut, bouton « Run live » qui lance le vrai pipeline depuis l'audio (transcription, intention, agent), « Record your own » (darija, français ou anglais), « See her 30-second onboarding » (les 4 étapes du profil en accéléré).

2. Interface en anglais, messages de l'agent en { darija, en } affichés l'un sous l'autre. Bandeau guidé 1 à 5 synchronisé avec l'étape en cours : Voice note in darija, What BonSafar understood, Live flight plan, One package one price, Ready-to-go travel file.

3. Replay honnête : si un run dépasse JURY_REPLAY_AFTER_MS ou échoue, bascule sur le run enregistré du scénario (bloc 3). Badge « replay » visible, heure de capture des prix affichée, événements marqués replay dans le panneau. Ajoute un script npm run record:jury qui exécute les 3 scénarios en live et enregistre leurs runs.

4. Garde-fous : compteur de coût cumulé dans la table usage (écrit côté serveur). Au-delà de SPEND_LIMIT_USD, mode replay seul avec un message clair. Limite de 10 runs live par IP et par heure (IP hachée, jamais stockée en clair).

5. Carte de fin : temps total, coût total, modèles utilisés et nombre d'appels, heure de capture des prix, boutons « Try scenario 2 », « Record your own », liens GitHub et vidéo.

6. Sur desktop hors mode jury : bandeau discret « Judges: try the 60-second demo » vers /?jury=1.

7. Passe finale : prefers-reduced-motion partout, contrastes AA, aria-label, focus visible, test en navigation privée, aucune erreur dans la console, métadonnées Open Graph (titre, description, image) pour le partage sur X.

8. README complet en anglais à partir du modèle de docs/demo-et-mode-jury.md section 7 : lien démo en tête, schéma d'architecture en Mermaid, modèles Meta et leur rôle, garde-fou prix, services externes déclarés, confidentialité, consentement des voix, lancement en local, « built during the event ».

9. Vérification : npm run lint et npm run build, puis fichiers et tests à la main, en français.
```

## Préparer les notes vocales (avant le bloc)

Muse Voice Transcribe attend du WAV PCM 16 bits mono 24 kHz. Si tes fichiers viennent de WhatsApp ou du dictaphone (m4a, ogg, opus), demande à Cursor dans la même conversation :

```
Installe ffmpeg si besoin et convertis les 3 fichiers de public/jury/raw/ en WAV PCM 16 bits mono 24 kHz dans public/jury/ avec les noms scenario-1-istanbul.wav, scenario-2-paris.wav, scenario-3-sea.wav. Ne commite pas le dossier raw.
```

## Fini quand

- En navigation privée sur ordinateur, les 3 scénarios passent en moins de 60 s chacun.
- En coupant le réseau, le replay prend le relais proprement, avec son badge.
- Le README s'affiche bien sur GitHub, le lien démo marche.

## Après le bloc

`/fin-de-bloc`, commit, `git push`, puis la vidéo.
