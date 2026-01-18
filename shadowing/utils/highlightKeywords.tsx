import React from 'react';

/**
 * Highlights keywords in text content by wrapping them in <strong> tags
 * @param content - The text content to process (paragraphs separated by \n\n)
 * @param keywords - Array of keyword strings to highlight
 * @returns JSX elements with highlighted keywords
 */
export function highlightKeywords(
  content: string,
  keywords: string[]
): JSX.Element {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  // Sort keywords by length (longest first) to avoid partial matches
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        const highlightedContent = highlightParagraph(paragraph, sortedKeywords);
        return (
          <p key={pIndex} className="mb-4 leading-relaxed">
            {highlightedContent}
          </p>
        );
      })}
    </>
  );
}

/**
 * Highlights keywords in a single paragraph
 */
function highlightParagraph(
  paragraph: string,
  keywords: string[]
): (string | JSX.Element)[] {
  if (keywords.length === 0) {
    return [paragraph];
  }

  const result: (string | JSX.Element)[] = [];
  let remainingText = paragraph;
  let keyIndex = 0;

  // Create a map to track which positions have been matched
  const matches: Array<{ start: number; end: number; keyword: string }> = [];

  // Find all keyword matches in the paragraph
  keywords.forEach(keyword => {
    if (!keyword || keyword.trim() === '') return;

    // Escape special regex characters
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create regex with word boundaries for whole phrase matching (case-insensitive)
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
    
    let match;
    while ((match = regex.exec(paragraph)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      // Check if this position overlaps with existing matches
      const overlaps = matches.some(m => 
        (start >= m.start && start < m.end) || 
        (end > m.start && end <= m.end) ||
        (start <= m.start && end >= m.end)
      );
      
      if (!overlaps) {
        matches.push({ start, end, keyword: match[0] });
      }
    }
  });

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Build the result array
  let lastIndex = 0;
  matches.forEach((match, index) => {
    // Add text before the match
    if (match.start > lastIndex) {
      result.push(paragraph.substring(lastIndex, match.start));
    }
    
    // Add the highlighted keyword with orange color
    result.push(
      <strong key={`${keyIndex++}`} className="font-bold text-[#fc5d01]">
        {match.keyword}
      </strong>
    );
    
    lastIndex = match.end;
  });

  // Add remaining text after last match
  if (lastIndex < paragraph.length) {
    result.push(paragraph.substring(lastIndex));
  }

  return result.length > 0 ? result : [paragraph];
}
