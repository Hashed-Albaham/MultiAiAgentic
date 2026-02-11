<div align="center">

# 🤖 AI Orchestrator Hub

### مركز تنسيق الوكلاء الذكية | AI Agent Orchestration Platform

<p>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa" alt="PWA" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
</p>

</div>

---

<div dir="rtl">

## 📋 نظرة عامة (عربي)

**AI Orchestrator Hub** هو تطبيق ويب متقدم لإدارة وتنسيق الوكلاء الذكية (AI Agents). يتيح إنشاء وكلاء، ربطهم بخطوط أنابيب (Pipelines)، إجراء محادثات، مقارنة نتائج عدة نماذج، وتشغيل حوارات آلية بين الوكلاء.

### ✨ الميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🧠 **إدارة الوكلاء** | إنشاء وتعديل وحذف وكلاء ذكية مع تخصيص prompt النظام |
| 🔗 **Pipeline بصري** | رسم خطوط أنابيب بربط عقد بصرياً مع drag & drop |
| 🔄 **دعم الحلقات** | اكتشاف الدورات تلقائياً + تشغيل حلقات مع تحديد عدد التكرارات |
| 💬 **محادثة مباشرة** | محادثة فورية مع أي وكيل ذكي |
| ⚖️ **مقارنة الوكلاء** | إرسال نفس السؤال لعدة وكلاء ومقارنة الردود |
| 🤝 **حوار آلي** | تشغيل حوار تلقائي بين وكيلين |
| 📊 **سجل تنفيذ متقدم** | لوحة قابلة للسحب والتحجيم + نافذة عرض كامل مع نسخ/تصدير/طباعة |
| 👁 **عرض مخرجات العقد** | زر عين على كل نموذج لعرض المدخل والمخرج بعد التنفيذ |
| 🌐 **ثنائي اللغة** | عربي + إنجليزي مع تبديل فوري وRTL/LTR |
| 📱 **متجاوب بالكامل** | تصميم محسّن للجوال مع hamburger menu + touch-friendly |
| 📦 **PWA** | قابل للتثبيت كتطبيق + يعمل offline |
| 🔑 **إدارة المفاتيح** | مفاتيح API + توكنات وصول مع تشفير محلي |

### 🏗️ النماذج المدعومة

| المزود | النماذج |
|--------|---------|
| OpenAI | GPT-4o, GPT-4o-mini, GPT-4, GPT-3.5-Turbo |
| Google Gemini | Gemini 2.0 Flash, Gemini 1.5 Pro/Flash |
| Anthropic Claude | Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku |
| Meta Llama | Llama 3.1 70B/8B |
| Mistral | Mistral Large, Mistral Small |
| Cohere | Command R+, Command R |

</div>

---

## 📋 Overview (English)

**AI Orchestrator Hub** is an advanced web application for managing and orchestrating AI Agents. It enables creating agents, connecting them in visual Pipelines, chatting, comparing multiple models, and running automated dialogues between agents.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🧠 **Agent Management** | Create, edit, and delete AI agents with custom system prompts |
| 🔗 **Visual Pipeline** | Draw pipelines by connecting nodes visually with drag & drop |
| 🔄 **Loop Support** | Auto-detect cycles + run loops with configurable iterations |
| 💬 **Live Chat** | Real-time conversation with any AI agent |
| ⚖️ **Agent Comparison** | Send the same prompt to multiple agents and compare results |
| 🤝 **Auto Dialogue** | Run automated dialogues between two agents |
| 📊 **Advanced Execution Log** | Draggable & resizable panel + full output modal with copy/export/print |
| 👁 **Node Output Viewer** | Eye button on each node to view input/output after execution |
| 🌐 **Bilingual** | Arabic + English with instant toggle and RTL/LTR |
| 📱 **Fully Responsive** | Mobile-optimized with hamburger menu + touch-friendly |
| 📦 **PWA** | Installable as native app + offline support |
| 🔑 **Key Management** | API keys + access tokens with local encryption |

---

## 🚀 Getting Started | البدء

### Prerequisites | المتطلبات

- **Node.js** >= 18.0
- **npm** >= 9.0
- At least one API key (OpenAI, Gemini, Claude, etc.)

### Installation | التثبيت

```bash
# Clone the repository
git clone <repo-url>
cd agent-orchestrator-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:8080**

### Production Build | بناء الإنتاج

```bash
npm run build
npm run preview
```

---

## 🐳 Docker | التشغيل بـ Docker

### Quick Start

```bash
# Build and run
docker compose up -d

