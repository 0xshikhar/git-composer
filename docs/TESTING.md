# OpenGit Composer - Testing Guide

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- VSCode 1.85+
- A test Git repository with staged changes

## Installation for Testing

### Option 1: Install from VSIX (Recommended for Testing)

```bash
# Build the extension
pnpm install
pnpm run compile
pnpm run package:vsix

# The VSIX will be in:
# - macOS: ~/.vscode/extensions/
# - Or use "Install from VSIX" in VSCode (Cmd+Shift+P -> "Install from VSIX")
```

### Option 2: Development Mode (Using vscode-test-electron)

```bash
pnpm install
pnpm run compile
pnpm run test:integration
```

## Manual Testing Checklist

### Step 1: Verify Extension Installation

1. Open VSCode
2. Go to Extensions (`Cmd+Shift+X`)
3. Search for "Git Commit Composer" or "0xshikhar"
4. Verify the extension is installed and shows v2.0.0

### Step 2: Verify Sidebar Appears

1. **The extension should automatically appear in the sidebar** (Activity Bar on the left)
2. Look for the OpenGit Composer icon in the activity bar (below Explorer, Search, etc.)
3. Click the OpenGit Composer icon to open the panel

> **Note:** If the sidebar icon doesn't appear, try:
>
> - Restart VSCode completely (`Cmd+Q` then reopen)
> - Check the Output panel for errors: `View > Output > Select "Git Commit Composer"` from dropdown

### Step 3: Test Basic Functionality

1. **Open a Git repository** with some staged changes (`git add .`)
2. Click the OpenGit Composer icon in the sidebar
3. Verify the panel shows your staged files
4. Click "Auto Compose" to generate commit suggestions
5. Review and modify suggested commits
6. Click "Commit" to execute

### Step 4: Test AI Providers

Test each configured AI provider:

- Open Settings (`Cmd+,`)
- Search for "OpenGit Composer"
- Test with different providers:
  - OpenAI
  - Anthropic
  - Gemini
  - Kimi
  - Ollama (local)

### Step 5: Test Commands

Test the command palette commands:

1. `Cmd+Shift+P` → "Commit Composer: Auto Compose"
2. Verify it opens/focuses the sidebar panel

## Common Issues & Fixes

### Sidebar Icon Not Appearing

**Symptoms:** Extension installs but no icon in activity bar

**Solutions:**

1. Rebuild and reinstall: `pnpm run package:vsix` then reinstall the generated VSIX.
2. Check activation: Open DevTools (`Cmd+Opt+I`) → Console → Search for errors
3. Verify package.json has activation event: `"onView:commitComposer.sidebarView"`

### Extension Not Activating

**Symptoms:** Panel is empty or shows nothing

**Solutions:**

1. Check Output > Git Commit Composer for logs
2. Ensure you have a Git repository open
3. Run `git status` to confirm you have staged changes

### Webview Not Loading

**Symptoms:** Sidebar opens but shows blank/empty

**Solutions:**

1. Run `pnpm run compile` to build webview
2. Check `dist/webview.js` exists
3. Reload VSCode window: `Cmd+Shift+P` → "Reload Window"

## Running Unit Tests

```bash
# Run all tests
pnpm run test

# Run specific test file
pnpm run test -- --grep "commitSplitter"

# Run integration tests
pnpm run test:integration
```

## Test Scenarios

### Scenario 1: Single File Commit

1. Create a new file `test.js`
2. `git add test.js`
3. Open OpenGit Composer sidebar
4. Click Auto Compose
5. Verify single commit suggestion
6. Commit and verify in `git log`

### Scenario 2: Multiple Files - Split Commits

1. Modify 5+ files across different features
2. `git add .`
3. Open OpenGit Composer
4. Click Auto Compose
5. Verify multiple commit suggestions (should split by feature)
6. Commit all and verify each in log

### Scenario 3: Conventional Commit Format

1. Configure: Settings → commitComposer.commitFormat = "conventional"
2. Stage changes
3. Auto Compose
4. Verify format: `type(scope): description`

### Scenario 4: Custom AI Provider

1. Add API key: Settings → commitComposer.apiKey
2. Select provider: Settings → commitComposer.aiProvider
3. Test Auto Compose
4. Verify custom model works (if specified)
