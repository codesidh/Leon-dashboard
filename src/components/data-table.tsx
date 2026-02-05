"use client"

/*
 * TanStack Table's `useReactTable` returns helper functions that React Compiler
 * currently cannot safely memoize. We intentionally opt this component out of
 * the `react-hooks/incompatible-library` lint rule and rely on TanStack's
 * internal memoization.
 */
/* eslint-disable react-hooks/incompatible-library */

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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
import { Button } from "@/components/ui/button"

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
  /** Initial sort state when uncontrolled */
  initialSorting?: SortingState
  /** Initial page size for client-side pagination (default: 25) */
  initialPageSize?: number
  /** Page size options for the per-page selector */
  pageSizeOptions?: number[]
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const {
    columns,
    data,
    getRowId,
    sorting: controlledSorting,
    onSortingChange,
    enableSorting = true,
    initialSorting,
    initialPageSize = 25,
    pageSizeOptions = [10, 25, 50, 100],
  } = props

  const [uncontrolledSorting, setUncontrolledSorting] = React.useState<SortingState>(
    initialSorting ?? [],
  )
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  React.useEffect(() => {
    // Keep uncontrolled sorting in sync when initialSorting changes
    if (!controlledSorting && initialSorting) {
      setUncontrolledSorting(initialSorting)
    }
  }, [controlledSorting, initialSorting])

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting: controlledSorting ?? uncontrolledSorting,
      pagination,
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
    onPaginationChange: setPagination,
    enableSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDirection =
                  header.column.getIsSorted() === "asc"
                    ? "asc"
                    : header.column.getIsSorted() === "desc"
                      ? "desc"
                      : null

                return (
                  <TableHead
                    key={header.id}
                    className={canSort ? "cursor-pointer select-none" : undefined}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : (
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortDirection === "asc" && (
                              <span className="text-[10px] text-muted-foreground">▲</span>
                            )}
                            {sortDirection === "desc" && (
                              <span className="text-[10px] text-muted-foreground">▼</span>
                            )}
                          </div>
                        )}
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
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 py-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Page {currentPage} of {pageCount}
            </span>
            <span className="hidden sm:inline">
              • Showing {table.getRowModel().rows.length} of {data.length} rows
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-7 rounded-md border border-border bg-background px-1 text-xs"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                ›
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
