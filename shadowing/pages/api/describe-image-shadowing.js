import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const describeImageDir = path.join(process.cwd(), 'public/shadowingsource/di');
    
    // Check if directory exists
    if (!fs.existsSync(describeImageDir)) {
      return res.status(404).json({ error: 'Describe Image directory not found' });
    }

    // Read all files in the directory
    const files = fs.readdirSync(describeImageDir);
    
    // Filter only mp3 files
    const mp3Files = files.filter(file => file.endsWith('.mp3'));
    
    // Parse files and group by sentence number
    const sentencesMap = {};
    
    mp3Files.forEach(file => {
      // Format: {number}_{voice}_{text}.mp3
      const parts = file.split('_');
      const number = parseInt(parts[0]);
      const voice = parts[1].toLowerCase();
      const textParts = parts.slice(2);
      const text = textParts.join('_').replace('.mp3', '').replace(/_/g, ' ');
      
      if (!sentencesMap[number]) {
        sentencesMap[number] = {
          number: number,
          text: text,
          voices: {}
        };
      }
      
      // Store the file path for this voice
      sentencesMap[number].voices[voice] = `/shadowingsource/di/${file}`;
    });
    
    // Convert to array and sort by number
    const sentences = Object.values(sentencesMap).sort((a, b) => a.number - b.number);
    
    // Generate full text by combining all sentences
    const fullText = sentences.map(s => s.text).join(' ');
    
    // Return the structured data
    const data = {
      id: 'describe-image-1',
      name: 'Describe Image Practice',
      sentences: sentences,
      fullText: fullText,
      availableVoices: ['brian', 'joanna', 'olivia']
    };
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading describe image files:', error);
    res.status(500).json({ error: 'Failed to read describe image files' });
  }
}
