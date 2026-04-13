import type { JSX } from '@emotion/react/jsx-runtime'
import {
  alpha,
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useEffect, useRef } from 'react'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import CustomCheckbox from '../inputs/CustomCheckbox'

export interface Column<T> {
  id: keyof T
  label_desc?: string
  label: JSX.Element | string
  align?: 'right' | 'left' | 'center'
  render?: (value: any, row: T) => React.ReactNode
  minWidth?: number
  hiddenOnMobile?: boolean
  truncate?: boolean
  sticky?: 'left' | 'right'
  stickyOffset?: number
  backgroundColor?: string
}

export interface DataTableProps<T extends { id: string | number }> {
  rows: T[]
  columns: Column<T>[]
  title?: string
  subTitle?: string
  maxHeight?: number
  pagination?: boolean
  selectable?: boolean
  onSelectRows?: (ids: Array<T['id']>) => void
  selectedRowIds?: Array<T['id']>
  rowsPerPageOptions?: number[]
  defaultRowsPerPage?: number
  bgOverlayImg?: string
  renderExpandedRow?: (row: T) => React.ReactNode
  expandable?: boolean
  currentPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  totalCount?: number
  onRowClick?: (row: T) => void
  selectionResetToken?: number | string
}

export default function DataTable<T extends { id: string | number }>(props: DataTableProps<T>) {
  const {
    rows,
    columns,
    title,
    subTitle,
    maxHeight = 500,
    pagination = false,
    selectable = false,
    onSelectRows,
    selectedRowIds,
    rowsPerPageOptions = [5, 10, 25],
    defaultRowsPerPage = 10,
    bgOverlayImg,
    renderExpandedRow,
    expandable,
    currentPage,
    onPageChange,
    onRowsPerPageChange,
    totalCount,
    onRowClick,
    selectionResetToken,
  } = props

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const primary = theme.palette.primary.main
  const textPrimary = theme.palette.text.primary
  const textSecondary = theme.palette.text.secondary
  const borderColor = alpha(textPrimary, 0.1)
  const softBorderColor = alpha(textPrimary, 0.06)
  const headerBg = 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,242,236,0.98) 100%)'
  const tableBg = '#FFFCF8'
  const rowHover = alpha(primary, 0.045)
  const mobileCardBg = 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,244,238,0.96) 100%)'

  const [localPage, setLocalPage] = React.useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = React.useState(defaultRowsPerPage)
  const [selectedIds, setSelectedIds] = React.useState<Array<T['id']>>([])
  const [expandedRowId, setExpandedRowId] = React.useState<T['id'] | null>(null)

  const expandedRef = useRef<HTMLDivElement | null>(null)

  const page = currentPage ?? localPage
  const rowsPerPage = localRowsPerPage
  const paginationPage = currentPage !== undefined ? Math.max(page - 1, 0) : page

  const handleChangePage = (_: unknown, newPage: number) => {
    if (onPageChange) onPageChange(newPage + 1)
    else setLocalPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = +event.target.value
    if (onRowsPerPageChange) onRowsPerPageChange(newRowsPerPage)
    else {
      setLocalRowsPerPage(newRowsPerPage)
      setLocalPage(0)
    }
  }

  const isAllSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))

  const handleSelect = (id: T['id']) => {
    const selected = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id]
    setSelectedIds(selected)
    onSelectRows?.(selected)
  }

  const handleSelectAll = (checked: boolean) => {
    const allIds = checked ? rows.map((r) => r.id) : []
    setSelectedIds(allIds)
    onSelectRows?.(allIds)
  }

  useEffect(() => {
    if (!selectedRowIds) return
    setSelectedIds(selectedRowIds)
  }, [selectedRowIds])

  useEffect(() => {
    setSelectedIds((currentSelectedIds) => {
      const visibleIds = new Set(rows.map((row) => row.id))
      const nextSelectedIds = currentSelectedIds.filter((id) => visibleIds.has(id))
      const isSameSelection =
        nextSelectedIds.length === currentSelectedIds.length &&
        nextSelectedIds.every((id, index) => id === currentSelectedIds[index])

      if (!isSameSelection) {
        onSelectRows?.(nextSelectedIds)
        return nextSelectedIds
      }

      return currentSelectedIds
    })
  }, [rows, onSelectRows])

  useEffect(() => {
    if (selectionResetToken === undefined) return
    setSelectedIds([])
    onSelectRows?.([])
  }, [selectionResetToken, onSelectRows])

  const toggleExpand = (id: T['id']) => {
    const isExpanding = id !== expandedRowId
    setExpandedRowId(isExpanding ? id : null)
    if (isExpanding && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 160)
    }
  }

  return (
    <CardContent
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 5,
        border: `1px solid ${borderColor}`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,247,241,0.98) 100%)',
        boxShadow: `0 20px 42px ${alpha(textPrimary, 0.07)}`,
        p: 0,
      }}
    >
      {bgOverlayImg && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgOverlayImg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.05,
            zIndex: 1,
          }}
        />
      )}

      <Box sx={{ position: 'relative', zIndex: 2, p: { xs: 1.6, sm: 2.1, md: 2.4 } }}>
        {(title || subTitle || pagination) && (
          <Stack
            mb={2}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{
              px: { xs: 0.4, sm: 0.6 },
              py: { xs: 0.5, sm: 0.8 },
            }}
          >
            <Stack spacing={0.8}>
              {title && (
                <Typography
                  sx={{
                    fontSize: { xs: '1.02rem', sm: '1.18rem' },
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: textPrimary,
                  }}
                >
                  {title}
                </Typography>
              )}
              {subTitle && (
                <Typography
                  sx={{
                    fontSize: '0.84rem',
                    color: textSecondary,
                    maxWidth: 640,
                    lineHeight: 1.6,
                  }}
                >
                  {subTitle}
                </Typography>
              )}
            </Stack>

            {pagination && totalCount !== undefined && (
              <TablePagination
                component="div"
                count={totalCount}
                page={paginationPage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderRadius: 999,
                  px: 1.2,
                  backgroundColor: alpha('#ffffff', 0.92),
                  border: `1px solid ${borderColor}`,
                  boxShadow: `0 10px 24px ${alpha(textPrimary, 0.05)}`,
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '12px',
                    color: textSecondary,
                    fontWeight: 600,
                  },
                  '& .MuiTablePagination-select': {
                    color: textPrimary,
                    fontWeight: 700,
                  },
                  '& .MuiTablePagination-actions button': {
                    color: primary,
                    '&:hover': {
                      backgroundColor: alpha(primary, 0.08),
                    },
                  },
                }}
              />
            )}
          </Stack>
        )}

        {rows.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1.3}
            sx={{
              minHeight: 300,
              py: 5,
              borderRadius: 4,
              border: `1px dashed ${alpha(primary, 0.16)}`,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(247,241,235,0.92) 100%)',
            }}
          >
            <Box
              component="img"
              src="/images/empty-files.png"
              alt="No data"
              sx={{ width: 260, opacity: 0.78 }}
            />
            <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
              No records to display
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Once activity starts, the operations feed will appear here.
            </Typography>
          </Stack>
        ) : isMobile ? (
          <Stack spacing={1.6}>
            {selectable && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 0.5,
                  py: 0.35,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CustomCheckbox
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Typography fontSize="12px" fontWeight={700} sx={{ color: textPrimary }}>
                    Select all
                  </Typography>
                </Stack>
                <Typography fontSize="12px" sx={{ color: textSecondary }}>
                  {selectedIds.length} selected
                </Typography>
              </Stack>
            )}
            {rows.map((row) => {
              const isExpanded = expandedRowId === row.id
              return (
                <Card
                  key={row.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${borderColor}`,
                    background: mobileCardBg,
                    boxShadow: `0 14px 28px ${alpha(textPrimary, 0.05)}`,
                  }}
                >
                  <CardContent sx={{ px: 2, py: 1.8 }}>
                    <Stack spacing={1.35}>
                      {selectable && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CustomCheckbox
                              checked={selectedIds.includes(row.id)}
                              onChange={() => handleSelect(row.id)}
                            />
                            <Typography fontSize="12px" fontWeight={700} sx={{ color: textPrimary }}>
                              Select entry
                            </Typography>
                          </Stack>
                        </Stack>
                      )}
                      {columns.map((col) => {
                        if (col.hiddenOnMobile) return null
                        const value = col.render ? col.render(row[col.id], row) : row[col.id]
                        return (
                          <Box key={col.id as string}>
                            <Typography
                              fontSize="11px"
                              fontWeight={800}
                              sx={{ color: alpha(textSecondary, 0.92), textTransform: 'uppercase', letterSpacing: '0.08em' }}
                            >
                              {col.label}
                            </Typography>
                            {col.label_desc ? (
                              <Typography fontSize="10px" fontWeight={600} sx={{ color: textSecondary, opacity: 0.85 }}>
                                {col.label_desc}
                              </Typography>
                            ) : null}
                            <Typography fontSize="13px" sx={{ color: textPrimary, mt: 0.45 }}>
                              {React.isValidElement(value)
                                ? value
                                : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                            </Typography>
                            <Divider sx={{ mt: 1, borderColor: softBorderColor }} />
                          </Box>
                        )
                      })}
                    </Stack>

                    {renderExpandedRow && (
                      <IconButton
                        size="small"
                        onClick={() => toggleExpand(row.id)}
                        sx={{
                          mt: 1,
                          color: primary,
                          bgcolor: alpha(primary, 0.08),
                          border: `1px solid ${alpha(primary, 0.14)}`,
                          '&:hover': { backgroundColor: alpha(primary, 0.12) },
                        }}
                      >
                        {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                      </IconButton>
                    )}

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box ref={expandedRef} mt={1.2}>
                        {renderExpandedRow?.(row)}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto', borderRadius: 5 }}>
            <TableContainer
              component={Paper}
              sx={{
                background: tableBg,
                border: `1px solid ${borderColor}`,
                minWidth: '100%',
                maxHeight,
                boxShadow: 'none',
                borderRadius: 4,
                backdropFilter: 'none',
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {selectable && (
                      <TableCell
                        padding="checkbox"
                        sx={{
                          position: 'sticky',
                          top: 0,
                          background: headerBg,
                          borderBottom: `1px solid ${borderColor}`,
                          zIndex: theme.zIndex.appBar + 1,
                          py: 1.4,
                        }}
                      >
                        <CustomCheckbox
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          color="primary"
                        />
                      </TableCell>
                    )}

                    {columns.map((col) =>
                      col.hiddenOnMobile && isMobile ? null : (
                        <TableCell
                          key={col.id as string}
                          align={col.align ?? 'left'}
                          sx={{
                            position: col.sticky ? 'sticky' : 'static',
                            top: 0,
                            background: headerBg,
                            color: alpha(textPrimary, 0.86),
                            minWidth: col.minWidth || 100,
                            fontWeight: 800,
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.09em',
                            zIndex: col.sticky ? theme.zIndex.appBar + 3 : theme.zIndex.appBar + 1,
                            borderBottom: `1px solid ${borderColor}`,
                            py: 1.4,
                            px: 2,
                            ...(col.sticky === 'right'
                              ? {
                                  right: col.stickyOffset ?? 0,
                                  boxShadow:
                                    col.stickyOffset === 0
                                      ? `-6px 0 10px ${alpha(textPrimary, 0.08)}`
                                      : undefined,
                                }
                              : {}),
                            ...(col.sticky === 'left'
                              ? {
                                  left: col.stickyOffset ?? 0,
                                  boxShadow: `6px 0 10px ${alpha(textPrimary, 0.08)}`,
                                }
                              : {}),
                          }}
                        >
                          {col.label}
                          {col.label_desc ? (
                            <Typography fontSize="10px" fontWeight={600} sx={{ color: alpha(textSecondary, 0.92), mt: 0.45 }}>
                              {col.label_desc}
                            </Typography>
                          ) : null}
                        </TableCell>
                      ),
                    )}

                    {expandable && renderExpandedRow && (
                      <TableCell
                        sx={{
                          position: 'sticky',
                          top: 0,
                          background: headerBg,
                          borderBottom: `1px solid ${borderColor}`,
                          width: 40,
                          zIndex: theme.zIndex.appBar + 1,
                        }}
                      />
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row) => {
                    const isExpanded = expandedRowId === row.id
                    return (
                      <React.Fragment key={row.id}>
                        <TableRow
                          hover={!!onRowClick}
                          onClick={onRowClick ? () => onRowClick(row) : undefined}
                          sx={{
                            borderBottom: `1px solid ${softBorderColor}`,
                            backgroundColor: '#fffdfa',
                            transition: 'background-color .18s ease, box-shadow .18s ease',
                            '&:nth-of-type(even)': {
                              backgroundColor: alpha('#F7F1EB', 0.5),
                            },
                            '&:hover': onRowClick
                              ? {
                                  backgroundColor: rowHover,
                                  cursor: 'pointer',
                                }
                              : {
                                  backgroundColor: alpha(primary, 0.025),
                                },
                          }}
                        >
                          {selectable && (
                            <TableCell padding="checkbox">
                              <CustomCheckbox
                                checked={selectedIds.includes(row.id)}
                                onChange={() => handleSelect(row.id)}
                                sx={{ color: primary }}
                              />
                            </TableCell>
                          )}

                          {columns.map((col) => {
                            if (col.hiddenOnMobile && isMobile) return null
                            const value = row[col.id]
                            const cellContent = col.render ? col.render(value, row) : (value as React.ReactNode)
                            const shouldTruncate = col.truncate !== false

                            let tooltipTitle: string | undefined
                            if (shouldTruncate && !React.isValidElement(cellContent)) {
                              if (value !== null && value !== undefined && typeof value !== 'object') {
                                tooltipTitle = String(value)
                              }
                            }

                            return (
                              <TableCell
                                key={col.id as string}
                                align={col.align ?? 'left'}
                                sx={{
                                  position: col.sticky ? 'sticky' : 'static',
                                  color: textPrimary,
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  whiteSpace: shouldTruncate ? 'nowrap' : 'normal',
                                  overflow: shouldTruncate ? 'hidden' : 'visible',
                                  textOverflow: shouldTruncate ? 'ellipsis' : 'clip',
                                  maxWidth: shouldTruncate ? 240 : 'none',
                                  py: 1.45,
                                  px: 2,
                                  borderBottom: 'none',
                                  backgroundColor: col.sticky ? '#FFFFFF' : undefined,
                                  zIndex: col.sticky ? 2 : 1,
                                  ...(col.sticky === 'right'
                                    ? {
                                        right: col.stickyOffset ?? 0,
                                        boxShadow:
                                          col.stickyOffset === 0
                                            ? `-6px 0 10px ${alpha(textPrimary, 0.08)}`
                                            : undefined,
                                      }
                                    : {}),
                                  ...(col.sticky === 'left'
                                    ? {
                                        left: col.stickyOffset ?? 0,
                                        boxShadow: `6px 0 10px ${alpha(textPrimary, 0.08)}`,
                                      }
                                    : {}),
                                }}
                              >
                                {tooltipTitle ? (
                                  <Tooltip title={tooltipTitle} arrow disableInteractive>
                                    <Box component="span">{cellContent}</Box>
                                  </Tooltip>
                                ) : (
                                  <Box component="span">{cellContent}</Box>
                                )}
                              </TableCell>
                            )
                          })}

                          {expandable && renderExpandedRow && (
                            <TableCell sx={{ py: 1.5, px: 2 }}>
                              <IconButton
                                size="small"
                                onClick={() => toggleExpand(row.id)}
                                sx={{
                                  color: primary,
                                  bgcolor: alpha(primary, 0.08),
                                  border: `1px solid ${alpha(primary, 0.14)}`,
                                  '&:hover': { backgroundColor: alpha(primary, 0.12) },
                                }}
                              >
                                {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>

                        {expandable && renderExpandedRow && (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length + (selectable ? 2 : 1)}
                              sx={{
                                p: 0,
                                backgroundColor: alpha(primary, 0.03),
                                borderTop: `1px solid ${borderColor}`,
                              }}
                            >
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box
                                  ref={expandedRef}
                                  p={2.8}
                                  sx={{
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,242,236,0.98) 100%)',
                                  }}
                                >
                                  {renderExpandedRow(row)}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </CardContent>
  )
}
