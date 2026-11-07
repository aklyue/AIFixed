import { useEffect, useRef } from "react";
import {
  drawPresentationCanvasFrame,
} from "../../lib/PresentationCanvasMatrix";
import type { PresentationCanvasVariant } from "../../lib/PresentationCanvasMatrix";

interface PresentationCanvasProps {
  variant: PresentationCanvasVariant;
  className?: string;
}

const PresentationCanvas = ({
  variant,
  className,
}: PresentationCanvasProps) => {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasElementRef.current;
    const canvasContext = canvasElement?.getContext("2d");
    if (!canvasElement || !canvasContext) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let canvasWidth = 0;
    let canvasHeight = 0;
    let pixelRatio = 1;
    let animationFrameId = 0;
    let isCanvasVisible = true;
    let frameTimeMs = 0;

    const resizePresentationCanvas = () => {
      const canvasBounds = canvasElement.getBoundingClientRect();
      canvasWidth = canvasBounds.width;
      canvasHeight = canvasBounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvasElement.width = Math.round(canvasWidth * pixelRatio);
      canvasElement.height = Math.round(canvasHeight * pixelRatio);
      canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      canvasContext.imageSmoothingEnabled = true;
      renderPresentationCanvasFrame(reducedMotionQuery.matches ? 0 : frameTimeMs);
    };

    const renderPresentationCanvasFrame = (nextFrameTimeMs: number) => {
      animationFrameId = 0;
      frameTimeMs = nextFrameTimeMs;
      canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
      drawPresentationCanvasFrame(
        canvasContext,
        canvasWidth,
        canvasHeight,
        reducedMotionQuery.matches ? 0 : frameTimeMs,
        variant,
      );

      if (isCanvasVisible && !reducedMotionQuery.matches) {
        animationFrameId = window.requestAnimationFrame(
          renderPresentationCanvasFrame,
        );
      }
    };

    const schedulePresentationCanvasFrame = () => {
      if (
        isCanvasVisible &&
        !reducedMotionQuery.matches &&
        animationFrameId === 0
      ) {
        animationFrameId = window.requestAnimationFrame(
          renderPresentationCanvasFrame,
        );
      } else if (reducedMotionQuery.matches) {
        renderPresentationCanvasFrame(0);
      }
    };

    const canvasResizeObserver = new ResizeObserver(
      resizePresentationCanvas,
    );
    canvasResizeObserver.observe(canvasElement);

    const canvasVisibilityObserver = new IntersectionObserver(
      ([canvasEntry]) => {
        isCanvasVisible = canvasEntry.isIntersecting;

        if (isCanvasVisible) {
          schedulePresentationCanvasFrame();
        } else if (animationFrameId !== 0) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
      },
    );
    canvasVisibilityObserver.observe(canvasElement);

    const handleMotionPreferenceChange = () => {
      if (reducedMotionQuery.matches && animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
        renderPresentationCanvasFrame(0);
      } else {
        schedulePresentationCanvasFrame();
      }
    };

    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);
    resizePresentationCanvas();
    schedulePresentationCanvasFrame();

    return () => {
      canvasResizeObserver.disconnect();
      canvasVisibilityObserver.disconnect();
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasElementRef}
      className={className}
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
};

export default PresentationCanvas;
