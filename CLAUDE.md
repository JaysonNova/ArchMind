# CLAUDE.md

## Project Overview

**ArchMind AI** is a local-running MVP tool that transforms ideas into deliverables (PRD + Prototype) through RAG-based knowledge retrieval and AI reasoning.

**Core Value:** Make every historical document a foundation for new features, eliminating logical gaps in product iteration.

## Critical Rules

### 1. Automatic Context7 MCP Usage
**ALWAYS use Context7 MCP tools proactively** when writing code involving any library/framework:
- Call `resolve-library-id` → `query-docs` automatically (don't wait for user request)
- Use cases: Nuxt 3, Zod, LangChain.js, pgvector, Pinia, shadcn/ui, etc.
- Prioritize retrieved documentation over training data

### 2. UI Library Standard
**ONLY use shadcn/ui (Vue) components** - imported from `~/components/ui/*`
- ❌ NEVER use: Nuxt UI, PrimeVue, or any other UI library
- ❌ NEVER implement custom components when shadcn/ui has equivalent ones
- ✅ Always check shadcn-vue documentation for existing components before writing custom code
- ✅ Prefer shadcn/ui components over custom implementations (e.g., use `Sidebar` instead of custom sidebar)
- ✅ Style with Tailwind CSS only (no custom CSS files)
- ✅ Use `cn()` utility for conditional classes

### 3. Animation Effects Library
**Use vue-bits for visual effects and animations** - https://vue-bits.dev
- ✅ Priority: vue-bits > custom CSS animations > other animation libraries
- ✅ Components installed at `~/components/ui/bits/`
- ✅ Categories: Text Animations, Backgrounds, Animations, Components
- ✅ Examples: ShinyText, Aurora, SplitText, GlitchText, etc.
- ✅ Check vue-bits.dev before implementing custom visual effects

## Technology Stack

- **Framework:** Nuxt 3 + TypeScript 5.x
- **UI:** shadcn/ui (Vue) + Tailwind CSS
- **Animations:** vue-bits (https://vue-bits.dev)
- **Database:** PostgreSQL + pgvector
- **AI:** Multi-model adapters (Claude, GPT-4, Gemini, Qwen, Wenxin, DeepSeek, Ollama)
- **RAG:** LangChain.js + OpenAI Embeddings
- **State:** Pinia | **Forms:** VeeValidate + Zod

## Project Structure

```
ArchMind/
├── pages/              # Nuxt 3 file-based routing
├── server/api/         # API endpoints
├── components/         # Vue components
│   └── ui/             # shadcn/ui components
├── composables/        # Vue composables
├── stores/             # Pinia stores
├── lib/                # Core business logic
│   ├── ai/             # Multi-model AI adapters
│   ├── rag/            # RAG retrieval engine
│   ├── prd/            # PRD generation
│   └── db/             # Database client
├── types/              # TypeScript types
└── config/             # YAML configuration
```

## Core Architecture

### 1. Multi-Model AI Adapters
Unified interface supporting multiple AI providers:
```typescript
interface AIModelAdapter {
  generateText(prompt: string): Promise<string>
  generateStream(prompt: string): AsyncIterator<string>
  generateStructured<T>(prompt: string, schema: JSONSchema): Promise<T>
}
```

**Model Selection Strategy:**
- PRD Generation: Claude 3.5 Sonnet
- Chinese Content: Qwen-Max / Wenxin
- Large Documents: Gemini 1.5 Pro (200K context)
- Privacy Mode: Ollama (local)

### 2. RAG Pipeline
1. Document Loading (PDF/DOCX/Markdown)
2. Text Chunking (1000 chars, 200 overlap)
3. Vectorization (OpenAI embeddings)
4. Storage (PostgreSQL + pgvector)
5. Retrieval (Top-5 similarity search, threshold=0.7)

### 3. PRD Generation Flow
User Input → RAG Retrieval → Context Building → Model Selection → AI Generation → Post-processing → Database Persistence

## Database Schema

**Key Tables:**
- `documents` - Uploaded documents (PDF/DOCX/Markdown)
- `document_chunks` - Text chunks with vector embeddings (pgvector)
- `prd_documents` - Generated PRDs with metadata
- `prd_document_references` - Links PRDs to source documents
- `system_config` - Key-value configuration
- `generation_history` - Audit log

## Development Commands

```bash
# Setup
pnpm install
cp .env.example .env  # Configure API keys
pnpm db:init          # Initialize database

# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Lint code

# Database
pnpm db:init          # Initialize/reset
pnpm db:seed          # Add test data
```

## Environment Variables

```bash
# AI Models
ANTHROPIC_API_KEY=xxx
OPENAI_API_KEY=xxx
GOOGLE_API_KEY=xxx
DASHSCOPE_API_KEY=xxx  # Qwen
BAIDU_API_KEY=xxx      # Wenxin
DEEPSEEK_API_KEY=xxx
OLLAMA_BASE_URL=http://localhost:11434

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/archmind

# RAG Config
EMBEDDING_MODEL=text-embedding-3-small
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
SIMILARITY_THRESHOLD=0.7

# AI Defaults
DEFAULT_MODEL=claude-3.5-sonnet
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=8000
```

## Key Implementation Patterns

### 1. API Routes (Nuxt 3 Conventions)
- `server/api/[resource]/index.get.ts` - GET collection
- `server/api/[resource]/index.post.ts` - POST collection
- `server/api/[resource]/[id]/index.get.ts` - GET item
- Use `defineEventHandler` and proper error handling with `createError`

### 2. Model Adapter Implementation
- Implement `AIModelAdapter` interface in `lib/ai/adapters/`
- Handle streaming with `AsyncIterator<string>`
- Add cost estimation logic
- Register in `ModelManager` and update `config/ai-models.yaml`

### 3. RAG Processing
Load → Split (1000/200) → Embed (OpenAI) → Store (pgvector) → Retrieve (Top-5)

### 4. PRD Generation
Input Parsing → RAG Retrieval → Context Building → Model Selection → Streaming Generation → Post-processing → Database Persistence

## Important Design Decisions

### Local-First Architecture
- All documents stored locally in PostgreSQL
- No cloud storage except AI API calls
- User controls which documents are sent to AI
- Supports fully offline mode with Ollama

### Model Selection
Task-based routing with fallback mechanism defined in `config/ai-models.yaml`:
```yaml
ai_models:
  default: claude-3.5-sonnet
  fallback: [gpt-4o, qwen-max]
  preferences:
    prd_generation: [claude-3.5-sonnet, gpt-4o]
    chinese_content: [qwen-max, wenxin-4.0]
```

## shadcn/ui Usage Guide

### Installation
```bash
# Add components
pnpm dlx shadcn-vue@latest add button card dialog input label

# Essential components
pnpm dlx shadcn-vue@latest add button input label textarea select checkbox radio-group switch
pnpm dlx shadcn-vue@latest add card separator tabs scroll-area
pnpm dlx shadcn-vue@latest add dialog alert toast progress
pnpm dlx shadcn-vue@latest add dropdown-menu navigation-menu breadcrumb sidebar
pnpm dlx shadcn-vue@latest add table badge avatar
```

### Available Components Checklist
Before implementing custom UI, check if shadcn-vue provides:
- **Layout:** Sidebar, NavigationMenu, Breadcrumb, Separator, ScrollArea
- **Forms:** Input, Label, Textarea, Select, Checkbox, RadioGroup, Switch
- **Feedback:** Dialog, Alert, Toast, Progress
- **Data:** Table, Badge, Avatar, Card, Tabs
- **Actions:** Button, DropdownMenu

**Rule:** If shadcn-vue has the component, ALWAYS use it instead of building custom.

### Component Patterns

**Form with Validation:**
```vue
<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { useForm } from 'vee-validate'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const { errors, handleSubmit } = useForm({
  validationSchema: schema
})
</script>

<template>
  <form @submit="handleSubmit" class="space-y-4">
    <div class="space-y-2">
      <Label for="email">Email</Label>
      <Input id="email" type="email" />
      <p v-if="errors.email" class="text-sm text-destructive">
        {{ errors.email }}
      </p>
    </div>
    <Button type="submit">Submit</Button>
  </form>
</template>
```

**Dialog Pattern:**
```vue
<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogDescription>This action cannot be undone.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button @click="handleConfirm">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

**Data Table:**
```vue
<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="item in items" :key="item.id">
        <TableCell>{{ item.name }}</TableCell>
        <TableCell>
          <Badge :variant="item.status === 'active' ? 'default' : 'secondary'">
            {{ item.status }}
          </Badge>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
```

### Customization

**Theme (assets/css/main.css):**
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}
```

**Custom Variants (components/ui/button.ts):**
```typescript
import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        success: 'bg-green-600 text-white hover:bg-green-700' // Custom
      }
    }
  }
)
```

### Migration from Other Libraries

Replace deprecated components:
```vue
<!-- ❌ BEFORE (Nuxt UI) -->
<UButton color="primary" @click="handleClick">Click</UButton>

<!-- ✅ AFTER (shadcn/ui) -->
<Button variant="default" @click="handleClick">Click</Button>
```

### Resources
- shadcn/ui: https://ui.shadcn.com
- shadcn-vue: https://www.shadcn-vue.com
- Radix Vue: https://www.radix-vue.com
- Lucide Icons: https://lucide.dev

