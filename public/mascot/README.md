# Mascot Images

Place your PNGTuber mascot images in this directory with the following names:

## Required Files:

1. **idle.png** - The mascot with mouth closed (default/idle state)
2. **talk-1.png** - The mascot with mouth in first talking position (open)
3. **talk-2.png** - The mascot with mouth in second talking position (alternate)

## Image Requirements:

- Format: PNG with transparent background recommended
- Size: 400x400px or larger (will be scaled to fit)
- All three images should have the same dimensions
- The mascot should be centered in the image

## Animation Behavior:

- When the AI is **not speaking**: Shows `idle.png`
- When the AI **starts speaking**: Alternates between `talk-1.png` and `talk-2.png` based on audio volume
- Animation syncs with the ElevenLabs audio output

## Example Workflow:

1. Create or obtain a character mascot
2. Export 3 frames: closed mouth, open mouth variation 1, open mouth variation 2
3. Name them exactly as listed above
4. Place them in this directory
5. The mascot will automatically animate during the interview!
