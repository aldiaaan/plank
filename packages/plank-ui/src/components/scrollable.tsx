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
      <div
        data-slot="scrollable"
        ref={registerScrollRef}
        onScroll={handleScroll}
        style={
          {
            "--shadow--bottom-offset": `${shadowOffsetBottom}px`,
            "--shadow--top-offset": `${shadowOffsetTop}px`,
          } as React.CSSProperties
        }
        className={cn(
          "h-full overflow-y-auto",
          "before:content-[''] before:absolute before:top-[var(--shadow--top-offset)] before:left-0 before:right-0",
          "before:h-6 before:bg-gradient-to-b before:from-black/10 before:to-transparent",
          "before:pointer-events-none before:transition-opacity",
          "after:content-[''] after:absolute after:bottom-[var(--shadow--bottom-offset)] after:left-0 after:right-0",
          "after:h-12 after:bg-gradient-to-t after:from-black/10 after:to-transparent",
          "after:pointer-events-none after:transition-opacity",
          isScrolled ? "before:opacity-100" : "before:opacity-0",
          isAtBottom ? "after:opacity-0" : "after:opacity-100",
        )}
      >
        {children}
      </div>
    </div>
  );
}
