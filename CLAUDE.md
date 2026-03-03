# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI to generate React components based on natural language descriptions, displays them in a real-time preview, and provides a code editor for manual modifications. The application uses a virtual file system (no files written to disk) and supports both anonymous and authenticated user workflows.

## Development Commands

### Setup
```bash
npm run setup  # Install dependencies, generate Prisma client, run migrations
```

### Development
```bash
npm run dev              # Start dev server with Turbopack
npm run dev:daemon       # Start dev server in background, logs to logs.txt
```

### Testing
```bash
npm test                 # Run all tests with Vitest
```

### Database
```bash
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run database migrations
npm run db:reset         # Reset database (force)
```

### Build & Production
```bash
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

## Architecture

### Virtual File System (VFS)

The core of this application is a **virtual file system** implemented in `src/lib/file-system.ts`. This is NOT a real file system - all files exist only in memory and are serialized to the database for persistence.

Key characteristics:
- Files are stored in a `Map<string, FileNode>` structure
- Paths are normalized (always start with `/`)
- Supports file operations: create, read, update, delete, rename
- Can serialize/deserialize to JSON for database storage
- All paths are absolute (e.g., `/App.jsx`, `/components/Button.jsx`)

The VFS is used throughout the application:
- **Client-side**: `FileSystemContext` wraps the VFS and provides React hooks
- **Server-side**: VFS is reconstructed from database on each chat request
- **AI tools**: Claude AI uses `str_replace_editor` and `file_manager` tools to manipulate the VFS

### AI Integration Flow

1. **User sends message** → `src/app/api/chat/route.ts`
2. **VFS reconstructed** from serialized `files` object
3. **System prompt** (`src/lib/prompts/generation.tsx`) guides AI behavior
4. **AI uses tools**:
   - `str_replace_editor`: view, create, edit files (see `src/lib/tools/str-replace.ts`)
   - `file_manager`: rename, delete files (see `src/lib/tools/file-manager.ts`)
5. **Tool calls update VFS** in memory
6. **VFS serialized** and saved to database on completion

### JSX Transformation Pipeline

Located in `src/lib/transform/jsx-transformer.ts`, this handles converting user-written JSX/TSX into browser-executable code:

1. **Transform**: Uses Babel Standalone to transpile JSX/TSX → JS
2. **Import Resolution**:
   - External packages → esm.sh CDN URLs
   - Local files → Blob URLs
   - Supports `@/` alias for root-relative imports
3. **Import Map Creation**: Generates an importmap for the preview iframe
4. **CSS Handling**: Collects CSS imports and injects as `<style>` tags
5. **Error Handling**: Syntax errors are caught and displayed in preview

### Preview System

The preview iframe is generated via `createPreviewHTML()` in `jsx-transformer.ts`:
- Uses ES module importmap for dependency resolution
- Includes Tailwind CSS CDN
- React Error Boundary for runtime error handling
- Displays syntax errors with formatted error messages
- Entry point is always `/App.jsx`

### Database Schema

SQLite database with Prisma ORM:

```prisma
User {
  id: String (cuid)
  email: String (unique)
  password: String (hashed with bcrypt)
  projects: Project[]
}

Project {
  id: String (cuid)
  name: String
  userId: String? (nullable for anonymous projects)
  messages: String (JSON serialized chat history)
  data: String (JSON serialized VFS state)
  user: User?
}
```

- Anonymous users can create projects (userId is null)
- Session storage tracks anonymous work for account creation prompts
- Projects are auto-saved after each AI response (see `onFinish` in chat route)

### Authentication

JWT-based auth implemented in `src/lib/auth.ts`:
- Passwords hashed with bcrypt
- Session tokens stored in HTTP-only cookies
- Middleware in `src/middleware.ts` (currently minimal)
- Anonymous users tracked via `src/lib/anon-work-tracker.ts` using sessionStorage

### State Management

- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`): Manages VFS, selected file, and file operations
- **ChatContext** (`src/lib/contexts/chat-context.tsx`): Manages chat messages and AI interactions
- Both use React Context API (no external state library)

### Important Patterns

1. **Import Alias**: All local imports use `@/` prefix (e.g., `import Button from '@/components/Button'`)
2. **Path Normalization**: All VFS paths must start with `/`
3. **Entry Point**: Every project MUST have `/App.jsx` as the root component
4. **No HTML Files**: Projects don't use HTML files - preview is generated programmatically
5. **Tool Call Sync**: Client-side `handleToolCall` keeps VFS in sync with AI tool calls

## AI Provider Configuration

The app can run with or without an Anthropic API key:
- **With API key**: Uses Claude AI via `@ai-sdk/anthropic`
- **Without API key**: Falls back to mock provider (returns static code)
- See `src/lib/provider.ts` for provider switching logic
- Mock provider uses fewer steps (4 vs 40) to prevent repetition

## Testing

Uses Vitest with React Testing Library:
- Test files located alongside source files in `__tests__/` directories
- File naming: `*.test.tsx` or `*.test.ts`
- JSDOM for browser environment simulation
- Config in `vitest.config.mts`

## Node.js Compatibility

Uses `node-compat.cjs` to polyfill Node.js modules in browser context (required for dependencies that reference Node.js APIs). This is loaded via `NODE_OPTIONS='--require ./node-compat.cjs'` in all npm scripts.
