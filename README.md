# ChromaDB Studio

A modern web interface for ChromaDB built with Next.js 15, React 19, and TypeScript. This application provides a user-friendly way to interact with ChromaDB, a modern embedding database.

## 🚀 Features

- Modern UI built with Next.js 15 and React 19
- TypeScript for type safety
- ChromaDB integration
- Docker support for easy deployment
- Ollama integration for embeddings

## 📋 Prerequisites

Before you begin, ensure you have installed:

- Node.js 18.x or later
- Docker and Docker Compose
- npm or yarn or pnpm or bun

## 🛠️ Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/oscarabcorona/chromadb-studio
cd chromadb-studio
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🐳 Docker Setup

### Starting Required Services

1. Start ChromaDB:

```bash
docker run -d --name chromadb \
  -p 8000:8000 \
  chromadb/chroma
```

2. Start Ollama:

```bash
docker run -d --name ollama \
  -p 11434:11434 \
  ollama/ollama
```

3. Pull the embedding model:

```bash
curl http://localhost:11434/api/pull -d '{"name": "mxbai-embed-large"}'
```

### Verifying Services

- ChromaDB should be accessible at: http://localhost:8000
- Ollama should be accessible at: http://localhost:11434

## 🏗️ Project Structure

```
src/
├── app/         # Next.js app router pages
├── components/  # React components
├── config/      # Configuration files
├── lib/         # Utility functions and libraries
└── types/       # TypeScript type definitions
```

## 📦 Key Dependencies

- Next.js 15.3.1 - React framework
- React 19.0.0 - UI library
- ChromaDB 2.3.0 - Embedding database
- TypeScript - Type safety
- TailwindCSS - Styling
- UUID - Unique identifier generation

## 🚀 Deployment

The application can be deployed using Vercel or any other Next.js-compatible hosting platform:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/chromadb-studio)

For more details on deployment, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is available under a custom license that allows free use for non-commercial purposes. Commercial use requires explicit approval from Oscar Corona (oabc4004@gmail.com). See the [LICENSE](LICENSE) file for details.

For commercial licensing inquiries, please contact:

- Email: oabc4004@gmail.com
- Subject: "ChromaDB Studio Commercial License Request"
