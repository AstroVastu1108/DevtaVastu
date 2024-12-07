export const calculateCentroid = (points) => {
  if (!points || points.length === 0) return null;

  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);

  return {
    x: sumX / points.length,
    y: sumY / points.length
  };
};

export const pointToLineDistance = (x, y, start, end) => {
  const A = x - start.x;
  const B = y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = start.x;
    yy = start.y;
  } else if (param > 1) {
    xx = end.x;
    yy = end.y;
  } else {
    xx = start.x + param * C;
    yy = start.y + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
};

const DIRECTION_DATA = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];


export const drawDirectionLetters = (ctx) => {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const padding = 30;
  
  // Define fixed positions for direction letters
  // const positions = {
  //   // Top edge
  //   'N': { x: canvasWidth / 2 , y: padding, align: 'center' },
  //   'NNE': { x: canvasWidth * 0.75 - 85, y: padding, align: 'center' },
  //   'NE': { x: canvasWidth - padding - 85, y: padding, align: 'right' },
    
  //   // Right edge
  //   'ENE': { x: canvasWidth - padding, y: canvasHeight * 0.25, align: 'right' },
  //   'E': { x: canvasWidth - padding, y: canvasHeight / 2, align: 'right' },
  //   'ESE': { x: canvasWidth - padding, y: canvasHeight * 0.75, align: 'right' },
    
  //   // Bottom edge
  //   'SE': { x: canvasWidth - padding - 85 , y: canvasHeight - padding, align: 'right' },
  //   'SSE': { x: canvasWidth * 0.75 - 85, y: canvasHeight - padding, align: 'center' },
  //   'S': { x: canvasWidth / 2, y: canvasHeight - padding, align: 'center' },
  //   'SSW': { x: canvasWidth * 0.25 + 85, y: canvasHeight - padding, align: 'center' },
  //   'SW': { x: padding + 85 , y: canvasHeight - padding, align: 'left' },
    
  //   // Left edge
  //   'WSW': { x: padding, y: canvasHeight * 0.75, align: 'left' },
  //   'W': { x: padding, y: canvasHeight / 2, align: 'left' },
  //   'WNW': { x: padding, y: canvasHeight * 0.25, align: 'left' },
  //   'NW': { x: padding + 85 , y: padding , align: 'left' },
  //   'NNW': { x: canvasWidth * 0.25 + 85, y: padding, align: 'center' }
  // };

  const positions = {
    // Top edge
    'N': { x: canvasWidth / 2, y: padding, align: 'center' },
    'NNE': { x: canvasWidth * 0.75 - 35, y: padding, align: 'center' },
    'NE': { x: canvasWidth - padding, y: padding, align: 'center' },

    // Right edge
    'ENE': { x: canvasWidth - padding, y: canvasHeight * 0.25 + 35, align: 'right' },
    'E': { x: canvasWidth - padding, y: canvasHeight / 2, align: 'right' },
    'ESE': { x: canvasWidth - padding, y: canvasHeight * 0.75 - 35, align: 'right' },

    // Bottom edge
    'SE': { x: canvasWidth - padding , y: canvasHeight - padding, align: 'center' },
    'SSE': { x: canvasWidth * 0.75 - 35, y: canvasHeight - padding, align: 'center' },
    'S': { x: canvasWidth / 2, y: canvasHeight - padding, align: 'center' },
    'SSW': { x: canvasWidth * 0.25 + 35, y: canvasHeight - padding, align: 'center' },
    'SW': { x: padding , y: canvasHeight - padding, align: 'center' },

    // Left edge
    'WSW': { x: padding, y: canvasHeight * 0.75 - 35, align: 'left' },
    'W': { x: padding, y: canvasHeight / 2, align: 'left' },
    'WNW': { x: padding, y: canvasHeight * 0.25 + 35, align: 'left' },
    'NW': { x: padding , y: padding, align: 'center' },
    'NNW': { x: canvasWidth * 0.25 + 35, y: padding, align: 'center' },
  };


  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  
  // DIRECTION_DATA.forEach(direction => {
  //   const pos = positions[direction];
  //   if (pos) {
  //     ctx.textAlign = pos.align;
  //     ctx.textBaseline = 'middle';
  //     // ctx.textBaseline = 'start';
      
  //     // Draw background
  //     const metrics = ctx.measureText(direction);
  //     const padding = 4;
  //     ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      
  //     ctx.fillRect(
  //       pos.align === 'right' ? pos.x - metrics.width - padding * 2 : 
  //       pos.align === 'center' ? pos.x - metrics.width/2 - padding :
  //       pos.x,
  //       pos.y - metrics.actualBoundingBoxAscent/2 - padding,
  //       metrics.width + padding * 2,
  //       metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + padding * 2
  //     );
      
  //     // Draw text
  //     ctx.fillStyle = 'black';
  //     ctx.fillText(direction, pos.x, pos.y);
      
  //   }
  // });

  DIRECTION_DATA.forEach((direction) => {
    const pos = positions[direction];
    if (pos) {
      const textWidth = ctx.measureText(direction).width;
      const textHeight =
        ctx.measureText(direction).actualBoundingBoxAscent +
        ctx.measureText(direction).actualBoundingBoxDescent;
      const padding = 0;
  
      // Draw background rectangle
      if (pos.align === 'left' || pos.align === 'right') {
        // For vertical text (left and right)
        // ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        // ctx.fillRect(
        //   pos.x - textHeight / 2 - padding,
        //   pos.y - textWidth / 2 - padding,
        //   textHeight + padding * 2,
        //   textWidth + padding * 2
        // );
  
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.align === 'right' ? Math.PI / 2 : -Math.PI / 2); // Rotate vertically
        ctx.fillStyle = '#000000';
        // ctx.textAlign = 'center';
        // ctx.textBaseline = 'middle';
        ctx.fillText(direction, 0, 0);
        ctx.restore();
      } else {
  
        ctx.fillStyle = '#000000';
        ctx.textAlign = pos.align;
        // ctx.textBaseline = 'bottom';
        ctx.fillText(direction, pos.x, pos.y);
      }
    }
  });
  
};