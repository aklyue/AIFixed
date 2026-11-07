import { useEffect, useRef } from "react";
import {
  drawPixelCanvasMatrixFrame,
} from "../../lib/PixelCanvasMatrix";
import type { PixelCanvasVariant } from "../../lib/PixelCanvasMatrix";

interface PixelCanvasProps {
  variant: PixelCanvasVariant;
  className?: string;
}

const PixelCanvas = ({ variant, className }: PixelCanvasProps) => {
  const pixelCanvasElementRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const pixelCanvasElement = pixelCanvasElementRef.current;
    const pixelCanvasContext = pixelCanvasElement?.getContext("2d");
    if (!pixelCanvasElement || !pixelCanvasContext) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let pixelCanvasWidth = 0;
    let pixelCanvasHeight = 0;
    let pixelCanvasRatio = 1;
    let pixelCanvasFrameId = 0;
    let isPixelCanvasVisible = true;
    let pixelCanvasFrameTime = 0;

    const resizePixelCanvas = () => {
      const pixelCanvasBounds = pixelCanvasElement.getBoundingClientRect();
      pixelCanvasWidth = pixelCanvasBounds.width;
      pixelCanvasHeight = pixelCanvasBounds.height;
      pixelCanvasRatio = Math.min(window.devicePixelRatio || 1, 2);

      pixelCanvasElement.width = Math.round(pixelCanvasWidth * pixelCanvasRatio);
      pixelCanvasElement.height = Math.round(
        pixelCanvasHeight * pixelCanvasRatio,
      );
      const pixelCanvasUnit =
        (Math.min(pixelCanvasWidth, pixelCanvasHeight) * pixelCanvasRatio) / 12;
      const pixelCanvasOffsetX =
        ((pixelCanvasWidth - pixelCanvasHeight) / 2) * pixelCanvasRatio;
      const pixelCanvasOffsetY =
        ((pixelCanvasHeight - pixelCanvasWidth) / 2) * pixelCanvasRatio;
      pixelCanvasContext.setTransform(
        pixelCanvasUnit,
        0,
        0,
        pixelCanvasUnit,
        pixelCanvasOffsetX,
        pixelCanvasOffsetY,
      );
      renderPixelCanvasFrame(reducedMotionQuery.matches ? 0 : pixelCanvasFrameTime);
    };

    const renderPixelCanvasFrame = (nextPixelCanvasFrameTime: number) => {
      pixelCanvasFrameId = 0;
      pixelCanvasFrameTime = nextPixelCanvasFrameTime;

      drawPixelCanvasMatrixFrame(
        pixelCanvasContext,
        reducedMotionQuery.matches ? 0 : pixelCanvasFrameTime,
        variant,
      );

      if (isPixelCanvasVisible && !reducedMotionQuery.matches) {
        pixelCanvasFrameId = window.requestAnimationFrame(renderPixelCanvasFrame);
      }
    };

    const schedulePixelCanvasFrame = () => {
      if (
        isPixelCanvasVisible &&
        !reducedMotionQuery.matches &&
        pixelCanvasFrameId === 0
      ) {
        pixelCanvasFrameId = window.requestAnimationFrame(renderPixelCanvasFrame);
      } else if (reducedMotionQuery.matches) {
        renderPixelCanvasFrame(0);
      }
    };

    const pixelCanvasResizeObserver = new ResizeObserver(resizePixelCanvas);
    pixelCanvasResizeObserver.observe(pixelCanvasElement);

    const pixelCanvasVisibilityObserver = new IntersectionObserver(
      ([pixelCanvasEntry]) => {
        isPixelCanvasVisible = pixelCanvasEntry.isIntersecting;

        if (isPixelCanvasVisible) {
          schedulePixelCanvasFrame();
        } else if (pixelCanvasFrameId !== 0) {
          window.cancelAnimationFrame(pixelCanvasFrameId);
          pixelCanvasFrameId = 0;
        }
      },
    );
    pixelCanvasVisibilityObserver.observe(pixelCanvasElement);

    const handlePixelCanvasMotionPreference = () => {
      if (reducedMotionQuery.matches && pixelCanvasFrameId !== 0) {
        window.cancelAnimationFrame(pixelCanvasFrameId);
        pixelCanvasFrameId = 0;
        renderPixelCanvasFrame(0);
      } else {
        schedulePixelCanvasFrame();
      }
    };

    reducedMotionQuery.addEventListener(
      "change",
      handlePixelCanvasMotionPreference,
    );
    resizePixelCanvas();
    schedulePixelCanvasFrame();

    return () => {
      pixelCanvasResizeObserver.disconnect();
      pixelCanvasVisibilityObserver.disconnect();
      reducedMotionQuery.removeEventListener(
        "change",
        handlePixelCanvasMotionPreference,
      );
      if (pixelCanvasFrameId !== 0) {
        window.cancelAnimationFrame(pixelCanvasFrameId);
      }
    };
  }, [variant]);

  return (
    <canvas
      ref={pixelCanvasElementRef}
      className={className}
      aria-hidden="true"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        imageRendering: "pixelated",
      }}
    />
  );
};

export default PixelCanvas;
