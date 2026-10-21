---
name: token-saver
description: Optimizes AI agent context window usage, reduces LLM token consumption, avoids verbose outputs, uses targeted file reads/edits, and ensures maximum efficiency during programming and debugging.
metadata:
  model: inherit
---

## Use this skill when
- Executing code changes, debugging, or analyzing code in this repository.
- Managing context window budget, token limits, or large conversation threads.
- Refactoring or reading large project files.

## Do not use this skill when
- The user explicitly asks for extensive explanations, beginner-friendly tutorials, or deep educational deep dives.

## Core Directives for Token Efficiency

### 1. Targeted Code Reading
- **Never read entire files** if only specific functions or line numbers are needed.
- Always supply `StartLine` and `EndLine` to `read_file` (typically 30–80 lines at a time).
- Use fast regex searches (`grep` or `Select-String`) before opening files.

### 2. Precise Surgical Edits
- Always use `edit_file` with precise search and replace blocks.
- Never rewrite an entire file with `write_file` unless creating a new file from scratch.
- Avoid modifying code or comments unrelated to the task at hand.

### 3. High-Density Communication
- Eliminate conversational filler, redundant greetings, and repeated task summaries.
- Deliver direct answers, bullet points, file diff summaries, or shell commands.
- Never repeat large code blocks in the chat response if they already exist in files or artifacts.

### 4. Proactive Compaction
- Recommend the `/compact` slash command whenever context length approaches critical size.
