"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TourStep {
  /** data-tour attribute value on the target element */
  target: string;
  /** Short title (2-5 words) */
  title: string;
  /** Description (1 sentence max) */
  description: string;
  /** Position of tooltip relative to target */
  position?: "top" | "bottom" | "left" | "right";
}

interface Props {
  /** Unique ID per page to track completion in localStorage */
  tourId: string;
  steps: TourStep[];
  /** Primary color for buttons */
  accentColor?: string;
}

export default function InteractiveTour({ tourId, steps, accentColor = "#2563eb" }: Props) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<"top" | "bottom" | "left" | "right">("top");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const storageKey = `tour_done_${tourId}`;

  // Auto-start on first visit
  useEffect(() => {
    const done = localStorage.getItem(storageKey);
    if (!done && steps.length > 0) {
      // Small delay so the page renders first
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, [storageKey, steps.length]);

  const positionTooltip = useCallback(() => {
    if (!active || steps.length === 0) return;

    const step = steps[currentStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const tooltipW = 320;
    const tooltipH = tooltipRef.current?.offsetHeight || 140;
    const pad = 14;
    const arrowSize = 8;

    // Highlight the target element
    el.classList.add("tour-highlight");

    // Determine best position
    let pos = step.position;
    if (!pos) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      if (spaceBelow >= tooltipH + pad + arrowSize) pos = "bottom";
      else if (spaceAbove >= tooltipH + pad + arrowSize) pos = "top";
      else if (spaceRight >= tooltipW + pad + arrowSize) pos = "right";
      else if (spaceLeft >= tooltipW + pad + arrowSize) pos = "left";
      else pos = "bottom";
    }

    let top = 0;
    let left = 0;
    const aStyle: React.CSSProperties = { position: "absolute" };

    switch (pos) {
      case "bottom":
        top = rect.bottom + pad;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        aStyle.top = -arrowSize;
        aStyle.left = "50%";
        aStyle.transform = "translateX(-50%)";
        aStyle.borderLeft = `${arrowSize}px solid transparent`;
        aStyle.borderRight = `${arrowSize}px solid transparent`;
        aStyle.borderBottom = `${arrowSize}px solid white`;
        break;
      case "top":
        top = rect.top - tooltipH - pad;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        aStyle.bottom = -arrowSize;
        aStyle.left = "50%";
        aStyle.transform = "translateX(-50%)";
        aStyle.borderLeft = `${arrowSize}px solid transparent`;
        aStyle.borderRight = `${arrowSize}px solid transparent`;
        aStyle.borderTop = `${arrowSize}px solid white`;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + pad;
        aStyle.left = -arrowSize;
        aStyle.top = "50%";
        aStyle.transform = "translateY(-50%)";
        aStyle.borderTop = `${arrowSize}px solid transparent`;
        aStyle.borderBottom = `${arrowSize}px solid transparent`;
        aStyle.borderRight = `${arrowSize}px solid white`;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - pad;
        aStyle.right = -arrowSize;
        aStyle.top = "50%";
        aStyle.transform = "translateY(-50%)";
        aStyle.borderTop = `${arrowSize}px solid transparent`;
        aStyle.borderBottom = `${arrowSize}px solid transparent`;
        aStyle.borderLeft = `${arrowSize}px solid white`;
        break;
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - tooltipH - 12));

    setTooltipStyle({
      position: "fixed",
      top,
      left,
      width: tooltipW,
      zIndex: 10002,
    });
    setArrowStyle(aStyle);
    setArrowDirection(pos);
  }, [active, currentStep, steps]);

  // Position on mount, step change, and resize
  useEffect(() => {
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [positionTooltip]);

  // Clean up highlights when step changes
  useEffect(() => {
    return () => {
      document.querySelectorAll(".tour-highlight").forEach((el) => {
        el.classList.remove("tour-highlight");
      });
    };
  }, [currentStep, active]);

  const finish = useCallback(() => {
    setActive(false);
    localStorage.setItem(storageKey, "1");
    document.querySelectorAll(".tour-highlight").forEach((el) => {
      el.classList.remove("tour-highlight");
    });
  }, [storageKey]);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const startTour = () => {
    setCurrentStep(0);
    setActive(true);
  };

  if (steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      {/* Floating "?" button to restart tour */}
      {!active && (
        <button
          onClick={startTour}
          className="fixed bottom-5 right-5 w-11 h-11 rounded-full shadow-lg text-white flex items-center justify-center text-lg font-bold z-[9999] hover:scale-110 active:scale-95 transition-transform tour-help-btn"
          style={{ backgroundColor: accentColor }}
          title="Ver recorrido guiado"
        >
          ?
        </button>
      )}

      {/* Tour overlay + tooltip */}
      {active && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[10000] tour-overlay"
            onClick={finish}
          />

          {/* Tooltip */}
          <div
            ref={tooltipRef}
            style={tooltipStyle}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 tour-tooltip"
          >
            {/* Arrow */}
            <div style={arrowStyle} />

            {/* Content */}
            <div className="p-4">
              {/* Progress dots */}
              <div className="flex items-center gap-1 mb-3">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === currentStep ? 20 : 6,
                      backgroundColor: i === currentStep ? accentColor : "#e5e7eb",
                    }}
                  />
                ))}
              </div>

              {/* Step number */}
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                {currentStep + 1} de {steps.length}
              </p>

              {/* Title & description */}
              <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
            </div>

            {/* Actions */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <button
                onClick={finish}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Saltar tour
              </button>
              <div className="flex gap-2">
                {!isFirst && (
                  <button
                    onClick={prev}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Anterior
                  </button>
                )}
                <button
                  onClick={next}
                  className="text-xs px-4 py-1.5 rounded-lg text-white font-medium transition-colors hover:brightness-110"
                  style={{ backgroundColor: accentColor }}
                >
                  {isLast ? "Entendido" : "Siguiente"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
