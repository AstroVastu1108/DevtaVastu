import React, { useState, useRef, useEffect } from 'react';
import { calculateCentroid, pointToLineDistance } from '../utils/geometryUtils';
import { DEFAULT_LINE_SETS } from '../constants/directions';
import GridBackground from './GridBackground';
import LineControls from './LineControls';
import jsPDF from "jspdf";

import { Upload } from 'lucide-react';
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
  // Show Marma lines
  const [hideMarmaLines, setHideMarmaLines] = useState(false);
  // Show Marma points
  const [hideMarmapoints, setHideMarmapoints] = useState(false);
  // file upload state
  const [fileUploaded, setFileUploaded] = useState(false);
  // circle visible state
  const [hideCircle, setHideCircle] = useState(false);
  // Show Devta
  const [showDevta, setShowDevta] = useState(false);


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
        setFileUploaded(true)
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

  const [intersectionsState, setIntersectionsState] = useState([]);

  const pointLookup = intersectionsState.reduce((acc, item) => {
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

  const drawLinesEquallyDivide = (label1, label2, stroke, strokeWidth) => {
    const point1 = pointLookup[label1];
    const point2 = pointLookup[label2];

    if (!point1 || !point2) return null;

    // Calculate the division points
    const division1 = {
      x: point1.x + (point2.x - point1.x) / 3,
      y: point1.y + (point2.y - point1.y) / 3,
    };
    const division2 = {
      x: point1.x + (2 * (point2.x - point1.x)) / 3,
      y: point1.y + (2 * (point2.y - point1.y)) / 3,
    };

    return (
      <>
        {/* Draw the main line */}
        <line
          x1={point1.x}
          y1={point1.y}
          x2={point2.x}
          y2={point2.y}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {/* Draw points at the division positions */}
        <circle cx={division1.x} cy={division1.y} r="4" fill="red" />
        <circle cx={division2.x} cy={division2.y} r="4" fill="red" />
      </>
    );
  };


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
    ["N2", "E8"],
    // new points
    // ["W8", "N2"],
    // ["W7", "N3"],
    // ["W6", "N4"],
    // ["W5", "N5"],
    // ["W4", "N6"],
    // ["W3", "N7"],
    // ["W2", "N8"],
    // ["W1", "E1"],
    // ["S8", "E2"],
    // ["S7", "E3"],
    // ["S6", "E4"],
    // ["S5", "E5"],
    // ["S4", "E6"],
    // ["S3", "E7"],
    // ["S2", "E8"],
  ];
  const linesLeft = [
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
    ["N2", "E8"],
    // new points
    ["W8", "N2"],
    ["W7", "N3"],
    ["W6", "N4"],
    ["W5", "N5"],
    ["W4", "N6"],
    ["W3", "N7"],
    ["W2", "N8"],
    ["W1", "E1"],
    ["S8", "E2"],
    ["S7", "E3"],
    ["S6", "E4"],
    ["S5", "E5"],
    ["S4", "E6"],
    ["S3", "E7"],
    ["S2", "E8"],
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
  const [leftIntersectionPoints, setLeftIntersectionPoints] = useState([]);
  const [MarmaintersectionPoints, setMarmaIntersectionPoints] = useState([]);

  useEffect(() => {
    if (intersectionsState.length > 0) {
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
  }, [intersectionsState, points]);

  useEffect(() => {
    if (intersectionsState.length > 0) {
      const newLeftIntersectionPoints = [];

      for (let i = 0; i < linesLeft.length; i++) {
        const line1 = [
          pointLookup[linesLeft[i][0]],
          pointLookup[linesLeft[i][1]],
        ];

        for (let j = i + 1; j < linesLeft.length; j++) {
          const line2 = [
            pointLookup[linesLeft[j][0]],
            pointLookup[linesLeft[j][1]],
          ];

          const intersection = calculateIntersectionPoins(line1, line2);

          if (intersection) {
            newLeftIntersectionPoints.push(intersection);
          }
        }
      }
      const filteredLeftIntersectionPoints = newLeftIntersectionPoints.filter(
        (newPoint) =>
          !intersectionPoints.some((existingPoint) =>
            existingPoint.x === newPoint.x && existingPoint.y === newPoint.y
          )
      );

      setLeftIntersectionPoints(filteredLeftIntersectionPoints);
    }
  }, [intersectionsState, points, intersectionPoints]);

  useEffect(() => {
    if (intersectionsState.length > 0) {
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
  }, [intersectionsState, points]);


  useEffect(() => {
    // if (hideCircle) {
    const newIntersections = [];

    Array.from({ length: totalLines }).forEach((_, index) => {
      const rotationIndex = index % totalLines;
      const angle = rotationIndex * angleIncrement + (360 + inputDegree);
      const radian = (angle * Math.PI) / 180;

      const squareSize = 676; // Define your square size
      const halfSize = squareSize / 2; // Calculate half size
      const margin = 26; // Define your margin

      // Check if centroid is defined and has valid x, y properties
      if (centroid && typeof centroid.x === 'number' && typeof centroid.y === 'number') {
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

        let labelPrefix;
        let labelIndex;

        // Assign labels based on rotation index
        if (rotationIndex >= 20 && rotationIndex <= 27) {
          labelPrefix = "N";
          labelIndex = rotationIndex - 19; // N1-N8
        } else if (rotationIndex >= 28 || rotationIndex <= 3) {
          labelPrefix = "E";
          labelIndex = rotationIndex >= 28 ? rotationIndex - 27 : rotationIndex + 5; // E1-E8
        } else if (rotationIndex >= 4 && rotationIndex <= 11) {
          labelPrefix = "S";
          labelIndex = rotationIndex - 3; // S1-S8
        } else if (rotationIndex >= 12 && rotationIndex <= 19) {
          labelPrefix = "W";
          labelIndex = rotationIndex - 11; // W1-W8
        }

        // Calculate intersections if points are valid
        if (points.length > 1) {
          for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            const intersection = calculateLineIntersection(
              centroid.x,
              centroid.y,
              endX,
              endY,
              points[i].x,
              points[i].y,
              points[nextIndex].x,
              points[nextIndex].y
            );

            // Only push valid intersections
            if (intersection) {
              newIntersections.push({
                point: intersection,
                label: `${labelPrefix}${labelIndex}`,
              });
            }
          }
        }
      }
    });

    setIntersectionsState(newIntersections);
    // }
  }, [hideCircle, totalLines, angleIncrement, inputDegree, centroid, points]);

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });

  const handleMouseEnter = (event, point) => {
    setTooltip({
      visible: true,
      x: point.x,
      y: point.y,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  const intermediatePoints1 = []; // Array to store the first intermediate points (P1)
  const intermediatePoints2 = []; // Array to store the second intermediate points (P2)



  return (
    <div className="flex flex-row p-4 bg-gray-100 rounded shadow-lg">
      <div className="flex flex-col w-1/4 p-4 bg-white rounded shadow-md">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileUpload}
        >
          <label className=" flex items-center gap-2 px-4 py-2 mb-4 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors">
            <Upload size={20} />
            <span>Upload File</span>
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileUpload}
            // disabled={fileUploaded}
            />
          </label>
        </div>

        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={hideCircle}
            onChange={(e) => setHideCircle(e.target.checked)}
            id="hideCircle"
            className="mr-2"
          />
          <label htmlFor="hideCircle">Show Chakra</label>
        </div>

        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={showDevta}
            onChange={(e) => setShowDevta(e.target.checked)}
            id="showDevta"
            className="mr-2"
          />
          <label htmlFor="showDevta">Show Devta</label>
        </div>


        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={hideMarmaLines}
            onChange={(e) => setHideMarmaLines(e.target.checked)}
            id="hideMarmaLines"
            className="mr-2"
          />
          <label htmlFor="hideMarmaLines">Show Marma Lines</label>
        </div>


        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={hideMarmapoints}
            onChange={(e) => setHideMarmapoints(e.target.checked)}
            id="hideMarmapoints"
            className="mr-2"
          />
          <label htmlFor="hideMarmapoints">Show Marma Points</label>
        </div>



        {hideCircle && fileUploaded && <>
          {lineSets.map((lineSet, i) => (
            <LineControls
              key={i}
              lineSet={lineSet}
              setIndex={i}
              onUpdate={handleLineSetUpdate}
            />
          ))}

          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={snapToCentroid}
              onChange={(e) => setSnapToCentroid(e.target.checked)}
              id="snapToCentroid"
              className="mr-2"
            />
            <label htmlFor="snapToCentroid">Snap to Centroid</label>
          </div>

          <label className="flex items-center">
            Enter Degree:
            <input
              type="number"
              value={inputDegree}
              onChange={handleInputChange}
              className="border border-gray-300 p-1 rounded ml-2 w-16"
              placeholder="0"
              aria-label="Degree input"
            />
          </label>
        </>}

        <button
          onClick={exportToPDF}
          className="download-button mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
        >
          Download SVG
        </button>
      </div>

      <div className="flex-grow p-4" ref={printRef}>
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
            className="cursor-pointer border border-gray-200 bg-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            style={{ touchAction: 'none', border: "0" }}
          >

            {!fileUploaded && <>
              <GridBackground width={width} height={height} gridSize={gridSize} />
            </>}

            {fileUploaded &&
              <>


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

                        {hideCircle &&
                          Array.from({ length: totalLines }).map((_, index) => {
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
                        {/* {intersectionsState.map((intersection, i) => (
                      <g key={i}>
                        <circle cx={intersection.point.x} cy={intersection.point.y} r="3" fill="red" />
                        <text x={intersection.point.x + 5} y={intersection.point.y - 5} fontSize="10" fill="black" style={{
                          userSelect: 'none', // Prevent text selection
                          cursor: 'default' // Optional: Make the cursor non-interactive
                        }}>
                          {intersection.label}
                        </text>
                      </g>
                    ))} */}


                        {showDevta ? <>

                          {intersectionsState.map((intersection, i) => {
                            // Calculate the delta (difference) for x and y coordinates
                            const dx = (centroid.x - intersection.point.x) / 3;
                            const dy = (centroid.y - intersection.point.y) / 3;

                            // Calculate the first intermediate point (P1)
                            const point1 = { x: intersection.point.x + dx, y: intersection.point.y + dy };
                            intermediatePoints1.push(point1); // Add P1 to the array

                            // Calculate the second intermediate point (P2)
                            const point2 = { x: intersection.point.x + 2 * dx, y: intersection.point.y + 2 * dy };
                            intermediatePoints2.push(point2); // Add P2 to the array

                            return (
                              <g key={i}>
                                {/* Draw the intersection point */}
                                {hideCircle && <> 
                                <circle cx={intersection.point.x} cy={intersection.point.y} r="3" fill="red" />
                                <text
                                  x={intersection.point.x + 5}
                                  y={intersection.point.y - 5}
                                  fontSize="10"
                                  fill="black"
                                  style={{
                                    userSelect: 'none', // Prevent text selection
                                    cursor: 'default', // Optional: Make the cursor non-interactive
                                  }}
                                >
                                  {intersection.label}
                                </text>
                                </>}

                                {/* Draw the first intermediate point (P1) */}
                                <circle cx={point1.x} cy={point1.y} r="3" fill="blue" />
                                {/* <text
        x={point1.x + 5}
        y={point1.y - 5}
        fontSize="10"
        fill="black"
        style={{ userSelect: 'none', cursor: 'default' }}
      >
        P1-{i}
      </text> */}

                                {/* Draw the second intermediate point (P2) */}
                                <circle cx={point2.x} cy={point2.y} r="3" fill="blue" />
                                {/* <text
        x={point2.x + 5}
        y={point2.y - 5}
        fontSize="10"
        fill="black"
        style={{ userSelect: 'none', cursor: 'default' }}
      >
        P2-{i}
      </text> */}
                              </g>
                            );
                          })}

                          {intermediatePoints1.length > 1 && (
                            <polyline
                              points={intermediatePoints1.map((p) => `${p.x},${p.y}`).join(" ") + ` ${intermediatePoints1[0].x},${intermediatePoints1[0].y}`} // Connect back to the start point
                              fill="none"
                              stroke="purple"
                              strokeWidth="2"
                            />
                          )}

                          {intermediatePoints2.length > 1 && (
                            <polyline
                              points={intermediatePoints2.map((p) => `${p.x},${p.y}`).join(" ") + ` ${intermediatePoints2[0].x},${intermediatePoints2[0].y}`}
                              fill="none"
                              stroke="orange" // Different color for distinction
                              strokeWidth="2"
                            />
                          )}
                        </> : <>
                        {hideCircle && <>
                          {intersectionsState.map((intersection, i) => (
                            <g key={i}>
                              <circle cx={intersection.point.x} cy={intersection.point.y} r="3" fill="red" />
                              <text x={intersection.point.x + 5} y={intersection.point.y - 5} fontSize="10" fill="black" style={{
                                userSelect: 'none', // Prevent text selection
                                cursor: 'default' // Optional: Make the cursor non-interactive
                              }}>
                                {intersection.label}
                              </text>
                            </g>
                          ))}
                        </>}
                        </>}
                      </>
                    )}
                    {hideMarmaLines && (
                      <>
                        {lines.map((line, index) => {
                          const [startPoint, endPoint] = line;
                          return (
                            <g key={`marma-line-${index}`}>
                              {drawLines(startPoint, endPoint, "purple", 1)}
                            </g>
                          );
                        })}
                        {linesLeft.map((line, index) => {
                          const [startPoint, endPoint] = line;
                          return (
                            <g key={`marma-line-${index}`}>
                              {drawLines(startPoint, endPoint, "orange", 1)}
                            </g>
                          );
                        })}

                        {/* Direction fixed lines */}
                        <g key="fixed-line-n8-w2">{drawLines("N8", "W2", "orange", 1)}</g>
                        <g key="fixed-line-e1-w1">{drawLines("E1", "W1", "orange", 1)}</g>
                        <g key="fixed-line-e2-s8">{drawLines("E2", "S8", "orange", 1)}</g>
                        <g key="fixed-line-w8-s2">{drawLines("W8", "S2", "orange", 1)}</g>
                        <g key="fixed-line-n1-s1">{drawLines("N1", "S1", "orange", 1)}</g>
                        <g key="fixed-line-n2-e8">{drawLines("N2", "E8", "orange", 1)}</g>
                      </>
                    )}
                    {hideMarmapoints && <>
                      {intersectionPoints.map((point, idx) => (
                        <circle
                          key={idx}
                          cx={point.x}
                          cy={point.y}
                          r={4}
                          fill="green"
                          stroke="black"
                          onMouseEnter={(e) => handleMouseEnter(e, point)}
                          onMouseLeave={handleMouseLeave}
                        />
                      ))}
                      {leftIntersectionPoints.map((point, idx) => (
                        <circle
                          key={idx}
                          cx={point.x}
                          cy={point.y}
                          r={4}
                          fill="blue"
                          stroke="black"
                          onMouseEnter={(e) => handleMouseEnter(e, point)}
                          onMouseLeave={handleMouseLeave}
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
                          onMouseEnter={(e) => handleMouseEnter(e, point)}
                          onMouseLeave={handleMouseLeave}
                        />
                      ))}
                    </>}
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
              </>
            }

          </svg>

          {tooltip.visible && (
            <div
              style={{
                position: 'absolute',
                left: tooltip.x + 20,
                top: tooltip.y - 30,
                backgroundColor: 'white',
                border: '1px solid black',
                padding: '5px',
                borderRadius: '5px',
                pointerEvents: 'none',
                fontSize: '12px',
              }}
            >
              x: {tooltip.x}, y: {tooltip.y}
            </div>
          )}

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