# Git Commit Composer

[![Version](https://vsmarketplacebadges.dev/version/undefined_publisher.vscode-commit-composer.svg)](https://marketplace.visualstudio.com/items?itemName=undefined_publisher.vscode-commit-composer)
[![Installs](https://vsmarketplacebadges.dev/installs/undefined_publisher.vscode-commit-composer.svg)](https://marketplace.visualstudio.com/items?itemName=undefined_publisher.vscode-commit-composer)

**Git Commit Composer** is a VS Code extension that intelligently groups your staged changes into logical commits using AI. Say goodbye to massive, unstructured commits and let AI help you organize your work.

## ✨ Features

- **🤖 AI-Powered Analysis**: Automatically analyzes staged changes using advanced LLMs (OpenAI, Anthropic, etc.).
- **🧩 Logical Grouping**: Intelligently groups related file changes into cohesive commit units.
- **📝 Auto-Generated Messages**: Generates descriptive and semantic commit messages for each group.
- **👀 Interactive Review**: clearly view staged files, proposed groups, and diffs before committing.
- **🛠️ Manual Control**: Manually adjust groups or messages if the AI suggestion isn't perfect.

## 🚀 Installation

1. Open **VS Code**.
2. Go to the **Extensions** view (`Cmd+Shift+X` or `Ctrl+Shift+X`).
3. Search for **Git Commit Composer**.
4. Click **Install**.

## 📖 Usage

1. **Stage your changes** in the Source Control view as usual.
2. Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
3. Run the command: **`Commit Composer: Auto Compose`**.
4. The **Commit Composer Panel** will open, showing your staged changes.
5. Click **Generate Groups** to let the AI analyze your changes.
6. Review the suggested commit groups.
7. Click **Commit** on a group to commit those changes to your repository.

## ⚙️ Configuration

You can configure the extension permissions and defaults in VS Code Settings (`Cmd+,`):

| Setting                     | Description                                            | Default                 |
| :-------------------------- | :----------------------------------------------------- | :---------------------- |
| `commitComposer.aiProvider` | Select the AI provider (OpenAI, Anthropic, etc.)       | `openai`                |
| `commitComposer.apiKey`     | Your API Key for the selected provider                 | `""`                    |
| `commitComposer.model`      | Specific model to use (e.g., `gpt-4`, `claude-3-opus`) | `""` (provider default) |

## 🔑 API Keys

To use this extension, you need to provide an API key for your chosen AI provider.

1. Go to **Settings** > **Extensions** > **Git Commit Composer**.
2. Enter your API key in the `Api Key` field.

> **Note:** Your API key is stored locally in your VS Code settings and is never shared.

## 🤝 Contributing

Issues and pull requests are welcome! See our [GitHub Repository](https://github.com/) for more details.

## 📄 License

This project is licensed under the MIT License.
