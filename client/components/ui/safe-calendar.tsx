import * as React from "react";
import { Calendar, CalendarProps } from "./calendar";

/**
 * A wrapper around the Calendar component that prevents ResizeObserver loops
 * by debouncing updates and catching errors
 */
const SafeCalendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (props, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    // Reset visibility after a short delay if there are any issues
    React.useEffect(() => {
      if (!isVisible) {
        timeoutRef.current = setTimeout(() => {
          setIsVisible(true);
        }, 100);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [isVisible]);

    // Catch any ResizeObserver errors and temporarily hide/show the calendar
    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        const msg = String(event.message || "").toLowerCase();
        if (msg.includes("resizeobserver") || msg.includes("loop completed")) {
          event.preventDefault();
          setIsVisible(false);
          return false;
        }
      };

      window.addEventListener("error", handleError, true);
      return () => window.removeEventListener("error", handleError, true);
    }, []);

    if (!isVisible) {
      return (
        <div
          ref={ref}
          className="h-[300px] w-[300px] animate-pulse bg-gray-100 rounded"
        />
      );
    }

    try {
      return <Calendar ref={ref} {...props} />;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.toLowerCase().includes("resizeobserver") ||
          error.message.toLowerCase().includes("loop completed"))
      ) {
        // If there's a ResizeObserver error, show a simple fallback
        return (
          <div
            ref={ref}
            className="h-[300px] w-[300px] bg-gray-50 rounded flex items-center justify-center text-gray-500"
          >
            Calendar loading...
          </div>
        );
      }
      throw error;
    }
  },
);

SafeCalendar.displayName = "SafeCalendar";

export { SafeCalendar };
export type { CalendarProps };
