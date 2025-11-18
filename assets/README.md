# Assets Directory

This directory contains game assets including sprites, music, and other media files.

## Structure

```
assets/
├── sprites/          # Pixel art sprites
│   ├── player/       # Player character sprites
│   └── buildings/    # Building sprites
├── music/            # Background music tracks
└── README.md         # This file
```

## Current Implementation

The game currently uses programmatically generated sprites (colored rectangles) for:
- Player characters (32x48 pixels, colored rectangles)
- Buildings (various sizes, colored rectangles)

## Future Asset Integration

To replace programmatic sprites with actual pixel art:

1. **Player Sprites**: Create sprite sheets for idle, walk left, and walk right animations
   - Format: PNG sprite sheets
   - Size: 32x48 pixels per frame
   - Style: Leisure Suit Larry-inspired pixel art

2. **Building Sprites**: Create building exterior sprites
   - Format: PNG images
   - Style: Retro pixel art matching LSL aesthetic

3. **Music**: Add 80s MIDI-style background music tracks
   - Format: MP3 or OGG
   - One track per scene (beach, city, bar, hotel)
   - Style: 80s synth/MIDI music

## Music Notes

The current implementation uses Web Audio API to generate simple synth tones. To use actual music files:

1. Place music files in `assets/music/`
2. Update `MusicManager.js` to load and play audio files instead of generating tones
3. Recommended naming: `beach.mp3`, `city.mp3`, `bar.mp3`, `hotel.mp3`

