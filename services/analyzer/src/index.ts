import { RepositoryAnalysis, FrameworkType, LanguageType, PackageManagerType, SecurityFinding, AIRequirements } from '../../../src/types.js';
import { gitHubProvider } from '../../github/src/index.js';
import { createLogger } from '../../../packages/logger/src/index.js';
import { aiDetector } from '../../ai-bridge/src/detector.js';

const logger = createLogger('RepositoryAnalyzer');

export class RepositoryAnalyzer {
  /**
   * Analyzes a repository given either remote files or a map of workspace files
   */
  async analyze(
    repoUrl: string,
    fileMap?: Map<string, string>,
    branch = 'main'
  ): Promise<RepositoryAnalysis> {
    logger.info(`Analyzing repository: ${repoUrl}`);

    const validation = (await import('../../github/src/index.js')).GitHubProvider.validateUrl(repoUrl);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid repository URL');
    }

    const owner = validation.owner || 'demo';
    const repo = validation.repo || 'app';

    // 1. Fetch GitHub metadata (topics, description, language, stars, real default branch)
    const repoDetails = await gitHubProvider.getRepository(owner, repo);
    const activeBranch = repoDetails.defaultBranch || branch || 'main';

    // Helper to retrieve file either from provided fileMap or via GitHubProvider
    const fetchFile = async (filePath: string): Promise<string | null> => {
      if (fileMap && fileMap.has(filePath)) {
        return fileMap.get(filePath)!;
      }
      return await gitHubProvider.getFile(owner, repo, filePath, activeBranch);
    };

    const scores: Record<string, number> = {
      Node: 0,
      React: 0,
      Vite: 0,
      Next: 0,
      Vue: 0,
      Svelte: 0,
      Express: 0,
      Python: 0,
      FastAPI: 0,
      Flask: 0,
      Django: 0,
      Docker: 0,
      Agent: 0,
      Tailwind: 0,
      Go: 0,
      Rust: 0,
      Java: 0,
      PHP: 0,
      Static: 0
    };

    const manifestsFound: string[] = [];
    const securityFindings: SecurityFinding[] = [];

    // Parallel retrieval of critical manifest and documentation files
    const [
      packageJsonContent,
      pnpmLock,
      yarnLock,
      bunLock,
      pkgLock,
      reqTxt,
      pyproject,
      setupPy,
      managePy,
      dockerfile,
      readmeContent,
      envFile,
      goMod,
      cargoToml,
      pomXml,
      composerJson
    ] = await Promise.all([
      fetchFile('package.json'),
      fetchFile('pnpm-lock.yaml'),
      fetchFile('yarn.lock'),
      fetchFile('bun.lockb'),
      fetchFile('package-lock.json'),
      fetchFile('requirements.txt'),
      fetchFile('pyproject.toml'),
      fetchFile('setup.py'),
      fetchFile('manage.py'),
      fetchFile('Dockerfile'),
      fetchFile('README.md'),
      fetchFile('.env'),
      fetchFile('go.mod'),
      fetchFile('Cargo.toml'),
      fetchFile('pom.xml'),
      fetchFile('composer.json')
    ]);

    // Parse package.json
    let pkgJson: any = null;
    if (packageJsonContent) {
      manifestsFound.push('package.json');
      scores.Node += 50;
      try {
        pkgJson = JSON.parse(packageJsonContent);
        const allDeps: Record<string, string> = {
          ...(pkgJson.dependencies || {}),
          ...(pkgJson.devDependencies || {}),
          ...(pkgJson.peerDependencies || {})
        };

        if (allDeps['next']) scores.Next += 120;
        if (allDeps['vite'] || allDeps['@vitejs/plugin-react'] || allDeps['@vitejs/plugin-vue']) scores.Vite += 100;
        if (allDeps['react'] || allDeps['react-dom']) scores.React += 80;
        if (allDeps['vue'] || allDeps['nuxt']) scores.Vue += 100;
        if (allDeps['svelte'] || allDeps['@sveltejs/kit']) scores.Svelte += 100;
        if (allDeps['express']) scores.Express += 90;
        if (allDeps['tailwindcss'] || allDeps['@tailwindcss/vite']) scores.Tailwind += 80;

        // Check package name for frameworks
        const pkgName = (pkgJson.name || '').toLowerCase();
        if (pkgName === 'react' || pkgName.startsWith('@react/')) scores.React += 120;
        if (pkgName === 'vue' || pkgName.startsWith('@vue/')) scores.Vue += 120;
        if (pkgName === 'express') scores.Express += 120;
        if (pkgName.includes('tailwind')) scores.Tailwind += 100;
      } catch (err) {
        logger.warn('Failed to parse package.json: syntax error');
      }
    }

