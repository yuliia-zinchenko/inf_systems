'use client';

import type { KeyboardEvent } from 'react';

interface EditableTitleProps {
  value: string;
  onCommit: (next: string) => void;
}

export const EditableTitle = ({ value, onCommit }: EditableTitleProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLHeadingElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      event.currentTarget.textContent = value;
      event.currentTarget.blur();
    }
  };

  return (
    <h1
      className="mt-3 -mx-1 cursor-text rounded-lg px-1 text-3xl font-semibold tracking-tight outline-none transition hover:bg-white/5 focus:bg-white/5 md:text-4xl"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(event) => onCommit(event.currentTarget.textContent ?? '')}
      onKeyDown={handleKeyDown}
    >
      {value}
    </h1>
  );
};
