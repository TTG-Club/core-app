const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'd:\\Project\\git\\TTG\\core-app';

// 4.3 Replace MarkupRender with MarkupContent
const displayFiles = [
  'app/features/spells/body/ui/DescriptionsBlock.vue',
  'app/features/bestiary/body/ui/DescriptionsBlock.vue',
  'app/features/bestiary/body/CreatureBody.vue',
  'app/features/bestiary/body/ui/stats-block/StatsBlock.vue',
  'app/features/items/body/ui/DescriptionsBlock.vue',
  'app/features/magic-items/body/ui/DescriptionsBlock.vue',
  'app/features/feats/body/ui/DescriptionsBlock.vue',
  'app/features/feats/body/ui/StatsBlock.vue',
  'app/features/glossary/body/ui/DescriptionsBlock.vue',
  'app/features/backgrounds/body/ui/DescriptionsBlock.vue',
  'app/features/backgrounds/body/ui/StatsBlock.vue',
  'app/features/species/body/SpeciesBody.vue',
  'app/features/classes/body/ClassBody.vue',
  'app/features/classes/body/ui/FeatureCollapse.vue',
  'app/features/classes/body/ui/ClassEquipment.vue',
  'app/features/sources/body/SourceBody.vue',
  'app/features/roadmap/preview/RoadmapPreview.vue',
  'app/features/roadmap/detail/RoadmapDetail.vue',
];

for (const f of displayFiles) {
  const p = path.join(ROOT, f);

  if (!fs.existsSync(p)) {
    continue;
  }

  let code = fs.readFileSync(p, 'utf-8');

  code = code.replace(
    /import\s+\{\s*MarkupRender\s*\}\s+from\s+['"]~ui\/markup['"]/g,
    "import { MarkupContent } from '~markup/content'",
  );

  code = code.replace(/<MarkupRender/g, '<MarkupContent');
  code = code.replace(/:render-node=/g, ':content=');
  code = code.replace(/<\/MarkupRender>/g, '<\/MarkupContent>');
  fs.writeFileSync(p, code, 'utf-8');
}

// 4.4 Замена UTextarea → MarkupEditor (13 редакторов)
const editorFiles = [
  'app/features/spells/editor/SpellsEditor.vue',
  'app/features/bestiary/editor/CreatureEditor.vue',
  'app/features/items/editor/ItemEditor.vue',
  'app/features/magic-items/editor/MagicItemEditor.vue',
  'app/features/feats/editor/FeatsEditor.vue',
  'app/features/glossary/editor/GlossaryEditor.vue',
  'app/features/backgrounds/editor/BackgroundsEditor.vue',
  'app/features/species/editor/SpeciesEditor.vue',
  'app/features/classes/editor/ClassEditor.vue',
  'app/features/sources/editor/SourceEditor.vue',
  'app/features/roadmap/editor/RoadmapEditor.vue',
];

for (const f of editorFiles) {
  const p = path.join(ROOT, f);

  if (!fs.existsSync(p)) {
    continue;
  }

  let code = fs.readFileSync(p, 'utf-8');

  // Attempt to replace <UTextarea v-model="state.description" ... />
  // We'll replace lines roughly.
  code = code.replace(
    /<UTextarea[^>]*?v-model=["']state\.description["'][^>]*?\/>/g,
    `<MarkupEditor v-model="state.description" />`,
  );

  // Same but without state prefix if any
  if (code.includes("description: ''")) {
    code = code.replace(
      /description:\s*['"]['"]/g,
      `description: { type: 'doc', content: [{ type: 'paragraph' }] }`,
    );
  }

  // Add import if not present
  if (!code.includes('import { MarkupEditor }')) {
    const importMatch = code.match(/<script setup lang="ts">/);

    if (importMatch) {
      code = code.replace(
        /<script setup lang="ts">/,
        `<script setup lang="ts">\n  import { MarkupEditor } from '~markup/editor';`,
      );
    }
  }

  fs.writeFileSync(p, code, 'utf-8');
}

console.log('UI substitutions ran.');

// Update Types: find all detail.ts, create.ts, types.ts, index.ts under app/features/*/types or model
// and replace description: string | Array<string> | RenderNode with JSONContent.
function getFiles(dir) {
  let files = [];

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

const allFeaturesFiles = getFiles(path.join(ROOT, 'app/features'));

const typeFiles = allFeaturesFiles
  .filter((f) => f.includes('\\types\\') || f.includes('\\model\\'))
  .filter((f) => f.endsWith('.ts'));

// Now apply regex to typeFiles
for (const p of typeFiles) {
  let code = fs.readFileSync(p, 'utf-8');
  let changed = false;

  if (code.includes('~ui/markup')) {
    code = code.replace(
      /import\s+type\s+\{\s*RenderNode\s*\}\s+from\s+['"]~ui\/markup[^'"]*['"];?/g,
      "import type { JSONContent } from '@tiptap/core';",
    );

    changed = true;
  }

  // replace description: Array<string>
  if (
    code.match(
      /description\??:\s*Array<string>|description\??:\s*string|description\??:\s*RenderNode/,
    )
  ) {
    code = code.replace(
      /description\s*:\s*(?:Array<string>|string|RenderNode)(?: \/\/[^\n]*)?;/g,
      'description: JSONContent;',
    );

    code = code.replace(
      /description\?\s*:\s*(?:Array<string>|string|RenderNode)(?: \/\/[^\n]*)?;/g,
      'description?: JSONContent;',
    );

    changed = true;
  }

  if (changed) {
    if (!code.includes('import type { JSONContent }')) {
      code = `import type { JSONContent } from '@tiptap/core';\n${code}`;
    }

    fs.writeFileSync(p, code, 'utf-8');
  }
}

console.log('Types updated.');
