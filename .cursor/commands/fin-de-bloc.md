# Fin de bloc

Wrap up the current block before I commit and deploy:

1. Run `npm run lint` and `npm run build`. Fix every error and warning you introduced.
2. Check that no secret is in the diff, in client code or in logs, and that `.env.local` is not tracked by git.
3. Compare each screen of this block with its mockup in `design/maquettes/png` and list visible differences.
4. Give me, in French:
   - the list of files created or changed;
   - what I must test by hand, step by step (desktop Chrome and Android Chrome);
   - the env vars I must add on Vercel, if any;
   - anything you were unsure about or skipped.
5. Propose a conventional commit message in English.
