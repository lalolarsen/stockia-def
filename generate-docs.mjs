// generate-docs.mjs
// Ejecutar con: node generate-docs.mjs
// Genera documentación automática en /docs para Obsidian

import fs from "fs";
import path from "path";

const DOCS_DIR = "./docs";
const SRC_DIR = "./src";

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function writeDoc(folder, filename, content) {
  const dir = path.join(DOCS_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, "utf-8");
  console.log(`✅ ${folder}/${filename}`);
}

function getFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => ext.some((e) => f.endsWith(e)));
}

function getFilesRecursive(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getFilesRecursive(filePath, ext));
    } else if (ext.some((e) => file.endsWith(e))) {
      results.push(filePath);
    }
  }
  return results;
}

// ─── Extraer info del archivo ────────────────────────────────────────────────

function extractComponentInfo(content, filePath) {
  const name = path.basename(filePath, path.extname(filePath));

  // Imports
  const imports = [...content.matchAll(/^import (.+) from ['"](.+)['"]/gm)].map(
    (m) => `- \`${m[2]}\``
  );

  // Props (TypeScript interfaces/types)
  const propsMatch = content.match(/(?:interface|type)\s+\w*Props\w*\s*[={][^}]+}/s);
  const props = propsMatch ? propsMatch[0] : null;

  // Hooks usados
  const hooks = [
    ...new Set([...content.matchAll(/\b(use[A-Z]\w+)\s*\(/g)].map((m) => m[1])),
  ];

  // Supabase calls
  const supabaseCalls = [
    ...new Set(
      [...content.matchAll(/supabase\.(from|auth|storage|rpc)\(['"]?(\w+)/g)].map(
        (m) => `\`${m[1]}(${m[2]})\``
      )
    ),
  ];

  return { name, imports, props, hooks, supabaseCalls };
}

function extractServiceInfo(content, filePath) {
  const name = path.basename(filePath, path.extname(filePath));

  // Funciones exportadas
  const functions = [
    ...content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)\s*=/g),
  ].map((m) => m[1] || m[2]);

  // Tablas de Supabase
  const tables = [
    ...new Set([...content.matchAll(/\.from\(['"](\w+)['"]\)/g)].map((m) => m[1])),
  ];

  // Tipos de operaciones
  const ops = {
    select: content.includes(".select("),
    insert: content.includes(".insert("),
    update: content.includes(".update("),
    delete: content.includes(".delete("),
    upsert: content.includes(".upsert("),
  };

  return { name, functions, tables, ops };
}

// ─── Generar docs de Componentes ─────────────────────────────────────────────

function generateComponentDocs() {
  const componentFiles = getFilesRecursive(`${SRC_DIR}/components`, [".tsx", ".ts"]);
  const pageFiles = getFilesRecursive(`${SRC_DIR}/pages`, [".tsx"]);
  const layoutFiles = getFilesRecursive(`${SRC_DIR}/layouts`, [".tsx"]);

  const allFiles = [...componentFiles, ...pageFiles, ...layoutFiles];

  for (const filePath of allFiles) {
    const content = readFile(filePath);
    const { name, imports, hooks, supabaseCalls, props } = extractComponentInfo(
      content,
      filePath
    );

    const relativePath = filePath.replace("./", "");
    const category = filePath.includes("/pages/")
      ? "páginas"
      : filePath.includes("/layouts/")
      ? "layouts"
      : "componentes";

    let md = `# ${name}\n\n`;
    md += `**Categoría:** ${category}\n`;
    md += `**Ruta:** \`${relativePath}\`\n\n`;

    if (props) {
      md += `## Props\n\`\`\`typescript\n${props}\n\`\`\`\n\n`;
    }

    if (hooks.length > 0) {
      md += `## Hooks utilizados\n${hooks.map((h) => `- \`${h}\``).join("\n")}\n\n`;
    }

    if (supabaseCalls.length > 0) {
      md += `## Llamadas a Supabase\n${supabaseCalls.join("\n")}\n\n`;
    }

    if (imports.length > 0) {
      md += `## Imports\n${imports.slice(0, 10).join("\n")}\n\n`;
    }

    md += `---\n*Generado automáticamente — no editar manualmente*\n`;

    const folder =
      category === "páginas"
        ? `componentes/paginas`
        : category === "layouts"
        ? `componentes/layouts`
        : `componentes/ui`;

    writeDoc(folder, `${name}.md`, md);
  }
}

// ─── Generar docs de Servicios ───────────────────────────────────────────────

function generateServiceDocs() {
  const serviceFiles = getFilesRecursive(`${SRC_DIR}/services`, [".ts"]);

  const tableMap = {}; // tabla -> servicios que la usan

  for (const filePath of serviceFiles) {
    const content = readFile(filePath);
    const { name, functions, tables, ops } = extractServiceInfo(content, filePath);

    let md = `# Servicio: ${name}\n\n`;
    md += `**Ruta:** \`${filePath.replace("./", "")}\`\n\n`;

    if (tables.length > 0) {
      md += `## Tablas de Supabase\n${tables.map((t) => `- [[${t}]]`).join("\n")}\n\n`;
      for (const t of tables) {
        if (!tableMap[t]) tableMap[t] = [];
        tableMap[t].push(name);
      }
    }

    if (functions.length > 0) {
      md += `## Funciones exportadas\n${functions.map((f) => `- \`${f}()\``).join("\n")}\n\n`;
    }

    const activeOps = Object.entries(ops)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (activeOps.length > 0) {
      md += `## Operaciones\n${activeOps.map((o) => `- \`${o}\``).join("\n")}\n\n`;
    }

    md += `---\n*Generado automáticamente — no editar manualmente*\n`;

    writeDoc("servicios", `${name}.md`, md);
  }

  return tableMap;
}

// ─── Generar docs de Rutas ───────────────────────────────────────────────────

function generateRoutesDocs() {
  const routerContent = readFile(`${SRC_DIR}/app/router.tsx`);

  const routes = [...routerContent.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map(
    (m) => m[1]
  );
  const elements = [...routerContent.matchAll(/element:\s*<(\w+)/g)].map((m) => m[1]);

  let md = `# Rutas del proyecto\n\n`;
  md += `**Archivo:** \`src/app/router.tsx\`\n\n`;
  md += `## Rutas definidas\n\n`;
  md += `| Ruta | Componente |\n|------|------------|\n`;

  for (let i = 0; i < routes.length; i++) {
    const component = elements[i] || "—";
    md += `| \`${routes[i]}\` | [[${component}]] |\n`;
  }

  md += `\n---\n*Generado automáticamente — no editar manualmente*\n`;

  writeDoc("rutas", "router.md", md);
}

// ─── Generar docs de Tablas Supabase ────────────────────────────────────────

function generateSupabaseDocs(tableMap) {
  const dbTypesContent = readFile(`${SRC_DIR}/types/database.ts`);

  // Extraer interfaces/tipos de tablas
  const tableTypes = [...dbTypesContent.matchAll(/(\w+):\s*\{[\s\S]*?Row:\s*\{([\s\S]*?)\}/g)];

  for (const [, tableName, rowContent] of tableTypes) {
    const fields = [...rowContent.matchAll(/(\w+):\s*([^;\n]+)/g)].map(
      (m) => `| \`${m[1]}\` | \`${m[2].trim()}\` |`
    );

    let md = `# Tabla: ${tableName}\n\n`;
    md += `## Campos\n\n`;
    md += `| Campo | Tipo |\n|-------|------|\n`;
    md += fields.join("\n") + "\n\n";

    const usedBy = tableMap[tableName];
    if (usedBy && usedBy.length > 0) {
      md += `## Usado en servicios\n${usedBy.map((s) => `- [[${s}]]`).join("\n")}\n\n`;
    }

    md += `---\n*Generado automáticamente — no editar manualmente*\n`;

    writeDoc("supabase/tablas", `${tableName}.md`, md);
  }

  // Índice de tablas
  if (tableTypes.length > 0) {
    let indexMd = `# Tablas de Supabase\n\n`;
    for (const [, tableName] of tableTypes) {
      indexMd += `- [[${tableName}]]\n`;
    }
    writeDoc("supabase", "index.md", indexMd);
  }
}

// ─── Generar índice general ──────────────────────────────────────────────────

function generateIndex() {
  let md = `# 📚 Documentación STOCKIA-DI\n\n`;
  md += `> Generado automáticamente el ${new Date().toLocaleDateString("es-CL")}\n\n`;

  md += `## Secciones\n\n`;
  md += `- [[router]] — Rutas de la aplicación\n`;
  md += `- [[supabase/index]] — Tablas de Supabase\n`;
  md += `- Servicios → carpeta \`servicios/\`\n`;
  md += `- Componentes → carpeta \`componentes/\`\n\n`;

  md += `## Stack\n\n`;
  md += `- **Frontend:** React + TypeScript + Vite\n`;
  md += `- **Backend:** Supabase\n`;
  md += `- **Estilos:** Tailwind CSS\n`;
  md += `- **Estado:** TanStack Query\n\n`;

  md += `---\n*Para regenerar: \`node generate-docs.mjs\`*\n`;

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(path.join(DOCS_DIR, "index.md"), md, "utf-8");
  console.log("✅ docs/index.md");
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log("🚀 Generando documentación...\n");

generateIndex();
generateRoutesDocs();
const tableMap = generateServiceDocs();
generateSupabaseDocs(tableMap);
generateComponentDocs();

console.log("\n✨ ¡Documentación generada en /docs!");