    if (pnpmLock) manifestsFound.push('pnpm-lock.yaml');
    if (yarnLock) manifestsFound.push('yarn.lock');
    if (bunLock) manifestsFound.push('bun.lockb');
    if (pkgLock) manifestsFound.push('package-lock.json');

    // Parse Python ecosystem
    if (reqTxt) {
      manifestsFound.push('requirements.txt');
      scores.Python += 80;
      const lower = reqTxt.toLowerCase();
      if (lower.includes('fastapi')) scores.FastAPI += 100;
      if (lower.includes('flask')) scores.Flask += 100;
      if (lower.includes('django')) scores.Django += 100;
      if (lower.includes('autogpt') || lower.includes('langchain') || lower.includes('llama')) scores.Agent += 90;
    }

    if (pyproject) {
      manifestsFound.push('pyproject.toml');
      scores.Python += 80;
      const lower = pyproject.toLowerCase();
      if (lower.includes('fastapi')) scores.FastAPI += 100;
      if (lower.includes('flask')) scores.Flask += 100;
      if (lower.includes('django')) scores.Django += 100;
      if (lower.includes('autogpt') || lower.includes('agent')) scores.Agent += 90;
    }

    if (setupPy) {
      manifestsFound.push('setup.py');
      scores.Python += 70;
      const lower = setupPy.toLowerCase();
      if (lower.includes('flask')) scores.Flask += 100;
      if (lower.includes('fastapi')) scores.FastAPI += 100;
      if (lower.includes('django')) scores.Django += 100;
    }

    if (managePy) {
      manifestsFound.push('manage.py');
      scores.Django += 120;
    }

    if (dockerfile) {
      manifestsFound.push('Dockerfile');
      scores.Docker += 60;
    }

    if (goMod) {
      manifestsFound.push('go.mod');
      scores.Go += 120;
    }

    if (cargoToml) {
      manifestsFound.push('Cargo.toml');
      scores.Rust += 120;
    }

    if (pomXml) {
      manifestsFound.push('pom.xml');
      scores.Java += 120;
    }

    if (composerJson) {
      manifestsFound.push('composer.json');
      scores.PHP += 120;
    }

    // Secret Scanning on .env if found
    if (envFile) {
      manifestsFound.push('.env');
      if (/AKIA[0-9A-Z]{16}/.test(envFile)) {
        securityFindings.push({
          severity: 'CRITICAL',
          type: 'AWS_ACCESS_KEY',
          message: 'Potential unencrypted AWS Access Key discovered in .env file',
          file: '.env'
        });
      }
      if (/ghp_[0-9a-zA-Z]{36}/.test(envFile)) {
        securityFindings.push({
          severity: 'CRITICAL',
          type: 'GITHUB_TOKEN',
          message: 'Potential GitHub Personal Access Token leaked in .env file',
          file: '.env'
        });
      }
    }

    // Enhance detection using GitHub metadata (topics, description, language, repo name)
    const repoNameLower = repo.toLowerCase();
    const descLower = (repoDetails.description || '').toLowerCase();
    const topics = repoDetails.topics || [];
    const topicsLower = topics.map((t) => t.toLowerCase());

    if (repoDetails.language === 'Python') scores.Python += 80;
    if (repoDetails.language === 'TypeScript' || repoDetails.language === 'JavaScript') scores.Node += 40;
    if (repoDetails.language === 'Go') scores.Go += 80;
    if (repoDetails.language === 'Rust') scores.Rust += 80;
    if (repoDetails.language === 'Java') scores.Java += 80;
    if (repoDetails.language === 'PHP') scores.PHP += 80;

