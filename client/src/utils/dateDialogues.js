export const DATE_SCRIPTS = {
  bar: [
    {
      id: 'bar_mystery_poet',
      partnerName: 'Velvet the Poet',
      vibe: 'bar',
      startId: 'opener',
      nodes: {
        opener: {
          prompt: 'Velvet taps the bar. "So, what brings you out tonight?"',
          options: [
            { text: '"Your smile. And maybe the karaoke."', next: 'karaoke' },
            { text: '"Thirst. Deep, existential thirst."', next: 'thirst' }
          ]
        },
        karaoke: {
          prompt: 'She grins. "Karaoke? Bold. Do you duet or solo?"',
          options: [
            { text: 'Duet, always. Teamwork makes the neon glow.', result: 'success' },
            { text: 'Solo. I hog the spotlight.', result: 'fail' }
          ]
        },
        thirst: {
          prompt: '"Existential, huh?" She leans in. "Pitch me your best line."',
          options: [
            { text: '"Roses are red, this bar is blue, your laugh is the melody I never knew."', result: 'success' },
            { text: '"Want to hear about my NFT portfolio?"', result: 'fail' }
          ]
        }
      },
      successMessage: 'Velvet snaps her fingers, neon hearts shimmer overhead. Date mode: engaged.',
      failureMessage: 'Velvet chuckles, pats your shoulder, and orders you both mocktails anyway.'
    }
  ],
  hotel: [
    {
      id: 'hotel_lobby_chic',
      partnerName: 'Sable the Concierge',
      vibe: 'hotel',
      startId: 'opener',
      nodes: {
        opener: {
          prompt: 'Sable straightens her badge. "Checking in for adventure or relaxation?"',
          options: [
            { text: 'Adventure. Secret rooftop pool party?', next: 'rooftop' },
            { text: 'Relaxation. Pillow menu recommendations?', next: 'pillow' }
          ]
        },
        rooftop: {
          prompt: '"I might know a door code," she whispers. "What do you offer in return?"',
          options: [
            { text: 'A legendary high-five montage on the way up.', result: 'success' },
            { text: 'My collection of hotel shampoo bottles.', result: 'fail' }
          ]
        },
        pillow: {
          prompt: '"Pillow nerds unite," she smiles. "Feather or foam?"',
          options: [
            { text: 'Memory foam. I dream in HD.', result: 'success' },
            { text: 'Uh... the scratchy ones?', result: 'fail' }
          ]
        }
      },
      successMessage: 'Sable stamps an imaginary passport; pastel hearts float up the lobby skylight.',
      failureMessage: 'Sable laughs kindly and hands you a hotel mint for bravery.'
    }
  ]
};

export function getRandomDateScript(buildingType = 'bar') {
  const scripts = DATE_SCRIPTS[buildingType] || DATE_SCRIPTS.bar;
  return scripts[Math.floor(Math.random() * scripts.length)];
}
