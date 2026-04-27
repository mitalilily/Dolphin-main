import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchMyNdr,
  fetchMyNdrTimeline,
  submitNdrChangeAddress,
  submitNdrChangePhone,
  submitNdrReattempt,
} from '../../api/ndr'
import { getPresignedDownloadUrls } from '../../api/upload.api'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import PageHeading from '../../components/UI/heading/PageHeading'
import CustomInput from '../../components/UI/inputs/CustomInput'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import FileUploader, { type UploadedFileInfo } from '../../components/UI/uploader/FileUploader'
import { toast } from '../../components/UI/Toast'

type NdrRow = {
  id?: string
  awb_number?: string
  order_id?: string
  status?: string
  reason?: string
  remarks?: string
  integration_type?: string
  courier_partner?: string
  attempt_no?: string
}
type TimelineEvent = {
  at?: string
  status?: string
  remarks?: string
  reason?: string
  admin_note?: string
  attachment_key?: string
  attachment_name?: string
  attachment_mime?: string
  attachment_url?: string | null
}
type TableRow = Omit<NdrRow, 'id'> & { id: string }

export default function NdrList() {
  const [rows, setRows] = useState<NdrRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState<{ search?: string; fromDate?: string; toDate?: string }>(
    {},
  )
  const [reattemptOpen, setReattemptOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [selectedAwb, setSelectedAwb] = useState<string | null>(null)
  const [nextAttemptDate, setNextAttemptDate] = useState<string>('')
  const [comments, setComments] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [timeline, setTimeline] = useState<{ events?: TimelineEvent[] } | null>(null)
  const [changePhoneOpen, setChangePhoneOpen] = useState(false)
  const [changeAddressOpen, setChangeAddressOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [pincode, setPincode] = useState('')
  const [uploadedAttachment, setUploadedAttachment] = useState<UploadedFileInfo | null>(null)

  const resetAttachment = useCallback(() => {
    setUploadedAttachment(null)
  }, [])

  const loadNdrEvents = useCallback(async () => {
    try {
      setLoading(true)
      const resp = await fetchMyNdr({
        page,
        limit: rowsPerPage,
        search: filters.search,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      })
      setRows(resp?.data || [])
      setTotalCount(resp?.totalCount || 0)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = error?.response?.data?.message || error?.message || 'Failed to load NDR events'
      toast.open({ message: msg, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filters, page, rowsPerPage])

  useEffect(() => {
    loadNdrEvents()
  }, [loadNdrEvents])

  const columns: Column<TableRow>[] = useMemo(
    () => [
      { id: 'awb_number', label: 'AWB' },
      { id: 'order_id', label: 'Order ID' },
      { id: 'status', label: 'Status' },
      { id: 'reason', label: 'Reason' },
      { id: 'remarks', label: 'Remarks' },
      {
        id: 'actions' as keyof TableRow,
        label: 'Actions',
        minWidth: 380,
        truncate: false,
        render: (_, row) => {
          const provider = String(row.integration_type || row.courier_partner || '').toLowerCase()
          const supportsEdits = ['delhivery', 'ekart', 'xpressbees', 'shipmozo'].some((p) =>
            provider.includes(p),
          )
          const isNSL = String(row.status || '')
            .toLowerCase()
            .includes('nsl')
          const attempts = row.attempt_no ? parseInt(String(row.attempt_no), 10) || 0 : 0
          return (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                onClick={async () => {
                  try {
                    setSelectedAwb(row.awb_number || null)
                    const resp = await fetchMyNdrTimeline({
                      awb: row.awb_number,
                      orderId: row.order_id,
                    })
                    const timelineData = resp?.data || null
                    const events = Array.isArray(timelineData?.events) ? timelineData.events : []
                    const keys: string[] = Array.from(
                      new Set<string>(
                        events
                          .map((event: TimelineEvent) => event?.attachment_key)
                          .filter(
                            (key: TimelineEvent['attachment_key']): key is string => Boolean(key),
                          ),
                      ),
                    )

                    if (keys.length) {
                      try {
                        const urls = await getPresignedDownloadUrls(keys)
                        const urlMap = new Map<string, string>()
                        keys.forEach((key: string, index: number) => {
                          urlMap.set(key, urls?.[index] || '')
                        })
                        timelineData.events = events.map((event: TimelineEvent) => ({
                          ...event,
                          attachment_url: event.attachment_key
                            ? urlMap.get(event.attachment_key) || null
                            : null,
                        }))
                      } catch {
                        timelineData.events = events.map((event: TimelineEvent) => ({
                          ...event,
                          attachment_url: null,
                        }))
                      }
                    }

                    setTimeline(timelineData)
                    setTimelineOpen(true)
                  } catch (e: unknown) {
                    const error = e as { response?: { data?: { message?: string } } }
                    toast.open({
                      message: error?.response?.data?.message || 'Failed to load timeline',
                      severity: 'error',
                    })
                  }
                }}
              >
                Timeline
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={isNSL || attempts >= 3}
                title={
                  isNSL ? 'Not serviceable (NSL)' : attempts >= 3 ? 'Max attempts reached' : ''
                }
                onClick={() => {
                    setSelectedAwb(row.awb_number || null)
                    setNextAttemptDate('')
                    setComments('')
                    resetAttachment()
                    setReattemptOpen(true)
                  }}
                >
                Reattempt
              </Button>
              {supportsEdits && (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={isNSL}
                  title={isNSL ? 'Not serviceable (NSL)' : ''}
                  onClick={() => {
                    setSelectedAwb(row.awb_number || null)
                    setPhone('')
                    resetAttachment()
                    setChangePhoneOpen(true)
                  }}
                >
                  Change Phone
                </Button>
              )}
              {supportsEdits && (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={isNSL}
                  title={isNSL ? 'Not serviceable (NSL)' : ''}
                  onClick={() => {
                    setSelectedAwb(row.awb_number || null)
                    setName('')
                    setAddress1('')
                    setAddress2('')
                    setPincode('')
                    resetAttachment()
                    setChangeAddressOpen(true)
                  }}
                >
                  Change Address
                </Button>
              )}
            </Stack>
          )
        },
      },
    ],
    [],
  )

  const filterFields: FilterField[] = [
    { name: 'search', label: 'Search', type: 'text', placeholder: 'AWB / Order ID / Reason' },
    { name: 'fromDate', label: 'From', type: 'date' },
    { name: 'toDate', label: 'To', type: 'date' },
  ]

  const tableRows: TableRow[] = useMemo(
    () => rows.map((r, idx) => ({ ...r, id: String(r.id || r.awb_number || r.order_id || idx) })),
    [rows],
  )

  return (
    <Stack gap={3} p={4}>
      <PageHeading
        title="NDR"
        subtitle="Review non-delivery reports, open timelines, and trigger reattempt workflows in a operations view."
      />
      <FilterBar
        fields={filterFields}
        defaultValues={filters}
        onApply={(f) => {
          setFilters(f)
          setPage(1)
        }}
        loading={loading}
      />

      <Paper sx={{ borderRadius: 2, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <Typography p={3}>Loading NDRs...</Typography>
        ) : (
          <DataTable
            rows={tableRows}
            columns={columns}
            title="NDR Events"
            pagination
            currentPage={page}
            onPageChange={setPage}
            onRowsPerPageChange={(n) => {
              setRowsPerPage(n)
              setPage(1)
            }}
            defaultRowsPerPage={rowsPerPage}
            totalCount={totalCount}
          />
        )}
      </Paper>

      {/* Timeline Drawer (simple) */}
      <Dialog open={timelineOpen} onClose={() => setTimelineOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>NDR Timeline</DialogTitle>
        <DialogContent>
          <Stack gap={1} mt={1}>
            {(timeline?.events || []).map((e: TimelineEvent, idx: number) => (
              <Stack key={idx} gap={0} borderLeft="2px solid #E2E8F0" pl={1}>
                <Typography variant="caption" color="text.secondary">
                  {e?.at ? new Date(e.at).toLocaleString() : '—'}
                </Typography>
                <Typography variant="body2">{e?.status || '—'}</Typography>
                {e?.remarks && (
                  <Typography variant="caption" color="text.secondary">
                    {e.remarks}
                  </Typography>
                )}
                {e?.admin_note && (
                  <Typography variant="caption" color="text.secondary">
                    Admin note: {e.admin_note}
                  </Typography>
                )}
                {e?.attachment_url && (
                  <Stack direction="column" spacing={1} mt={1}>
                    {String(e?.attachment_mime || '').startsWith('audio/') ? (
                      <audio controls preload="none" src={e.attachment_url}>
                        Your browser does not support audio playback.
                      </audio>
                    ) : null}
                    {String(e?.attachment_mime || '').startsWith('image/') ? (
                      <Box
                        component="img"
                        src={e.attachment_url}
                        alt={e?.attachment_name || 'NDR attachment'}
                        sx={{
                          width: '100%',
                          maxWidth: 280,
                          maxHeight: 220,
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '1px solid #E2E8F0',
                        }}
                      />
                    ) : null}
                    <Button
                      size="small"
                      variant="outlined"
                      component="a"
                      href={e.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {e?.attachment_name || 'Open attachment'}
                    </Button>
                  </Stack>
                )}
              </Stack>
            ))}
            {!timeline?.events?.length && (
              <Typography variant="body2" color="text.secondary">
                No events found.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reattemptOpen} onClose={() => setReattemptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request Reattempt</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <CustomInput label="AWB" value={selectedAwb || ''} disabled topMargin={false} />
            <CustomInput
              label="Next Attempt Date"
              type="date"
              value={nextAttemptDate}
              onChange={(e) => setNextAttemptDate((e.target as HTMLInputElement).value)}
            />
            <CustomInput
              label="Comments"
              value={comments}
              placeholder="Add a note (optional)"
              onChange={(e) => setComments((e.target as HTMLInputElement).value)}
            />
            <Stack gap={1}>
              <Typography variant="body2" fontWeight={600}>
                Recording / Image
              </Typography>
              <FileUploader
                multiple={false}
                maxSizeMb={15}
                accept="audio/*,image/*,.mp3,.wav,.m4a,.aac,.ogg,.jpg,.jpeg,.png,.webp"
                folderKey="ndr-actions"
                onUploaded={(files) => setUploadedAttachment(files?.[0] || null)}
                label="Upload recording or image"
                fullWidth
              />
              <Typography variant="caption" color="text.secondary">
                Optional. Add a call recording or image proof for this NDR action.
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReattemptOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedAwb || !nextAttemptDate || submitting}
            onClick={async () => {
              try {
                setSubmitting(true)
                await submitNdrReattempt({
                  awb: selectedAwb || undefined,
                  nextAttemptDate,
                  comments,
                  attachmentKey: uploadedAttachment?.key,
                  attachmentName: uploadedAttachment?.originalName,
                  attachmentMime: uploadedAttachment?.mime,
                })
                toast.open({ message: 'Reattempt requested successfully', severity: 'success' })
                setReattemptOpen(false)
                resetAttachment()
                setPage(1)
                await loadNdrEvents()
              } catch (err: unknown) {
                const error = err as {
                  response?: { data?: { message?: string } }
                  message?: string
                }
                const msg =
                  error?.response?.data?.message || error?.message || 'Failed to request reattempt'
                toast.open({ message: msg, severity: 'error' })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Phone */}
      <Dialog
        open={changePhoneOpen}
        onClose={() => setChangePhoneOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Phone</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <CustomInput label="AWB" value={selectedAwb || ''} disabled topMargin={false} />
            <CustomInput
              label="Phone"
              value={phone}
              onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
              placeholder="10+ digits"
            />
            <Stack gap={1}>
              <Typography variant="body2" fontWeight={600}>
                Recording / Image
              </Typography>
              <FileUploader
                multiple={false}
                maxSizeMb={15}
                accept="audio/*,image/*,.mp3,.wav,.m4a,.aac,.ogg,.jpg,.jpeg,.png,.webp"
                folderKey="ndr-actions"
                onUploaded={(files) => setUploadedAttachment(files?.[0] || null)}
                label="Upload recording or image"
                fullWidth
              />
              <Typography variant="caption" color="text.secondary">
                Optional. Add supporting media with the phone change request.
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePhoneOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedAwb || !/^\d{10,}$/.test(phone) || submitting}
            onClick={async () => {
              try {
                setSubmitting(true)
                await submitNdrChangePhone({
                  awb: selectedAwb || undefined,
                  phone,
                  attachmentKey: uploadedAttachment?.key,
                  attachmentName: uploadedAttachment?.originalName,
                  attachmentMime: uploadedAttachment?.mime,
                })
                toast.open({ message: 'Phone update submitted', severity: 'success' })
                setChangePhoneOpen(false)
                resetAttachment()
                setPage(1)
                await loadNdrEvents()
              } catch (err: unknown) {
                const error = err as {
                  response?: { data?: { message?: string } }
                  message?: string
                }
                const msg =
                  error?.response?.data?.message || error?.message || 'Failed to update phone'
                toast.open({ message: msg, severity: 'error' })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Address */}
      <Dialog
        open={changeAddressOpen}
        onClose={() => setChangeAddressOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Address</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <CustomInput label="AWB" value={selectedAwb || ''} disabled topMargin={false} />
            <CustomInput
              label="Name"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
            />
            <CustomInput
              label="Address line 1"
              value={address1}
              onChange={(e) => setAddress1((e.target as HTMLInputElement).value)}
            />
            <CustomInput
              label="Address line 2"
              value={address2}
              onChange={(e) => setAddress2((e.target as HTMLInputElement).value)}
            />
            <CustomInput
              label="Pincode"
              value={pincode}
              onChange={(e) => setPincode((e.target as HTMLInputElement).value)}
            />
            <Stack gap={1}>
              <Typography variant="body2" fontWeight={600}>
                Recording / Image
              </Typography>
              <FileUploader
                multiple={false}
                maxSizeMb={15}
                accept="audio/*,image/*,.mp3,.wav,.m4a,.aac,.ogg,.jpg,.jpeg,.png,.webp"
                folderKey="ndr-actions"
                onUploaded={(files) => setUploadedAttachment(files?.[0] || null)}
                label="Upload recording or image"
                fullWidth
              />
              <Typography variant="caption" color="text.secondary">
                Optional. Add supporting media with the address change request.
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeAddressOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedAwb || !address1 || submitting}
            onClick={async () => {
              try {
                setSubmitting(true)
                await submitNdrChangeAddress({
                  awb: selectedAwb || undefined,
                  name: name || undefined,
                  address_1: address1,
                  address_2: address2 || undefined,
                  pincode: pincode || undefined,
                  attachmentKey: uploadedAttachment?.key,
                  attachmentName: uploadedAttachment?.originalName,
                  attachmentMime: uploadedAttachment?.mime,
                })
                toast.open({ message: 'Address update submitted', severity: 'success' })
                setChangeAddressOpen(false)
                resetAttachment()
                setPage(1)
                await loadNdrEvents()
              } catch (err: unknown) {
                const error = err as {
                  response?: { data?: { message?: string } }
                  message?: string
                }
                const msg =
                  error?.response?.data?.message || error?.message || 'Failed to update address'
                toast.open({ message: msg, severity: 'error' })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
