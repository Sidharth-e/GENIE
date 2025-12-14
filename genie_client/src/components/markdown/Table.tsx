"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table = ({ className, children, ...props }: TableProps) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!tableRef.current) return;

    const table = tableRef.current;
    let text = "";

    // Get headers
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
      (th as HTMLElement).innerText.trim(),
    );
    text += headers.join("\t") + "\n";

    // Get rows
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      const rowData = cells.map((cell) =>
        (cell as HTMLElement).innerText.replace(/[\r\n]+/g, " ").trim(),
      );
      text += rowData.join("\t") + "\n";
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="!my-6 !rounded-xl !border !border-gray-200 !shadow-sm !bg-white !overflow-hidden">
      <div className="!overflow-x-auto">
        <table
          ref={tableRef}
          className={cn(
            "!w-full !text-sm !text-left !border-collapse !m-0 !indent-0",
            className,
          )}
          {...props}
        >
          {children}
        </table>
      </div>

      {/* Bottom Container */}
      <div className="!bg-gray-50 !border-t !border-gray-200 !px-6 !py-4 !flex !items-center !justify-end">
        <button
          onClick={handleCopy}
          className="!inline-flex !items-center !gap-2 !px-3 !py-2 !bg-white !border !border-gray-300 !rounded-lg !text-sm !font-medium !text-gray-700 hover:!bg-gray-50 hover:!text-gray-900 !transition-all !shadow-sm focus:!outline-none focus:!ring-2 focus:!ring-offset-1 focus:!ring-indigo-500"
        >
          {copied ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="!text-green-600"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="!text-green-600 !font-medium">Copied!</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn(
      "!bg-gray-100 !text-gray-600 !font-medium !border-b !border-gray-200",
      className,
    )}
    {...props}
  />
);

export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("!divide-y !divide-gray-100", className)} {...props} />
);

export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      "hover:!bg-gray-50 !transition-colors !duration-200 !border-b-0 last:!border-b-0",
      className,
    )}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "!py-3 !px-6 !text-left !font-medium !text-gray-600 !bg-gray-100 !border-0",
      className,
    )}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn("!py-3 !px-6 !text-gray-600 !border-0", className)}
    {...props}
  />
);
