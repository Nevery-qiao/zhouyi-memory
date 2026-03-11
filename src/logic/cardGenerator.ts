import type { Card, Hexagram } from '../models/types';
import { hexagrams } from '../data/hexagrams';

/**
 * 从 64 卦生成 A/C/G 三种类型共 192 张卡片
 *
 * 类型 A：卦象(trigram/symbol) → 卦名
 * 类型 C：卦名 → 卦辞
 * 类型 G：六爻卦象(symbol) → 上下卦构成
 */
export function generateAllCards(): Card[] {
  const cards: Card[] = [];

  for (const hex of hexagrams) {
    cards.push(createCardA(hex));
    cards.push(createCardC(hex));
    cards.push(createCardG(hex));
  }

  return cards;
}

/** 类型 A：卦象 → 卦名 */
function createCardA(hex: Hexagram): Card {
  // 八经卦（trigram 非空）用三爻卦象，复合卦用六爻卦象
  const front = hex.trigram || hex.symbol;
  return {
    id: `${hex.id}-A`,
    type: 'A',
    hexagramId: hex.id,
    front,
    back: hex.name,
  };
}

/** 类型 C：卦名 → 卦辞 */
function createCardC(hex: Hexagram): Card {
  return {
    id: `${hex.id}-C`,
    type: 'C',
    hexagramId: hex.id,
    front: hex.name,
    back: hex.judgment,
  };
}

/** 类型 G：六爻卦象 → 上下卦构成 */
function createCardG(hex: Hexagram): Card {
  return {
    id: `${hex.id}-G`,
    type: 'G',
    hexagramId: hex.id,
    front: hex.symbol,
    back: `上${hex.upperTrigram}${hex.upperTrigramSymbol} 下${hex.lowerTrigram}${hex.lowerTrigramSymbol}`,
  };
}

/** 按 hexagramId 获取对应卦数据 */
export function getHexagramById(id: number): Hexagram | undefined {
  return hexagrams.find(h => h.id === id);
}

/** 缓存生成的卡片（只生成一次） */
let _allCards: Card[] | null = null;

export function getAllCards(): Card[] {
  if (!_allCards) {
    _allCards = generateAllCards();
  }
  return _allCards;
}