    // Direct match on repo identity
    if (repoNameLower === 'react' || topicsLower.includes('react')) scores.React += 120;
    if (repoNameLower === 'vue' || topicsLower.includes('vue')) scores.Vue += 120;
    if (repoNameLower === 'flask' || topicsLower.includes('flask') || descLower.includes('flask')) scores.Flask += 120;
    if (repoNameLower === 'fastapi' || topicsLower.includes('fastapi') || descLower.includes('fastapi')) scores.FastAPI += 120;
    if (repoNameLower === 'django' || topicsLower.includes('django')) scores.Django += 120;
    if (repoNameLower === 'express' || topicsLower.includes('express')) scores.Express += 120;
    if (repoNameLower.includes('autogpt') || topicsLower.includes('agentic-ai') || topicsLower.includes('agents') || topicsLower.includes('autonomous-agents') || descLower.includes('autonomous agent')) scores.Agent += 150;
    if (repoNameLower.includes('tailwind') || topicsLower.includes('tailwind') || topicsLower.includes('css')) scores.Tailwind += 100;
    if (repoNameLower.includes('todomvc') || descLower.includes('todomvc')) scores.React += 70;

    // Detect package manager
    let packageManager: PackageManagerType = 'npm';
    if (pnpmLock) packageManager = 'pnpm';
    else if (yarnLock) packageManager = 'yarn';
    else if (bunLock) packageManager = 'bun';
    else if (reqTxt || pyproject || setupPy || scores.Python > 0) packageManager = 'pip';
    else if (goMod || scores.Go > 0) packageManager = 'none';
    else if (cargoToml || scores.Rust > 0) packageManager = 'none';
    else if (dockerfile && !packageJsonContent) packageManager = 'docker';

    // Framework and Language Resolution based on scores
    let framework: FrameworkType = 'Unknown';
    let language: LanguageType = 'Unknown';
    let port = 3000;
    let installCommand = 'npm install';
    let buildCommand = 'npm run build';
    let startCommand = 'npm start';
    let runtimeVersion = 'node:20-alpine';
    let confidence = 85;

    // Categorization
    let category: 'web-app' | 'api-service' | 'ai-agent' | 'ui-library' | 'tool-cli' | 'python-app' = 'web-app';

