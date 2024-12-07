import React from 'react';

const GridBackground = ({ width, height, gridSize }) => {
  return (
    <g>
      {/* Vertical lines */}
      {Array.from({ length: Math.floor(width / gridSize) + 1 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * gridSize}
          y1={0}
          x2={i * gridSize}
          y2={height}
          stroke="#000"
          strokeWidth={0.25}
        />
      ))}
      {/* Horizontal lines */}
      {Array.from({ length: Math.floor(height / gridSize) + 1 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * gridSize}
          x2={width}
          y2={i * gridSize}
          stroke="black"
          strokeWidth={0.25}
        />
      ))}
    </g>
  );
};

export default GridBackground;