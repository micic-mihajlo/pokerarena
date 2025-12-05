# PokerArena - LLM Poker Benchmark

A visual poker benchmark where LLM models compete against each other in Texas Hold'em (Fixed Limit).

![PokerArena Screenshot](screenshot.png)

## Features

- **Live Visual Table**: Watch AI models play poker in real-time with animated cards and chips
- **Multiple LLM Players**: GPT-5.1, Claude Haiku 4.5, Claude Sonnet 4.5, Gemini 2.5 Flash
- **Fixed Limit Texas Hold'em**: Proper poker rules enforcement
- **Game Controls**: Start, pause, speed control
- **Action Log**: Track all player actions and hand results
- **Standings**: Real-time chip count leaderboard

## Tech Stack

- Next.js 15 (App Router)
- AI SDK v5 with OpenRouter
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand for state management
- Motion for animations

## Getting Started

### Prerequisites

- Node.js 18+
- OpenRouter API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pokerarena.git
cd pokerarena
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Add your Vercel AI Gateway key to `.env.local` (OpenRouter key is optional for direct calls):
```
GATEWAY_API_KEY=your_gateway_key_here
# Optional: OPENROUTER_API_KEY=your_openrouter_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Game Engine**: Core poker logic handles blinds, dealing, betting rounds, and showdown
2. **LLM Integration**: Each player is backed by an LLM via Vercel AI Gateway (OpenRouter optional)
3. **Prompt Engineering**: LLMs receive game state and must respond with valid actions
4. **Response Parsing**: Handles various LLM response formats with fallbacks

## LLM Players

| Model | Provider | OpenRouter ID |
|-------|----------|---------------|
| GPT-5.1 | OpenAI | `openai/gpt-5.1` |
| Claude Haiku 4.5 | Anthropic | `anthropic/claude-haiku-4.5` |
| Claude Sonnet 4.5 | Anthropic | `anthropic/claude-sonnet-4.5` |
| Gemini 2.5 Flash | Google | `google/gemini-2.5-flash` |

## Poker Rules

- **Format**: Texas Hold'em Fixed Limit
- **Blinds**: Small blind = 5, Big blind = 10 (configurable)
- **Bet Sizes**: 
  - Pre-flop/Flop: 1 big blind
  - Turn/River: 2 big blinds
- **Max Raises**: 4 per betting round
- **Starting Chips**: 1000 per player

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main game view
│   └── api/game/route.ts  # LLM action endpoint
├── components/poker/      # UI components
├── lib/
│   ├── poker/            # Game engine
│   └── ai/               # LLM integration
├── stores/               # Zustand stores
└── types/               # TypeScript types
```

## License

MIT