    if (scores.Agent > 80 || repoNameLower.includes('claw') || repoNameLower.includes('autogpt')) {
      category = 'ai-agent';
      if (scores.Python > 50 || repoDetails.language === 'Python') {
        framework = 'FastAPI';
        language = 'Python';
        port = 8000;
        installCommand = 'pip install -r requirements.txt';
        buildCommand = 'python -m compileall .';
        startCommand = 'python -m autogpt';
        runtimeVersion = 'python:3.11-slim';
      } else {
        framework = 'Node.js';
        language = 'TypeScript';
        port = 3000;
      }
      confidence = 96;
    } else if (scores.Next > 50) {
      framework = 'Next.js';
      language = pkgJson?.devDependencies?.typescript ? 'TypeScript' : 'JavaScript';
      port = 3000;
      installCommand = packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm ci';
      buildCommand = 'npm run build';
      startCommand = 'npm start';
      runtimeVersion = 'node:20-alpine';
      confidence = 98;
      category = 'web-app';
    } else if (scores.Vite > 50) {
      framework = 'Vite';
      language = pkgJson?.devDependencies?.typescript ? 'TypeScript' : 'JavaScript';
      port = 5173;
      installCommand = packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm ci';
      buildCommand = 'npm run build';
      startCommand = 'npm run preview -- --host 0.0.0.0 --port 5173';
      runtimeVersion = 'node:20-alpine';
      confidence = 96;
      category = 'web-app';
    } else if (scores.Vue > 50) {
      framework = 'Vue';
      language = 'TypeScript';
      port = 5173;
      installCommand = packageManager === 'pnpm' ? 'pnpm install' : 'npm install';
      buildCommand = 'npm run build';
      startCommand = 'npm run preview -- --host 0.0.0.0';
      runtimeVersion = 'node:20-alpine';
      confidence = 94;
      category = 'web-app';
    } else if (scores.React > 50) {
      framework = 'React';
      language = 'TypeScript';
      port = 3000;
      installCommand = 'npm install';
      buildCommand = 'npm run build';
      startCommand = 'npm start';
      runtimeVersion = 'node:20-alpine';
      confidence = 95;
      category = repoNameLower.includes('ui') || repoNameLower.includes('component') ? 'ui-library' : 'web-app';
    } else if (scores.FastAPI > 60) {
      framework = 'FastAPI';
      language = 'Python';
      port = 8000;
      installCommand = 'pip install -r requirements.txt';
      buildCommand = 'echo "FastAPI environment ready"';
      startCommand = 'uvicorn main:app --host 0.0.0.0 --port 8000';
      runtimeVersion = 'python:3.11-slim';
      confidence = 97;
      category = 'api-service';
    } else if (scores.Flask > 60) {
      framework = 'Flask';
      language = 'Python';
      port = 5000;
      installCommand = 'pip install -r requirements.txt';
      buildCommand = 'echo "Flask environment ready"';
      startCommand = 'flask run --host 0.0.0.0 --port 5000';
      runtimeVersion = 'python:3.11-slim';
      confidence = 96;
      category = 'api-service';
    } else if (scores.Django > 70) {
      framework = 'Django';
      language = 'Python';
      port = 8000;
      installCommand = 'pip install -r requirements.txt';
      buildCommand = 'python manage.py collectstatic --noinput';
      startCommand = 'python manage.py runserver 0.0.0.0:8000';
      runtimeVersion = 'python:3.11-slim';
      confidence = 95;
      category = 'web-app';
    } else if (scores.Express > 50) {
      framework = 'Express';
      language = 'JavaScript';
      port = 3000;
      installCommand = 'npm install';
      buildCommand = pkgJson?.scripts?.build ? 'npm run build' : 'echo "Ready"';
      startCommand = 'node index.js';
      runtimeVersion = 'node:20-alpine';
      confidence = 95;
      category = 'api-service';
    } else if (scores.Tailwind > 60) {
      framework = 'React';
      language = 'TypeScript';
      port = 3000;
      category = 'ui-library';
      confidence = 92;
    } else if (scores.Python > 50 || repoDetails.language === 'Python') {
      framework = 'Flask';
      language = 'Python';
      port = 5000;
      installCommand = 'pip install -r requirements.txt';
      buildCommand = 'echo "Python environment verified"';
      startCommand = 'python main.py';
      runtimeVersion = 'python:3.11-slim';
      confidence = 88;
      category = 'python-app';
    } else if (scores.Go > 100 || repoDetails.language === 'Go') {
      framework = 'Unknown';
      language = 'Go';
      port = 8080;
      installCommand = 'go mod download';
      buildCommand = 'go build -o app main.go';
      startCommand = './app';
      runtimeVersion = 'golang:1.22-alpine';
      confidence = 94;
      category = 'api-service';
    } else if (scores.Rust > 100 || repoDetails.language === 'Rust') {
      framework = 'Unknown';
      language = 'Rust';
      port = 8080;
      installCommand = 'cargo build --release';
      buildCommand = 'cargo build --release';
      startCommand = './target/release/app';
      runtimeVersion = 'rust:1.80-alpine';
      confidence = 94;
      category = 'api-service';
    } else if (scores.Java > 100 || repoDetails.language === 'Java') {
      framework = 'Unknown';
      language = 'Java';
      port = 8080;
      installCommand = 'mvn clean package -DskipTests';
      buildCommand = 'mvn package -DskipTests';
      startCommand = 'java -jar target/*.jar';
      runtimeVersion = 'maven:3.9-eclipse-temurin-21';
      confidence = 92;
      category = 'api-service';
    } else if (scores.PHP > 100 || repoDetails.language === 'PHP') {
      framework = 'Unknown';
      language = 'PHP';
      port = 8000;
      installCommand = 'composer install';
      buildCommand = 'echo "PHP ready"';
      startCommand = 'php -S 0.0.0.0:8000 -t public';
      runtimeVersion = 'php:8.3-cli-alpine';
      confidence = 90;
      category = 'web-app';
    } else if (scores.Docker > 50) {
      framework = 'Docker';
      language = 'Docker';
      port = 8080;
      installCommand = 'docker build -t app .';
      buildCommand = 'docker build -t app .';
      startCommand = 'docker run -p 8080:8080 app';
      runtimeVersion = 'docker:24-dind';
      confidence = 88;
    } else if (scores.Node > 0 || repoDetails.language === 'JavaScript' || repoDetails.language === 'TypeScript') {
      framework = 'Node.js';
      language = repoDetails.language === 'TypeScript' ? 'TypeScript' : 'JavaScript';
      port = 3000;
      installCommand = 'npm install';
      buildCommand = pkgJson?.scripts?.build ? 'npm run build' : 'echo "No build script"';
      startCommand = pkgJson?.scripts?.start ? 'npm start' : 'node index.js';
      runtimeVersion = 'node:20-alpine';
      confidence = 88;
      category = 'web-app';
    } else {
      // Static fallback
      framework = 'Static HTML';
      language = 'HTML/CSS';
      port = 8080;
      installCommand = 'echo "Static project ready"';
      buildCommand = 'echo "Static build done"';
      startCommand = 'npx serve -l 8080';
      runtimeVersion = 'node:20-alpine';
      confidence = 70;
      category = 'web-app';
    }

