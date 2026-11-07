export type PresentationCanvasVariant =
  | "heroMatrix"
  | "featureMatrix"
  | "valueMatrix"
  | "slideMatrix"
  | "contextVector"
  | "workflowMatrix"
  | "capabilityVector"
  | "actionVector";

const CANVAS_INK = "#2e2e2e";
const CANVAS_ACCENT = "#777777";
const CANVAS_MUTED = "#c4c4c4";

function traceCanvasRoundedRectangle(
  canvasContext: CanvasRenderingContext2D,
  canvasX: number,
  canvasY: number,
  canvasWidth: number,
  canvasHeight: number,
  canvasRadius: number,
) {
  const boundedRadius = Math.min(
    canvasRadius,
    canvasWidth / 2,
    canvasHeight / 2,
  );

  canvasContext.beginPath();
  canvasContext.moveTo(canvasX + boundedRadius, canvasY);
  canvasContext.lineTo(canvasX + canvasWidth - boundedRadius, canvasY);
  canvasContext.quadraticCurveTo(
    canvasX + canvasWidth,
    canvasY,
    canvasX + canvasWidth,
    canvasY + boundedRadius,
  );
  canvasContext.lineTo(
    canvasX + canvasWidth,
    canvasY + canvasHeight - boundedRadius,
  );
  canvasContext.quadraticCurveTo(
    canvasX + canvasWidth,
    canvasY + canvasHeight,
    canvasX + canvasWidth - boundedRadius,
    canvasY + canvasHeight,
  );
  canvasContext.lineTo(canvasX + boundedRadius, canvasY + canvasHeight);
  canvasContext.quadraticCurveTo(
    canvasX,
    canvasY + canvasHeight,
    canvasX,
    canvasY + canvasHeight - boundedRadius,
  );
  canvasContext.lineTo(canvasX, canvasY + boundedRadius);
  canvasContext.quadraticCurveTo(
    canvasX,
    canvasY,
    canvasX + boundedRadius,
    canvasY,
  );
  canvasContext.closePath();
}

function drawCanvasSlideMatrix(
  canvasContext: CanvasRenderingContext2D,
  canvasX: number,
  canvasY: number,
  canvasWidth: number,
  canvasHeight: number,
  canvasOpacity: number,
  canvasRotation = 0,
) {
  canvasContext.save();
  canvasContext.translate(
    canvasX + canvasWidth / 2,
    canvasY + canvasHeight / 2,
  );
  canvasContext.rotate(canvasRotation);
  canvasContext.translate(-canvasWidth / 2, -canvasHeight / 2);

  traceCanvasRoundedRectangle(
    canvasContext,
    0,
    0,
    canvasWidth,
    canvasHeight,
    10,
  );
  canvasContext.fillStyle = `rgba(255,255,255,${canvasOpacity})`;
  canvasContext.fill();
  canvasContext.strokeStyle = `rgba(46,46,46,${canvasOpacity * 0.32})`;
  canvasContext.lineWidth = 1.5;
  canvasContext.stroke();

  canvasContext.fillStyle = `rgba(46,46,46,${canvasOpacity * 0.76})`;
  canvasContext.fillRect(
    canvasWidth * 0.12,
    canvasHeight * 0.17,
    canvasWidth * 0.48,
    canvasHeight * 0.055,
  );

  const canvasBarWidths = [0.57, 0.52, 0.55, 0.4];
  canvasBarWidths.forEach((canvasBarWidth, canvasIndex) => {
    canvasContext.fillStyle = `rgba(119,119,119,${canvasOpacity * 0.38})`;
    canvasContext.fillRect(
      canvasWidth * 0.12,
      canvasHeight * (0.32 + canvasIndex * 0.12),
      canvasWidth * canvasBarWidth,
      canvasHeight * 0.035,
    );
  });

  canvasContext.fillStyle = `rgba(119,119,119,${canvasOpacity * 0.42})`;
  canvasContext.fillRect(
    canvasWidth * 0.72,
    canvasHeight * 0.31,
    canvasWidth * 0.16,
    canvasHeight * 0.37,
  );
  canvasContext.restore();
}

function drawSlideMatrixCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
) {
  const canvasSlideWidth = canvasWidth * 0.48;
  const canvasSlideHeight = canvasHeight * 0.68;
  const canvasSlideX = (canvasWidth - canvasSlideWidth) / 2;
  const canvasSlideY = (canvasHeight - canvasSlideHeight) / 2;
  const canvasRotation = Math.sin(frameTimeMs * 0.00055) * 0.035;

  drawCanvasSlideMatrix(
    canvasContext,
    canvasSlideX - canvasWidth * 0.08,
    canvasSlideY + canvasHeight * 0.08,
    canvasSlideWidth,
    canvasSlideHeight,
    0.48,
    -canvasRotation * 1.8,
  );
  drawCanvasSlideMatrix(
    canvasContext,
    canvasSlideX + canvasWidth * 0.08,
    canvasSlideY + canvasHeight * 0.04,
    canvasSlideWidth,
    canvasSlideHeight,
    0.64,
    canvasRotation * 1.4,
  );
  drawCanvasSlideMatrix(
    canvasContext,
    canvasSlideX,
    canvasSlideY,
    canvasSlideWidth,
    canvasSlideHeight,
    1,
    canvasRotation,
  );

}

function drawContextVectorCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
) {
  const canvasVectorCount = 5;

  for (
    let canvasVectorIndex = 0;
    canvasVectorIndex < canvasVectorCount;
    canvasVectorIndex += 1
  ) {
    const canvasRowProgress = canvasVectorIndex / (canvasVectorCount - 1);
    const canvasBaseY = canvasHeight * (0.2 + canvasRowProgress * 0.6);
    const canvasAmplitude = canvasHeight * (0.07 + canvasRowProgress * 0.025);

    canvasContext.beginPath();
    for (let canvasStepIndex = 0; canvasStepIndex <= 48; canvasStepIndex += 1) {
      const canvasStepProgress = canvasStepIndex / 48;
      const canvasX = canvasWidth * (0.08 + canvasStepProgress * 0.84);
      const canvasY =
        canvasBaseY +
        Math.sin(
          canvasStepProgress * Math.PI * 2.2 +
            canvasRowProgress * 1.8 +
            frameTimeMs * 0.0008,
        ) *
          canvasAmplitude;

      if (canvasStepIndex === 0) {
        canvasContext.moveTo(canvasX, canvasY);
      } else {
        canvasContext.lineTo(canvasX, canvasY);
      }
    }

    canvasContext.strokeStyle =
      canvasVectorIndex === 2 ? "rgba(46,46,46,0.42)" : "rgba(119,119,119,0.2)";
    canvasContext.lineWidth = canvasVectorIndex === 2 ? 2 : 1;
    canvasContext.stroke();

    const canvasParticleProgress =
      (frameTimeMs * 0.00012 + canvasRowProgress * 0.23) % 1;
    const canvasParticleX =
      canvasWidth * (0.08 + canvasParticleProgress * 0.84);
    const canvasParticleY =
      canvasBaseY +
      Math.sin(
        canvasParticleProgress * Math.PI * 2.2 +
          canvasRowProgress * 1.8 +
          frameTimeMs * 0.0008,
      ) *
        canvasAmplitude;

    canvasContext.beginPath();
    canvasContext.arc(canvasParticleX, canvasParticleY, 3.5, 0, Math.PI * 2);
    canvasContext.fillStyle =
      canvasVectorIndex === 2 ? CANVAS_INK : CANVAS_ACCENT;
    canvasContext.fill();
  }
}

function drawWorkflowMatrixCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
) {
  const canvasNodeCenters = [
    { x: canvasWidth * 0.19, y: canvasHeight * 0.72 },
    { x: canvasWidth * 0.5, y: canvasHeight * 0.3 },
    { x: canvasWidth * 0.81, y: canvasHeight * 0.52 },
  ];
  const canvasNodeRadius = Math.min(canvasWidth, canvasHeight) * 0.13;

  canvasContext.lineWidth = 2;
  canvasContext.strokeStyle = "rgba(119,119,119,0.35)";
  canvasContext.beginPath();
  canvasContext.moveTo(canvasNodeCenters[0].x, canvasNodeCenters[0].y);
  canvasContext.lineTo(canvasNodeCenters[1].x, canvasNodeCenters[1].y);
  canvasContext.lineTo(canvasNodeCenters[2].x, canvasNodeCenters[2].y);
  canvasContext.stroke();

  canvasNodeCenters.forEach((canvasNodeCenter, canvasNodeIndex) => {
    const canvasNodePulse =
      0.22 + 0.12 * (1 + Math.sin(frameTimeMs * 0.002 + canvasNodeIndex));

    canvasContext.beginPath();
    canvasContext.arc(
      canvasNodeCenter.x,
      canvasNodeCenter.y,
      canvasNodeRadius,
      0,
      Math.PI * 2,
    );
    canvasContext.fillStyle = `rgba(119,119,119,${canvasNodePulse})`;
    canvasContext.fill();
    canvasContext.strokeStyle = `rgba(46,46,46,${0.25 + canvasNodePulse})`;
    canvasContext.stroke();

    canvasContext.fillStyle = CANVAS_INK;
    canvasContext.fillRect(
      canvasNodeCenter.x - canvasNodeRadius * 0.34,
      canvasNodeCenter.y - canvasNodeRadius * 0.34,
      canvasNodeRadius * 0.68,
      canvasNodeRadius * 0.68,
    );
  });

  const canvasFlowProgress = (frameTimeMs * 0.00018) % 1;
  const canvasFlowSegment = canvasFlowProgress < 0.5 ? 0 : 1;
  const canvasSegmentProgress =
    canvasFlowSegment === 0
      ? canvasFlowProgress * 2
      : (canvasFlowProgress - 0.5) * 2;
  const canvasSegmentStart = canvasNodeCenters[canvasFlowSegment];
  const canvasSegmentEnd = canvasNodeCenters[canvasFlowSegment + 1];
  const canvasFlowX =
    canvasSegmentStart.x +
    (canvasSegmentEnd.x - canvasSegmentStart.x) * canvasSegmentProgress;
  const canvasFlowY =
    canvasSegmentStart.y +
    (canvasSegmentEnd.y - canvasSegmentStart.y) * canvasSegmentProgress;

  canvasContext.beginPath();
  canvasContext.arc(canvasFlowX, canvasFlowY, 4, 0, Math.PI * 2);
  canvasContext.fillStyle = CANVAS_ACCENT;
  canvasContext.fill();
}

function drawHeroMatrixCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
) {
  const matrixCellSize = Math.max(2, Math.floor(canvasWidth / 24));
  const matrixColumnCount = Math.floor(canvasWidth / matrixCellSize);
  const matrixRowCount = Math.floor(canvasHeight / matrixCellSize);
  const matrixScanRow =
    Math.floor(frameTimeMs * 0.008) % Math.max(1, matrixRowCount);

  for (let matrixRowIndex = 0; matrixRowIndex < matrixRowCount; matrixRowIndex += 1) {
    for (
      let matrixColumnIndex = 0;
      matrixColumnIndex < matrixColumnCount;
      matrixColumnIndex += 1
    ) {
      const matrixDistance = Math.abs(matrixRowIndex - matrixScanRow);
      const matrixOpacity = Math.max(0, 0.28 - matrixDistance * 0.045);
      const matrixIsAccent =
        (matrixColumnIndex + matrixRowIndex * 3) % 11 === 0;

      if (matrixOpacity <= 0.02 && !matrixIsAccent) continue;

      canvasContext.fillStyle = matrixIsAccent
        ? `rgba(119,119,119,${0.18 + 0.16 * Math.sin(frameTimeMs * 0.002 + matrixColumnIndex)})`
        : `rgba(46,46,46,${matrixOpacity})`;
      canvasContext.fillRect(
        matrixColumnIndex * matrixCellSize,
        matrixRowIndex * matrixCellSize,
        matrixCellSize - 1,
        matrixCellSize - 1,
      );
    }
  }

  const matrixCursorX =
    ((frameTimeMs * 0.018) % (matrixColumnCount * matrixCellSize)) +
    matrixCellSize / 2;
  canvasContext.fillStyle = CANVAS_INK;
  canvasContext.fillRect(
    matrixCursorX,
    matrixScanRow * matrixCellSize,
    matrixCellSize * 2,
    matrixCellSize,
  );
}

function drawFeatureMatrixCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
) {
  const matrixCellSize = Math.max(2, Math.floor(Math.min(canvasWidth, canvasHeight) / 12));
  const matrixCenterX = Math.floor(canvasWidth / 2 / matrixCellSize);
  const matrixCenterY = Math.floor(canvasHeight / 2 / matrixCellSize);
  const matrixRadius = 4;
  const matrixPhase = Math.floor(frameTimeMs * 0.004) % (matrixRadius * 8);

  for (
    let matrixRowOffset = -matrixRadius;
    matrixRowOffset <= matrixRadius;
    matrixRowOffset += 1
  ) {
    for (
      let matrixColumnOffset = -matrixRadius;
      matrixColumnOffset <= matrixRadius;
      matrixColumnOffset += 1
    ) {
      const matrixRingDistance =
        Math.abs(matrixColumnOffset) + Math.abs(matrixRowOffset);
      const matrixIsCenter =
        Math.abs(matrixColumnOffset) <= 1 && Math.abs(matrixRowOffset) <= 1;
      const matrixIsWave =
        ((matrixRingDistance - matrixPhase + matrixRadius * 8) %
          (matrixRadius * 2)) <
        2;
      if (!matrixIsCenter && !matrixIsWave) continue;

      const matrixOpacity = matrixIsCenter
        ? 0.8
        : 0.18 + 0.42 * Math.sin(frameTimeMs * 0.003 + matrixRingDistance);
      canvasContext.fillStyle = `rgba(46,46,46,${matrixOpacity})`;
      canvasContext.fillRect(
        (matrixCenterX + matrixColumnOffset) * matrixCellSize,
        (matrixCenterY + matrixRowOffset) * matrixCellSize,
        matrixCellSize - 1,
        matrixCellSize - 1,
      );
    }
  }
}

function drawValueMatrixCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
) {
  const matrixCellSize = Math.max(2, Math.floor(Math.min(canvasWidth, canvasHeight) / 14));
  const matrixShield = [
    "00111100",
    "01111110",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000",
    "00000000",
  ];
  const matrixOriginX =
    Math.floor(canvasWidth / matrixCellSize / 2) -
    Math.floor(matrixShield[0].length / 2);
  const matrixOriginY =
    Math.floor(canvasHeight / matrixCellSize / 2) -
    Math.floor(matrixShield.length / 2);
  const matrixScanline = Math.floor(frameTimeMs * 0.006) % matrixShield.length;

  matrixShield.forEach((matrixRow, matrixRowIndex) => {
    [...matrixRow].forEach((matrixCell, matrixColumnIndex) => {
      if (matrixCell !== "1") return;

      const matrixIsScanline = matrixRowIndex === matrixScanline;
      canvasContext.fillStyle = matrixIsScanline
        ? CANVAS_ACCENT
        : `rgba(46,46,46,${0.35 + matrixRowIndex * 0.055})`;
      canvasContext.fillRect(
        (matrixOriginX + matrixColumnIndex) * matrixCellSize,
        (matrixOriginY + matrixRowIndex) * matrixCellSize,
        matrixCellSize - 1,
        matrixCellSize - 1,
      );
    });
  });

  const matrixOrbitColumn =
    (Math.floor(frameTimeMs * 0.004) % (matrixShield[0].length + 4)) - 2;
  canvasContext.fillStyle = CANVAS_MUTED;
  canvasContext.fillRect(
    (matrixOriginX + matrixOrbitColumn) * matrixCellSize,
    (matrixOriginY - 2) * matrixCellSize,
    matrixCellSize,
    matrixCellSize,
  );
}

function drawCapabilityVectorCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
) {
  const matrixCellSize = Math.max(2, Math.floor(canvasWidth / 24));
  const matrixColumnCount = Math.floor(canvasWidth / matrixCellSize);
  const matrixRowCount = Math.floor(canvasHeight / matrixCellSize);
  const matrixColumnOffset = Math.floor(frameTimeMs * 0.006) % 5;

  for (let matrixColumnIndex = 0; matrixColumnIndex < matrixColumnCount; matrixColumnIndex += 1) {
    const matrixColumnPhase =
      (matrixColumnIndex + matrixColumnOffset) % 5;
    const matrixColumnHeight = 2 + ((matrixColumnIndex * 7) % Math.max(3, matrixRowCount - 3));
    const matrixColumnBottom = Math.floor(matrixRowCount * 0.8);

    for (
      let matrixCellIndex = 0;
      matrixCellIndex < matrixColumnHeight;
      matrixCellIndex += 1
    ) {
      const matrixOpacity =
        matrixColumnPhase === 0
          ? 0.68
          : 0.16 + (matrixCellIndex / matrixColumnHeight) * 0.34;
      canvasContext.fillStyle = `rgba(46,46,46,${matrixOpacity})`;
      canvasContext.fillRect(
        matrixColumnIndex * matrixCellSize,
        (matrixColumnBottom - matrixCellIndex) * matrixCellSize,
        matrixCellSize - 1,
        matrixCellSize - 1,
      );
    }
  }
}

function drawActionVectorCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
) {
  const matrixCellSize = Math.max(2, Math.floor(Math.min(canvasWidth, canvasHeight) / 14));
  const matrixArrow = [
    "0001000",
    "0011100",
    "0111110",
    "0001000",
    "0001000",
    "0001000",
    "0001000",
  ];
  const matrixOriginX =
    Math.floor(canvasWidth / matrixCellSize / 2) -
    Math.floor(matrixArrow[0].length / 2);
  const matrixOriginY =
    Math.floor(canvasHeight / matrixCellSize / 2) -
    Math.floor(matrixArrow.length / 2);
  const matrixPulse = 0.5 + 0.35 * Math.sin(frameTimeMs * 0.003);

  matrixArrow.forEach((matrixRow, matrixRowIndex) => {
    [...matrixRow].forEach((matrixCell, matrixColumnIndex) => {
      if (matrixCell !== "1") return;

      canvasContext.fillStyle =
        matrixRowIndex < 3
          ? CANVAS_ACCENT
          : `rgba(46,46,46,${matrixPulse})`;
      canvasContext.fillRect(
        (matrixOriginX + matrixColumnIndex) * matrixCellSize,
        (matrixOriginY + matrixRowIndex) * matrixCellSize,
        matrixCellSize - 1,
        matrixCellSize - 1,
      );
    });
  });

  const matrixSparkleOffset = Math.floor(frameTimeMs * 0.003) % 3;
  canvasContext.fillStyle = CANVAS_MUTED;
  canvasContext.fillRect(
    (matrixOriginX + matrixArrow[0].length + 1) * matrixCellSize,
    (matrixOriginY + 1 + matrixSparkleOffset) * matrixCellSize,
    matrixCellSize,
    matrixCellSize,
  );
}

export function drawPresentationCanvasFrame(
  canvasContext: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  frameTimeMs: number,
  canvasVariant: PresentationCanvasVariant,
) {
  canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

  switch (canvasVariant) {
    case "heroMatrix":
      drawHeroMatrixCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        frameTimeMs,
      );
      break;
    case "featureMatrix":
      drawFeatureMatrixCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        frameTimeMs,
      );
      break;
    case "valueMatrix":
      drawValueMatrixCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        frameTimeMs,
      );
      break;
    case "slideMatrix":
      drawSlideMatrixCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        frameTimeMs,
      );
      break;
    case "contextVector":
      drawContextVectorCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        frameTimeMs,
      );
      break;
    case "workflowMatrix":
      drawWorkflowMatrixCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        frameTimeMs,
      );
      break;
    case "capabilityVector":
      drawCapabilityVectorCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        frameTimeMs,
      );
      break;
    case "actionVector":
      drawActionVectorCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        frameTimeMs,
      );
      break;
  }
}
