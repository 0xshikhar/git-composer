VS Code Git Commit Composer - Detailed Implementation Plan
Project Overview
A VS Code extension that intelligently groups staged changes into logical commits using AI models with user-provided API keys.
Tech Stack

Language: TypeScript
Runtime: Node.js
Framework: VS Code Extension API
Git Integration: simple-git library
AI Integration: Direct API calls (OpenAI, Anthropic, Google, etc.)
UI: VS Code Webview API + React
State Management: Zustand or Context API
Styling: Tailwind CSS or VS Code's Codicons

Project Structure
vscode-commit-composer/
├── src/
│ ├── extension.ts # Entry point
│ ├── commands/
│ │ ├── autoComposeCommits.ts # Main command
│ │ ├── configureAI.ts # AI settings
│ │ └── manualCompose.ts # Manual grouping
│ ├── git/
│ │ ├── gitService.ts # Git operations wrapper
│ │ ├── diffParser.ts # Parse git diffs
│ │ ├── changeAnalyzer.ts # Analyze change patterns
│ │ └── commitExecutor.ts # Execute commits safely
│ ├── ai/
│ │ ├── aiProvider.ts # Abstract AI interface
│ │ ├── providers/
│ │ │ ├── openai.ts
│ │ │ ├── anthropic.ts
│ │ │ ├── google.ts
│ │ │ └── ollama.ts
│ │ ├── promptBuilder.ts # Build AI prompts
│ │ └── responseParser.ts # Parse AI responses
│ ├── grouping/
│ │ ├── commitGrouper.ts # Grouping logic
│ │ ├── heuristics.ts # Pre-AI heuristics
│ │ └── validator.ts # Validate groupings
│ ├── webview/
│ │ ├── CommitComposerPanel.ts # Webview controller
│ │ └── ui/
│ │ ├── App.tsx # React root
│ │ ├── components/
│ │ │ ├── FileList.tsx
│ │ │ ├── CommitGroup.tsx
│ │ │ ├── DiffViewer.tsx
│ │ │ └── AISettings.tsx
│ │ └── styles/
│ │ └── main.css
│ ├── config/
│ │ ├── settings.ts # Extension settings
│ │ └── constants.ts # Constants
│ ├── utils/
│ │ ├── logger.ts # Logging utility
│ │ ├── cache.ts # Response caching
│ │ └── tokenCounter.ts # Token estimation
│ └── types/
│ ├── git.ts # Git-related types
│ ├── ai.ts # AI-related types
│ └── commits.ts # Commit grouping types
├── media/ # Icons, CSS
├── test/
│ ├── suite/
│ │ ├── extension.test.ts
│ │ ├── git.test.ts
│ │ └── ai.test.ts
│ └── fixtures/ # Test data
├── .vscode/
│ ├── launch.json # Debug config
│ └── settings.json
├── package.json # Extension manifest
├── tsconfig.json
├── webpack.config.js # Bundle config
└── README.md
