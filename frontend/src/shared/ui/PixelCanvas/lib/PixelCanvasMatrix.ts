export type PixelCanvasVariant =
  | "heroMatrix"
  | "featureMatrix"
  | "valueMatrix"
  | "journeyVector"
  | "demoMatrix"
  | "capabilityVector"
  | "pricingMatrix"
  | "actionVector";

type PixelCanvasCell = 0 | 1 | 2;
type PixelCanvasMatrix = PixelCanvasCell[][];

const PIXEL_MATRIX_SIZE = 12;
const PIXEL_ART_OFFSET = 2;
const PIXEL_ART_SIZE = 8;
const PIXEL_CELL_INSET = 0.08;
const PIXEL_INK = "rgba(0, 0, 0, 0.34)";
const PIXEL_ACCENT = "rgba(0, 0, 0, 0.72)";

function createPixelCanvasMatrix(): PixelCanvasMatrix {
  return Array.from({ length: PIXEL_MATRIX_SIZE }, () =>
    Array<PixelCanvasCell>(PIXEL_MATRIX_SIZE).fill(0),
  );
}

function setPixelCanvasMask(
  pixelCanvasMatrix: PixelCanvasMatrix,
  pixelMask: string[],
  pixelValue: PixelCanvasCell = 1,
  pixelCanvasOffsetRow = PIXEL_ART_OFFSET,
) {
  pixelMask.forEach((pixelMaskRow, pixelRow) => {
    [...pixelMaskRow].forEach((pixelCell, pixelColumn) => {
      if (pixelCell === "1") {
        pixelCanvasMatrix[pixelRow + pixelCanvasOffsetRow][
          pixelColumn + PIXEL_ART_OFFSET
        ] = pixelValue;
      }
    });
  });
}

function recolorPixelCanvasCells(
  pixelCanvasMatrix: PixelCanvasMatrix,
  pixelCoordinates: number[][],
  pixelCanvasOffsetRow = PIXEL_ART_OFFSET,
) {
  pixelCoordinates.forEach(([pixelColumn, pixelRow]) => {
    const matrixColumn = pixelColumn + PIXEL_ART_OFFSET;
    const matrixRow = pixelRow + pixelCanvasOffsetRow;
    if (pixelCanvasMatrix[matrixRow][matrixColumn] !== 0) {
      pixelCanvasMatrix[matrixRow][matrixColumn] = 2;
    }
  });
}

function drawPixelCanvasCellMatrix(
  pixelCanvasContext: CanvasRenderingContext2D,
  pixelCanvasMatrix: PixelCanvasMatrix,
) {
  pixelCanvasMatrix.forEach((pixelMatrixRow, pixelRow) => {
    pixelMatrixRow.forEach((pixelCell, pixelColumn) => {
      if (pixelCell === 0) return;

      pixelCanvasContext.fillStyle = pixelCell === 2 ? PIXEL_ACCENT : PIXEL_INK;
      pixelCanvasContext.fillRect(
        pixelColumn + PIXEL_CELL_INSET,
        pixelRow + PIXEL_CELL_INSET,
        1 - PIXEL_CELL_INSET * 2,
        1 - PIXEL_CELL_INSET * 2,
      );
    });
  });
}

function drawHeroPixelMatrix(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
) {
  const pixelCanvasMatrix = createPixelCanvasMatrix();
  const logoNodeCoordinates = [
    [6, 2],
    [4.5, 5],
    [7.5, 5],
    [3, 8],
    [6, 8],
    [9, 8],
  ];
  const activeLogoNode =
    Math.floor(frameTimeMs / 420) % logoNodeCoordinates.length;

  logoNodeCoordinates.forEach(([pixelColumn, pixelRow], nodeIndex) => {
    pixelCanvasContext.beginPath();
    pixelCanvasContext.arc(
      pixelColumn + 0.5,
      pixelRow + 1,
      1.2,
      0,
      Math.PI * 2,
    );
    pixelCanvasContext.fillStyle =
      nodeIndex === activeLogoNode ? PIXEL_ACCENT : PIXEL_INK;
    pixelCanvasContext.fill();
  });
  drawPixelCanvasCellMatrix(pixelCanvasContext, pixelCanvasMatrix);
}

