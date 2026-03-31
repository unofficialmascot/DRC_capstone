import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface FormTableProps extends React.HTMLAttributes<HTMLTableElement> {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  className?: string;
}

export const FormTable = React.forwardRef<HTMLTableElement, FormTableProps>(
  ({ className, headers, rows, ...props }, ref) => (
    <Table ref={ref} className={cn("w-full", className)} {...props}>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead key={index} className="bg-gray-50 text-left font-semibold text-gray-700">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <TableCell key={cellIndex} className="border-gray-200">
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
);
FormTable.displayName = "FormTable";