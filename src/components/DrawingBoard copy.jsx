import React, { useState, useRef, useEffect } from 'react';
import { calculateCentroid, pointToLineDistance } from '../utils/geometryUtils';
import { DEFAULT_LINE_SETS } from '../constants/directions';
import GridBackground from './GridBackground';
import LineControls from './LineControls';
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
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
  // circle visible state
  const [hideCircleIntersaction, setHideCircleIntersaction] = useState(false);
  // Show Devta
  const [showDevta, setShowDevta] = useState(false);
  const [showDevtaIntersaction, setShowDevtaIntersaction] = useState(false);
  const [disableDraw, setDisableDraw] = useState(false);
  const [lockCentroid, setLockCentroid] = useState(false);

  const svgRef = useRef(null);
  const printRef = useRef(null);
  const selectedPointRef = useRef(null);
  const movingCentroidRef = useRef(false);
  useEffect(() => {
    if (snapToCentroid) {
      if(!lockCentroid){
        setCentroid(calculateCentroid(points));
      }
    }
  }, [points, snapToCentroid]);

  useEffect(() => {
    if(!lockCentroid){
      setCentroid(calculateCentroid(points));
    }
  }, []);


  // const downloadPDF = () => {
  //   html2canvas(printRef.current).then((canvas) => {
  //     const imgData = canvas.toDataURL('image/png');
  //     const pdf = new jsPDF();
  //     const imgWidth = 190; // Adjust the width according to your needs
  //     const pageHeight = pdf.internal.pageSize.height;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //     let heightLeft = imgHeight;

  //     let position = 0;

  //     pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  //     heightLeft -= pageHeight;

  //     while (heightLeft >= 0) {
  //       position = heightLeft - imgHeight;
  //       pdf.addPage();
  //       pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  //       heightLeft -= pageHeight;
  //     }

  //     pdf.save('download.pdf');
  //   });
  // };

  // const downloadPDF = () => {
  //   const scale = 5; // Adjust this value as needed for quality

  //   // Set A4 size in points
  //   const a4Width = 595.28; // A4 width in points
  //   const a4Height = 841.89; // A4 height in points

  //   html2canvas(printRef.current, { scale }).then((canvas) => {
  //     const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG for better compression
  //     const pdf = new jsPDF('p', 'pt', 'a4'); // Create a PDF document with A4 size

  //     // Calculate dimensions for the PDF
  //     const imgWidth = a4Width; // Use full A4 width
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

  //     const pageHeight = pdf.internal.pageSize.height;
  //     let heightLeft = imgHeight;

  //     let position = 0;

  //     // Add the first page with the image
  //     pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  //     heightLeft -= pageHeight;

  //     // Add additional pages if the image height exceeds one page
  //     while (heightLeft >= 0) {
  //       position = heightLeft - imgHeight;
  //       pdf.addPage();
  //       pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  //       heightLeft -= pageHeight;
  //     }

  //     pdf.save('download.pdf');
  //   });
  // };

  const downloadPDF = () => {
    const scale = 8; // Adjust this value as needed for quality

    // Set A4 size in points
    const a4Width = 595.28; // A4 width in points
    const a4Height = 841.89; // A4 height in points

    html2canvas(printRef.current, { scale }).then((canvas) => {
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG for better compression
      const pdf = new jsPDF('p', 'pt', 'a4'); // Create a PDF document with A4 size

      // Calculate dimensions for the PDF
      const imgWidth = a4Width; // 60% of A4 width for the image
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

      const formX = imgWidth; // Starting x position for form (right side)

      // Add the image to the left side
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      // Save the PDF
      pdf.save('download.pdf');
    });
  };


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

  const readFileData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = (err) => {
        reject(err);
      };
      reader.readAsDataURL(file);
    });
  };

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
        // const data = await readFileData(uploadedFile);
        const images = [];
        const data = await readFileData(uploadedFile);
        // console.log("images : ", images)

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
        if(!lockCentroid){
          setCentroid({ x: clampedX, y: clampedY });
        }
      }
    } else if (selectedPointRef.current !== null) {
      // Move a specific point
      if (!disableDraw) {
        const newPoints = [...points];
        newPoints[selectedPointRef.current] = position;
        setPoints(newPoints);
        // Recalculate centroid after point modification
        if(!lockCentroid){
          setCentroid(calculateCentroid(newPoints));
        }
      }
    }
  };

  const handleMouseUp = () => {
    movingCentroidRef.current = false;
    selectedPointRef.current = null;
  };

  const handleDoubleClick = (e) => {
    if (!disableDraw) {
      if (drawingMode !== 'drawing') return;

      const position = getMousePosition(e);
      const clickedPointIndex = findNearestPoint(position.x, position.y);

      if (clickedPointIndex !== -1) {
        if (points.length > 3) {
          const newPoints = points.filter((_, i) => i !== clickedPointIndex);
          setPoints(newPoints);
          if(!lockCentroid){
            setCentroid(calculateCentroid(newPoints));
          }
        }
      } else {
        const closestLineIndex = findClosestLine(position.x, position.y);
        if (closestLineIndex !== -1) {
          const newPoints = [...points];
          newPoints.splice(closestLineIndex + 1, 0, position);
          setPoints(newPoints);
          if(!lockCentroid){
            setCentroid(calculateCentroid(newPoints));
          }
        }
      }
    }
  };

  const handleLineSetUpdate = (setIndex, updates) => {
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
  const intermediatePoints1Test = []; // Array to store the first intermediate points (P1)
  const intermediatePoints2 = []; // Array to store the second intermediate points (P2)
  const intermediatePoints2Test = []; // Array to store the second intermediate points (P2)
  const [intersactMidIntermediatePoints, setIntersactMidIntermediatePoints] = useState([]); // Array to store the second intermediate points (P2)

  const calculateMidpoint = (pointA, pointB) => {
    return {
      x: (pointA.x + pointB.x) / 2,
      y: (pointA.y + pointB.y) / 2,
    };
  };
  const labelsToExtract = ["I2", "I3", "I4", "I5", "I6", "I10", "I11", "I12", "I13", "I14", "I18", "I19", "I20", "I21", "I22", "I26", "I27", "I28", "I29", "I30"];
  const labelsToExtract1 = ["X2", "X3", "X4", "X5", "X6", "X10", "X11", "X12", "X13", "X14", "X18", "X19", "X20", "X21", "X22", "X26", "X27", "X28", "X29", "X30"];
  useEffect(() => {

    // Filtered data
    const filteredData = intermediatePoints1Test.filter((item) =>
      labelsToExtract.includes(item.label)
    );
    // console.log("filteredData : ",filteredData)
    const filteredData1 = intermediatePoints2Test.filter((item) =>
      labelsToExtract1.includes(item.label)
    );
    // console.log("filteredData1 : ",filteredData1)
    const midpoints = filteredData.map((item1, index) => {
      const item2 = filteredData1[index];
      const midpoint = calculateMidpoint(item1.point, item2.point);
      return {
        label: `A${index + 1}`,
        midpoint,
      };
    });
    setIntersactMidIntermediatePoints(midpoints)
    // intersactMidIntermediatePoints.push(midpoints)
    // console.log(midpoints);
  }, [showDevta, points, intersectionPoints])

  const drawLinesForDevta = (label1, label2, stroke, strokeWidth) => {
    const point1filteredData = intersactMidIntermediatePoints.filter((item) =>
      label1 == item.label
    );
    const point2filteredData = intersactMidIntermediatePoints.filter((item) =>
      label2 == item.label
    );
    // console.log('point1filteredData : ', point1filteredData[0]?.midpoint)
    // console.log('point2filteredData : ', point2filteredData[0]?.midpoint)
    const point1 = point1filteredData[0]?.midpoint;
    const point2 = point2filteredData[0]?.midpoint;
    // console.log('point1 : ', point1)
    // console.log('point2 : ', point2)

    if (!point1 || !point2) return null;

    return (
      <line
        // key={index}
        x1={point1.x}
        y1={point1.y}
        x2={point2.x}
        y2={point2.y}
        //  stroke="blue"
        //   strokeWidth="2"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }


  const [zoom, setZoom] = useState(1); // Initial zoom level
  const [rotation, setRotation] = useState(0); // Initial rotation angle
  const [translate, setTranslate] = useState({ x: 0, y: 0 }); // Initial pan offsets

  // Zoom in
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.1, 5)); // Limit max zoom to 5
  // Zoom out
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.1, -51)); // Limit min zoom to 1

  // Reset Transformations
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setTranslate({ x: 0, y: 0 });
  };

  const handleRotationChange = (e) => {
    const angle = parseFloat(e.target.value);
    setRotation(angle); // Update the rotation state immediately for visual feedback
  };

  const drawDevtaLineData = (point1, point2) => {
    return (
      <line
        x1={point1?.x}
        y1={point1?.y}
        x2={point2?.x}
        y2={point2?.y}
        //  stroke="blue"
        //   strokeWidth="2"
        stroke={"red"}
        strokeWidth={2}
      />
    );
  }

  const devta = [
    "Brahma",
    "Bhudhar",
    "Aryama",
    "Viviswan",
    "Mitra",
    "Aapaha",
    "Aapahavatsa",
    "Savita",
    "Savitra",
    "Indra",
    "Jaya",
    "Rudra",
    "Rajyakshma",
    "Shikhi",
    "Parjanya",
    "Jayant",
    "Mahendra",
    "Surya",
    "Satya",
    "Bhrisha",
    "Antriksh",
    "Anil",
    "Pusha",
    "Vitasta",
    "GrihaSpatya",
    "Yama",
    "Gandharva",
    "Bhringraj",
    "Mrigah",
    "Pitra",
    "Dauwarik",
    "Sugreev",
    "Pushpdant",
    "Varun",
    "Asur",
    "Shosha",
    "Papyakshma",
    "Roga",
    "Ahir",
    "Mukhya",
    "Bhallat",
    "Soma",
    "Bhujag",
    "Aditi",
    "Diti"]

  const [drawDevtaObject, setDrawDevtaObject] = useState([]);
  const [areas, setAreas] = useState([]);
  const convertPointsToCoordinates = (area) => {
    return [
      { x: area.point1.x, y: area.point1.y },
      { x: area.point2.x, y: area.point2.y },
      { x: area.point3.x, y: area.point3.y },
      { x: area.point4.x, y: area.point4.y },
    ];
  };
  const convertPointsToCoordinates1 = (area) => {
    return [
      { x: area.point1.x, y: area.point1.y },
      { x: area.point2.x, y: area.point2.y },
      { x: area.point3.x, y: area.point3.y },
      { x: area.point4.x, y: area.point4.y },
      { x: area.point5.x, y: area.point5.y },
      { x: area.point6.x, y: area.point6.y },
      { x: area.point7.x, y: area.point7.y },
      { x: area.point8.x, y: area.point8.y },
    ];
  };

  useEffect(() => {
    const filteredData = (label, object) => {
      return object.filter((item) => label === item.label);
    };

    const intermediatePoints = [
      { pointLookup: pointLookup["W4"], label: "I15" },
      { pointLookup: pointLookup["W5"], label: "I16" },
      { pointLookup: pointLookup["W6"], label: "I17" },
      { pointLookup: pointLookup["W7"], label: "I18", intersectLabel: "A11" },
      { pointLookup: pointLookup["W8"], label: "I19" },
      { pointLookup: pointLookup["N1"], label: "I20", intersectLabel: "A13", extraIntersect: "X20" },
      { pointLookup: pointLookup["N2"], label: "I21" },
      { pointLookup: pointLookup["N3"], label: "I22", intersectLabel: "A15" },
      // Another side
      { pointLookup: pointLookup["N4"], label: "I23" },
      { pointLookup: pointLookup["N5"], label: "I24" },
      { pointLookup: pointLookup["N6"], label: "I25" },
      { pointLookup: pointLookup["N7"], label: "I26", intersectLabel: "A16" },
      { pointLookup: pointLookup["N8"], label: "I27" },
      { pointLookup: pointLookup["E1"], label: "I28", intersectLabel: "A18", extraIntersect: "X28" },
      { pointLookup: pointLookup["E2"], label: "I29" },
      { pointLookup: pointLookup["E3"], label: "I30", intersectLabel: "A20" },
      // Another side
      { pointLookup: pointLookup["E4"], label: "I31" },
      { pointLookup: pointLookup["E5"], label: "I0" },
      { pointLookup: pointLookup["E6"], label: "I1" },
      { pointLookup: pointLookup["E7"], label: "I2", intersectLabel: "A1" },
      { pointLookup: pointLookup["E8"], label: "I3" },
      { pointLookup: pointLookup["S1"], label: "I4", intersectLabel: "A3", extraIntersect: "X4" },
      { pointLookup: pointLookup["S2"], label: "I5" },
      { pointLookup: pointLookup["S3"], label: "I6", intersectLabel: "A5" },
      // Another side
      { pointLookup: pointLookup["S4"], label: "I7" },
      { pointLookup: pointLookup["S5"], label: "I8" },
      { pointLookup: pointLookup["S6"], label: "I9" },
      { pointLookup: pointLookup["S7"], label: "I10", intersectLabel: "A6" },
      { pointLookup: pointLookup["S8"], label: "I11" },
      { pointLookup: pointLookup["W1"], label: "I12", intersectLabel: "A8", extraIntersect: "X12" },
      { pointLookup: pointLookup["W2"], label: "I13" },
      { pointLookup: pointLookup["W3"], label: "I14", intersectLabel: "A10" },
    ];

    const newDrawDevtaObject = intermediatePoints.reduce((acc, { pointLookup, label, intersectLabel, extraIntersect }) => {
      const filteredPoint = filteredData(label, intermediatePoints1Test);
      const intersectPoint = intersectLabel ? filteredData(intersectLabel, intersactMidIntermediatePoints) : null;
      const extraFilteredPoint = extraIntersect ? filteredData(extraIntersect, intermediatePoints2Test) : null;

      const obj = {
        point1: pointLookup,
        point2: filteredPoint[0]?.point || null,
        midpoint: intersectPoint ? intersectPoint[0]?.midpoint || null : null,
        extrapoint: extraFilteredPoint ? extraFilteredPoint[0]?.point || null : null,
      };

      // Check and push the main object if point1 is not null
      if (obj.point1 !== null) {
        // Push the main object
        if (obj.point2 !== null || obj.midpoint !== null) {
          acc.push({
            point1: obj.point1,
            point2: obj.midpoint || obj.point2,
          });
        }

        // If extraIntersect is defined, push the extrapoint object as well
        if (extraIntersect && obj.extrapoint !== null) {
          acc.push({
            point1: obj.extrapoint,
            point2: obj.midpoint || obj.point2,
          });
        }
      }

      return acc;
    }, []);

    const intermediatePointsTest = [
      { pointLookup: pointLookup["E1"], label: "I28", pointLookup1: pointLookup["E2"], label1: "I29" },
      { pointLookup: pointLookup["E2"], label: "I29", pointLookup1: pointLookup["E3"], label1: "I30" },
      { pointLookup: pointLookup["E3"], label: "I30", pointLookup1: pointLookup["E4"], label1: "I31" },
      { pointLookup: pointLookup["E4"], label: "I31", pointLookup1: pointLookup["E5"], label1: "I0" },
      { pointLookup: pointLookup["E5"], label: "I0", pointLookup1: pointLookup["E6"], label1: "I1" },
      { pointLookup: pointLookup["E6"], label: "I1", pointLookup1: pointLookup["E7"], label1: "I2" },
      { pointLookup: pointLookup["E7"], label: "I2", pointLookup1: pointLookup["E8"], label1: "I3" },
      { pointLookup: pointLookup["E8"], label: "I3", pointLookup1: pointLookup["S1"], label1: "I4" },
      { pointLookup: pointLookup["S1"], label: "I4", pointLookup1: pointLookup["S2"], label1: "I5" },
      { pointLookup: pointLookup["S2"], label: "I5", pointLookup1: pointLookup["S3"], label1: "I6" },
      { pointLookup: pointLookup["S3"], label: "I6", pointLookup1: pointLookup["S4"], label1: "I7" },
      { pointLookup: pointLookup["S4"], label: "I7", pointLookup1: pointLookup["S5"], label1: "I8" },
      { pointLookup: pointLookup["S5"], label: "I8", pointLookup1: pointLookup["S6"], label1: "I9" },
      { pointLookup: pointLookup["S6"], label: "I9", pointLookup1: pointLookup["S7"], label1: "I10" },
      { pointLookup: pointLookup["S7"], label: "I10", pointLookup1: pointLookup["S8"], label1: "I11" },
      { pointLookup: pointLookup["S8"], label: "I11", pointLookup1: pointLookup["W1"], label1: "I12" },
      { pointLookup: pointLookup["W1"], label: "I12", pointLookup1: pointLookup["W2"], label1: "I13" },
      { pointLookup: pointLookup["W2"], label: "I13", pointLookup1: pointLookup["W3"], label1: "I14" },
      { pointLookup: pointLookup["W3"], label: "I14", pointLookup1: pointLookup["W4"], label1: "I15" },
      { pointLookup: pointLookup["W4"], label: "I15", pointLookup1: pointLookup["W5"], label1: "I16" },
      { pointLookup: pointLookup["W5"], label: "I16", pointLookup1: pointLookup["W6"], label1: "I17" },
      { pointLookup: pointLookup["W6"], label: "I17", pointLookup1: pointLookup["W7"], label1: "I18" },
      { pointLookup: pointLookup["W7"], label: "I18", pointLookup1: pointLookup["W8"], label1: "I19" },
      { pointLookup: pointLookup["W8"], label: "I19", pointLookup1: pointLookup["N1"], label1: "I20" },
      { pointLookup: pointLookup["N1"], label: "I20", pointLookup1: pointLookup["N2"], label1: "I21" },
      { pointLookup: pointLookup["N2"], label: "I21", pointLookup1: pointLookup["N3"], label1: "I22" },
      { pointLookup: pointLookup["N3"], label: "I22", pointLookup1: pointLookup["N4"], label1: "I23" },
      { pointLookup: pointLookup["N4"], label: "I23", pointLookup1: pointLookup["N5"], label1: "I24" },
      { pointLookup: pointLookup["N5"], label: "I24", pointLookup1: pointLookup["N6"], label1: "I25" },
      { pointLookup: pointLookup["N6"], label: "I25", pointLookup1: pointLookup["N7"], label1: "I26" },
      { pointLookup: pointLookup["N7"], label: "I26", pointLookup1: pointLookup["N8"], label1: "I27" },
      { pointLookup: pointLookup["N8"], label: "I27", pointLookup1: pointLookup["E1"], label1: "I28" },
    ];

    const reversedIntermediatePointsTest = intermediatePointsTest.reverse();

    const newDrawDevtaObjectTest = reversedIntermediatePointsTest.reduce((acc, { pointLookup, label, pointLookup1, label1 }) => {
      const filteredPoint = filteredData(label, intermediatePoints1Test);
      const filteredPoint2 = filteredData(label1, intermediatePoints1Test);

      const newObject = {
        point1: pointLookup,
        point2: pointLookup1,
        point3: filteredPoint2[0]?.point || null,
        point4: filteredPoint[0]?.point || null,
      };

      // Check if all points are not null
      if (newObject.point1 && newObject.point2 && newObject.point3 && newObject.point4) {
        acc.push(newObject);
      }

      return acc;
    }, []);

    const areas1 = newDrawDevtaObjectTest.map((area, index) => ({
      id: index,
      coordinates: convertPointsToCoordinates(area),
      text: `Area ${index + 1}`,
    }));

    const intermediatePointsTest1 = [
      { points: { p1: "I20", p2: "A13", p3: "I22", p4: "A15" } },
      { points: { p1: "I18", p2: "A11", p3: "I20", p4: "A13" } },
      { points: { p1: "I12", p2: "A8", p3: "I14", p4: "A10" } },
      { points: { p1: "I10", p2: "A6", p3: "I12", p4: "A8" } },
      { points: { p1: "I4", p2: "A3", p3: "I6", p4: "A5" } },
      { points: { p1: "I2", p2: "A1", p3: "I4", p4: "A3" } },
      { points: { p1: "I28", p2: "A18", p3: "I30", p4: "A20" } },
      { points: { p1: "I26", p2: "A16", p3: "I28", p4: "A18" } },
    ];

    const newDrawDevtaObjectTest1 = intermediatePointsTest1.reduce((acc, { points: { p1, p2, p3, p4 } }) => {
      const filteredPoint1 = filteredData(p1, intermediatePoints1Test);
      const filteredPoint2 = filteredData(p2, intersactMidIntermediatePoints);
      const filteredPoint3 = filteredData(p3, intermediatePoints1Test);
      const filteredPoint4 = filteredData(p4, intersactMidIntermediatePoints);

      const newObject = {
        point1: filteredPoint3[0]?.point || null,
        point2: filteredPoint1[0]?.point || null,
        point3: filteredPoint2[0]?.midpoint || null,
        point4: filteredPoint4[0]?.midpoint || null,
      };

      // Check if all points are not null
      if (newObject.point1 && newObject.point2 && newObject.point3 && newObject.point4) {
        acc.push(newObject);
      }

      return acc;
    }, []);

    const intermediatePointsTest2 = [
      { points: { p1: "I14", p2: "A10", p3: "A8", p4: "X12", p5: "X20", p6: "A13", p7: "A11", p8: "I20" } },
      { points: { p1: "I6", p2: "A5", p3: "A3", p4: "X4", p5: "X12", p6: "A8", p7: "A6", p8: "I10" } },
      { points: { p1: "I30", p2: "A20", p3: "A18", p4: "X28", p5: "X4", p6: "A3", p7: "A1", p8: "I2" } },
      { points: { p1: "I22", p2: "A15", p3: "A13", p4: "X20", p5: "X28", p6: "A18", p7: "A16", p8: "I26" } },
    ];

    const newDrawDevtaObjectTest2 = intermediatePointsTest2.reduce((acc, { points: { p1, p2, p3, p4, p5, p6, p7, p8 } }) => {
      const filteredPoint1 = filteredData(p1, intermediatePoints1Test);
      const filteredPoint2 = filteredData(p2, intersactMidIntermediatePoints);
      const filteredPoint3 = filteredData(p3, intersactMidIntermediatePoints);
      const filteredPoint4 = filteredData(p4, intermediatePoints2Test);
      const filteredPoint5 = filteredData(p5, intermediatePoints2Test);
      const filteredPoint6 = filteredData(p6, intersactMidIntermediatePoints);
      const filteredPoint7 = filteredData(p7, intersactMidIntermediatePoints);
      const filteredPoint8 = filteredData(p8, intermediatePoints1Test);

      const newObject = {
        point1: filteredPoint1[0]?.point || null,
        point2: filteredPoint2[0]?.midpoint || null,
        point3: filteredPoint3[0]?.midpoint || null,
        point4: filteredPoint4[0]?.point || null,
        point5: filteredPoint5[0]?.point || null,
        point6: filteredPoint6[0]?.midpoint || null,
        point7: filteredPoint7[0]?.midpoint || null,
        point8: filteredPoint8[0]?.point || null,
      };

      // Check if all points are not null
      if (newObject.point1 && newObject.point2 && newObject.point3 && newObject.point4
        && newObject.point5
        && newObject.point6
        && newObject.point7
        && newObject.point8
      ) {
        acc.push(newObject);
      }

      return acc;
    }, []);

    const intermediatePointsTest3 = [
      { points: { p1: "X28", p2: "X4", p3: "X12", p4: "X20" } }
    ];

    const newDrawDevtaObjectTest3 = intermediatePointsTest3.reduce((acc, { points: { p1, p2, p3, p4 } }) => {
      const filteredPoint1 = filteredData(p1, intermediatePoints2Test);
      const filteredPoint2 = filteredData(p2, intermediatePoints2Test);
      const filteredPoint3 = filteredData(p3, intermediatePoints2Test);
      const filteredPoint4 = filteredData(p4, intermediatePoints2Test);

      const newObject = {
        point1: filteredPoint1[0]?.point || null,
        point2: filteredPoint2[0]?.point || null,
        point3: filteredPoint3[0]?.point || null,
        point4: filteredPoint4[0]?.point || null
      };

      // Check if all points are not null
      if (newObject.point1 && newObject.point2 && newObject.point3 && newObject.point4) {
        acc.push(newObject);
      }

      return acc;
    }, []);

    const areas2 = newDrawDevtaObjectTest1.map((area, index) => ({
      id: index + 33,
      coordinates: convertPointsToCoordinates(area),
      text: `Area ${index + 32 + 1}`,
    }));

    const areas3 = newDrawDevtaObjectTest2.map((area, index) => ({
      id: index + 40 + 1,
      coordinates: convertPointsToCoordinates1(area),
      text: `Area ${index + 40 + 1}`,
    }));

    const areas4 = newDrawDevtaObjectTest3.map((area, index) => ({
      id: index + 45,
      coordinates: convertPointsToCoordinates(area),
      text: `Area ${index + 45}`,
    }));

    setAreas([...areas1, ...areas2, ...areas3, ...areas4].reverse());
    // console.log("Area : ", areas)
    setDrawDevtaObject(newDrawDevtaObject);
  }, [intersactMidIntermediatePoints]);


  const HoverArea = ({ coordinates, hoverText }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Calculate the center position for the text and rectangle
    const centerX = (coordinates[0].x + coordinates[2].x) / 2 + 15;
    const centerY = (coordinates[0].y + coordinates[2].y) / 2 + 15;

    // Measure text width and height (or use a fixed size if consistent)
    const textWidth = hoverText.length * 8; // Estimate based on character count
    const textHeight = 20; // Adjust based on your font size and padding

    return (
      <>
        <polygon
          points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")}
          fill={"transparent"}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />

        {isHovered && (
          <>
            {/* Background Rectangle */}
            <rect
              x={centerX - textWidth / 2} // Center the rectangle
              y={centerY - textHeight / 2} // Center the rectangle
              width={textWidth} // Set the width according to your text length
              height={textHeight} // Set the height for the rectangle
              fill="white" // Background color
              rx="4" // Rounded corners
              ry="4" // Rounded corners
              style={{ cursor: 'none' }}
            />
            {/* Text with purple color and semi-bold */}
            <text
              x={centerX}
              y={centerY}
              fill="purple"
              fontSize="14"
              fontWeight="600" // Semi-bold weight
              alignmentBaseline="central"
              textAnchor="middle" // Center the text
            >
              {hoverText}
            </text>
          </>
        )}
      </>
    );
  };

  const handleSave = () => {
    console.log("centroid : ", centroid)
    console.log("points : ", points)
    console.log("image rotation : ", rotation)
    console.log("image zoom in : ", zoom)
  }

  // useEffect(()=>{
  // const midpoints = filteredData.map((item1, index) => {
  //   const item2 = filteredData1[index];
  //   const midpoint = calculateMidpoint(item1.point, item2.point);
  //   return {
  //     label: `A${index + 1}`,
  //     midpoint,
  //   };
  // });
  // },[intersectionsState,centroid])

  // const plotText = (label1,label2,label)=>{
  //   const point1  = pointLookup[label1]
  //   const point2  = pointLookup[label2]
  //   const midpoints = calculateMidpoint(point1, point2)
  //   console.log("midpoints : ",midpoints)
  //   console.log("midpoints.x - 70 : ",midpoints.x - 70 > 60)
  //   return (
  //     <g>
  //     {hideCircleIntersaction && <circle cx={midpoints.x} cy={midpoints.y} r="3" fill="black" />}
  //     <text
  //       // x={90}
  //       // y={40}
  //       x={midpoints.x - 70 > 60 ? midpoints.x - 70 : 90  }
  //       y={midpoints.y - 90 > 60 ? midpoints.y - 90 :  40 }
  //       fontSize="16"
  //       fontWeight="500"
  //       fill="red"
  //       textAnchor='middle'
  //       // textAnchor={finalLabelX > adjustedX ? "start" : "end"} // Adjust text anchor based on position
  //       alignmentBaseline="middle"
  //       style={{
  //         userSelect: 'none', // Prevent text selection
  //         cursor: 'default', // Optional: Make the cursor non-interactive
  //       }}
  //     >
  //       {label}
  //     </text>
  //   </g>
  //   )
  // }

  const plotText = (label1, label2, label) => {

    // const cx = centroid.x; 
    // const cy = centroid.y; 
    // const distance = 300; 
    // const angleBetweenTexts = 11.25; 
    // const totalParts = 32; 
    // const texts = [];

    // for (let i = 0; i < totalParts; i++) {
    //     const angle = angleBetweenTexts * i  + 11 +220;
    //     const angleRadians = angle * (Math.PI / 180);

    //     const textX = cx + distance * Math.cos(angleRadians);
    //     const textY = cy + distance * Math.sin(angleRadians);

    //     let label;
    //     if (i >= 0 && i <= 7) {
    //         label = `N${i + 1}`; // N1 to N8
    //     } else if (i >= 8 && i <= 15) {
    //         label = `E${i - 7}`; // E1 to E8
    //     } else if (i >= 16 && i <= 23) {
    //         label = `S${i - 15}`; // S1 to S8
    //     } else if (i >= 24 && i <= 31) {
    //         label = `W${i - 23}`; // W1 to W8
    //     }

    //     texts.push(
    //         <text key={i} x={textX} y={textY} fontSize="16" fill="blue" style={{
    //           userSelect: 'none',
    //           cursor: 'default', 
    //         }}>
    //             {label}
    //         </text>
    //     );
    // }
    // return texts



    // // working
    // // Effective dimensions ensure the minimum size
    // const effectiveWidth = 650;
    // const effectiveHeight = 600;
    // // const effectiveWidth = 650 < minWidth ? minWidth : 650;
    // // const effectiveHeight = 600 < minHeight ? minHeight : 500;

    // const cx = centroid.x;
    // const cy = centroid.y;

    // // Calculate dynamic distance based on effective dimensions
    // const maxDistanceX = Math.min(cx, effectiveWidth - cx);
    // const maxDistanceY = Math.min(cy, effectiveHeight - cy);
    // const distance = Math.min(maxDistanceX, maxDistanceY); // Subtract padding

    // const angleBetweenTexts = 11.25;
    // const totalParts = 32;
    // const texts = [];

    // for (let i = 0; i < totalParts; i++) {
    //   const angle = angleBetweenTexts * i + 11 + 220;
    //   const angleRadians = angle * (Math.PI / 180);

    //   const textX = cx + distance * Math.cos(angleRadians);
    //   const textY = cy + distance * Math.sin(angleRadians);

    //   let label;
    //   if (i >= 0 && i <= 7) {
    //     label = `N${i + 1}`; // N1 to N8
    //   } else if (i >= 8 && i <= 15) {
    //     label = `E${i - 7}`; // E1 to E8
    //   } else if (i >= 16 && i <= 23) {
    //     label = `S${i - 15}`; // S1 to S8
    //   } else if (i >= 24 && i <= 31) {
    //     label = `W${i - 23}`; // W1 to W8
    //   }

    //   texts.push(
    //     <text
    //       key={i}
    //       x={textX}
    //       y={textY}
    //       fontSize="20"
    //       fill="black"
    //       style={{
    //         userSelect: 'none',
    //         cursor: 'default',
    //       }}
    //     >
    //       {label}
    //     </text>
    //   );
    // }
    // return texts;

    // Effective dimensions ensure the minimum size
    const effectiveWidth = 650;
    const effectiveHeight = 600;

    // Get centroid coordinates
    const cx = centroid.x;
    const cy = centroid.y;

    // Define the side length of the square
    const sideLength = 500; // You can adjust this value to change the size of the square
    const halfSide = sideLength / 2; // Calculate half side length

    // Define text labels for each part (N, E, S, W)
    const labels = [];
    const totalParts = 32; // Total number of labels

    // Create labels for each direction
    for (let i = 0; i < totalParts; i++) {
      let label;

      // Determine the label based on the index
      if (i < 8) {
        label = `N${i + 1}`; // North labels (N1 to N8)
      } else if (i < 16) {
        label = `E${i - 7}`; // East labels (E1 to E8)
      } else if (i < 24) {
        label = `S${i - 15}`; // South labels (S1 to S8)
      } else {
        label = `W${i - 23}`; // West labels (W1 to W8)
      }

      labels.push(label);
    }

    // Calculate positions for each label in a square pattern
    const texts = labels.map((label, index) => {
      let textX, textY;

      // Determine position based on the index
      if (index < 8) {
        // North side (top)
        textX = cx - (halfSide - (sideLength / 8) * index) + 20; // Evenly spaced across the top
        textY = cy - halfSide; // Fixed y position
      } else if (index < 16) {
        // East side (right)
        textX = cx + halfSide; // Fixed x position
        textY = cy - (halfSide - (sideLength / 8) * (index - 8)) + 40; // Evenly spaced down the right
      } else if (index < 24) {
        // South side (bottom)
        textX = cx + (halfSide - (sideLength / 8) * (index - 16)) - 40; // Evenly spaced across the bottom
        textY = cy + halfSide + 20; // Fixed y position
      } else {
        // West side (left)
        textX = cx - halfSide - 20; // Fixed x position
        textY = cy + (halfSide - (sideLength / 8) * (index - 24)) - 20; // Evenly spaced up the left
      }

      // Return text element
      return (
        <text
          key={index}
          x={textX}
          y={textY}
          fontSize="20"
          fill="black"
          style={{
            userSelect: 'none',
            cursor: 'default',
          }}
        >
          {label}
        </text>
      );
    });

    // Return the array of text elements
    return texts;

  }




  return (
    <div className="flex flex-row p-4 bg-gray-100 rounded shadow-lg">
      <div className="flex flex-col w-1/4 p-6 bg-white rounded-lg shadow-lg space-y-6 h-[100vh] overflow-y-auto">
        {/* File Upload Section */}
        <div
          className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileUpload}
        >
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <Upload size={24} className="text-blue-600" />
            <span className="text-blue-600 font-medium">Upload File</span>
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileUpload}
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">Supported: .jpg, .jpeg, .png, .pdf</p>
        </div>

        {/* Image Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rotation}
              onChange={handleRotationChange}
              placeholder="Rotation (°)"
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleReset}
              className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition"
            >
              Reset
            </button>
          </div>

          <div className="flex justify-between gap-2">
            <button
              onClick={handleZoomIn}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition w-full"
            >
              Zoom In
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition w-full"
            >
              Zoom Out
            </button>
          </div>
        </div>

        {/* Checkbox Toggles */}
        <div className="space-y-3">
          {[
            { id: "hideCircle", label: "Show Chakra", checked: hideCircle, onChange: setHideCircle },
            { id: "hideCircleIntersaction", label: "Show Chakra Intersaction points", checked: hideCircleIntersaction, onChange: setHideCircleIntersaction },
            { id: "showDevta", label: "Show Devta", checked: showDevta, onChange: setShowDevta },
            { id: "showDevtaIntersaction", label: "Show Devta Intersaction points", checked: showDevtaIntersaction, onChange: setShowDevtaIntersaction },
            { id: "hideMarmaLines", label: "Show Marma Lines", checked: hideMarmaLines, onChange: setHideMarmaLines },
            { id: "hideMarmapoints", label: "Show Marma Points", checked: hideMarmapoints, onChange: setHideMarmapoints },
            { id: "disableDraw", label: "Done Drawing", checked: disableDraw, onChange: setDisableDraw },
            { id: "lockCentroid", label: "Lock Centroid", checked: lockCentroid, onChange: setLockCentroid },
          ].map(({ id, label, checked, onChange }) => (
            <div key={id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="cursor-pointer w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer">
                {label}
              </label>
            </div>
          ))}
        </div>

        {/* Line Controls (Conditionally Rendered) */}
        {hideCircle && fileUploaded && (
          <div className="space-y-4">
            {lineSets.map((lineSet, i) => (
              <LineControls
                key={i}
                lineSet={lineSet}
                setIndex={i}
                onUpdate={handleLineSetUpdate}
              />
            ))}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="snapToCentroid"
                checked={snapToCentroid}
                onChange={(e) => setSnapToCentroid(e.target.checked)}
                className="cursor-pointer w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="snapToCentroid" className="text-sm text-gray-700">
                Snap to Centroid
              </label>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Enter Degree:</span>
              <input
                type="number"
                value={inputDegree}
                onChange={handleInputChange}
                className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                aria-label="Degree input"
              />
            </label>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={downloadPDF}
          // onClick={exportToPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full"
        >
          Download SVG
        </button>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full"
        >
          Save
        </button>
      </div>

      {/* SVG */}
      <div className="flex-grow p-4" ref={printRef}>
        <div className="flex mb-1 ms-2.5">
          {Array.from({ length: 26 }, (_, i) => (
            <div key={i} className="text-sm ms-2.5 w-4" style={{
              userSelect: 'none', // Prevent text selection
              cursor: 'default' // Optional: Make the cursor non-interactive
            }}>{i + 1}</div>
          ))}
        </div>

        <div className="relative flex">
          <div className="flex flex-col">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, i) => (
              <div key={i} className="text-sm mb-1.5 w-4" style={{
                userSelect: 'none', // Prevent text selection
                cursor: 'default' // Optional: Make the cursor non-interactive
              }}>{letter}</div>
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
                  {/* <g className="file-layer"
                    transform={`translate(${translate.x}, ${translate.y}) rotate(${rotation}, ${width / 2}, ${height / 2}) scale(${zoom})`}
                  >

                    <image
                      href={previewUrl}
                      style={{ maxWidth: "100%", maxHeight: "400px" }}
                      width={width}
                      height={height}
                    />
                  </g> */}

                  <g
                    className="file-layer"
                    transform={`translate(${translate.x + (width - width * zoom) / 2}, ${translate.y + (height - height * zoom) / 2}) rotate(${rotation}, ${width / 2}, ${height / 2}) scale(${zoom})`}
                  >
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
                    {!disableDraw && (
                      points.map((point, i) => (
                        <circle
                          key={i}
                          cx={point.x}
                          cy={point.y}
                          r="5"
                          fill="red"
                          stroke="white"
                          strokeWidth="2"
                        />
                      ))
                    )}

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
                                {index % lineSets.length == 0 &&
                                  <line
                                    x1={centroid.x}
                                    y1={centroid.y}
                                    x2={endX}
                                    y2={endY}
                                    stroke={style.stroke}
                                    strokeWidth={style.strokeWidth}
                                    strokeDasharray={style.strokeDasharray}
                                  />
                                }
                              </g>
                            );
                          })
                        }

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
                            console.log("lookup : ",pointLookup["S1"])
                            // Calculate the first intermediate point (P1)
                            const point1 = { x: intersection.point.x + dx, y: intersection.point.y + dy };
                            intermediatePoints1.push(point1); // Add P1 to the array
                            intermediatePoints1Test.push({
                              point: point1,
                              label: `I${i}`,
                            });
                            // Calculate the second intermediate point (P2)
                            const point2 = { x: intersection.point.x + 2 * dx, y: intersection.point.y + 2 * dy };
                            intermediatePoints2.push(point2); // Add P2 to the array
                            intermediatePoints2Test.push({
                              point: point2,
                              label: `X${i}`,
                            });
                            return (
                              <g key={i}>
                                {/* Draw the intersection point */}
                                {hideCircle && <>
                                  {hideCircleIntersaction && <circle cx={intersection.point.x} cy={intersection.point.y} r="3" fill="red" />}
                                  {/* <circle cx={intersection.point.x} cy={intersection.point.y} r="3" fill="red" /> */}
                                  <text
                                    x={intersection.point.x + 5}
                                    y={intersection.point.y - 5}
                                    fontSize="10"
                                    fill="black"
                                    style={{
                                      userSelect: 'none',
                                      cursor: 'default',
                                    }}
                                  >
                                    {intersection.label}
                                  </text>
                                </>}
                            <circle cx={pointLookup["S1"].x} cy={pointLookup["S1"].y} r="3" fill="Black" />

                                {/* Draw the first intermediate point (P1) */}
                                {showDevtaIntersaction && <circle cx={point1.x} cy={point1.y} r="3" fill="blue" />}
                                {/* <text
                                  x={point1.x + 5}
                                  y={point1.y - 5}
                                  fontSize="10"
                                  fill="black"
                                  style={{ userSelect: 'none', cursor: 'default' }}
                                >
                                  I-{i}
                                </text> */}

                                {/* Draw the second intermediate point (P2) */}
                                {showDevtaIntersaction && <circle cx={point2.x} cy={point2.y} r="3" fill="blue" />}
                                {/* <text
                                  x={point2.x + 5}
                                  y={point2.y - 5}
                                  fontSize="10"
                                  fill="black"
                                  style={{ userSelect: 'none', cursor: 'default' }}
                                >
                                  X-{i}
                                </text> */}
                              </g>
                            );
                          })}

                          {/* uncomment this */}
                          {/* {intersactMidIntermediatePoints.map((item, i) => {
                            return (
                              // console.log("Items : ",item)
                              <>
                                {showDevtaIntersaction &&
                                  <circle
                                    key={i}
                                    cx={item.midpoint.x}
                                    cy={item.midpoint.y}
                                    r="5"
                                    fill="black"
                                    stroke="white"
                                    strokeWidth="2"
                                  />}
                                 <text
                                  x={item.midpoint.x + 5}
                                  y={item.midpoint.y - 5}
                                  fontSize="10"
                                  fill="black"
                                  style={{ userSelect: 'none', cursor: 'default' }}
                                >
                                  {item.label}
                                </text>
                              </>
                            )
                          })} */}
                          {/* uncomment this */}
                          {/* {drawDevtaObject && drawDevtaObject.map((item) => {
                            return (
                              drawDevtaLineData(item.point1, item.point2)
                            )
                          })} */}
                          {/* <polygon 
                                  points="450,230 450,294.44 486.67,279.25 486.67,193.33"
                                  fill="lightblue" 
                                  stroke="blue" 
                                  stroke-width="2" /> */}
                          {/* <polygon 
                                  points="450,230 550,230 550,330 450,330"
                                  fill="lightblue" 
                                  stroke="blue" 
                                  stroke-width="2" /> */}

                          {/* {drawDevtaLineData()} */}

                            {/* uncomment this */}
                          {/* {drawLinesForDevta("A1", "A2", "red", 2)}
                          {drawLinesForDevta("A2", "A3", "red", 2)}
                          {drawLinesForDevta("A3", "A4", "red", 2)}
                          {drawLinesForDevta("A4", "A5", "red", 2)}

                          {drawLinesForDevta("A6", "A7", "red", 2)}
                          {drawLinesForDevta("A7", "A8", "red", 2)}
                          {drawLinesForDevta("A8", "A9", "red", 2)}
                          {drawLinesForDevta("A9", "A10", "red", 2)}
                          {drawLinesForDevta("A11", "A12", "red", 2)}
                          {drawLinesForDevta("A12", "A13", "red", 2)}
                          {drawLinesForDevta("A13", "A14", "red", 2)}
                          {drawLinesForDevta("A14", "A15", "red", 2)}
                          {drawLinesForDevta("A16", "A17", "red", 2)}
                          {drawLinesForDevta("A17", "A18", "red", 2)}
                          {drawLinesForDevta("A18", "A19", "red", 2)}
                          {drawLinesForDevta("A19", "A20", "red", 2)} */}

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
                                {hideCircleIntersaction && <circle cx={intersection.point.x} cy={intersection.point.y} r="3" fill="red" />}
                                {/* <text
                                  x={intersection.point.x}
                                  y={intersection.point.y}
                                  fontSize="16"
                                  fontWeight="500"
                                  fill="black"
                                  textAnchor="middle"
                                  alignmentBaseline="middle"
                                  style={{
                                    userSelect: 'none', // Prevent text selection
                                    cursor: 'default' // Optional: Make the cursor non-interactive
                                  }}>
                                  {intersection.label}
                                </text> */}
                              </g>
                            ))}



                            {intersectionsState && plotText("N1", "N2", "N1")}
                            {/* {intersectionsState.map((intersection, i) => {
                              const { point, label } = intersection;
                              const halfSize = 676/2;
                              const margin = 26;
                              // Adjusted positions for the labels
                              const adjustedX = point.x; // Base offset for x
                              const adjustedY = point.y; // Base offset for y

                              // Additional adjustments for label positioning
                              const labelOffsetX = Math.cos(Math.atan2(adjustedY, adjustedX)) > 0 ? 10 : 30;
                              const labelOffsetY = Math.cos(Math.atan2(adjustedY, adjustedX)) > 0 ? 30 : 30;

                              const finalLabelX = adjustedX + labelOffsetX;
                              const finalLabelY = adjustedY + labelOffsetY;

                              const rightBoundary = centroid.x + halfSize - margin;
                              const leftBoundary = centroid.x - halfSize + margin;
                              const topBoundary = centroid.y - halfSize + margin;
                              const bottomBoundary = centroid.y + halfSize - margin;
                              return (
                                <g key={i}>
                                  {hideCircleIntersaction && <circle cx={point.x} cy={point.y} r="3" fill="red" />}
                                  <text
                                    x={finalLabelX}
                                    y={finalLabelY}
                                    fontSize="16"
                                    fontWeight="500"
                                    fill="black"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    style={{
                                      userSelect: 'none', // Prevent text selection
                                      cursor: 'default', // Optional: Make the cursor non-interactive
                                    }}
                                  >
                                    {label}
                                  </text>
                                </g>
                              );
                            })} */}
                            {/* 
                            {intersectionsState.map((intersection, i) => {
                              const { point, label } = intersection;
                              // Base offset for x and y
                              const adjustedX = point.x;
                              const adjustedY = point.y;
                              return (
                                <g key={i}>
                                  {hideCircleIntersaction && <circle cx={point.x} cy={point.y} r="3" fill="red" />}
                                  <text
                                    x={adjustedX + 55}
                                    y={adjustedY + 35}
                                    fontSize="16"
                                    fontWeight="500"
                                    fill="black"
                                    textAnchor='middle'
                                    // textAnchor={finalLabelX > adjustedX ? "start" : "end"} // Adjust text anchor based on position
                                    alignmentBaseline="middle"
                                    style={{
                                      userSelect: 'none', // Prevent text selection
                                      cursor: 'default', // Optional: Make the cursor non-interactive
                                    }}
                                  >
                                    {label}
                                  </text>
                                </g>
                              );
                            })} */}


                            {/* {intersectionsState.map((intersection, i) => {
                              const { point, label } = intersection;

                              // Adjusted positions for the labels
                              const adjustedX = point.x; // Base offset for x
                              const adjustedY = point.y; // Base offset for y

                              // Additional adjustments for label positioning based on SVG dimensions
                              const svgWidth = 500; // Replace with your actual SVG width
                              const svgHeight = 500; // Replace with your actual SVG height

                              const labelOffsetX = adjustedX / svgWidth > 0.5 ? 10 : 30;
                              const labelOffsetY = adjustedY / svgHeight > 0.5 ? 30 : 30;

                              const finalLabelX = adjustedX + labelOffsetX;
                              const finalLabelY = adjustedY + labelOffsetY;

                              return (
                                <g key={i}>
                                  {hideCircleIntersaction && <circle cx={point.x} cy={point.y} r="3" fill="red" />}

                                  <text
                                    x={finalLabelX}
                                    y={finalLabelY}
                                    fontSize="16"
                                    fontWeight="500"
                                    fill="black"
                                    textAnchor={labelOffsetX < 0 ? "end" : "start"}
                                    // textAnchor="middle"
                                    alignmentBaseline="middle"
                                    style={{
                                      userSelect: 'none', // Prevent text selection
                                      cursor: 'default', // Optional: Make the cursor non-interactive
                                    }}
                                  >
                                    {label}
                                  </text>
                                </g>
                              );
                            })} */}

                          </>}
                        </>}
                      </>
                    )}

                    {areas.map((area, index) => {
                      return (
                        <HoverArea
                          key={area.id}
                          coordinates={area.coordinates}
                          hoverText={(index + 1) + " " + devta[index]}
                        />
                      )
                    })}

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
                <rect x={0} y={0} width="676" height="27" fill="white" mask="url(#white-mask)" />
                <rect x={0} y={0} width="27" height="676" fill="white" mask="url(#white-mask)" />
                <rect x={0} y={649} width="676" height="27" fill="white" mask="url(#white-mask)" />
                <rect x={649} y={0} width="27" height="676" fill="white" mask="url(#white-mask)" />
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
                      {index % lineSets.length &&
                        <line
                          x1={centroid.x}
                          y1={centroid.y}
                          x2={endX}
                          y2={endY}
                          stroke={style.stroke}
                          strokeWidth={style.strokeWidth}
                          strokeDasharray={style.strokeDasharray}
                        />
                      }
                    </g>
                  );
                })}
                {/* if something wrong with direction then uncomment this */}
                {/* {Array.from({ length: totalLines }).map((_, index) => {
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
                })} */}
                {/* changes applied on 25th Dec 2024 */}
                {Array.from({ length: totalLines }).map((_, index) => {
                  const rotationIndex = index % totalLines;
                  const angle = rotationIndex * angleIncrement + (270 + inputDegree);
                  const radian = (angle * Math.PI) / 180;

                  // Dynamic centroid-based calculation
                  const svgWidth = width; // SVG width
                  const svgHeight = height; // SVG height
                  const minBoundary = 50; // Minimum inner boundary to avoid

                  // Outer boundaries for the text
                  const outerBounds = {
                    xMin: 0 + 15,
                    xMax: svgWidth - 15,
                    yMin: 0 + 15,
                    yMax: svgHeight - 15,
                  };

                  // Inner restricted boundaries (600x600 zone to avoid)
                  const restrictedBounds = {
                    xMin: (svgWidth - minBoundary) / 2,
                    xMax: svgWidth - (svgWidth - minBoundary) / 2,
                    yMin: (svgHeight - minBoundary) / 2,
                    yMax: svgHeight - (svgHeight - minBoundary) / 2,
                  };

                  const slope = Math.tan(radian);
                  const direction = index % 2 === 0 ? DIRECTION_DATA[index / 2] : null;

                  let endX, endY;
                  let labelX, labelY;
                  const labelOffset = 1.04; // Label position offset

                  if (Math.abs(slope) <= 1) {
                    // Horizontal placement
                    endX = Math.cos(radian) > 0 ? outerBounds.xMax : outerBounds.xMin;
                    endY = centroid.y + slope * (endX - centroid.x);

                    // Adjust label position dynamically
                    labelX = Math.min(
                      Math.max(outerBounds.xMin, centroid.x + (endX - centroid.x) * labelOffset),
                      outerBounds.xMax
                    );
                    labelY = Math.min(
                      Math.max(outerBounds.yMin, centroid.y + (endY - centroid.y) * labelOffset),
                      outerBounds.yMax
                    );
                  } else {
                    // Vertical placement
                    endY = Math.sin(radian) > 0 ? outerBounds.yMax : outerBounds.yMin;
                    endX = centroid.x + (1 / slope) * (endY - centroid.y);

                    // Adjust label position dynamically
                    labelX = Math.min(
                      Math.max(outerBounds.xMin, centroid.x + (endX - centroid.x) * labelOffset),
                      outerBounds.xMax
                    );
                    labelY = Math.min(
                      Math.max(outerBounds.yMin, centroid.y + (endY - centroid.y) * labelOffset),
                      outerBounds.yMax
                    );
                  }

                  // Avoid restricted (600x600) zone
                  if (
                    labelX > restrictedBounds.xMin &&
                    labelX < restrictedBounds.xMax &&
                    labelY > restrictedBounds.yMin &&
                    labelY < restrictedBounds.yMax
                  ) {
                    // Adjust label position slightly to move out of the restricted area
                    const adjustFactor = 10; // Push outside the restricted bounds
                    labelX = labelX < restrictedBounds.xMin ? restrictedBounds.xMin - adjustFactor : labelX;
                    labelX = labelX > restrictedBounds.xMax ? restrictedBounds.xMax + adjustFactor : labelX;
                    labelY = labelY < restrictedBounds.yMin ? restrictedBounds.yMin - adjustFactor : labelY;
                    labelY = labelY > restrictedBounds.yMax ? restrictedBounds.yMax + adjustFactor : labelY;
                  }
                  if (Math.abs(slope) <= 1) {
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
                              cursor: 'default', // Optional: Make the cursor non-interactive
                            }}
                          >
                            {direction}
                          </text>
                        )}
                      </g>
                    );
                  } else {
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
                              cursor: 'default', // Optional: Make the cursor non-interactive
                            }}
                          >
                            {direction}
                          </text>
                        )}
                      </g>
                    );
                  }

                })}

                {/* {Array.from({ length: totalLines }).map((_, index) => {
                  const rotationIndex = index % totalLines;
                  const angle = rotationIndex * angleIncrement + (0 + inputDegree) + 8;
                  const radian = (angle * Math.PI) / 180;

                  const squareSize = 605;
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
                  const direction = intersectionsState[index].label;
                  console.log("intersectionsState : ", intersectionsState[index].label)
                  let endX, endY;
                  let labelX, labelY;
                  const labelOffset = 1.04; // Label position offset

                  if (Math.abs(slope) <= 1) {
                    endX = Math.cos(radian) > 0 ? rightBoundary : leftBoundary;
                    endY = clampedY + slope * (endX - clampedX);
                    labelX = Math.cos(radian) > 0 ? (clampedX + (endX - clampedX) * labelOffset + 340) : (clampedX + (endX - clampedX) * labelOffset + 340);
                    labelY = Math.cos(radian) > 0 ? (clampedY + (endY - clampedY) * labelOffset + 330) : (clampedY + (endY - clampedY) * labelOffset + 360);

                    return (
                      <g key={index}>
                        {direction && (
                          <text
                            x={labelX}
                            y={labelY}
                            fontSize="18"
                            fontWeight="500"
                            fill="black"
                            // transform={Math.cos(radian) > 0 ? `rotate(90, ${labelX}, ${labelY})` : `rotate(-90, ${labelX}, ${labelY})`}
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
                    labelX = Math.sin(radian) > 0 ? (clampedX + (endX - clampedX) * labelOffset + 358) : clampedX + (endX - clampedX) * labelOffset + 330;
                    labelY = Math.sin(radian) > 0 ? (clampedY + (endY - clampedY) * labelOffset + 320) : clampedY + (endY - clampedY) * labelOffset + 340;

                    return (
                      <g key={index}>
                        {direction && (
                          <text
                            x={labelX}
                            y={labelY}
                            fontSize="18"
                            fontWeight="500"
                            fill="black"
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
                })} */}
                {/* {Array.from({ length: totalLines }).map((_, index) => {
                  const rotationIndex = index % totalLines;
                  const angle = rotationIndex * angleIncrement + (0 + inputDegree) + 8;
                  const radian = (angle * Math.PI) / 180;

                  const squareSize = 605;
                  const halfSize = squareSize / 2;
                  const margin = 26;

                  // Your centroid
                  const centroidX = centroid.x;
                  const centroidY = centroid.y;

                  const slope = Math.tan(radian);
                  const rightBoundary = centroidX + halfSize - margin;
                  const leftBoundary = centroidX - halfSize + margin;
                  const topBoundary = centroidY - halfSize + margin;
                  const bottomBoundary = centroidY + halfSize - margin;
                  const direction = intersectionsState[index].label;

                  let endX, endY;
                  let labelX, labelY;
                  const labelOffset = 1.04; // Label position offset

                  if (Math.abs(slope) <= 1) {
                    endX = Math.cos(radian) > 0 ? rightBoundary : leftBoundary;
                    endY = centroidY + slope * (endX - centroidX);
                    labelX = centroidX + (endX - centroidX) * labelOffset;
                    labelY = centroidY + (endY - centroidY) * labelOffset;
                  } else {
                    endY = Math.sin(radian) > 0 ? bottomBoundary : topBoundary;
                    endX = centroidX + (1 / slope) * (endY - centroidY);
                    labelX = centroidX + (endX - centroidX) * labelOffset;
                    labelY = centroidY + (endY - centroidY) * labelOffset;
                  }

                  return (
                    <g key={index}>
                      {direction && (
                        <>
                          <text
                            x={labelX}
                            y={labelY}
                            fontSize="18"
                            fontWeight="500"
                            fill="black"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            style={{
                              userSelect: 'none', 
                              cursor: 'default'
                            }}
                          >
                            {direction}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })} */}
                {/* {Array.from({ length: totalLines }).map((_, index) => {
                  const rotationIndex = index % totalLines;
                  const angle = rotationIndex * angleIncrement + inputDegree + 8; // Adjusted base angle
                  const radian = (angle * Math.PI) / 180;

                  const squareSize = 662; // Total SVG size
                  const margin = 75;

                  // Centroid position
                  const centroidX = centroid.x;
                  const centroidY = centroid.y;

                  const slope = Math.tan(radian);
                  const rightBoundary = squareSize - margin; // Right boundary of the SVG
                  const leftBoundary = margin; // Left boundary of the SVG
                  const topBoundary = margin; // Top boundary of the SVG
                  const bottomBoundary = squareSize - margin; // Bottom boundary of the SVG
                  console.log("intersectionsState : ",intersectionsState)
                  const direction = intersectionsState[index]?.label;

                  let endX, endY;
                  let labelX, labelY;
                  const labelOffset = 1.04; // Factor to position labels slightly beyond the endpoint

                  if (Math.abs(slope) <= 1) {
                    // Shallow angles: Intersect with left or right boundary
                    endX = Math.cos(radian) > 0 ? rightBoundary : leftBoundary;
                    endY = centroidY + slope * (endX - centroidX);
                  } else {
                    // Steep angles: Intersect with top or bottom boundary
                    endY = Math.sin(radian) > 0 ? bottomBoundary : topBoundary;
                    endX = centroidX + (1 / slope) * (endY - centroidY);
                  }

                  // Clamp endpoint positions within boundaries
                  const clampedEndX = Math.max(leftBoundary, Math.min(rightBoundary, endX));
                  const clampedEndY = Math.max(topBoundary, Math.min(bottomBoundary, endY));

                  // Calculate label positions relative to clamped endpoints
                  labelX = centroidX + (clampedEndX - centroidX) * labelOffset;
                  labelY = centroidY + (clampedEndY - centroidY) * labelOffset;

                  // Clamp labels to ensure they stay within SVG boundaries
                  const clampedLabelX = Math.max(leftBoundary, Math.min(rightBoundary, labelX));
                  const clampedLabelY = Math.max(topBoundary, Math.min(bottomBoundary, labelY));

                  return (
                    <g key={index}>
                      {direction && (
                        <>
                          <text
                            x={clampedLabelX}
                            y={clampedLabelY}
                            fontSize="18"
                            fontWeight="500"
                            fill="black"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            style={{
                              userSelect: 'none',
                              cursor: 'default',
                            }}
                          >
                            {direction}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })} */}
                {/* 
                {Array.from({ length: totalLines }).map((_, index) => {
                  const direction = intersectionsState[index]?.label; // Get the label from intersectionsState

                  // Get the centroid position and other parameters
                  const centroidX = centroid.x;
                  const centroidY = centroid.y;
                  const rotationIndex = index % totalLines;
                  const angle = rotationIndex * angleIncrement + inputDegree + 8; // Adjusted base angle
                  const radian = (angle * Math.PI) / 180;

                  const squareSize = 662; // Total SVG size
                  const margin = 75;

                  const rightBoundary = squareSize - margin; // Right boundary of the SVG
                  const leftBoundary = margin; // Left boundary of the SVG
                  const topBoundary = margin; // Top boundary of the SVG
                  const bottomBoundary = squareSize - margin; // Bottom boundary of the SVG

                  let endX, endY;

                  // Calculate intersection point with boundaries
                  const slope = Math.tan(radian);
                  if (Math.abs(slope) <= 1) {
                    // Shallow angles: Intersect with left or right boundary
                    endX = Math.cos(radian) > 0 ? rightBoundary : leftBoundary;
                    endY = centroidY + slope * (endX - centroidX);
                  } else {
                    // Steep angles: Intersect with top or bottom boundary
                    endY = Math.sin(radian) > 0 ? bottomBoundary : topBoundary;
                    endX = centroidX + (1 / slope) * (endY - centroidY);
                  }

                  // Clamp endpoint positions within boundaries
                  const clampedEndX = Math.max(leftBoundary, Math.min(rightBoundary, endX));
                  const clampedEndY = Math.max(topBoundary, Math.min(bottomBoundary, endY));

                  // Offset for positioning the text slightly outside the intersection point
                  const labelOffset = 10; // Adjust this value as needed

                  // Calculate direction vector for the offset
                  const directionX = clampedEndX - centroidX;
                  const directionY = clampedEndY - centroidY;
                  const distance = Math.sqrt(directionX ** 2 + directionY ** 2);

                  // Normalize direction vector and apply the offset
                  const textX = clampedEndX + (directionX / distance) * labelOffset;
                  const textY = clampedEndY + (directionY / distance) * labelOffset;

                  return (
                    <g key={index}>
                      {direction && (
                        <text
                          x={textX}
                          y={textY}
                          fontSize="18"
                          fontWeight="500"
                          fill="black"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          style={{
                            userSelect: 'none',
                            cursor: 'default',
                          }}
                        >
                          {direction}
                        </text>
                      )}
                    </g>
                  );
                })} */}
                {/* {Array.from({ length: totalLines }).map((_, index) => {
                  const direction = intersectionsState[index]?.label; // Get the label from intersectionsState

                  // Get the centroid position and other parameters
                  const centroidX = centroid.x;
                  const centroidY = centroid.y;
                  const rotationIndex = index % totalLines;
                  const angle = rotationIndex * angleIncrement + inputDegree + 8; // Adjusted base angle
                  const radian = (angle * Math.PI) / 180;

                  const squareSize = 662; // Total SVG size
                  const margin = 75;

                  const rightBoundary = squareSize - margin; // Right boundary of the SVG
                  const leftBoundary = margin; // Left boundary of the SVG
                  const topBoundary = margin; // Top boundary of the SVG
                  const bottomBoundary = squareSize - margin; // Bottom boundary of the SVG

                  let endX, endY;

                  // Calculate intersection point with boundaries
                  const slope = Math.tan(radian);
                  if (Math.abs(slope) <= 1) {
                    // Shallow angles: Intersect with left or right boundary
                    endX = Math.cos(radian) > 0 ? rightBoundary : leftBoundary;
                    endY = centroidY + slope * (endX - centroidX);
                  } else {
                    // Steep angles: Intersect with top or bottom boundary
                    endY = Math.sin(radian) > 0 ? bottomBoundary : topBoundary;
                    endX = centroidX + (1 / slope) * (endY - centroidY);
                  }

                  // Clamp endpoint positions within boundaries
                  const clampedEndX = Math.max(leftBoundary, Math.min(rightBoundary, endX));
                  const clampedEndY = Math.max(topBoundary, Math.min(bottomBoundary, endY));

                  // Offset for positioning the text slightly outside the intersection point
                  const labelOffset = 10; // Adjust this value as needed

                  // Calculate direction vector for the offset
                  const directionX = clampedEndX - centroidX;
                  const directionY = clampedEndY - centroidY;
                  const distance = Math.sqrt(directionX ** 2 + directionY ** 2);

                  let textX, textY;

                  // Normalize direction vector and apply the offset if distance is greater than zero
                  if (distance > 0) {
                    textX = clampedEndX + (directionX / distance) * labelOffset;
                    textY = clampedEndY + (directionY / distance) * labelOffset;
                  } else {
                    // Handle case where distance is 0
                    textX = clampedEndX + labelOffset;
                    textY = clampedEndY + labelOffset;
                  }

                  // Debugging logs
                  console.log(`Index: ${index}, Angle: ${angle}, Clamped End: (${clampedEndX}, ${clampedEndY}), Text Position: (${textX}, ${textY}), Label : ${direction} `);

                  return (
                    <g key={index}>
                      {direction && (
                        <text
                          x={textX}
                          y={textY}
                          fontSize="18"
                          fontWeight="500"
                          fill="black"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          style={{
                            userSelect: 'none',
                            cursor: 'default',
                          }}
                        >
                          {direction}
                        </text>
                      )}
                    </g>
                  );
                })} */}
                {/* {Array.from({ length: totalLines }).map((_, index) => {
                  const direction = intersectionsState[index]?.label; // Get the label from intersectionsState

                  // Get the centroid position and other parameters
                  const centroidX = centroid.x;
                  const centroidY = centroid.y;
                  const rotationIndex = index % totalLines;
                  const angle = rotationIndex * angleIncrement + inputDegree + 8; // Adjusted base angle
                  const radian = (angle * Math.PI) / 180;

                  const squareSize = 662; // Total SVG size
                  const margin = 75;

                  const rightBoundary = squareSize - margin; // Right boundary of the SVG
                  const leftBoundary = margin; // Left boundary of the SVG
                  const topBoundary = margin; // Top boundary of the SVG
                  const bottomBoundary = squareSize - margin; // Bottom boundary of the SVG

                  let endX, endY;

                  // Calculate intersection point with boundaries
                  const slope = Math.tan(radian);
                  if (Math.abs(slope) <= 1) {
                    // Shallow angles: Intersect with left or right boundary
                    endX = Math.cos(radian) > 0 ? rightBoundary : leftBoundary;
                    endY = centroidY + slope * (endX - centroidX);
                  } else {
                    // Steep angles: Intersect with top or bottom boundary
                    endY = Math.sin(radian) > 0 ? bottomBoundary : topBoundary;
                    endX = centroidX + (1 / slope) * (endY - centroidY);
                  }

                  // Clamp endpoint positions within boundaries
                  const clampedEndX = Math.max(leftBoundary, Math.min(rightBoundary, endX));
                  const clampedEndY = Math.max(topBoundary, Math.min(bottomBoundary, endY));

                  // Offset for positioning the text slightly outside the intersection point
                  const labelOffset = 10; // Adjust this value as needed

                  // Calculate direction vector for the offset
                  const directionX = clampedEndX - centroidX;
                  const directionY = clampedEndY - centroidY;
                  const distance = Math.sqrt(directionX ** 2 + directionY ** 2);

                  let textX, textY;

                  // Normalize direction vector and apply the offset if distance is greater than zero
                  if (distance > 0) {
                    // Always place text to the right of the intersection point
                    textX = clampedEndX + labelOffset; // Move text to the right
                    textY = clampedEndY; // Keep the vertical position aligned with the intersection point

                    // Adjust for corner cases
                    if (clampedEndX === rightBoundary && clampedEndY === topBoundary) {
                      // Top-right corner
                      textY += 15; // Move text down for better visibility
                    } else if (clampedEndX === rightBoundary && clampedEndY === bottomBoundary) {
                      // Bottom-right corner
                      textY -= 15; // Move text up for better visibility
                    } else if (clampedEndX === leftBoundary && clampedEndY === topBoundary) {
                      // Top-left corner
                      textY += 15; // Move text down for better visibility
                    } else if (clampedEndX === leftBoundary && clampedEndY === bottomBoundary) {
                      // Bottom-left corner
                      textY -= 15; // Move text up for better visibility
                    }
                  } else {
                    // Handle case where distance is 0
                    textX = clampedEndX + labelOffset;
                    textY = clampedEndY;
                  }

                  // Debugging logs
                  console.log(`Index: ${index}, Angle: ${angle}, Clamped End: (${clampedEndX}, ${clampedEndY}), Text Position: (${textX}, ${textY}), Label: ${direction}`);

                  return (
                    <g key={index}>
                      {direction && (
                        <text
                          x={textX}
                          y={textY}
                          fontSize="18"
                          fontWeight="500"
                          fill="black"
                          textAnchor="start" // Align text to the start for better positioning
                          alignmentBaseline="middle"
                          style={{
                            userSelect: 'none',
                            cursor: 'default',
                          }}
                        >
                          {direction}
                        </text>
                      )}
                    </g>
                  );
                })} */}






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
              <div key={i} className="text-sm mb-1.5 w-4" style={{
                userSelect: 'none', // Prevent text selection
                cursor: 'default' // Optional: Make the cursor non-interactive
              }}>{letter}</div>
            ))}
          </div>
        </div>

        <div className="flex mb-1 ms-2.5">
          {Array.from({ length: 26 }, (_, i) => (
            <div key={i} className="text-sm ms-2.5 w-4" style={{
              userSelect: 'none', // Prevent text selection
              cursor: 'default' // Optional: Make the cursor non-interactive
            }}>{i + 1}</div>
          ))}
        </div>
      </div>
    </div>

  );
};

export default DrawingBoard;