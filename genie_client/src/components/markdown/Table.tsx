"use client";

import { cn } from "@/lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table = ({ className, ...props }: TableProps) => (
  <div className="my-6 w-full overflow-y-auto overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
    <table className={cn("w-full text-sm text-left", className)} {...props} />
  </div>
);

export const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn(
      "bg-gray-100 text-gray-700 font-medium uppercase text-xs",
      className,
    )}
    {...props}
  />
);

export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody
    className={cn("divide-y divide-gray-200 bg-white", className)}
    {...props}
  />
);

export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn("hover:bg-gray-50/80 transition-colors", className)}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn("px-6 py-3 font-semibold tracking-wider", className)}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn("px-6 py-4 whitespace-nowrap text-gray-600", className)}
    {...props}
  />
);
