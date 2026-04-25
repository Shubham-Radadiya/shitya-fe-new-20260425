import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";

const DELAY_MS = 150;
const GAP = 10;
const VIEW_PAD = 8;

function computeCoords(triggerRect, popW, popH, position) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceAbove = triggerRect.top;
  const spaceBelow = vh - triggerRect.bottom;

  if (position === "right") {
    let left = triggerRect.right + GAP;
    let top = triggerRect.top + triggerRect.height / 2 - popH / 2;
    if (left + popW > vw - VIEW_PAD) {
      return computeCoordsVertical(
        triggerRect,
        popW,
        popH,
        spaceAbove,
        spaceBelow,
        vw,
        vh
      );
    }
    top = Math.max(
      VIEW_PAD,
      Math.min(top, vh - popH - VIEW_PAD)
    );
    return { top, left, placement: "right" };
  }

  return computeCoordsVertical(
    triggerRect,
    popW,
    popH,
    spaceAbove,
    spaceBelow,
    vw,
    vh
  );
}

function computeCoordsVertical(
  triggerRect,
  popW,
  popH,
  spaceAbove,
  spaceBelow,
  vw,
  vh
) {
  let placement = "top";
  if (
    spaceAbove < popH + GAP + VIEW_PAD &&
    spaceBelow > spaceAbove
  ) {
    placement = "bottom";
  } else if (
    spaceBelow < popH + GAP + VIEW_PAD &&
    spaceAbove > spaceBelow
  ) {
    placement = "top";
  }

  let left = triggerRect.left + triggerRect.width / 2 - popW / 2;
  left = Math.max(VIEW_PAD, Math.min(left, vw - popW - VIEW_PAD));

  let top =
    placement === "top"
      ? triggerRect.top - popH - GAP
      : triggerRect.bottom + GAP;

  top = Math.max(VIEW_PAD, Math.min(top, vh - popH - VIEW_PAD));

  return { top, left, placement };
}

/**
 * Renders tooltip in a portal (fixed) so it is not clipped by scroll parents
 * or covered by the dashboard header stacking.
 */
const SettingTooltip = ({
  content,
  children,
  position = "top",
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState(null);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  }, []);

  const show = useCallback(() => {
    clearTimers();
    showTimer.current = setTimeout(() => setVisible(true), DELAY_MS);
  }, [clearTimers]);

  const hide = useCallback(() => {
    clearTimers();
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setCoords(null);
    }, 80);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const pop = popRef.current;
    if (!visible || !trigger || !pop) return;

    const tr = trigger.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    const popW = pr.width || pop.offsetWidth || 260;
    const popH = pr.height || pop.offsetHeight || 80;

    setCoords(computeCoords(tr, popW, popH, position));
  }, [visible, position]);

  useLayoutEffect(() => {
    if (!visible) return undefined;

    updatePosition();
    const raf = requestAnimationFrame(() => updatePosition());

    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [visible, content, position, updatePosition]);

  if (!content) {
    return <>{children}</>;
  }

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;

  return (
    <span
      ref={triggerRef}
      className={`setting-tooltip ${className}`.trim()}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      {visible && portalTarget
        ? createPortal(
            <span
              ref={popRef}
              className="setting-tooltip__pop setting-tooltip__pop--portal"
              role="tooltip"
              style={{
                ...(coords
                  ? {
                      top: coords.top,
                      left: coords.left,
                      visibility: "visible",
                    }
                  : {
                      top: 0,
                      left: 0,
                      visibility: "hidden",
                    }),
              }}
            >
              <span className="setting-tooltip__text">{content}</span>
              <span
                className={`setting-tooltip__arrow ${
                  coords?.placement === "bottom"
                    ? "setting-tooltip__arrow--bottom"
                    : coords?.placement === "right"
                      ? "setting-tooltip__arrow--right"
                      : "setting-tooltip__arrow--top"
                }`}
                aria-hidden
              />
            </span>,
            portalTarget
          )
        : null}
    </span>
  );
};

export default SettingTooltip;