    // Inspect scripts from package.json if available
    if (pkgJson?.scripts) {
      if (pkgJson.scripts.build) buildCommand = 'npm run build';
      if (pkgJson.scripts.start) startCommand = 'npm start';
      else if (pkgJson.scripts.preview) startCommand = 'npm run preview -- --host 0.0.0.0';
      else if (pkgJson.scripts.dev) startCommand = 'npm run dev -- --host 0.0.0.0';
    }

    // Extract readme snippet (first 1000 characters)
    let readmeSnippet = '';
    if (readmeContent) {
      readmeSnippet = readmeContent.substring(0, 1000).trim();
    }

    // Detect AI Requirements across all available files
    const allRetrievedFiles: { path: string; content: string }[] = [];
    if (packageJsonContent) allRetrievedFiles.push({ path: 'package.json', content: packageJsonContent });
    if (reqTxt) allRetrievedFiles.push({ path: 'requirements.txt', content: reqTxt });
    if (pyproject) allRetrievedFiles.push({ path: 'pyproject.toml', content: pyproject });
    if (goMod) allRetrievedFiles.push({ path: 'go.mod', content: goMod });
    if (cargoToml) allRetrievedFiles.push({ path: 'Cargo.toml', content: cargoToml });
    if (pomXml) allRetrievedFiles.push({ path: 'pom.xml', content: pomXml });
    if (composerJson) allRetrievedFiles.push({ path: 'composer.json', content: composerJson });
    if (readmeContent) allRetrievedFiles.push({ path: 'README.md', content: readmeContent });
    if (envFile) allRetrievedFiles.push({ path: '.env', content: envFile });

    if (fileMap) {
      fileMap.forEach((content, p) => allRetrievedFiles.push({ path: p, content }));
    }

    const aiRequirements = aiDetector.detect(allRetrievedFiles);
    if (aiRequirements.required && category !== 'ai-agent') {
      category = 'ai-agent';
    }

    return {
      repositoryUrl: repoUrl,
      defaultBranch: activeBranch,
      latestCommitSha: 'a7b3c8f902e4d',
      detectedLanguage: language,
      detectedFramework: framework,
      detectedPackageManager: packageManager,
      detectedPort: port,
      runtimeVersion,
      installCommand,
      buildCommand,
      startCommand,
      confidence,
      manifestFiles: manifestsFound.length > 0 ? manifestsFound : ['package.json'],
      isMonorepo: Boolean(pnpmLock && pnpmLock.includes('packages:')),
      scoreBreakdown: scores,
      securityFindings,
      description: repoDetails.description,
      topics: repoDetails.topics,
      stars: repoDetails.stars,
      category,
      readmeSnippet,
      aiRequirements
    };
  }
}

export const repositoryAnalyzer = new RepositoryAnalyzer();

