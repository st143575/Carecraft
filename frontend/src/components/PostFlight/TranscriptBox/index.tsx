import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import demoDataService from '../../../services/demoDataService';

const TranscriptContainer = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-large);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--medium-gray);
  margin-bottom: var(--spacing-lg);
`;

const TranscriptHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--medium-gray);
`;

const Title = styled.h3`
  color: var(--bosch-dark-blue);
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
`;

const SearchInput = styled.input`
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 2px solid var(--medium-gray);
  border-radius: var(--radius-medium);
  font-size: 0.9rem;
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: var(--bosch-dark-blue);
    box-shadow: 0 0 0 3px rgba(1, 54, 98, 0.1);
  }
`;

const SearchButton = styled.button`
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--bosch-dark-blue);
  color: var(--white);
  border: none;
  border-radius: var(--radius-medium);
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    background-color: var(--bosch-dark-green);
  }
`;

const TranscriptContent = styled.div`
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid var(--medium-gray);
  border-radius: var(--radius-medium);
  padding: var(--spacing-lg);
  background-color: #f8f9fa;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--light-gray);
    border-radius: var(--radius-small);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--medium-gray);
    border-radius: var(--radius-small);
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--dark-gray);
  }
`;

const TranscriptEntry = styled.div<{ highlighted?: boolean; section?: number }>`
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  border-radius: var(--radius-small);
  transition: all 0.3s ease;
  scroll-margin-top: var(--spacing-lg);
  
  ${props => props.highlighted && `
    background-color: rgba(238, 73, 73, 0.1);
    border-left: 4px solid var(--bosch-red);
    padding-left: var(--spacing-md);
  `}
  
  ${props => props.section && `
    cursor: pointer;
    &:hover {
      background-color: rgba(1, 54, 98, 0.05);
    }
  `}
`;

const Timestamp = styled.span`
  color: var(--bosch-dark-blue);
  font-weight: 600;
  font-size: 0.9rem;
  margin-right: var(--spacing-md);
  min-width: 60px;
  display: inline-block;
`;

const Speaker = styled.span<{ isAgent?: boolean }>`
  font-weight: 600;
  font-size: 0.9rem;
  margin-right: var(--spacing-sm);
  color: ${props => props.isAgent ? 'var(--bosch-dark-green)' : 'var(--bosch-red)'};
`;

const Message = styled.span`
  color: var(--text-dark);
  font-size: 0.95rem;
`;

const HighlightedText = styled.span<{ type: 'positive' | 'negative' | 'protocol' }>`
  background-color: ${props => {
    switch (props.type) {
      case 'positive': return 'rgba(35, 113, 71, 0.2)';
      case 'negative': return 'rgba(238, 73, 73, 0.2)';
      case 'protocol': return 'rgba(1, 54, 98, 0.2)';
      default: return 'transparent';
    }
  }};
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
`;

const AnnotationBadge = styled.span<{ type: 'positive' | 'negative' | 'protocol' }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: var(--spacing-xs);
  
  ${props => {
    switch (props.type) {
      case 'positive':
        return `
          background-color: var(--bosch-dark-green);
          color: white;
        `;
      case 'negative':
        return `
          background-color: var(--bosch-red);
          color: white;
        `;
      case 'protocol':
        return `
          background-color: var(--bosch-dark-blue);
          color: white;
        `;
      default:
        return `
          background-color: var(--medium-gray);
          color: var(--text-dark);
        `;
    }
  }}
`;

const ExpandButton = styled.button`
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: transparent;
  color: var(--bosch-dark-blue);
  border: 2px solid var(--bosch-dark-blue);
  border-radius: var(--radius-medium);
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
  
  &:hover {
    background-color: var(--bosch-dark-blue);
    color: var(--white);
  }
