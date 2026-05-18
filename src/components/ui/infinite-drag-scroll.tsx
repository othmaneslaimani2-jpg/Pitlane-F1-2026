import {
  animate,
  motion,
  useMotionValue,
  wrap,
} from "motion/react";
import type { Variants } from "motion/react";
import {
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  createContext,
} from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

//Types
type variants = "default" | "masonry" | "polaroid";

// Create Context
const GridVariantContext = createContext<variants | undefined>(undefined);

//Motion Variants
const rowVariants: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: () => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: Math.random() * 0.3,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export const DraggableContainer = ({
  className,
  children,
  variant,
}: {
  className?: string;
  children: React.ReactNode;
  variant?: variants;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const [isDragging, setIsDragging] = useState(false);
  const isWheelScrolling = useRef(false);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIsDragging = () => {
    setIsDragging(true);
    isWheelScrolling.current = false;
    if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
  };
  const handleIsNotDragging = () => setIsDragging(false);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // const { width, height } = container.getBoundingClientRect();

    const xDrag = x.on("change", (latest) => {
      const containerEl = ref.current;
      if (!containerEl) return;
      const { width: currentWidth } = containerEl.getBoundingClientRect();
      const wrappedX = wrap(-(currentWidth / 2), 0, latest);
      if (wrappedX !== latest) {
        x.set(wrappedX);
      }
    });

    const yDrag = y.on("change", (latest) => {
      const containerEl = ref.current;
      if (!containerEl) return;
      const { height: currentHeight } = containerEl.getBoundingClientRect();
      const limitY = currentHeight / 2;

      if (isWheelScrolling.current) {
        const parentHeight = containerEl.parentElement?.getBoundingClientRect().height || currentHeight / 4;
        const maxScroll = Math.min(0, -(limitY - parentHeight));
        const clampedY = Math.max(maxScroll, Math.min(0, latest));
        if (clampedY !== latest) {
          y.set(clampedY);
        }
        return;
      }

      const wrappedY = wrap(-limitY, 0, latest);
      if (wrappedY !== latest) {
        y.set(wrappedY);
      }
    });

    const handleWheelScroll = (event: WheelEvent) => {
      if (!isDragging) {
        const containerEl = ref.current;
        if (!containerEl) return;

        const parentRect = containerEl.parentElement?.getBoundingClientRect();
        let parentHeight = containerEl.getBoundingClientRect().height / 4;
        if (parentRect) {
          const isInside =
            event.clientX >= parentRect.left &&
            event.clientX <= parentRect.right &&
            event.clientY >= parentRect.top &&
            event.clientY <= parentRect.bottom;
          if (!isInside) return;
          parentHeight = parentRect.height;
        }

        const rect = containerEl.getBoundingClientRect();
        const limitY = rect.height / 2; // Height of one full block of 27 images
        const currentY = y.get();
        const maxScroll = Math.min(0, -(limitY - parentHeight));
        
        const deltaY = event.deltaY * 2.7;

        // Check if we should lock scroll
        let shouldLock = false;

        if (deltaY > 0) {
          // Scrolling down: lock page scroll if we haven't reached the bottom limit yet
          if (currentY > maxScroll + 5) {
            shouldLock = true;
          }
        } else if (deltaY < 0) {
          // Scrolling up: lock page scroll if we haven't reached the top limit yet
          if (currentY < -5) {
            shouldLock = true;
          }
        }

        if (shouldLock) {
          if (event.cancelable) {
            event.preventDefault();
          }

          // Mark that we are wheel scrolling
          isWheelScrolling.current = true;
          if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
          wheelTimeoutRef.current = setTimeout(() => {
            isWheelScrolling.current = false;
          }, 400);

          // Calculate next position, clamp it between maxScroll and 0 to prevent infinite scrolling
          // without releasing lock
          const targetY = Math.max(maxScroll, Math.min(0, currentY - deltaY));

          animate(y, targetY, {
            type: "tween",
            duration: 0.3,
            ease: "easeOut",
          });
        }
      }
    };

    window.addEventListener("wheel", handleWheelScroll, { passive: false });
    return () => {
      xDrag();
      yDrag();
      window.removeEventListener("wheel", handleWheelScroll);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, [x, y, isDragging]);

  return (
    <GridVariantContext.Provider value={variant}>
      <div className="h-full w-full overflow-hidden">
        <motion.div
          className="h-full w-full overflow-hidden"
        >
          <motion.div
            className={cn(
              "grid h-fit w-fit cursor-grab grid-cols-[repeat(2,1fr)] bg-[#141414] active:cursor-grabbing will-change-transform",
              className,
            )}
            drag
            dragMomentum={true}
            dragTransition={{
              timeConstant: 200,
              power: 0.28,
              restDelta: 0,
              bounceStiffness: 0,
            }}
            onMouseDown={handleIsDragging}
            onMouseUp={handleIsNotDragging}
            onMouseLeave={handleIsNotDragging}
            onDragStart={() => {
              setIsDragging(true);
              isWheelScrolling.current = false;
              if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
            }}
            onDragEnd={() => {
              setIsDragging(false);
            }}
            style={{ x, y }}
            ref={ref}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </GridVariantContext.Provider>
  );
};

export const GridItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const variant = useContext(GridVariantContext);

  const gridItemStyles = cva(
    "overflow-hidden hover:cursor-pointer w-full h-full will-change-transform",
    {
      variants: {
        variant: {
          default: "rounded-sm",
          masonry: "even:mt-[60%] rounded-sm ",
          polaroid:
            "border-10 border-b-28 border-white shadow-xl even:rotate-3 odd:-rotate-2 hover:rotate-0 transition-transform ease-out duration-300 even:mt-[60%]",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    },
  );

  return (
    <motion.div
      className={cn(gridItemStyles({ variant, className }))}
      variants={rowVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

export const GridBody = memo(
  ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => {
    const variant = useContext(GridVariantContext);

    const gridBodyStyles = cva("grid grid-cols-[repeat(6,1fr)] h-fit w-fit", {
      variants: {
        variant: {
          default: "gap-14 p-7 md:gap-28 md:p-14",
          masonry: "gap-x-14 px-7 md:gap-x-28 md:px-14",
          polaroid: "gap-x-14 px-7 md:gap-x-28 md:px-14",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    });

    return (
      <>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(gridBodyStyles({ variant, className }))}
          >
            {children}
          </div>
        ))}
      </>
    );
  },
);

GridBody.displayName = "GridBody";
