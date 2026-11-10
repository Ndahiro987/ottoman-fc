"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <table className={cn("w-full text-sm text-left rtl:text-right text-gray-secondary", className)} {...props}>
      {children}
    </table>
  );
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead className={cn(className)} {...props}>
      {children}
    </thead>
  );
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return <tbody className={cn(className)} {...props}>{children}</tbody>;
}

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
}

export function TableFooter({ className, children, ...props }: TableFooterProps) {
  return (
    <tfoot className={cn(className)} {...props}>
      {children}
    </tfoot>
  );
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children?: React.ReactNode;
}

export function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <tr className={cn("border-b transition-colors hover:bg-gray-light/50 data-[state=selected]:bg-gray-light", className)} {...props}>
      {children}
    </tr>
  );
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "text-gray-secondary font-semibold bg-gray-light",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td className={cn("p-4 align-middle", className)} {...props}>
      {children}
    </td>
  );
}

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  children?: React.ReactNode;
}

export function TableCaption({ className, children, ...props }: TableCaptionProps) {
  return (
    <caption className={cn("text-gray-secondary text-sm mb-4", className)} {...props}>
      {children}
    </caption>
  );
}
