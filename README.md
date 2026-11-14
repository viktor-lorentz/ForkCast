# ForkCast

By team **Overcooked**.

AI@USC Hackathon project (Nov 14–15, 2026). ForkCast is a phone-first app that tells each USC student which dining hall has food they can actually eat today, backed by USC's own allergen labels.

- **Team plan:** [docs/HACKATHON_PLAN.md](docs/HACKATHON_PLAN.md) (start here)
- **Kickoff prompt:** [docs/KICKOFF_PROMPT.md](docs/KICKOFF_PROMPT.md)

**Live app:** https://ps-5-winners.vercel.app (try a sample student: [/?demo=halal-sesame](https://ps-5-winners.vercel.app/?demo=halal-sesame))

## Run it locally

```
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
npm test                     # 54 tests, no network or API key needed
```