---
name: Expo Mobile App Setup (fanverse-mobile)
description: Expo SDK 56 mobile app setup in the pnpm monorepo at artifacts/fanverse-mobile — key decisions and gotchas.
---

## Expo SDK version
- Use Expo SDK **56** (not 53 or 52). Package: `expo@56.0.12`.
- react@19.1.0, react-native@~0.86.0, expo-router@~56.2.11
- react-native-screens@~4.25.2, react-native-reanimated@4.4.1 (v4 — no babel plugin needed)
- react-native-worklets@^0.9.2 (required by reanimated v4 in web mode)
- react-native-web@~0.20.0 (required for expo web)

## Run command
```
CI=1 pnpm --filter @workspace/fanverse-mobile run dev
```
- `CI=1` puts Metro in single-bundle mode (no watch, bundles on first request)
- Port 5173 (5000 is taken by the web app)

## app.json critical settings
- `web.output: "single"` — required for SPA mode (static/SSR mode causes "Cannot read 'experiment'" server error)
- `scheme: "fanverse"` — required for expo-router deep linking

## API URL detection in Replit
In `lib/query-client.ts`, detect the Replit dev URL and swap port:
```js
const hostname = window.location.hostname;
if (/^\d+-/.test(hostname)) {
  return `${protocol}//${hostname.replace(/^\d+-/, '8080-')}`;
}
```
The API server runs on port 8080 (proxied). Mobile app runs on 5173.

## API field names (as of schema at time of writing)
- Nations: `flagEmoji` (not `flag`)
- Matches: `homeNationName`, `homeNationFlag`, `awayNationName`, `awayNationFlag`, `scheduledAt` (not `kickoffTime`, `homeTeam`, `homeFlag`)
- Leaderboard endpoint: `/api/leaderboard` (not `/api/stats/leaderboard`)
- Leaderboard response shape: `{ rank, user: { id, username, reputationPoints, reputationTier, nationCode }, totalVotes, totalReactions }`
- GlobalStats: `totalFans`, `totalNationsActive`, `totalMatchesCovered`, `totalVotesCast`, `totalDiscussions`
- Pulse: `sentimentScore` (0-1 float, not 0-100), `totalVoters` (not `totalVotes`)
- Discussions: `hasUserUpvoted` (not `userHasUpvoted`), `username` (not `authorUsername`)
- Predictions: `isResolved` (not `isCorrect`), `xpEarned` (not `pointsEarned`)
- Poll options: `{ value, label, voteCount }` — use `value` as key (not `id`), `label` for display text
- Poll voted state: `poll.userVoteOptionValue` (not `poll.userVoteOptionId`)

**Why:** API was designed independently from mobile type assumptions. Always read the actual route handler before assuming field names.

## Babel config
No `babel-plugin-reanimated` needed for reanimated v4. Minimal config:
```js
module.exports = function(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
```

## Known non-issues
- "An unknown error occurred while installing React Native DevTools" — harmless, system lib missing for the chrome binary but doesn't affect web bundling
- "11 packages may need updating" — npm peer warnings, doesn't affect functionality