function drawFeaturePixelMatrix(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
) {
  const pixelCanvasMatrix = createPixelCanvasMatrix();
  const featureWavePhase = Math.floor(frameTimeMs / 220) % PIXEL_ART_SIZE;

  for (let pixelRow = 0; pixelRow < PIXEL_ART_SIZE; pixelRow += 1) {
    for (let pixelColumn = 0; pixelColumn < PIXEL_ART_SIZE; pixelColumn += 1) {
      const featureRingDistance =
        Math.abs(pixelColumn - 3.5) + Math.abs(pixelRow - 3.5);
      if (featureRingDistance > 6 || featureRingDistance < 2) continue;

      const isFeatureWavePixel =
        Math.floor(featureRingDistance + featureWavePhase) % 5 === 0;
      pixelCanvasMatrix[pixelRow + PIXEL_ART_OFFSET][
        pixelColumn + PIXEL_ART_OFFSET
      ] = isFeatureWavePixel ? 2 : 1;
    }
  }
  recolorPixelCanvasCells(pixelCanvasMatrix, [
    [3, 1],
    [4, 1],
    [2, 2],
    [5, 2],
    [1, 3],
    [6, 3],
    [2, 5],
    [5, 5],
    [3, 6],
    [4, 6],
  ]);
  drawPixelCanvasCellMatrix(pixelCanvasContext, pixelCanvasMatrix);
}

function drawValuePixelMatrix(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
) {
  const pixelCanvasMatrix = createPixelCanvasMatrix();
  const shieldMask = [
    "00011000",
    "00111100",
    "01111110",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000",
  ];
  const shieldScanline = Math.floor(frameTimeMs / 300) % PIXEL_ART_SIZE;

  setPixelCanvasMask(pixelCanvasMatrix, shieldMask);
  const scanCoordinates = [...shieldMask[shieldScanline]]
    .map((pixelCell, pixelColumn) =>
      pixelCell === "1" ? [pixelColumn, shieldScanline] : null,
    )
    .filter((coordinate): coordinate is number[] => coordinate !== null);
  recolorPixelCanvasCells(pixelCanvasMatrix, scanCoordinates);
  drawPixelCanvasCellMatrix(pixelCanvasContext, pixelCanvasMatrix);
}

function drawJourneyPixelVector(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
) {
  const pixelCanvasMatrix = createPixelCanvasMatrix();
  const workflowMask = [
    "00000000",
    "00000000",
    "00000000",
    "11011011",
    "11011011",
    "00000000",
    "00000000",
    "00000000",
  ];
  const activeWorkflowStep = Math.floor(frameTimeMs / 520) % 3;

  setPixelCanvasMask(pixelCanvasMatrix, workflowMask);
  recolorPixelCanvasCells(pixelCanvasMatrix, [
    [activeWorkflowStep * 3, 3],
    [activeWorkflowStep * 3 + 1, 3],
    [activeWorkflowStep * 3, 4],
    [activeWorkflowStep * 3 + 1, 4],
  ]);
  drawPixelCanvasCellMatrix(pixelCanvasContext, pixelCanvasMatrix);
}

function drawDemoPixelMatrix(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
) {
  const pixelCanvasMatrix = createPixelCanvasMatrix();
  const presentationPlayerMask = [
    "11111111",
    "10000001",
    "10000001",
    "10011001",
    "10011001",
    "10000001",
    "10000001",
    "11111111",
  ];
  const playMask = [
    "00000000",
    "00011000",
    "00111100",
    "01111110",
    "01111110",
    "00111100",
    "00011000",
    "00000000",
  ];
  const playCoordinates = playMask.flatMap((pixelMaskRow, pixelRow) =>
    [...pixelMaskRow]
      .map((pixelCell, pixelColumn) =>
        pixelCell === "1" ? [pixelColumn, pixelRow] : null,
      )
      .filter((coordinate): coordinate is number[] => coordinate !== null),
  );

  setPixelCanvasMask(pixelCanvasMatrix, presentationPlayerMask);
  setPixelCanvasMask(pixelCanvasMatrix, playMask);
  if (Math.floor(frameTimeMs / 450) % 2 === 0) {
    recolorPixelCanvasCells(pixelCanvasMatrix, playCoordinates);
  }
  drawPixelCanvasCellMatrix(pixelCanvasContext, pixelCanvasMatrix);
}

