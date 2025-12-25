export function consts() {
  const basic = [
    { formula: 'к20', note: 'одиночный куб' },
    { formula: '2к6+3', note: 'сумма с модификатором' },
    { formula: '(4к6вх3+2)*2', note: 'группировка' },
  ];

  const keep = [
    { formula: '4к6вх3', note: 'оставить лучшие (kh3)' },
    { formula: '3к8вл1', note: 'оставить худшие (kl1)' },
    { formula: '5к10ул2', note: 'убрать лучшие (dh2)' },
    { formula: '5к10ух2', note: 'убрать худшие (dl2)' },
  ];

  const reroll = [
    { formula: 'к20пр1', note: 'переброс 1 (ro1)' },
    { formula: '10к6пб2', note: 'переброс 2 (r2)' },
    { formula: '8к6р<3', note: 'переброс <3' },
  ];

  return { basic, keep, reroll };
}