`;

interface TranscriptEntry {
  id: number;
  timestamp: string;
  speaker: 'agent' | 'customer';
  message: string;
  highlights?: Array<{
    text: string;
    type: 'positive' | 'negative' | 'protocol';
    annotation?: string;
  }>;
  section?: number;
}


interface TranscriptBoxProps {
  jumpToSection?: number;
  onSectionClick?: (section: number) => void;
}

const TranscriptBox: React.FC<TranscriptBoxProps> = ({ jumpToSection, onSectionClick }) => {
  const mockTranscript: TranscriptEntry[] = demoDataService.getTranscriptEntries();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Jump to section when requested
  useEffect(() => {
    if (jumpToSection && contentRef.current) {
      const sectionElement = contentRef.current.querySelector(`[data-section="${jumpToSection}"]`);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedSection(jumpToSection);
        
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedSection(null), 3000);
      }
    }
  }, [jumpToSection]);

  const filteredTranscript = mockTranscript.filter(entry =>
    searchTerm === '' || 
    entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedTranscript = isExpanded ? filteredTranscript : filteredTranscript.slice(0, 5);

  const handleSearch = () => {
    if (searchTerm && filteredTranscript.length > 0) {
      const firstResult = contentRef.current?.querySelector(`[data-id="${filteredTranscript[0].id}"]`);
      if (firstResult) {
        firstResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleSectionClick = (section: number) => {
    if (onSectionClick) {
      onSectionClick(section);
    }
  };

  const renderMessage = (entry: TranscriptEntry) => {
    if (!entry.highlights || entry.highlights.length === 0) {
      return <Message>{entry.message}</Message>;
    }

    let messageContent = entry.message;
    const highlights = [...entry.highlights].sort((a, b) => 
      messageContent.indexOf(b.text) - messageContent.indexOf(a.text)
    );

    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight.text})`, 'gi');
      messageContent = messageContent.replace(regex, `<highlight-${highlight.type}>$1</highlight-${highlight.type}>`);
    });

    const parts = messageContent.split(/(<highlight-[^>]+>.*?<\/highlight-[^>]+>)/);
    
    return (
      <Message>
        {parts.map((part, index) => {
          const highlightMatch = part.match(/<highlight-([^>]+)>(.*?)<\/highlight-[^>]+>/);
          if (highlightMatch) {
            const type = highlightMatch[1] as 'positive' | 'negative' | 'protocol';
            const text = highlightMatch[2];
            const annotation = entry.highlights?.find(h => h.text === text)?.annotation;
            
            return (
              <span key={index}>
                <HighlightedText type={type}>{text}</HighlightedText>
                {annotation && <AnnotationBadge type={type}>{annotation}</AnnotationBadge>}
              </span>
            );
          }
          return part;
        })}
      </Message>
    );
  };

  return (
    <TranscriptContainer>
      <TranscriptHeader>
        <Title>Call Transcript</Title>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <SearchButton onClick={handleSearch}>Search</SearchButton>
        </SearchContainer>
      </TranscriptHeader>
      
      <TranscriptContent ref={contentRef}>
        {displayedTranscript.map((entry) => (
          <TranscriptEntry
            key={entry.id}
            data-id={entry.id}
            data-section={entry.section}
            highlighted={highlightedSection === entry.section}
            section={entry.section}
            onClick={() => entry.section && handleSectionClick(entry.section)}
          >
            <Timestamp>{entry.timestamp}</Timestamp>
            <Speaker isAgent={entry.speaker === 'agent'}>
              {entry.speaker === 'agent' ? 'Agent:' : 'Customer:'}
            </Speaker>
            {renderMessage(entry)}
          </TranscriptEntry>
        ))}
        
        {!isExpanded && filteredTranscript.length > 5 && (
          <ExpandButton onClick={() => setIsExpanded(true)}>
            Show Full Transcript ({filteredTranscript.length - 5} more entries)
          </ExpandButton>
        )}
      </TranscriptContent>
    </TranscriptContainer>
  );
};

export default TranscriptBox;