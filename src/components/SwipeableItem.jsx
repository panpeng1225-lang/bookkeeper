import { useState, useRef } from 'react';

export default function SwipeableItem({ children, onEdit, onDelete }) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const locked = useRef(false); // lock direction once determined

  const THRESHOLD = 60;
  const BUTTON_WIDTH = 140; // total width of both buttons

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = offsetX;
    locked.current = false;
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Lock direction on first significant move
    if (!locked.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      locked.current = true;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical scroll, abort swipe
        setSwiping(false);
        return;
      }
    }

    if (locked.current) {
      e.preventDefault(); // prevent scroll during horizontal swipe
    }

    const next = currentX.current + dx;
    // Clamp: can't swipe right past 0, can't swipe left past -BUTTON_WIDTH
    setOffsetX(Math.max(-BUTTON_WIDTH, Math.min(0, next)));
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    // Snap open or closed
    if (offsetX < -THRESHOLD) {
      setOffsetX(-BUTTON_WIDTH);
    } else {
      setOffsetX(0);
    }
  };

  const close = () => setOffsetX(0);

  return (
    <div className="swipeable-container">
      {/* Background buttons */}
      <div className="swipeable-actions">
        <button
          className="swipe-btn swipe-edit"
          onClick={() => { close(); onEdit?.(); }}
        >
          编辑
        </button>
        <button
          className="swipe-btn swipe-delete"
          onClick={() => { close(); onDelete?.(); }}
        >
          删除
        </button>
      </div>

      {/* Foreground content */}
      <div
        className="swipeable-content"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
