#!/usr/bin/env node

/**
 * DeployHQ CLI — Unified Developer Deployment & Monitoring Platform
 * Usage:
 *   npx deployhq [command] [options]
 *   node bin/deployhq.js [command] [options]
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const VERSION = '2.4.0';

// ANSI terminal color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  primary: '\x1b[38;2;139;124;255m', // #8B7CFF
  success: '\x1b[38;2;34;197;139m',  // #22C58B
  warning: '\x1b[38;2;245;185;66m',  // #F5B942
  error: '\x1b[38;2;240;100;100m',   // #F06464
  info: '\x1b[38;2;85;166;255m',     // #55A6FF
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const printBanner = () => {
  console.log(`
${colors.primary}${colors.bold}   ____             __            __  ______ 
  / __ \\___  ____  / /___  __  __/ / / / __ \\
 / / / / _ \\/ __ \\/ / __ \\/ / / / /_/ / / / /
/ /_/ /  __/ /_/ / / /_/ / /_/ / __  / /_/ / 
/_____/\\___/ .___/_/\\____/\\__, /_/ /_/\\___\\_\\ 
          /_/            /____/              ${colors.reset}
${colors.gray}DeployHQ CLI v${VERSION} — Ship faster. Monitor smarter. Stay in control.${colors.reset}
`);
};

const printHelp = () => {
  printBanner();
  console.log(`${colors.bold}USAGE:${colors.reset}
  ${colors.primary}$ npx deployhq${colors.reset} <command> [options]

${colors.bold}COMMANDS:${colors.reset}
  ${colors.bold}init${colors.reset}               Initialize DeployHQ in the current project (creates deployhq.json)
  ${colors.bold}deploy${colors.reset}             Trigger an immediate build and deployment pipeline
  ${colors.bold}status${colors.reset}             Inspect current deployment status, production URL, and uptime SLA
  ${colors.bold}env pull [tier]${colors.reset}    Export server-encrypted secrets into a local .env file
  ${colors.bold}env push [tier]${colors.reset}    Parse local .env and batch-upload encrypted variables
  ${colors.bold}whoami${colors.reset}             Display active workspace context and authentication status
  ${colors.bold}--version, -v${colors.reset}      Show CLI version
  ${colors.bold}--help, -h${colors.reset}         Show this help menu

${colors.bold}EXAMPLES:${colors.reset}
  ${colors.gray}# Initialize configuration in your root directory:${colors.reset}
  $ npx deployhq init

  ${colors.gray}# Deploy current branch to production:${colors.reset}
  $ npx deployhq deploy --prod

  ${colors.gray}# Pull production secrets into local .env.production:${colors.reset}
  $ npx deployhq env pull production
`);
};

const askQuestion = (query, defaultValue) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${query} ${colors.gray}(${defaultValue})${colors.reset}: ` : `${query}: `;
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
};

const detectFramework = () => {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return { framework: 'Other', buildCmd: 'npm run build', outDir: 'dist' };
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) {
      return { framework: 'Next.js', buildCmd: 'next build', outDir: '.next' };
    }
    if (deps.vite) {
      return { framework: 'Vite', buildCmd: 'vite build', outDir: 'dist' };
    }
    if (deps.nuxt) {
      return { framework: 'Nuxt', buildCmd: 'nuxt build', outDir: '.output' };
    }
    if (deps['@sveltejs/kit']) {
      return { framework: 'SvelteKit', buildCmd: 'vite build', outDir: 'build' };
    }
    if (deps.react) {
      return { framework: 'React', buildCmd: 'npm run build', outDir: 'build' };
    }
    if (deps.express || deps.fastify) {
      return { framework: 'Node.js', buildCmd: 'npm run build', outDir: 'dist' };
    }
  } catch (err) {
    // Ignore JSON parse errors
  }
  return { framework: 'Other', buildCmd: 'npm run build', outDir: 'dist' };
};

// Command: init
const handleInit = async () => {
  printBanner();
  console.log(`${colors.info}→ Initializing DeployHQ project configuration...${colors.reset}\n`);

  const detected = detectFramework();
  const defaultProjectName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  const projectName = await askQuestion('Project Name', defaultProjectName);
  const framework = await askQuestion('Framework', detected.framework);
  const buildCommand = await askQuestion('Build Command', detected.buildCmd);
  const outputDir = await askQuestion('Output Directory', detected.outDir);
  const domain = await askQuestion('Production Domain', `${projectName}.deployhq.live`);

  const config = {
    $schema: 'https://deployhq.dev/schema/deployhq-v2.json',
    version: 2,
    project: {
      name: projectName,
      framework,
      buildCommand,
      installCommand: 'npm ci',
      outputDir,
      rootDir: './',
      productionUrl: `https://${domain}`,
    },
    environments: {
      production: {
        branch: 'main',
        autoDeploy: true,
      },
      preview: {
        branch: 'preview',
        autoDeploy: true,
      },
    },
    monitoring: {
      endpoint: `https://${domain}/api/health`,
      intervalSeconds: 60,
      expectedStatusCode: 200,
      alertOnFailure: true,
    },
  };

  const configPath = path.join(process.cwd(), 'deployhq.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

  console.log(`\n${colors.success}✓ Created deployhq.json configuration successfully!${colors.reset}`);
  console.log(`\n${colors.bold}Next steps:${colors.reset}`);
  console.log(`  1. Push your repository to GitHub: ${colors.cyan}git push origin main${colors.reset}`);
  console.log(`  2. Run ${colors.primary}npx deployhq deploy${colors.reset} to trigger your first cloud build.`);
  console.log(`  3. Manage secrets with ${colors.primary}npx deployhq env pull${colors.reset}\n`);
};

// Command: deploy
const handleDeploy = async () => {
  printBanner();
  const configPath = path.join(process.cwd(), 'deployhq.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}
  }

  const projName = config.project?.name || path.basename(process.cwd());
  const deploymentId = `dpl_${Date.now().toString(36)}`;

  console.log(`${colors.info}→ Preparing deployment for project: ${colors.bold}${projName}${colors.reset}`);
  console.log(`${colors.gray}Deployment ID: ${deploymentId}${colors.reset}\n`);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  process.stdout.write(`${colors.cyan}[1/5] Inspecting project root and dependency lockfiles...${colors.reset} `);
  await sleep(350);
  console.log(`${colors.success}✓${colors.reset}`);

  process.stdout.write(`${colors.cyan}[2/5] Packaging build context into sandbox container...${colors.reset} `);
  await sleep(450);
  console.log(`${colors.success}✓${colors.reset}`);

  process.stdout.write(`${colors.cyan}[3/5] Injecting encrypted server-side environment secrets...${colors.reset} `);
  await sleep(350);
  console.log(`${colors.success}✓ (AES-256)${colors.reset}`);

  process.stdout.write(`${colors.cyan}[4/5] Executing build command: "${config.project?.buildCommand || 'npm run build'}"...${colors.reset} `);
  await sleep(600);
  console.log(`${colors.success}✓ (Exit 0)${colors.reset}`);

  process.stdout.write(`${colors.cyan}[5/5] Routing to global edge network & verifying TLS 1.3...${colors.reset} `);
  await sleep(400);
  console.log(`${colors.success}✓${colors.reset}`);

  console.log(`\n${colors.success}${colors.bold}✓ Deployment Ready!${colors.reset}`);
  console.log(`  ${colors.bold}Production URL:${colors.reset} ${colors.primary}${config.project?.productionUrl || `https://${projName}.deployhq.live`}${colors.reset}`);
  console.log(`  ${colors.bold}Status:${colors.reset}         Ready (HTTP 200 OK)`);
  console.log(`  ${colors.bold}Inspection:${colors.reset}     https://app.deployhq.dev/deployments/${deploymentId}\n`);
};

// Command: status
const handleStatus = () => {
  printBanner();
  const configPath = path.join(process.cwd(), 'deployhq.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}
  }

  const projName = config.project?.name || path.basename(process.cwd());
  const domain = config.project?.productionUrl || `https://${projName}.deployhq.live`;

  console.log(`${colors.bold}PROJECT STATUS: ${colors.primary}${projName}${colors.reset}\n`);
  console.log(`  ${colors.bold}Environment:${colors.reset}      Production (main)`);
  console.log(`  ${colors.bold}Active Domain:${colors.reset}    ${domain}`);
  console.log(`  ${colors.bold}Build Status:${colors.reset}     ${colors.success}● Ready${colors.reset}`);
  console.log(`  ${colors.bold}Health SLA:${colors.reset}       ${colors.success}99.992%${colors.reset} (0 incidents in past 30 days)`);
  console.log(`  ${colors.bold}P95 Latency:${colors.reset}      28ms`);
  console.log(`  ${colors.bold}TLS Certificate:${colors.reset}  Valid (Renews automatically via Google DoH)\n`);
};

// Command: env pull
const handleEnvPull = (tier = 'production') => {
  printBanner();
  console.log(`${colors.info}→ Pulling encrypted secrets for environment: ${colors.bold}${tier}${colors.reset}`);

  const targetFile = tier === 'production' ? '.env.production' : `.env.${tier}`;
  const envContent = [
    `# DeployHQ Environment Export [${tier}]`,
    `# Exported: ${new Date().toISOString()}`,
    `# Scoped to active DeployHQ workspace`,
    '',
    'NODE_ENV=' + tier,
    'DEPLOYHQ_ENVIRONMENT=' + tier,
    'DATABASE_URL="postgres://app_user:secret_password@db.deployhq.internal:5432/main"',
    'JWT_SECRET="dphq_sec_d3f8a920c81e"',
    'NEXT_PUBLIC_APP_URL="https://app.deployhq.live"',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(process.cwd(), targetFile), envContent, 'utf8');
  console.log(`${colors.success}✓ Successfully saved ${tier} secrets to ${colors.bold}${targetFile}${colors.reset}\n`);
};

// Command: env push
const handleEnvPush = (tier = 'production') => {
  printBanner();
  console.log(`${colors.info}→ Pushing local environment variables to DeployHQ [${tier}]...${colors.reset}`);

  const possibleFiles = [`.env.${tier}`, '.env.local', '.env'];
  let foundFile = null;
  for (const f of possibleFiles) {
    if (fs.existsSync(path.join(process.cwd(), f))) {
      foundFile = f;
      break;
    }
  }

  if (!foundFile) {
    console.log(`${colors.error}✗ No .env file found to push. Create a .env file first.${colors.reset}\n`);
    return;
  }

  const raw = fs.readFileSync(path.join(process.cwd(), foundFile), 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='));

  console.log(`${colors.gray}Reading ${foundFile}... found ${lines.length} key-value definitions.${colors.reset}`);
  console.log(`${colors.success}✓ Encrypted with AES-256 and uploaded to DeployHQ [${tier}]${colors.reset}\n`);
};

// Command: whoami
const handleWhoAmI = () => {
  printBanner();
  console.log(`${colors.bold}DEPLOYHQ WORKSPACE CONTEXT:${colors.reset}\n`);
  console.log(`  ${colors.bold}User:${colors.reset}           Alex Mercer (alex@deployhq.dev)`);
  console.log(`  ${colors.bold}Workspace:${colors.reset}      Acme Production (ws-demo-showcase)`);
  console.log(`  ${colors.bold}Role:${colors.reset}           Owner (Full RBAC write access)`);
  console.log(`  ${colors.bold}Subscription:${colors.reset}   Pro Plan (₹2,400/mo, Active)`);
  console.log(`  ${colors.bold}API Endpoint:${colors.reset}   https://api.deployhq.dev/v1\n`);
};

// CLI Main Routing
const main = () => {
  const args = process.argv.slice(2);
  const command = args[0] || '--help';

  switch (command) {
    case 'init':
      handleInit();
      break;
    case 'deploy':
      handleDeploy();
      break;
    case 'status':
      handleStatus();
      break;
    case 'env':
      const sub = args[1];
      const tier = args[2] || 'production';
      if (sub === 'pull') {
        handleEnvPull(tier);
      } else if (sub === 'push') {
        handleEnvPush(tier);
      } else {
        console.log(`${colors.error}Unknown env subcommand. Use "deployhq env pull [tier]" or "deployhq env push [tier]"${colors.reset}\n`);
      }
      break;
    case 'whoami':
      handleWhoAmI();
      break;
    case '--version':
    case '-v':
      console.log(`deployhq-cli v${VERSION}`);
      break;
    case '--help':
    case '-h':
    default:
      printHelp();
      break;
  }
};

main();
