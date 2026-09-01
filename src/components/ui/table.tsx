import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    // On narrow screens a wide table (many columns) overflows its container;
    // overflow-auto already makes it swipeable, but nothing hints that more
    // columns exist off-screen. This fade only shows while there's actually
    // more to scroll to, and disappears once fully scrolled to the end.
    const [showScrollFade, setShowScrollFade] = React.useState(false);

    const checkOverflow = React.useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      setShowScrollFade(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    }, []);

    React.useEffect(() => {
      checkOverflow();
      const el = scrollRef.current;
      if (!el) return;
      el.addEventListener("scroll", checkOverflow, { passive: true });
      const resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener("scroll", checkOverflow);
        resizeObserver.disconnect();
      };
    }, [checkOverflow]);

    return (
      <div className="relative">
        <div className="w-full overflow-auto" ref={scrollRef}>
          <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
        </div>
        {showScrollFade && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent"
            aria-hidden="true"
          />
        )}
      </div>
    );
  },
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
