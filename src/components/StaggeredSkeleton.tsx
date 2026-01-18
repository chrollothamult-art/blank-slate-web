import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StaggeredSkeletonGridProps {
  count?: number;
  columns?: number;
  aspectRatio?: "square" | "video" | "portrait";
  className?: string;
}

export const StaggeredSkeletonGrid = ({
  count = 8,
  columns = 4,
  aspectRatio = "video",
  className,
}: StaggeredSkeletonGridProps) => {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-[4/3]",
    portrait: "aspect-[3/4]",
  };

  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <motion.div
      className={cn(
        "grid gap-6",
        gridClasses[columns as keyof typeof gridClasses] || gridClasses[4],
        className
      )}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08 },
        },
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="space-y-3"
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 },
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Skeleton className={cn("w-full rounded-2xl", aspectClasses[aspectRatio])} />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
        </motion.div>
      ))}
    </motion.div>
  );
};

interface StaggeredSkeletonListProps {
  count?: number;
  className?: string;
}

export const StaggeredSkeletonList = ({
  count = 5,
  className,
}: StaggeredSkeletonListProps) => {
  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 },
        },
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-4 p-4 rounded-2xl border border-border/50"
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </motion.div>
      ))}
    </motion.div>
  );
};
