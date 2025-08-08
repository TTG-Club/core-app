// Интерфейс для персонажа
interface Character {
  image: string;
  messages: string[];
}

// Массив персонажей с их репликами
const characters: Character[] = [
  {
    image: '/s3/sections/greeter.png',
    messages: [
      'Смотри-ка, новый паладин правил! Брось на харизму, чтобы не утонуть в деталях.',
      'Эй, герой, готов покорять правила? Давай зажжем!',
      'Ты здесь, чтобы править или просто поболтать?',
      'Брось кубик на удачу, новичок!',
      'Правила — это как дракон: либо ты его, либо он тебя!',
      'Ты готов к эпичной битве с правилами?',
      'Не бойся, я прикрою! Ну, или хотя бы подскажу.',
      'Давай, покажи, на что способен настоящий герой!',
      'Правила — это карта, а ты — искатель приключений!',
      'Вперед, легенда начинается здесь!',
    ],
  },
  {
    image: '/s3/sections/greeter.png',
    messages: [
      '2Ха, новенький! Готов к испытаниям судьбы?',
      '2Правила — это мой конек, а ты попробуй их оседлать!',
      '2Не тушуйся, я знаю все ходы и выходы!',
      '2Брось на мудрость, пригодится!',
      '2Ты в игре, а я твой верный спутник!',
      '2Правила — это лабиринт, но я знаю короткий путь!',
      '2Готов к приключению? Я уже заждался!',
      '2Смотри, как блестит мой меч... и мои советы!',
      '2Давай сыграем по-крупному, новичок!',
      '2Судьба зовет, а я тут с подсказками!',
    ],
  },
];

export function useCharacterSelection() {
  // Реактивные переменные для текущего персонажа и сообщения
  const selectedCharacter = ref<Character | null>(null);
  const currentMessage = ref<string>('');

  // Случайный выбор персонажа и сообщения при инициализации
  if (characters.length > 0) {
    const randomCharacterIndex = Math.floor(Math.random() * characters.length);
    const character = characters[randomCharacterIndex]!;

    const randomMessageIndex = Math.floor(
      Math.random() * character.messages.length,
    );

    selectedCharacter.value = character;
    currentMessage.value = character.messages[randomMessageIndex]!;
  }

  return {
    selectedCharacter,
    currentMessage,
  };
}
