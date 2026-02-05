"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface DataTableProps<TData, TValue> {
  /** Column definitions for TanStack Table */
  columns: ColumnDef<TData, TValue>[]
  /** Raw row data */
  data: TData[]
  /** Optional unique id accessor; defaults to row index */
  getRowId?: (originalRow: TData, index: number) => string
  /** Controlled sorting from parent (optional) */
  sorting?: SortingState
  /** Sorting change handler when controlled */
  onSortingChange?: (sorting: SortingState) => void
  /** Enable client-side sorting (default: true) */
  enableSorting?: boolean
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const {
    columns,
    data,
    getRowId,
    sorting: controlledSorting,
    onSortingChange,
    enableSorting = true,
  } = props

  const [uncontrolledSorting, setUncontrolledSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting: controlledSorting ?? uncontrolledSorting,
    },
    onSortingChange: (updater) => {
      if (!enableSorting) return
      const nextValue =
        typeof updater === "function" ? updater(controlledSorting ?? uncontrolledSorting) : updater

      if (onSortingChange) {
        onSortingChange(nextValue)
      } else {
        setUncontrolledSorting(nextValue)
      }
    },
    enableSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