function drawCapabilityPixelVector(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
) {
  const pixelCanvasMatrix = createPixelCanvasMatrix();
  const capabilityBarHeights = [2, 4, 3, 6, 5, 8, 5, 6];
  const capabilityScanColumn =
    Math.floor(frameTimeMs / 220) % capabilityBarHeights.length;

  capabilityBarHeights.forEach((barHeight, barIndex) => {
    for (let barPixel = 0; barPixel < barHeight; barPixel += 1) {
      pixelCanvasMatrix[PIXEL_ART_OFFSET + PIXEL_ART_SIZE - 1 - barPixel][
        PIXEL_ART_OFFSET + barIndex
      ] = barIndex === capabilityScanColumn ? 2 : 1;
    }
  });
  drawPixelCanvasCellMatrix(pixelCanvasContext, pixelCanvasMatrix);
}

function drawPricingPixelMatrix(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
) {
  const pixelCanvasMatrix = createPixelCanvasMatrix();
  const pricingStackMask = [
    "00000000",
    "00000000",
    "00111100",
    "01111110",
    "11000011",
    "01111110",
    "11000011",
    "01111110",
  ];
  const pricingScanline = 2 + (Math.floor(frameTimeMs / 320) % 6);

  setPixelCanvasMask(
    pixelCanvasMatrix,
    pricingStackMask,
    1,
    PIXEL_ART_OFFSET - 1,
  );
  const scanCoordinates = [...pricingStackMask[pricingScanline]]
    .map((pixelCell, pixelColumn) =>
      pixelCell === "1" ? [pixelColumn, pricingScanline] : null,
    )
    .filter((coordinate): coordinate is number[] => coordinate !== null);
  recolorPixelCanvasCells(
    pixelCanvasMatrix,
    scanCoordinates,
    PIXEL_ART_OFFSET - 1,
  );
  drawPixelCanvasCellMatrix(pixelCanvasContext, pixelCanvasMatrix);
}

function drawActionPixelVector(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
) {
  const pixelCanvasMatrix = createPixelCanvasMatrix();
  const actionArrowMask = [
    "00011000",
    "00111100",
    "01111110",
    "11011011",
    "00011000",
    "00011000",
    "00011000",
    "00011000",
  ];
  const actionScanline = Math.floor(frameTimeMs / 300) % PIXEL_ART_SIZE;

  setPixelCanvasMask(pixelCanvasMatrix, actionArrowMask);
  const scanCoordinates = [...actionArrowMask[actionScanline]]
    .map((pixelCell, pixelColumn) =>
      pixelCell === "1" ? [pixelColumn, actionScanline] : null,
    )
    .filter((coordinate): coordinate is number[] => coordinate !== null);
  recolorPixelCanvasCells(pixelCanvasMatrix, scanCoordinates);
  drawPixelCanvasCellMatrix(pixelCanvasContext, pixelCanvasMatrix);
}

export function drawPixelCanvasMatrixFrame(
  pixelCanvasContext: CanvasRenderingContext2D,
  frameTimeMs: number,
  pixelCanvasVariant: PixelCanvasVariant,
) {
  pixelCanvasContext.clearRect(
    0,
    0,
    PIXEL_MATRIX_SIZE,
    PIXEL_MATRIX_SIZE,
  );

  switch (pixelCanvasVariant) {
    case "heroMatrix":
      drawHeroPixelMatrix(pixelCanvasContext, frameTimeMs);
      break;
    case "featureMatrix":
      drawFeaturePixelMatrix(pixelCanvasContext, frameTimeMs);
      break;
    case "valueMatrix":
      drawValuePixelMatrix(pixelCanvasContext, frameTimeMs);
      break;
    case "journeyVector":
      drawJourneyPixelVector(pixelCanvasContext, frameTimeMs);
      break;
    case "demoMatrix":
      drawDemoPixelMatrix(pixelCanvasContext, frameTimeMs);
      break;
    case "capabilityVector":
      drawCapabilityPixelVector(pixelCanvasContext, frameTimeMs);
      break;
    case "pricingMatrix":
      drawPricingPixelMatrix(pixelCanvasContext, frameTimeMs);
      break;
    case "actionVector":
      drawActionPixelVector(pixelCanvasContext, frameTimeMs);
      break;
  }
}
