/**
 * 单个阵容抓取脚本
 * 使用 Anthropic Claude API 的 WebFetch 能力
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 手动输入抓取到的数据
 */
const compData = {
  url: 'https://tftacademy.com/tierlist/comps/set-16-noxus-atakhan',
  compName: 'set-16-noxus-atakhan',
  timestamp: new Date().toISOString(),

  // 基本信息
  name: 'Welcome to Noxus',
  tier: 'B-Tier',
  playstyle: '3-Cost Reroll (Easy Difficulty)',
  patch: '16.6',

  // Tips
  tips: 'This composition excels through itemization advantage and high-roll potential on 3-star units, though requires consistent high-level rolls and economy management for success.',

  // 核心英雄与装备
  champions: {
    mainCarry: {
      name: 'LeBlanc',
      cost: 3,
      items: ['Jeweled Gauntlet', 'Leviathan', 'Leviathan'],
      role: 'Primary damage dealer; unlock ASAP by itemizing Sion'
    },
    secondaryCarry: {
      name: 'Darius',
      cost: 4,
      items: ['Sterak\'s Gage', 'Titan\'s Resolve', 'Adaptive Helm'],
      role: 'Frontline bruiser; roll for 3-star upgrade'
    },
    tertiaryCarry: {
      name: 'Draven',
      cost: 4,
      items: ['Runaan\'s Hurricane', 'Guinsoo\'s Rageblade'],
      role: 'Attack damage carry; acquire if resources permit'
    },
    supporting: ['Briar', 'Sion', 'Kobuko', 'Swain', 'Mel', 'Atakhan']
  },

  // 装备优先级
  itemPriority: 'Recurve Bow → Giant\'s Belt → Sparring Gloves → Needlessly Large Rod',

  // 羁绊
  synergies: '5-Noxus synergy with Kobuko unlock as scaling progresses',

  // 运营策略
  stages: {
    stage2: 'Establish winstreaks with early LeBlanc and Noxus openers; build melee AD items for frontline.',
    stage3: 'Level to 6, activate 5-Noxus immediately; Darius becomes formidable with items.',
    stage4: 'Roll on level 7 for 3-star units; unlock Mel upon finding Ambessa for radiant items; transition to 7-Noxus or level to 8 for 5-cost units.'
  },

  // 强化符文
  augments: [
    'Bringer of Ruin (primary)',
    'Noxian Invasion',
    'Big Grab Bag',
    'Big Grab Bag Plus',
    'Gacha Addict',
    'Army Building',
    'Find Your Center',
    'The Darkin Forge'
  ]
};

/**
 * 保存为 JSON
 */
function saveAsJSON(data) {
  const outputDir = path.join(__dirname, 'data');
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, `${data.compName}_guide.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`💾 JSON 已保存: ${jsonPath}`);
  return jsonPath;
}

/**
 * 保存为 TFT.txt 格式
 */
function saveAsTFT(data) {
  const lines = [];

  // 阵容基本信息
  lines.push(`# ${data.name}`);
  lines.push(`Tier: ${data.tier}`);
  lines.push(`Playstyle: ${data.playstyle}`);
  lines.push(`Patch: ${data.patch}`);
  lines.push('');

  // Tips
  lines.push('## Tips');
  lines.push(data.tips);
  lines.push('');

  // 核心英雄
  lines.push('## Core Champions');
  lines.push('');
  lines.push(`### Main Carry - ${data.champions.mainCarry.name} (${data.champions.mainCarry.cost}-Cost)`);
  lines.push(`Items: ${data.champions.mainCarry.items.join(', ')}`);
  lines.push(`Role: ${data.champions.mainCarry.role}`);
  lines.push('');

  lines.push(`### Secondary Carry - ${data.champions.secondaryCarry.name} (${data.champions.secondaryCarry.cost}-Cost)`);
  lines.push(`Items: ${data.champions.secondaryCarry.items.join(', ')}`);
  lines.push(`Role: ${data.champions.secondaryCarry.role}`);
  lines.push('');

  lines.push(`### Tertiary Carry - ${data.champions.tertiaryCarry.name} (${data.champions.tertiaryCarry.cost}-Cost)`);
  lines.push(`Items: ${data.champions.tertiaryCarry.items.join(', ')}`);
  lines.push(`Role: ${data.champions.tertiaryCarry.role}`);
  lines.push('');

  lines.push(`Supporting Units: ${data.champions.supporting.join(', ')}`);
  lines.push('');

  // 装备优先级
  lines.push('## Item Priority');
  lines.push(data.itemPriority);
  lines.push('');

  // 羁绊
  lines.push('## Key Synergies');
  lines.push(data.synergies);
  lines.push('');

  // 运营策略
  lines.push('## Gameplay Strategy');
  lines.push('');
  Object.entries(data.stages).forEach(([stage, content]) => {
    const stageNum = stage.replace('stage', '');
    lines.push(`**Stage ${stageNum}:** ${content}`);
    lines.push('');
  });

  // 强化符文
  lines.push('## Notable Augments');
  data.augments.forEach(aug => {
    lines.push(`- ${aug}`);
  });
  lines.push('');

  // 保存到项目根目录的 TFT.txt
  const outputPath = path.join(__dirname, '..', 'TFT.txt');
  const content = lines.join('\n');
  fs.writeFileSync(outputPath, content, 'utf-8');

  console.log(`💾 TFT.txt 已保存: ${outputPath}`);
  console.log(`\n文件内容预览:\n${content.substring(0, 500)}...\n`);

  return outputPath;
}

/**
 * 主函数
 */
function main() {
  console.log('\n========================================');
  console.log('📝 处理阵容数据');
  console.log('========================================\n');

  console.log(`阵容: ${compData.name}`);
  console.log(`URL: ${compData.url}\n`);

  // 保存 JSON
  saveAsJSON(compData);

  // 保存 TFT.txt
  saveAsTFT(compData);

  console.log('✅ 数据处理完成！\n');
}

// 执行
main();

export { compData, saveAsJSON, saveAsTFT };
