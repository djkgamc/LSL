export const DATE_SCRIPTS = {
  bar: [
    {
      id: 'bar_mystery_poet',
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
    {
      id: 'bar_graffitist',
      difficulty: 'medium',
      partnerName: 'Ink the Tagger',
      vibe: 'bar',
      startId: 'opener',
      nodes: {
        opener: {
          prompt: 'Ink spins a marker. "What\'s your tag in this neon jungle?"',
          options: [
            { text: 'My moves. Dance floor is my canvas.', next: 'dance' },
            { text: 'My playlists. Bass is my signature.', next: 'playlist' },
            { text: 'Tags are vandalism. I pass.', result: 'fail' }
          ]
        },
        dance: {
          prompt: '"Show me a move name." Ink raises a brow.',
          options: [
            { text: 'The hologram slide—leaves a trail of light.', next: 'challenge' },
            { text: 'Freestyle chalk hearts on the streetcar rails.', next: 'ethos' },
            { text: 'Uh, the... shoulder shrug?', result: 'fail' }
          ]
        },
        playlist: {
          prompt: '"Curator, huh? What track do we open the night with?"',
          options: [
            { text: 'A sunrise synthwave remix—starts dreamy, ends roaring.', next: 'challenge' },
            { text: 'A whispered acapella intro, then glitch brass.', next: 'ethos' },
            { text: 'The loudest track immediately.', result: 'fail' }
          ]
        },
        challenge: {
          prompt: 'Ink taps the bar. "Last test: art or chaos?"',
          options: [
            { text: 'Art. We leave a story in every corner.', next: 'ethos' },
            { text: 'Chaos. Spray first, think never.', result: 'fail' },
            { text: 'Both—we plan the chaos.', next: 'ethos' }
          ]
        },
        ethos: {
          prompt: '"Then tag the finale," Ink says. "What\'s the flourish?"',
          options: [
            { text: 'A tiny crown only UV light reveals.', result: 'success' },
            { text: 'My gamer tag in block letters.', result: 'fail' },
            { text: 'Layered gradients that morph as you walk by.', result: 'success' }
          ]
        }
      },
      successMessage: 'Ink sketches your initials in neon light and nods—date unlocked.',
      failureMessage: 'Ink laughs, tags a tiny "nice try" by your elbow, and fades into the crowd.'
    },
    {
      id: 'bar_arcade_warlord',
      difficulty: 'hard',
      partnerName: 'Bytebreaker',
      vibe: 'bar',
      startId: 'opener',
      nodes: {
        opener: {
          prompt: 'Bytebreaker flips a token. "One credit. Impress me."',
          options: [
            { text: 'Talk strategy: frame-perfect combos.', next: 'strategy' },
            { text: 'Challenge to a co-op speedrun.', next: 'coop' },
            { text: 'Brag about mashing buttons.', result: 'fail' }
          ]
        },
        strategy: {
          prompt: '"Okay, what wins: perfect defense or reckless offense?"',
          options: [
            { text: 'Adaptive offense—counter on reaction.', next: 'lore' },
            { text: 'Defense forever. We time out everyone.', result: 'fail' },
            { text: 'Depends on the patch; we flex to meta mid-match.', next: 'tech' }
          ]
        },
        coop: {
          prompt: '"Co-op? Then pick your lane."',
          options: [
            { text: 'Shotcaller and buffer—I feed you perfect setups.', next: 'tech' },
            { text: 'I unplug rival controllers under the table.', result: 'fail' },
            { text: 'Crowd-control juggler while you nuke bosses.', next: 'lore' }
          ]
        },
        tech: {
          prompt: '"What modifiers are we toggling?"',
          options: [
            { text: 'Mirror match, no HUD. Pure instincts.', next: 'wager' },
            { text: 'Turbo mode with no guard breaks.', result: 'fail' },
            { text: 'Style-only skins—points for fashion parries.', next: 'wager' }
          ]
        },
        lore: {
          prompt: 'She smirks. "Ever beat the secret boss?"',
          options: [
            { text: 'Yeah—read the lore clue in the graffiti.', next: 'wager' },
            { text: 'Only watched speedruns, so we freestyle.', next: 'wager' },
            { text: 'Never saw it, I skipped cutscenes.', result: 'fail' }
          ]
        },
        wager: {
          prompt: '"Final call. High score wager: loser buys neon nachos?"',
          options: [
            { text: 'Deal. And winner chooses the soundtrack.', result: 'success' },
            { text: 'Only if we use tilt hacks.', result: 'fail' },
            { text: 'Side bet: loser cosplays the tutorial NPC.', result: 'success' }
          ]
        }
      },
      successMessage: 'Bytebreaker slides the token into your palm. "Tag-team run?" Hearts pixelate around you.',
      failureMessage: 'She shrugs, vaults into another match, and tosses you a practice pamphlet.'
    },
    {
      id: 'bar_boss_neon',
      difficulty: 'boss',
      partnerName: 'The Grand Manager',
      vibe: 'bar',
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
  ],
  hotel: [
    {
      id: 'hotel_lobby_chic',
      difficulty: 'easy',
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
    },
    {
      id: 'hotel_midnight_architect',
      difficulty: 'medium',
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
    {
      id: 'hotel_rooftop_myth',
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
    }
  ]
};

export function getRandomDateScript(buildingType = 'bar', difficulty = 'easy') {
  const scripts = DATE_SCRIPTS[buildingType] || DATE_SCRIPTS.bar;
  const filtered = scripts.filter(script => script.difficulty === difficulty);
  const pool = filtered.length ? filtered : scripts;
  return pool[Math.floor(Math.random() * pool.length)];
}
