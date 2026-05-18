import * as React from "react"

import {
  motion,
  useScroll,
  useTransform,
} from "motion/react"
import type {
  HTMLMotionProps,
  MotionValue,
  Variants,
} from "motion/react"

import { cn } from "@/lib/utils"

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>
}

const SPRING_CONFIG = {
  type: "spring",
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005,
  duration: 0.3,
} as const
const blurVariants: Variants = {
  hidden: {
    filter: "blur(10px)",
    opacity: 0,
  },
  visible: {
    filter: "blur(0px)",
    opacity: 1,
  },
}

const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined)
function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext)
  if (!context) {
    throw new Error(
      "useContainerScrollContext must be used within a ContainerScroll Component"
    )
  }
  return context
}
export const ContainerScroll = ({
  children,
  className,
  style,
  ...props
}: React.HtmlHTMLAttributes<HTMLDivElement>) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
  })
  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative min-h-[120vh]", className)}
        style={{
          perspective: "1000px",
          perspectiveOrigin: "center top",
          transformStyle: "preserve-3d",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  )
}
ContainerScroll.displayName = "ContainerScroll"
export const ContainerSticky = ({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "sticky left-0 top-0 min-h-120 w-full overflow-hidden",
        className
      )}
      style={{
        perspective: "1000px",
        perspectiveOrigin: "center top",
        transformStyle: "preserve-3d",
        transformOrigin: "50% 50%",
        ...style,
      }}
      {...props}
    />
  )
}
ContainerSticky.displayName = "ContainerSticky"

export const GalleryContainer = ({
  children,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & HTMLMotionProps<"div">) => {
  const { scrollYProgress } = useContainerScrollContext()
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [75, 0])
  const scale = useTransform(scrollYProgress, [0.5, 0.9], [1.2, 1])

  return (
    <motion.div
      className={cn(
        "relative grid size-full grid-cols-3 gap-2 rounded-2xl",
        className
      )}
      style={{
        rotateX,
        scale,
        transformStyle: "preserve-3d",
        perspective: "1000px",
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
GalleryContainer.displayName = "GalleryContainer"

export const GalleryCol = ({
  className,
  style,
  yRange,
  direction = "down",
  ...props
}: HTMLMotionProps<"div"> & { yRange?: string[]; direction?: "up" | "down" }) => {
  const { scrollYProgress } = useContainerScrollContext()
  const colRef = React.useRef<HTMLDivElement>(null)
  const [diff, setDiff] = React.useState(0)

  React.useEffect(() => {
    if (!colRef.current) return

    const updateHeight = () => {
      if (colRef.current) {
        const colHeight = colRef.current.scrollHeight
        const parentHeight = window.innerHeight
        // We translate by the difference between column height and viewport height.
        // We add some buffer so the columns scroll all the way out of/into screen beautifully.
        const d = Math.max(0, colHeight - parentHeight + 32)
        setDiff(d)
      }
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })
    observer.observe(colRef.current)

    const images = colRef.current.querySelectorAll("img")
    images.forEach((img) => {
      if (img.complete) {
        updateHeight()
      } else {
        img.addEventListener("load", updateHeight)
      }
    })

    return () => {
      observer.disconnect()
      images.forEach((img) => {
        img.removeEventListener("load", updateHeight)
      })
    }
  }, [])

  // If yRange is explicitly passed, map it; otherwise, use our dynamic calculation!
  const transformRange = (yRange ? yRange : (direction === "down" ? [0, -diff] : [-diff, 0])) as (string | number)[]
  const y = useTransform(scrollYProgress, [0, 1], transformRange)

  return (
    <motion.div
      ref={colRef}
      className={cn("relative flex w-full flex-col gap-2 ", className)}
      style={{
        y,
        ...style,
      }}
      {...props}
    />
  )
}
GalleryCol.displayName = "GalleryCol"


export const ContainerStagger = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ className, viewport, transition, ...props }, ref) => {
  return (
    <motion.div
      className={cn("relative", className)}
      ref={ref}
      initial="hidden"
      whileInView={"visible"}
      viewport={{ once: viewport?.once ?? true, ...viewport }}
      transition={{
        staggerChildren: transition?.staggerChildren || 0.2,
        ...transition,
      }}
      {...props}
    />
  )
})
ContainerStagger.displayName = "ContainerStagger"

export const ContainerAnimated = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ className, transition, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      variants={blurVariants}
      transition={SPRING_CONFIG || transition}
      {...props}
    />
  )
})
ContainerAnimated.displayName = "ContainerAnimated"
