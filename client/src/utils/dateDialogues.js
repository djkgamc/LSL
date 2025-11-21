// Mapping of building IDs to their specific date scripts
const BUILDING_SCRIPT_MAP = {
  // Easy Buildings
  main_bar: 'main_bar_poet',
  beach_bar: 'beach_bar_surfer',
  
  // Medium Buildings
  bar_hotel: 'bar_hotel_dj',
  city_bar: 'city_bar_hacker',
  hotel_bar: 'hotel_bar_sommelier',
  
  // Hard Buildings
  grand_hotel: 'grand_hotel_architect',
  city_hotel: 'city_hotel_stargazer',
  
  // Boss Building
  beach_hotel: 'beach_hotel_boss'
};

export const DATE_SCRIPTS = {
  // EASY SCRIPTS
  main_bar_poet: {
    id: 'main_bar_poet',
    difficulty: 'easy',
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
  },
  
  beach_bar_surfer: {
    id: 'beach_bar_surfer',
    difficulty: 'easy',
    partnerName: 'Wave the Surfer',
    vibe: 'bar',
    startId: 'opener',
    nodes: {
      opener: {
        prompt: 'Wave leans against the bar with a coconut drink. "You surf or just enjoy the view?"',
        options: [
          { text: '"I ride the waves of life, one day at a time."', next: 'philosophy' },
          { text: '"I collect seashells and good vibes."', next: 'vibes' }
        ]
      },
      philosophy: {
        prompt: '"Deep. What\'s your favorite part of the ocean?"',
        options: [
          { text: 'The horizon—where dreams meet reality.', result: 'success' },
          { text: 'The sharks. They\'re cool.', result: 'fail' }
        ]
      },
      vibes: {
        prompt: 'Wave grins. "Tell me your perfect beach day."',
        options: [
          { text: 'Sunrise yoga, sunset bonfire, stars overhead.', result: 'success' },
          { text: 'Just sleeping in the sand all day.', result: 'fail' }
        ]
      }
    },
    successMessage: 'Wave high-fives you. "You\'re totally rad!" Hearts wash in like the tide.',
    failureMessage: 'Wave shrugs. "Maybe next wave, dude."'
  },

  // MEDIUM SCRIPTS
  bar_hotel_dj: {
    id: 'bar_hotel_dj',
    difficulty: 'medium',
    partnerName: 'Pulse the DJ',
    vibe: 'bar',
    startId: 'opener',
    nodes: {
      opener: {
        prompt: 'Pulse adjusts their headphones. "What\'s your anthem?"',
        options: [
          { text: 'Something with a drop that shakes the floor.', next: 'energy' },
          { text: 'Smooth synthwave that builds slowly.', next: 'mood' },
          { text: 'I don\'t really listen to music.', result: 'fail' }
        ]
      },
      energy: {
        prompt: '"Nice. How do you feel the beat?"',
        options: [
          { text: 'In my chest—every kick drum is a heartbeat.', next: 'finale' },
          { text: 'With my ears, obviously.', result: 'fail' }
        ]
      },
      mood: {
        prompt: '"Classy. What vibe are we setting tonight?"',
        options: [
          { text: 'Neon dreams with a pulse of adventure.', next: 'finale' },
          { text: 'Whatever\'s popular.', result: 'fail' }
        ]
      },
      finale: {
        prompt: '"Last track of the night—what do we play?"',
        options: [
          { text: 'A slow build that explodes into euphoria.', result: 'success' },
          { text: 'Something loud and fast.', result: 'fail' },
          { text: 'A song that fades into silence together.', result: 'success' }
        ]
      }
    },
    successMessage: 'Pulse drops a perfect beat. "We\'re in sync." Hearts pulse with the rhythm.',
    failureMessage: 'Pulse scratches the record. "Off beat. Try again later."'
  },

  city_bar_hacker: {
    id: 'city_bar_hacker',
    difficulty: 'medium',
    partnerName: 'Cipher the Hacker',
    vibe: 'bar',
    startId: 'opener',
    nodes: {
      opener: {
        prompt: 'Cipher glances up from their terminal. "What\'s your access level?"',
        options: [
          { text: 'Root. I see the matrix.', next: 'tech' },
          { text: 'Guest. Just browsing.', next: 'casual' },
          { text: 'I don\'t speak nerd.', result: 'fail' }
        ]
      },
      tech: {
        prompt: '"Prove it. What\'s the best encryption?"',
        options: [
          { text: 'The one that keeps secrets but shares trust.', next: 'trust' },
          { text: 'ROT13, obviously.', result: 'fail' }
        ]
      },
      casual: {
        prompt: '"Fair. What brings you to this node?"',
        options: [
          { text: 'Curiosity. And maybe a connection.', next: 'trust' },
          { text: 'Free WiFi.', result: 'fail' }
        ]
      },
      trust: {
        prompt: 'Cipher leans back. "Final handshake: what\'s your signature move?"',
        options: [
          { text: 'Leaving a backdoor open—for you.', result: 'success' },
          { text: 'Closing all ports and ghosting.', result: 'fail' },
          { text: 'Staying vulnerable, but honest.', result: 'success' }
        ]
      }
    },
    successMessage: 'Cipher smirks. "Connection established." Hearts compile successfully.',
    failureMessage: 'Cipher closes the terminal. "Access denied. Ping me later."'
  },

  hotel_bar_sommelier: {
    id: 'hotel_bar_sommelier',
    difficulty: 'medium',
    partnerName: 'Vintage the Sommelier',
    vibe: 'hotel',
    startId: 'opener',
    nodes: {
      opener: {
        prompt: 'Vintage swirls a glass. "What\'s your palate?"',
        options: [
          { text: 'Bold and adventurous.', next: 'preference' },
          { text: 'Refined and subtle.', next: 'preference' },
          { text: 'I just drink soda.', result: 'fail' }
        ]
      },
      preference: {
        prompt: '"Interesting. What pairs with starlight?"',
        options: [
          { text: 'Something sparkling that mirrors the night.', next: 'pairing' },
          { text: 'Red wine, I guess?', result: 'fail' }
        ]
      },
      pairing: {
        prompt: '"Perfect. Final taste: what\'s the finish?"',
        options: [
          { text: 'Long and memorable—lingers like a good memory.', result: 'success' },
          { text: 'Quick and forgettable.', result: 'fail' },
          { text: 'Sweet with a hint of possibility.', result: 'success' }
        ]
      }
    },
    successMessage: 'Vintage raises a glass. "Exquisite choice." Hearts effervesce like champagne.',
    failureMessage: 'Vintage sets down the glass. "Not quite vintage yet."'
  },

  // HARD SCRIPTS
  grand_hotel_architect: {
    id: 'grand_hotel_architect',
    difficulty: 'hard',
    partnerName: 'Aria the Architect',
    vibe: 'hotel',
    startId: 'opener',
    nodes: {
      opener: {
        prompt: 'Aria sketches in a notebook. "What does your dream suite look like?"',
        options: [
          { text: 'Panoramic windows and hidden speakers.', next: 'soundtrack' },
          { text: 'Hidden courtyard with bioluminescent plants.', next: 'soundtrack' },
          { text: 'Just a bed. Maybe a chair.', result: 'fail' }
        ]
      },
      soundtrack: {
        prompt: '"Sound is flow. Pick the suite soundtrack."',
        options: [
          { text: 'Soft synth pads that bloom at sunrise.', next: 'amenities' },
          { text: 'A live quartet that fades into lo-fi beats.', next: 'amenities' },
          { text: 'Heavy metal 24/7.', result: 'fail' }
        ]
      },
      amenities: {
        prompt: '"What\'s the signature amenity?" Aria leans closer.',
        options: [
          { text: 'Mood lighting synced to the skyline.', next: 'escape' },
          { text: 'Mini bar full of labeled tap water.', result: 'fail' },
          { text: 'Pillow fort service with lanterns.', next: 'escape' }
        ]
      },
      escape: {
        prompt: '"Emergency escape plan?" Aria taps her pen.',
        options: [
          { text: 'Secret slide to the spa—style and safety.', result: 'success' },
          { text: 'Rooftop drone evacuation with snack packs.', result: 'success' },
          { text: 'We wing it and hope.', result: 'fail' }
        ]
      }
    },
    successMessage: 'Aria snaps her notebook shut. "Blueprint approved." Golden hearts shimmer down the hallway.',
    failureMessage: 'She chuckles, folds the page, and suggests a practice mockup in cardboard.'
  },

  city_hotel_stargazer: {
    id: 'city_hotel_stargazer',
    difficulty: 'hard',
    partnerName: 'Lumen the Stargazer',
    vibe: 'hotel',
    startId: 'opener',
    nodes: {
      opener: {
        prompt: 'Lumen adjusts a telescope. "Name a constellation no one else sees."',
        options: [
          { text: 'The Electric Phoenix—rebirth every dawn.', next: 'ritual' },
          { text: 'The Spoon.', result: 'fail' },
          { text: 'The Lost Subway Serpent weaving under cities.', next: 'ritual' }
        ]
      },
      ritual: {
        prompt: '"What\'s the ritual for calling it?"',
        options: [
          { text: 'Quiet countdown, then matching breaths.', next: 'signal' },
          { text: 'Shout until it appears.', result: 'fail' },
          { text: 'Choreographed shoulder rolls with incense.', next: 'signal' }
        ]
      },
      signal: {
        prompt: '"And the signal?" Lumen traces a star map.',
        options: [
          { text: 'Laser pointer constellation we draw together.', next: 'promise' },
          { text: 'Phone flashlight in Morse code.', result: 'fail' },
          { text: 'We reflect moonlight with mirrored lenses.', next: 'promise' }
        ]
      },
      promise: {
        prompt: '"Last question. What do we do if clouds roll in?"',
        options: [
          { text: 'Project our own stars on the ceiling.', result: 'success' },
          { text: 'Pack up and nap.', result: 'fail' },
          { text: 'Call it an omen and plan a second viewing party.', result: 'success' }
        ]
      }
    },
    successMessage: 'Lumen links pinky fingers with you. Stars and hearts blur together over the skyline.',
    failureMessage: 'Clouds cover the view. Lumen smiles and hands you a weather app recommendation.'
  },

  // BOSS SCRIPT
  beach_hotel_boss: {
    id: 'beach_hotel_boss',
    difficulty: 'boss',
    partnerName: 'The Grand Manager',
    vibe: 'hotel',
    startId: 'opener',
    nodes: {
      opener: {
        prompt: 'The Grand Manager peers over ledgers. "Convince me you deserve the penthouse."',
        options: [
          { text: 'We bring stories—every room gets a soundtrack.', next: 'staff' },
          { text: 'We host rooftop salons with live DJs for guests.', next: 'staff' },
          { text: 'We can pay? Probably?', result: 'fail' }
        ]
      },
      staff: {
        prompt: '"How do you treat the staff?"',
        options: [
          { text: 'Like co-stars. We tip in credits and compliments.', next: 'emergency' },
          { text: 'We host staff-appreciation open mic nights.', next: 'emergency' },
          { text: 'They don\'t notice us; we\'re stealth.', result: 'fail' }
        ]
      },
      emergency: {
        prompt: '"Fire alarm at 3 AM. What happens?"',
        options: [
          { text: 'We lead a calm, stylish evacuation to lobby playlists.', next: 'legacy' },
          { text: 'We coordinate room checks while concierge handles comms.', next: 'legacy' },
          { text: 'We hide on the balcony.', result: 'fail' }
        ]
      },
      legacy: {
        prompt: '"Final condition: what legacy do you leave behind?"',
        options: [
          { text: 'A guestbook full of gratitude and doodles.', result: 'success' },
          { text: 'A secret guide to kindness in every room drawer.', result: 'success' },
          { text: 'A mess for housekeeping.', result: 'fail' }
        ]
      }
    },
    successMessage: 'Keys gleam in your hand. "Penthouse granted." Heart-shaped confetti falls from hidden vents.',
    failureMessage: 'The Manager stamps DECLINED in red light and slides you a coupon for the lobby cafe.'
  }
};

// Get date script based on building ID (deterministic)
export function getDateScriptForBuilding(buildingId) {
  const scriptId = BUILDING_SCRIPT_MAP[buildingId];
  if (scriptId && DATE_SCRIPTS[scriptId]) {
    return DATE_SCRIPTS[scriptId];
  }
  
  // Fallback to first easy script if building not found
  console.warn(`No script found for building ${buildingId}, using fallback`);
  return DATE_SCRIPTS.main_bar_poet;
}

// Legacy function for backward compatibility (deprecated)
export function getRandomDateScript(buildingType = 'bar', difficulty = 'easy') {
  console.warn('getRandomDateScript is deprecated, use getDateScriptForBuilding instead');
  
  // Find first script matching difficulty
  for (const scriptId in DATE_SCRIPTS) {
    if (DATE_SCRIPTS[scriptId].difficulty === difficulty) {
      return DATE_SCRIPTS[scriptId];
    }
  }
  
  return DATE_SCRIPTS.main_bar_poet;
}
