export interface SubjectGame {
  id: string;
  title: string;
  description: string;
  route?: string;
  status: 'ready' | 'coming-soon';
}

export interface SubjectDefinition {
  id: 'english' | 'maths' | 'science' | 'social-science';
  name: string;
  emoji: string;
  accent: string;
  shadow: string;
  textStroke: string;
  mascotPrompt: string;
  games: SubjectGame[];
}

export const subjects: SubjectDefinition[] = [
  {
    id: 'english',
    name: 'English',
    emoji: '📖',
    accent: '#ff7a45',
    shadow: 'rgba(255, 122, 69, 0.34)',
    textStroke: '#ef5a29',
    mascotPrompt: 'Story time!',
    games: [
      {
        id: 'match-letters',
        title: 'Match Letters',
        description: 'Drag uppercase and lowercase balloons together.',
        route: '/english-match-letters',
        status: 'ready',
      },
      {
        id: 'draw-letters',
        title: 'Draw Letters',
        description: 'Trace giant letters with your hand.',
        status: 'coming-soon',
      },
      {
    id: 'guess-word',
    title: 'Guess the Word',
    description: 'Look at the picture and drag letters to spell the word!',
    status: 'ready',
    route: '/english-guess-word', 
  }
    ],
  },
  {
    id: 'maths',
    name: 'Maths',
    emoji: '🔢',
    accent: '#8b5cf6',
    shadow: 'rgba(139, 92, 246, 0.35)',
    textStroke: '#6d28d9',
    mascotPrompt: 'Number power!',
    games: [
      {
        id: 'count-fingers',
        title: 'Count Fingers',
        description: 'Count and match with your hands.',
        status: 'coming-soon',
      },
      {
    id: 'build-equation',
    title: 'Build the Equation',
    description: 'Drag numbers and symbols to build a correct math problem!',
    status: 'ready',
    route: '/math-equations', 
  }
    ],
  },
  {
    id: 'science',
    name: 'Science',
    emoji: '🔬',
    accent: '#22c55e',
    shadow: 'rgba(34, 197, 94, 0.35)',
    textStroke: '#15803d',
    mascotPrompt: 'Blast into space!',
    games: [
      {
        id: 'color-match',
        title: 'Solar System Adventure',
        description: 'Jump straight into the live solar system game.',
        route: '/science-solar',
        status: 'ready',
      },
    ],
  },
  {
    id: 'social-science',
    name: 'Social Science',
    emoji: '🌍',
    accent: '#06b6d4',
    shadow: 'rgba(6, 182, 212, 0.35)',
    textStroke: '#0f766e',
    mascotPrompt: 'Let us explore the world!',
    games: [
      {
        id: 'basic-quiz',
        title: 'Basic Quiz',
        description: 'Travel the world with easy prompts.',
        status: 'coming-soon',
      },
    ],
  },
];

