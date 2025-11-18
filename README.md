# Leisure Suit Larry MMORPG Framework

A web-based MMORPG framework inspired by Leisure Suit Larry, featuring multiple side-scrolling scenes, player interactions, and 80s-style music.

## Setup

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install server dependencies:
```bash
cd server
npm install
cd ..
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

### Running

Start both server and client:
```bash
npm run dev
```

Or run separately:
- Server: `npm run server` (runs on port 3000)
- Client: `npm run client` (serves on port 8081)

## Features

- Multiple side-scrolling scenes (Beach, City, Bar)
- Real-time multiplayer with Socket.io
- LSL-style pixel art graphics
- Building entry system
- Fist bump interactions
- 80s MIDI-style background music

## Project Structure

- `/server` - Node.js backend with Express and Socket.io
- `/client` - Phaser.js frontend game
- `/assets` - Game sprites and music

## Development

The game uses Phaser.js 3 for rendering and Socket.io for real-time multiplayer synchronization.

