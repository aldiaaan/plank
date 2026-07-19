import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useScrollable } from "../hooks/use-scrollable";
import { cn } from "../utils";

export type ScrollableContextValue = {
  scrollRef: HTMLDivElement | null;
  scrollToTop: () => void;
  registerScrollRef: (ref: HTMLDivElement | null) => void;
};

export type ScrollableProviderProps = {
  children: React.ReactNode;
};

export type ScrollableProps = {
  children: React.ReactNode;
  className?: string;
  shadowOffsetBottom?: number;
  shadowOffsetTop?: number;
};

export const ScrollableContext =
  createContext<ScrollableContextValue | null>(null);

export function ScrollableProvider(props: ScrollableProviderProps) {
  const { children } = props;

  const [scrollRef, registerScrollRef] = useState<HTMLDivElement | null>(null);

  const scrollToTop = useCallback(() => {
    if (scrollRef) {
      scrollRef.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [scrollRef]);

  return (
    <ScrollableContext.Provider
      value={{ scrollRef, scrollToTop, registerScrollRef }}
    >
      {children}
    </ScrollableContext.Provider>
  );
}

export function Scrollable(props: ScrollableProps) {
  const {
    children,
    className,
    shadowOffsetBottom = 0,
    shadowOffsetTop = 0,
  } = props;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const { registerScrollRef, scrollRef } = useScrollable();

  const handleScroll = useCallback(() => {
    const el = scrollRef;
    if (el) {
      const scrolledFromTop = el.scrollTop > 0;
      setIsScrolled(scrolledFromTop);

      const atTheBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 1;
      setIsAtBottom(atTheBottom);
    }
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef;
    if (el) {
      const hasScrollbar = el.scrollHeight > el.clientHeight;
      setIsAtBottom(!hasScrollbar);
    }

    handleScroll();
  }, [children, handleScroll, scrollRef]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <div
          data-slot="scrollable"
          ref={registerScrollRef}
          onScroll={handleScroll}
          className="h-full overflow-auto"
        >
          {children}
        </div>

        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 z-30 h-6 bg-gradient-to-b from-black/10 to-transparent transition-opacity",
            isScrolled ? "opacity-100" : "opacity-0",
          )}
          style={{ top: `${shadowOffsetTop}px` }}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 z-30 h-12 bg-gradient-to-t from-black/10 to-transparent transition-opacity",
            isAtBottom ? "opacity-0" : "opacity-100",
          )}
          style={{ bottom: `${shadowOffsetBottom}px` }}
        />
      </div>
    </div>
  );
}
