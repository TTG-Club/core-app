import { ref } from 'vue';

// Интерфейс для персонажа
interface Character {
  image: string;
  messages: string[];
}

// Массив персонажей с их репликами
const characters: Character[] = [
  {
    image: '/s3/sections/greeter.webp',
    messages: [
      'Смотри-ка, новый паладин правил! Брось на харизму, чтобы не утонуть в деталях.',
      'Смелый шаг, смертный! Без +5 к интеллекту тут легко заблудиться в таблицах.',
      'Вошёл в царство приключений? Брось на инициативу, или заклинания ударят первыми!',
      'О, авантюрист знаний! Надеюсь, у тебя есть зелье концентрации для этих страниц.',
      'Ты здесь, чтобы стать мастером игры? Без спас-броска на разум не обойтись!',
      'О, ещё один искатель приключений? Берегись ловушек в правилах — они коварны!',
      'О, новичок в лабиринте правил? Надеюсь, у тебя есть карта и пара кубиков!',
      'Ты здесь, чтобы постичь игру? Брось на выживание, или таблицы тебя поглотят!',
    ],
  },
  {
    image: '/s3/sections/greeter2.webp',
    messages: [
      'Вперед, легенда начинается здесь!',
      'Ворвался в мир подвигов? Брось d20 на отвагу и начни свою великую сагу!',
      'Новый авантюрист, мир ждёт твоих подвигов! Пусть каждый шаг будет достойным баллады барда.',
      'Впереди земли полные чудес! Хватай кубики, герой, и пиши свою историю с каждым броском.',
      'О, храбрец, готовый к квестам! Твоя судьба сияет ярче, чем древний артефакт.',
      'Добро пожаловать в мир, где рождаются герои! Твоя история начинается прямо сейчас.',
      'Готов к приключению? Я уже заждалась!',
      'Давай сыграем по-крупному, новичок!',
      'Судьба зовет, а я тут с подсказками!',
    ],
  },
];

export function useCharacterSelection() {
  // Реактивные переменные для текущего персонажа и сообщения
  const selectedCharacter = ref<Character | null>(null);
  const currentMessage = ref<string>('');

  // Функция для случайного выбора персонажа и сообщения
  function selectRandomCharacterAndMessage() {
    if (characters.length > 0) {
      const randomCharacterIndex = Math.floor(
        Math.random() * characters.length,
      );

      const character = characters[randomCharacterIndex]!;

      const randomMessageIndex = Math.floor(
        Math.random() * character.messages.length,
      );

      selectedCharacter.value = character;
      currentMessage.value = character.messages[randomMessageIndex]!;
    }
  }

  return {
    selectedCharacter,
    currentMessage,
    selectRandomCharacterAndMessage,
  };
}
