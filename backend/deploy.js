require('dotenv').config();

async function pushToGitHub(blueprint, dbCode, backendCode, frontendCode, readme) {
  const repoName = blueprint.project_name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const repoRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: repoName,
      private: false,
      auto_init: false,
      description: blueprint.description || '',
    }),
  });

  const repo = await repoRes.json();
  if (!repo.full_name) throw new Error('GitHub repo creation failed: ' + (repo.message || JSON.stringify(repo)));

  const files = {
    'backend/server.js': backendCode,
    'backend/db/schema.js': dbCode,
    'backend/package.json': JSON.stringify({
      name: `${repoName}-backend`,
      version: '1.0.0',
      scripts: { start: 'node server.js' },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        'better-sqlite3': '^9.4.3',
        dotenv: '^16.4.1',
      },
    }, null, 2),
    'backend/.gitignore': 'node_modules/\n.env\n*.db',
    'frontend/src/App.jsx': frontendCode,
    'frontend/src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)`,
    'frontend/src/index.css': '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
    'frontend/index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${blueprint.project_name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    'frontend/vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })`,
    'frontend/tailwind.config.js': `export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}`,
    'frontend/postcss.config.js': `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}`,
    'frontend/package.json': JSON.stringify({
      name: `${repoName}-frontend`,
      version: '1.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build' },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.22.0',
        axios: '^1.6.7',
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.2.1',
        vite: '^5.1.4',
        tailwindcss: '^3.4.1',
        postcss: '^8.4.35',
        autoprefixer: '^10.4.18',
      },
    }, null, 2),
    'README.md': readme || `# ${blueprint.project_name}`,
  };

  for (const [filePath, content] of Object.entries(files)) {
    await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Add ${filePath}`,
        content: Buffer.from(content).toString('base64'),
      }),
    });
  }

  return { repoName, repoFullName: repo.full_name };
}

async function deployToVercel(repoFullName, repoName) {
  const headers = {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const projectRes = await fetch('https://api.vercel.com/v9/projects', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: repoName,
      gitRepository: { type: 'github', repo: repoFullName },
      rootDirectory: 'frontend',
      framework: 'vite',
    }),
  });

  const project = await projectRes.json();
  if (!project.id) throw new Error('Vercel failed: ' + JSON.stringify(project));

  await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: repoName,
      gitSource: { type: 'github', repo: repoFullName, ref: 'main' },
    }),
  });

  return `https://${repoName}.vercel.app`;
}

async function deployToRailway(repoFullName, repoName) {
  const headers = {
    Authorization: `Bearer ${process.env.RAILWAY_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const projectRes = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `mutation {
        projectCreate(input: { name: "${repoName}-api" }) {
          id name
        }
      }`,
    }),
  });

  const projectData = await projectRes.json();
  const projectId = projectData?.data?.projectCreate?.id;
  if (!projectId) throw new Error('Railway project creation failed: ' + JSON.stringify(projectData));

  await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `mutation {
        serviceCreate(input: {
          projectId: "${projectId}",
          source: { repo: "${repoFullName}", branch: "main" },
          rootDirectory: "backend"
        }) {
          id name
        }
      }`,
    }),
  });

  return `https://${repoName}-api.up.railway.app`;
}

async function deployApp(blueprint, dbCode, backendCode, frontendCode, readme) {
  const { repoName, repoFullName } = await pushToGitHub(blueprint, dbCode, backendCode, frontendCode, readme);
  const [frontendUrl, backendUrl] = await Promise.all([
    deployToVercel(repoFullName, repoName),
    deployToRailway(repoFullName, repoName),
  ]);
  return {
    githubUrl: `https://github.com/${repoFullName}`,
    frontendUrl,
    backendUrl,
  };
}

module.exports = { deployApp };