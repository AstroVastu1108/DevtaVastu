export interface Point {
  x: number;
  y: number;
}

export interface FileType {
  url: string;
  type: string;
  name: string;
  width?: number;
  height?: number;
}

export interface DrawingBoardProps {
  width?: number;
  height?: number;
  gridSize?: number;
  lineStyles?: Array<{
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  }>;
  drawingMode?: 'drawing' | 'view';
}