# Or build manually
docker build -t ai-orchestrator-hub .
docker run -d -p 3000:80 --name ai-orchestrator-hub ai-orchestrator-hub
```

The app will be available at **http://localhost:3000**

### Docker Compose

```yaml
services:
  app:
    build: .
    ports:
      - "3000:80"
    restart: unless-stopped
```

---

## 📁 Project Structure | هيكل المشروع

```
agent-orchestrator-hub/
├── src/
│   ├── components/
│   │   ├── pipeline/
│   │   │   ├── AgentNode.tsx        # عقدة الوكيل في Pipeline
│   │   │   ├── CustomEdge.tsx       # الروابط المخصصة
│   │   │   └── ExecutionPanel.tsx   # لوحة سجل التنفيذ
│   │   ├── ui/                      # مكونات Shadcn/UI
│   │   ├── AppSidebar.tsx           # الشريط الجانبي
│   │   ├── AppLayout.tsx            # التخطيط العام
│   │   └── PageHeader.tsx           # رأس الصفحات
│   ├── lib/
│   │   ├── engine/
│   │   │   ├── dag-resolver.ts      # محلل الرسم البياني (DAG)
│   │   │   └── pipeline-executor.ts # محرك تنفيذ Pipeline
│   │   ├── aiService.ts             # خدمة الاتصال بالنماذج
│   │   └── utils.ts                 # أدوات مساعدة
│   ├── pages/
│   │   ├── Index.tsx                # الصفحة الرئيسية
│   │   ├── AgentsPage.tsx           # إدارة الوكلاء
│   │   ├── ChatPage.tsx             # المحادثة
│   │   ├── PipelinePage.tsx         # خط الأنابيب
│   │   ├── ComparePage.tsx          # مقارنة الوكلاء
│   │   ├── DialoguePage.tsx         # الحوار الآلي
│   │   ├── SettingsPage.tsx         # الإعدادات
│   │   └── ApiDocsPage.tsx          # توثيق API
│   ├── store/
│   │   ├── agentStore.ts            # حالة الوكلاء (Zustand)
│   │   ├── apiKeyStore.ts           # حالة المفاتيح
│   │   └── i18nStore.ts             # حالة الترجمة
│   ├── index.css                    # التنسيقات العامة
│   └── App.tsx                      # المكون الجذر
├── Dockerfile                       # بناء Docker
├── docker-compose.yml               # تشغيل Docker Compose
├── nginx.conf                       # إعدادات Nginx
├── package.json                     # الاعتمادات
├── tailwind.config.ts               # إعدادات Tailwind
├── vite.config.ts                   # إعدادات Vite
└── tsconfig.json                    # إعدادات TypeScript
```

---

## 🛠️ Tech Stack | التقنيات

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI Framework |
| **TypeScript 5.8** | Type Safety |
| **Vite 5** | Build Tool + HMR |
| **Tailwind CSS 3** | Styling |
| **Zustand** | State Management |
| **React Flow** | Visual Pipeline Editor |
| **Framer Motion** | Animations |
| **Shadcn/UI + Radix** | UI Components |
| **React Markdown** | Markdown Rendering |
| **Sonner** | Toast Notifications |
| **Vite PWA** | Progressive Web App |

---

## ⚙️ Configuration | الإعداد

### API Keys

1. Go to **Settings** → **API Keys** tab
2. Select a provider (OpenAI, Google, Anthropic, etc.)
3. Enter a label and your API key
4. Save — the key is stored locally in the browser

### Language Toggle

Click the 🌐 button in the Pipeline header or sidebar to toggle between **Arabic** and **English**.

---

## 📦 Deployment | النشر

### Static Hosting (Vercel, Netlify, Cloudflare Pages)

```bash
npm run build
# Upload the 'dist' folder to your hosting provider
```

### VPS / Server

```bash
# 1. Build
npm run build

# 2. Copy dist/ to your server
scp -r dist/ user@server:/var/www/app

# 3. Configure Nginx (use the provided nginx.conf)
sudo cp nginx.conf /etc/nginx/conf.d/app.conf
sudo nginx -t && sudo systemctl reload nginx
```

### Docker (Recommended for Production)

```bash
docker compose up -d --build
```

---

## 🔒 Security | الأمان

- API keys are stored **only in the browser** (localStorage) — never sent to our servers
- All API calls go **directly** from the browser to the AI provider
- No backend server — this is a **purely client-side** application
- CSP and security headers configured in Nginx

---

## 📄 License | الترخيص

MIT License — مفتوح المصدر

---

<div align="center">

**Built with ❤️ for the AI community**

مبني بـ ❤️ لمجتمع الذكاء الاصطناعي

</div>
