import React, { useState, useRef, useEffect } from 'react';
import { calculateCentroid, pointToLineDistance } from '../utils/geometryUtils';
import { DEFAULT_LINE_SETS } from '../constants/directions';
import GridBackground from './GridBackground';
import FileUpload from './FileUpload';
import LineControls from './LineControls';
import jsPDF from "jspdf";

const DEFAULT_POINTS = [
  { x: 120, y: 120 },
  { x: 560, y: 120 },
  { x: 560, y: 560 },
  { x: 120, y: 560 },
];


const DrawingBoard = ({
  width = 676,
  height = 676,
  gridSize = 26,
  drawingMode = 'drawing'
}) => {
  const [lineSets, setLineSets] = useState(DEFAULT_LINE_SETS);
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [centroid, setCentroid] = useState(null);
  const [snapToCentroid, setSnapToCentroid] = useState(true);
  const [hideCircle, setHideCircle] = useState(true);
  const [hideMarmaLines, setHideMarmaLines] = useState(true);

  const svgRef = useRef(null);
  const printRef = useRef(null);
  const selectedPointRef = useRef(null);
  const movingCentroidRef = useRef(false);
  useEffect(() => {
    if (snapToCentroid) {
      setCentroid(calculateCentroid(points));
    }
  }, [points, snapToCentroid]);

  useEffect(() => {
    setCentroid(calculateCentroid(points));
  }, []);

  const getMousePosition = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const CTM = svg.getScreenCTM();
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const transformed = point.matrixTransform(CTM.inverse());
    return { x: transformed.x, y: transformed.y };
  };
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];

    if (uploadedFile) {
      const fileType = uploadedFile.type;

      if (fileType.includes("image")) {
        // If the uploaded file is an image
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(uploadedFile);
      } else if (fileType === "application/pdf") {
        // If the uploaded file is a PDF
        const pdfData = await uploadedFile.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1); // Get the first page

        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        const base64Image = canvas.toDataURL("image/png");

        setPreviewUrl(base64Image);
      } else {
        alert("Unsupported file type. Please upload an image or PDF.");
      }
    }
  };

  const isPointNear = (x, y, point, threshold = 10) => {
    return Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2) < threshold;
  };

  const findNearestPoint = (x, y, threshold = 10) => {
    return points.findIndex(point => isPointNear(x, y, point, threshold));
  };

  const findClosestLine = (x, y, threshold = 10) => {
    let closestLine = -1;
    let minDistance = Infinity;

    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];
      const distance = pointToLineDistance(x, y, start, end);

      if (distance < minDistance) {
        minDistance = distance;
        closestLine = i;
      }
    }

    return minDistance < threshold ? closestLine : -1;
  };

  const handleMouseDown = (e) => {
    const position = getMousePosition(e);

    // Check if the centroid is clicked
    if (centroid && isPointNear(position.x, position.y, centroid)) {
      movingCentroidRef.current = true;
    } else {
      const pointIndex = findNearestPoint(position.x, position.y);
      if (pointIndex !== -1) {
        selectedPointRef.current = pointIndex;
      }
    }
  };


  const handleMouseMove = (e) => {
    const position = getMousePosition(e);

    if (movingCentroidRef.current) {
      // Move the centroid freely if snapping is disabled
      if (!snapToCentroid) {
        const canvasBounds = { xMin: 0, xMax: width, yMin: 0, yMax: height };
        const clampedX = Math.max(canvasBounds.xMin, Math.min(canvasBounds.xMax, position.x));
        const clampedY = Math.max(canvasBounds.yMin, Math.min(canvasBounds.yMax, position.y));

        setCentroid({ x: clampedX, y: clampedY });
      }
    } else if (selectedPointRef.current !== null) {
      // Move a specific point
      const newPoints = [...points];
      newPoints[selectedPointRef.current] = position;
      setPoints(newPoints);

      // Recalculate centroid after point modification
      setCentroid(calculateCentroid(newPoints));
    }
  };


  const handleMouseUp = () => {
    movingCentroidRef.current = false;
    selectedPointRef.current = null;
  };

  const handleDoubleClick = (e) => {
    if (drawingMode !== 'drawing') return;

    const position = getMousePosition(e);
    const clickedPointIndex = findNearestPoint(position.x, position.y);

    if (clickedPointIndex !== -1) {
      if (points.length > 3) {
        const newPoints = points.filter((_, i) => i !== clickedPointIndex);
        setPoints(newPoints);
        setCentroid(calculateCentroid(newPoints));
      }
    } else {
      const closestLineIndex = findClosestLine(position.x, position.y);
      if (closestLineIndex !== -1) {
        const newPoints = [...points];
        newPoints.splice(closestLineIndex + 1, 0, position);
        setPoints(newPoints);
        setCentroid(calculateCentroid(newPoints));
      }
    }
  };

  const handleLineSetUpdate = (setIndex, updates) => {
    console.log("updates : ", updates)
    setLineSets(prevSets =>
      prevSets.map((set, i) =>
        i === setIndex ? { ...set, ...updates } : set
      )
    );
  };

  // const exportToPDF = async () => {
  //   const svgElement = svgRef.current;
  //   const svgData = new XMLSerializer().serializeToString(svgElement);
  //   const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  //   const url = URL.createObjectURL(svgBlob);
  //   const doc = new jsPDF();

  //   // Create a high-resolution canvas
  //   const canvas = document.createElement('canvas');
  //   const scaleFactor = 4;
  //   const width = 676 * scaleFactor;
  //   const height = 676 * scaleFactor;
  //   canvas.width = width;
  //   canvas.height = height;

  //   const ctx = canvas.getContext('2d');

  //   if (!ctx) {
  //     throw new Error('Could not get canvas context');
  //   }

  //   // Fill the canvas with white
  //   ctx.fillStyle = 'white'; // Change to any desired color
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);

  //   // Create an image element to load the SVG
  //   const img = new Image();
  //   img.onload = function () {
  //     // Draw the SVG onto the canvas once it is loaded
  //     ctx.drawImage(img, 0, 0, width, height); // Adjust the position and size as needed

  //     // Convert the canvas to a data URL
  //     const imgData = canvas.toDataURL('image/svg'); // Use 'image/png' for better quality

  //     // Add image to PDF
  //     doc.addImage(imgData, 'SVG', 0, 0, 150, 150); // Adjust the position and size as needed

  //     // Save the PDF
  //     doc.save('download.pdf');

  //     // Clean up the object URL
  //     URL.revokeObjectURL(url);
  //   };

  //   // Set the source of the image to the SVG Blob URL
  //   img.src = url;

  // };

  const exportToPDF = async () => {
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const doc = new jsPDF();

    // Create a high-resolution canvas
    const canvas = document.createElement('canvas');
    const scaleFactor = 2; // Reduced scale factor
    const width = 676 * scaleFactor;
    const height = 676 * scaleFactor;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Fill the canvas with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0, width, height);

      // Convert the canvas to a data URL
      const imgData = canvas.toDataURL('image/png'); // Use PNG for better compression

      // Add image to PDF with compression
      doc.addImage(imgData, 'PNG', 0, 0, 100, 100, undefined, 'FAST'); // Adjust size

      // Save the PDF
      doc.save('download.pdf');

      // Clean up the object URL
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };


  const DIRECTION_DATA = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

  const [inputDegree, setInputDegree] = useState(0);

  const handleInputChange = (e) => {
    let value = parseFloat(e.target.value) || 0;
    if (value < 0) value = 0;
    if (value > 360) value = 360;
    setInputDegree(value);
  };


  const totalLines = 32;
  const angleIncrement = 360 / totalLines;


  // const startPoints = [28,29,30];
  // const endPoints = [10,11,12];
  const startPoints = [27, 28, 29, 19, 20, 21];
  const endPoints = [13, 12, 11, 5, 4, 3];
  // const startPoints = [27, 28, 29, 19, 20, 21, 27];
  // const endPoints = [13, 12, 11, 5, 4, 3, 29];

  const calculatePointOnCircle = (index, radius, margin, centroid) => {
    const angle = (360 / totalLines) * index; // Adjust for starting at the top
    const radians = (angle * Math.PI) / 180;
    const adjustedRadius = radius - margin; // Reduce radius by margin
    const x = centroid.x + adjustedRadius * Math.cos(radians);
    const y = centroid.y + adjustedRadius * Math.sin(radians);
    return { x, y };
  };

  function calculateIntersection(line1, line2) {
    const { x1, y1, x2, y2 } = line1;
    const { x3, y3, x4, y4 } = line2;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return null; // Lines are parallel

    const px =
      ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
    const py =
      ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

    // Check if the intersection is within both line segments
    if (
      Math.min(x1, x2) <= px &&
      px <= Math.max(x1, x2) &&
      Math.min(y1, y2) <= py &&
      py <= Math.max(y1, y2) &&
      Math.min(x3, x4) <= px &&
      px <= Math.max(x3, x4) &&
      Math.min(y3, y4) <= py &&
      py <= Math.max(y3, y4)
    ) {
      return { x: px, y: py };
    }

    return null; // Intersection is outside the segments
  }

  const calculateLineIntersection = (
    x1, y1,
    x2, y2,
    x3, y3,
    x4, y4) => {
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));

    if (denominator === 0) return null;

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

    const x = x1 + (ua * (x2 - x1));
    const y = y1 + (ua * (y2 - y1));

    return { x, y };
  };

  const calculateIntersectionPoints = (centroid, polygonPoints, radius, margin) => {
    const intersections = [];

    for (let i = 0; i < 32; i++) {
      const angle = (i * 11.25 * Math.PI) / 180;
      const endPoint = {
        x: centroid.x + (radius - margin) * Math.cos(angle),
        y: centroid.y + (radius - margin) * Math.sin(angle)
      };

      let labelPrefix;
      let labelIndex;

      if (i >= 20 && i <= 27) {
        labelPrefix = "N";
        labelIndex = i - 19; // N1-N8
      } else if (i >= 28 || i <= 3) {
        labelPrefix = "E";
        labelIndex = i >= 28 ? i - 27 : i + 5; // E1-E8
      } else if (i >= 4 && i <= 11) {
        labelPrefix = "S";
        labelIndex = i - 3; // S1-S8
      } else if (i >= 12 && i <= 19) {
        labelPrefix = "W";
        labelIndex = i - 11; // W1-W8
      }

      // Check intersection with each polygon edge
      for (let j = 0; j < polygonPoints.length; j++) {
        const nextJ = (j + 1) % polygonPoints.length;
        const intersection = calculateLineIntersection(
          centroid.x, centroid.y,
          endPoint.x, endPoint.y,
          polygonPoints[j].x, polygonPoints[j].y,
          polygonPoints[nextJ].x, polygonPoints[nextJ].y
        );

        if (intersection) {
          intersections.push({
            point: intersection,
            label: `${labelPrefix}${labelIndex}`
          });
        }
      }
    }

    return intersections;
  };

  const squareSize = 580; // Define square size if it's constant
  const margin = 26; // Define margin

  const [intersections, setIntersections] = useState([]);

  useEffect(() => {
    const newCentroid = calculateCentroid(points);
    setCentroid(newCentroid);

    // Calculate intersection points whenever points or centroid changes
    const newIntersections = calculateIntersectionPoints(
      newCentroid,
      points,
      676 / 2, // radius (half of square size)
      26 // margin
    );
    setIntersections(newIntersections);
  }, [points]);
  const edges = [];

  // Create line segments from points
  points.forEach((point, i) => {
    const nextPoint = points[(i + 1) % points.length]; // Loop back to the start for the last edge
    edges.push({
      x1: point.x,
      y1: point.y,
      x2: nextPoint.x,
      y2: nextPoint.y,
    });
  });

  // Find intersections between all pairs of edges
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      // Skip adjacent edges since they cannot intersect
      if (Math.abs(i - j) === 1 || (i === 0 && j === edges.length - 1)) {
        continue;
      }
      const intersection = calculateIntersection(edges[i], edges[j]);
      if (intersection) {
        intersections.push(intersection);
      }
    }
  }
  const pointLookup = intersections.reduce((acc, item) => {
    acc[item.label] = item.point;
    return acc;
  }, {});

  const drawLines = (label1, label2, stroke, strokeWidth) => {
    const point1 = pointLookup[label1];
    const point2 = pointLookup[label2];

    if (!point1 || !point2) return null;

    return (
      <line
        // key={index}
        x1={point1.x}
        y1={point1.y}
        x2={point2.x}
        y2={point2.y}
        //  stroke="blue"
        //         strokeWidth="2"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  const lines = [
    ["N7", "E3"],
    ["N8", "E2"],
    ["N6", "E4"],
    ["N5", "E5"],
    ["N5", "E5"],
    ["N4", "E6"],
    ["N4", "E6"],
    ["N3", "E7"],
    ["N2", "E8"],
    ["N1", "S1"],
    ["W8", "S2"],
    ["W7", "S3"],
    ["W6", "S4"],
    ["W5", "S5"],
    ["W4", "S6"],
    ["W3", "S7"],
    ["W2", "S8"],
    ["N8", "W2"],
    ["E1", "W1"],
    ["E2", "S8"],
    ["W8", "S2"],
    ["N1", "S1"],
    ["N2", "E8"]
  ];

  const Marmalines = [
    ["N8", "W2"],
    ["E1", "W1"],
    ["E2", "S8"],
    ["W8", "S2"],
    ["N1", "S1"],
    ["N2", "E8"]
  ]
  function calculateIntersectionPoins(line1, line2) {
    const [A, B] = line1;
    const [C, D] = line2;
    if (!A || !B || !C || !D) {
      return null;
    }
    const { x: x1, y: y1 } = A;
    const { x: x2, y: y2 } = B;
    const { x: x3, y: y3 } = C;
    const { x: x4, y: y4 } = D;

    // Calculate the denominator
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    // Check if lines are parallel (denom == 0)
    if (denom === 0) {
      return null; // No intersection (lines are parallel)
    }

    // Calculate the intersection point
    const px =
      ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
      denom;
    const py =
      ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
      denom;

    // Check if the intersection point is within the line segments
    const isWithinLine1 =
      Math.min(x1, x2) <= px &&
      px <= Math.max(x1, x2) &&
      Math.min(y1, y2) <= py &&
      py <= Math.max(y1, y2);
    const isWithinLine2 =
      Math.min(x3, x4) <= px &&
      px <= Math.max(x3, x4) &&
      Math.min(y3, y4) <= py &&
      py <= Math.max(y3, y4);

    if (isWithinLine1 && isWithinLine2) {
      return { x: px, y: py }; // Intersection point
    } else {
      return null; // Intersection point is outside the line segments
    }
  }

  const [intersectionPoints, setIntersectionPoints] = useState([]);
  const [MarmaintersectionPoints, setMarmaIntersectionPoints] = useState([]);

  useEffect(() => {
    if (intersections.length > 0) {
      const newIntersectionPoints = [];
      for (let i = 0; i < lines.length; i++) {
        const line1 = [
          pointLookup[lines[i][0]],
          pointLookup[lines[i][1]]
        ];

        for (let j = i + 1; j < lines.length; j++) {
          const line2 = [
            pointLookup[lines[j][0]],
            pointLookup[lines[j][1]]
          ];

          const intersection = calculateIntersectionPoins(line1, line2);

          if (intersection) {
            newIntersectionPoints.push(intersection);
          }
        }
      }

      setIntersectionPoints(newIntersectionPoints);
    }
  }, [intersections, points]);

  useEffect(() => {
    if (intersections.length > 0) {
      const newMarmaIntersectionPoints = [];
      for (let i = 0; i < Marmalines.length; i++) {
        const line1 = [
          pointLookup[Marmalines[i][0]],
          pointLookup[Marmalines[i][1]]
        ];

        for (let j = i + 1; j < Marmalines.length; j++) {
          const line2 = [
            pointLookup[Marmalines[j][0]],
            pointLookup[Marmalines[j][1]]
          ];

          const intersection = calculateIntersectionPoins(line1, line2);

          if (intersection) {
            newMarmaIntersectionPoints.push(intersection);
          }
        }
      }

      setMarmaIntersectionPoints(newMarmaIntersectionPoints);
    }
  }, [intersections, points]);

  return (
    <div className='flex flex-row'>
      <div className="">
        <button onClick={exportToPDF} className="download-button">
          Download SVG
        </button>
        {lineSets.map((lineSet, i) => (
          <LineControls
            key={i}
            lineSet={lineSet}
            setIndex={i}
            onUpdate={handleLineSetUpdate}
          />
        ))}
        <FileUpload onFileSelect={handleFileUpload} />
        <input
          type="checkbox"
          checked={snapToCentroid}
          onChange={(e) => setSnapToCentroid(e.target.checked)}
        /> Snap to Centroid
        <br></br>
        <input
          type="checkbox"
          checked={hideCircle}
          onChange={(e) => setHideCircle(e.target.checked)}
        /> Hide Circle
        <br></br>
        <input
          type="checkbox"
          checked={hideMarmaLines}
          onChange={(e) => setHideMarmaLines(e.target.checked)}
        /> Hide Marma Lines
        <br></br>
        <label>
          Enter Degree:
          <input
            type="number"
            value={inputDegree}
            onChange={handleInputChange}
            className="border border-gray-300 p-1 rounded"
            placeholder="0"
          />
        </label>
      </div>
      <div className="" ref={printRef}>
        <div className="flex mb-1 ms-2.5">
          {Array.from({ length: 26 }, (_, i) => (
            <div key={i} className="text-sm ms-2.5 w-4">{i + 1}</div>
          ))}
        </div>

        <div className="relative flex">
          <div className="flex flex-col">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, i) => (
              <div key={i} className="text-sm mb-1.5 w-4">{letter}</div>
            ))}
          </div>

          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="cursor-pointer border border-gray-200"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            style={{ touchAction: 'none', border: "0" }}
          >
            <defs>
              <clipPath id="svgViewBox">
                <rect width={width} height={height} />
              </clipPath>
            </defs>

            <g clipPath="url(#svgViewBox)">
              {/* Layer 1: Uploaded File */}
              <g className="file-layer">

                <image
                  href={previewUrl}
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                  width={width}
                  height={height}
                />
              </g>

              <GridBackground width={width} height={height} gridSize={gridSize} />

              <g className="drawing-layer" style={{ pointerEvents: 'all' }}>
                {points.length > 1 && (
                  <polygon
                    points={points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="blue"
                    strokeWidth="1"
                  />
                )}

                {/* Draw points */}
                {points.map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="red"
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}

                <g className="intersection-points">
                  {intersections.map(({ point, label }, index) => (
                    <g key={index}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        fill="purple"
                        stroke="white"
                        strokeWidth="1"
                      />
                      <text
                        x={point.x + 10}
                        y={point.y + 10}
                        fontSize="10"
                        fill="purple"
                        textAnchor="middle"
                        style={{
                          userSelect: 'none',
                          cursor: 'default'
                        }}
                      >
                        {label}
                      </text>
                    </g>
                  ))}
                </g>

                {centroid && (
                  <>
                    <circle
                      cx={centroid.x}
                      cy={centroid.y}
                      r="5"
                      fill="green"
                      stroke="white"
                      strokeWidth="2"
                    />


                    {hideCircle && Array.from({ length: totalLines }).map((_, index) => {
                      const rotationIndex = index % totalLines;
                      const angle = rotationIndex * angleIncrement + (270 + inputDegree);
                      const radian = (angle * Math.PI) / 180;

                      const squareSize = 676;
                      const halfSize = squareSize;
                      const margin = 26;

                      let endX, endY;
                      const slope = Math.tan(radian);
                      const rightBoundary = centroid.x + halfSize - margin;
                      const leftBoundary = centroid.x - halfSize + margin;
                      const topBoundary = centroid.y - halfSize + margin;
                      const bottomBoundary = centroid.y + halfSize - margin;

                      // Determine line endpoint based on slope
                      if (Math.abs(slope) <= 1) {
                        if (Math.cos(radian) > 0) {
                          endX = rightBoundary;
                          endY = centroid.y + slope * (rightBoundary - centroid.x);
                        } else {
                          endX = leftBoundary;
                          endY = centroid.y - slope * (centroid.x - leftBoundary);
                        }
                      } else {
                        if (Math.sin(radian) > 0) {
                          endX = centroid.x + (1 / slope) * (bottomBoundary - centroid.y);
                          endY = bottomBoundary;
                        } else {
                          endX = centroid.x - (1 / slope) * (centroid.y - topBoundary);
                          endY = topBoundary;
                        }
                      }

                      const style = lineSets[index % lineSets.length];

                      return (
                        <g key={index}>
                          <line
                            x1={centroid.x}
                            y1={centroid.y}
                            x2={endX}
                            y2={endY}
                            stroke={style.stroke}
                            strokeWidth={style.strokeWidth}
                            strokeDasharray={style.strokeDasharray}
                          />
                        </g>
                      );
                    })}
                  </>
                )}
                {hideMarmaLines && (
                  <>
                    {/* Marma Lines */}
                    {lines.map((line, index) => {
                      const [startPoint, endPoint] = line; // Destructure the line array
                      return drawLines(startPoint, endPoint, "purple", 1); // Call the drawLines function
                    })}

                    {/* Direction fixed lines */}
                    {drawLines("N8", "W2", "orange", 1)}
                    {drawLines("E1", "W1", "orange", 1)}
                    {drawLines("E2", "S8", "orange", 1)}
                    {drawLines("W8", "S2", "orange", 1)}
                    {drawLines("N1", "S1", "orange", 1)}
                    {drawLines("N2", "E8", "orange", 1)}
                  </>
                )}


                {intersectionPoints.map((point, idx) => (
                  <circle
                    key={idx}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill="green"
                    stroke="black"
                  />
                ))}
                {MarmaintersectionPoints.map((point, idx) => (
                  <circle
                    key={idx}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill="red"
                    stroke="black"
                  />
                ))}
              </g>
            </g>
            <rect x={0} y={0} width="676" height="26" fill="white" mask="url(#white-mask)" />
            <rect x={0} y={0} width="26" height="676" fill="white" mask="url(#white-mask)" />
            <rect x={0} y={650} width="676" height="26" fill="white" mask="url(#white-mask)" />
            <rect x={650} y={0} width="26" height="676" fill="white" mask="url(#white-mask)" />
          
            {Array.from({ length: totalLines }).map((_, index) => {
              const rotationIndex = index % totalLines;
              const angle = rotationIndex * angleIncrement + (270 + inputDegree);
              const radian = (angle * Math.PI) / 180;

              const squareSize = 670;
              const halfSize = squareSize / 2;
              const margin = 26;
              const canvasBounds = { xMin: 0, xMax: 676, yMin: 0, yMax: 676 };
              const clampedX = Math.max(canvasBounds.xMin, Math.min(canvasBounds.xMax, 0));
              const clampedY = Math.max(canvasBounds.yMin, Math.min(canvasBounds.yMax, 0));

              const slope = Math.tan(radian);
              const rightBoundary = clampedX + halfSize - margin;
              const leftBoundary = clampedX - halfSize + margin;
              const topBoundary = clampedY - halfSize + margin;
              const bottomBoundary = clampedY + halfSize - margin;
              const direction = index % 2 === 0 ? DIRECTION_DATA[index / 2] : null;

              let endX, endY;
              let labelX, labelY;
              const labelOffset = 1.04; // Label position offset

              if (Math.abs(slope) <= 1) {
                endX = Math.cos(radian) > 0 ? rightBoundary : leftBoundary;
                endY = clampedY + slope * (endX - clampedX);
                labelX = clampedX + (endX - clampedX) * labelOffset + 340;
                labelY = clampedY + (endY - clampedY) * labelOffset + 340;

                return (
                  <g key={index}>
                    {direction && (
                      <text
                        x={labelX}
                        y={labelY}
                        fontSize="18"
                        fontWeight="500"
                        fill="purple"
                        transform={Math.cos(radian) > 0 ? `rotate(90, ${labelX}, ${labelY})` : `rotate(-90, ${labelX}, ${labelY})`}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        style={{
                          userSelect: 'none', // Prevent text selection
                          cursor: 'default' // Optional: Make the cursor non-interactive
                        }}
                      >
                        {direction}
                      </text>
                    )}
                  </g>
                );
              } else {
                endY = Math.sin(radian) > 0 ? bottomBoundary : topBoundary;
                endX = clampedX + (1 / slope) * (endY - clampedY);
                labelX = clampedX + (endX - clampedX) * labelOffset + 340;
                labelY = clampedY + (endY - clampedY) * labelOffset + 340;

                return (
                  <g key={index}>
                    {direction && (
                      <text
                        x={labelX}
                        y={labelY}
                        fontSize="18"
                        fontWeight="500"
                        fill="purple"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        style={{
                          userSelect: 'none', // Prevent text selection
                          cursor: 'default' // Optional: Make the cursor non-interactive
                        }}
                      >
                        {direction}
                      </text>
                    )}
                  </g>
                );
              }
            })}

          </svg>

          <div className="flex flex-col ms-2">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, i) => (
              <div key={i} className="text-sm mb-1.5 w-4">{letter}</div>
            ))}
          </div>
        </div>

        <div className="flex mb-1 ms-2.5">
          {Array.from({ length: 26 }, (_, i) => (
            <div key={i} className="text-sm ms-2.5 w-4">{i + 1}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrawingBoard;