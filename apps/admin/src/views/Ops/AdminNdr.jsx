import { QuestionOutlineIcon } from '@chakra-ui/icons'
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Stack,
  Tag,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import FileUploader from 'components/upload/FileUploader'
import CustomDatePicker from 'components/Input/CustomDatePicker'
import CustomModal from 'components/Modal/CustomModal'
import TableFilters from 'components/Tables/TableFilters'
import {
  useAttachAdminNdrArtifact,
  useDelhiveryPickupReschedule,
  useNdrBulk,
  useNdrChangeAddress,
  useNdrChangePhone,
  useNdrReattempt,
} from 'hooks/useNdr'
import { useAdminNdr } from 'hooks/useOps'
import { useEffect, useState } from 'react'
import { FiClock, FiMapPin, FiPaperclip, FiPhone, FiRotateCw } from 'react-icons/fi'
import { getPresignedDownloadUrls } from 'services/upload.service'
import { exportAdminNdr, getAdminNdrKpis, getNdrTimeline } from 'services/ops.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

export default function AdminNdr() {
  const toast = useToast()
  const [filters, setFilters] = useState({
    search: '',
    fromDate: undefined,
    toDate: undefined,
    courier: '',
    integration_type: '',
    attempt_count: '',
    status: '',
  })
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [selected, setSelected] = useState([])
  const [kpis, setKpis] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const timelineModal = useDisclosure()
  const reattemptModal = useDisclosure()
  const changePhoneModal = useDisclosure()
  const changeAddressModal = useDisclosure()
  const attachmentModal = useDisclosure()
  const [activeRow, setActiveRow] = useState(null)
  const [form, setForm] = useState({
    nextAttemptDate: '',
    comments: '',
    phone: '',
    name: '',
    address_1: '',
    address_2: '',
    pincode: '',
    admin_note: '',
  })
  const [uploadedAttachment, setUploadedAttachment] = useState(null)
  const { mutate: reattemptMutate } = useNdrReattempt()
  const { mutate: changePhoneMutate } = useNdrChangePhone()
  const { mutate: changeAddressMutate } = useNdrChangeAddress()
  const { mutate: attachArtifactMutate, isPending: attachingArtifact } = useAttachAdminNdrArtifact()
  const { mutate: bulkMutate } = useNdrBulk()
  const { mutate: rescheduleMutate } = useDelhiveryPickupReschedule()

  const { data, isLoading } = useAdminNdr({
    page,
    limit: perPage,
    search: filters.search,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    courier: filters.courier || undefined,
    integration_type: filters.integration_type || undefined,
    attempt_count: filters.attempt_count ? Number(filters.attempt_count) : undefined,
    status: filters.status || undefined,
  })
  const rows = data?.data || []

  const filterOptions = [
    { key: 'search', label: 'Search', type: 'text', placeholder: 'AWB / Order / Reason' },
    { key: 'fromDate', label: 'From', type: 'date' },
    { key: 'toDate', label: 'To', type: 'date' },
    { key: 'courier', label: 'Courier', type: 'text', placeholder: 'Delhivery' },
    {
      key: 'integration_type',
      label: 'Integration',
      type: 'text',
      placeholder: 'delhivery',
    },
    { key: 'attempt_count', label: 'Attempts', type: 'number', min: 0 },
    {
      key: 'status',
      label: 'Status',
      type: 'text',
      placeholder: 'ndr / undelivered / address_issue',
    },
  ]

  const totalCount = data?.totalCount || 0

  const captions = [
    'AWB',
    'Order',
    'Seller',
    'Courier',
    'Status/NSL',
    'Reason/Remarks',
    'Attempts',
    'Last event time',
  ]
  const columnKeys = [
    'awb_number',
    'order_id',
    'merchant_id',
    'courier_partner',
    'status',
    'remarks',
    'attempt_no',
    'last_event_time',
  ]

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await getAdminNdrKpis()
        setKpis(resp?.data || null)
      } catch (e) {}
    })()
  }, [])

  const actionsBar = (
    <HStack>
      <Button
        size="sm"
        onClick={() => exportAdminNdr({ ...filters, limit: perPage, page })}
        variant="outline"
      >
        Export CSV
      </Button>
      {/* <Button
        size="sm"
        colorScheme="blue"
        isDisabled={selected.length === 0}
        onClick={() => {
          const items = selected
            .map((id) => rows.find((r) => r.id === id))
            .filter(Boolean)
            .map((r) => ({
              awb: r.awb_number,
              provider: r.integration_type,
              action: 're-attempt',
              data: {},
            }))
          bulkMutate(items)
          setSelected([])
          setPage(1)
        }}
      >
        Bulk Reattempt
      </Button> */}
      {/* <Button
        size="sm"
        variant="outline"
        isDisabled={selected.length === 0}
        onClick={() => {
          const awbs = selected
            .map((id) => rows.find((r) => r.id === id))
            .filter((r) => r?.courier_partner?.toLowerCase?.() === 'delhivery')
            .map((r) => r.awb_number)
          if (awbs.length) rescheduleMutate(awbs)
          setSelected([])
        }}
      >
        Delhivery Pickup Reschedule
      </Button> */}
    </HStack>
  )

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <TableFilters
        filters={filterOptions}
        values={filters}
        onApply={(f) => {
          setFilters(f)
          setPage(1)
        }}
      />

      {kpis && (
        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <StatCard label="Total NDRs" value={kpis.total} />
          <StatCard
            label="Orders Affected"
            value={kpis.ordersAffected}
            tooltip="Number of unique orders that have at least one NDR event within the applied filters."
          />
        </Stack>
      )}

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        title="NDR Events"
        data={rows}
        captions={captions}
        columnKeys={columnKeys}
        actionsColumnWidth="260px"
        // actionsStickyLeft
        // showCheckboxes
        selectedRows={selected}
        onSelectionChange={setSelected}
        renderActions={(row) => {
          const isNSL = String(row?.status || '')
            .toLowerCase()
            .includes('nsl')
          const attempts = row?.attempt_no ? parseInt(String(row.attempt_no), 10) || 0 : 0
          const provider = String(row?.integration_type || row?.courier_partner || '').toLowerCase()
          const supportsEdits = ['delhivery', 'ekart', 'xpressbees'].includes(provider)
          return (
            <HStack spacing={1}>
              <IconButton
                aria-label="Timeline"
                icon={<FiClock />}
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const resp = await getNdrTimeline({ awb: row.awb_number, orderId: row.order_id })
                  setTimeline(resp?.data)
                  timelineModal.onOpen()
                }}
              />
              <IconButton
                aria-label="Reattempt"
                icon={<FiRotateCw />}
                size="sm"
                variant="ghost"
                isDisabled={isNSL || attempts >= 3}
                colorScheme={isNSL || attempts >= 3 ? undefined : 'blue'}
                onClick={() => {
                  setActiveRow(row)
                  setForm((f) => ({
                    ...f,
                    nextAttemptDate: new Date().toISOString().slice(0, 10),
                    comments: '',
                  }))
                  reattemptModal.onOpen()
                }}
                title={attempts ? `Attempts: ${attempts}` : ''}
              />
              {supportsEdits && (
                <IconButton
                  aria-label="Change Phone"
                  icon={<FiPhone />}
                  size="sm"
                  variant="ghost"
                  isDisabled={isNSL}
                  colorScheme={isNSL ? undefined : 'green'}
                  onClick={() => {
                    setActiveRow(row)
                    setForm((f) => ({ ...f, phone: '' }))
                    changePhoneModal.onOpen()
                  }}
                />
              )}
              {supportsEdits && (
                <IconButton
                  aria-label="Change Address"
                  icon={<FiMapPin />}
                  size="sm"
                  variant="ghost"
                  isDisabled={isNSL}
                  colorScheme={isNSL ? undefined : 'purple'}
                  onClick={() => {
                    setActiveRow(row)
                    setForm((f) => ({
                      ...f,
                      name: row?.buyer_name || '',
                      address_1: '',
                      address_2: '',
                      pincode: '',
                    }))
                    changeAddressModal.onOpen()
                  }}
                />
              )}
              <IconButton
                aria-label="Attach Recording"
                icon={<FiPaperclip />}
                size="sm"
                variant="ghost"
                colorScheme="orange"
                onClick={() => {
                  setActiveRow(row)
                  setUploadedAttachment(null)
                  setForm((f) => ({ ...f, admin_note: row?.admin_note || '' }))
                  attachmentModal.onOpen()
                }}
                title="Attach call recording"
              />
            </HStack>
          )
        }}
        sortByComponent={actionsBar}
        renderers={{
          status: (v) => <Tag colorScheme="yellow">{v}</Tag>,
          merchant_id: (v, row) => {
            const id = v
            const name = row?.merchant_name || 'View Merchant'
            const href = `http://localhost:3000/admin/users-management/${id}/overview`
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#3182ce', textDecoration: 'underline' }}
              >
                {name}
              </a>
            )
          },
          last_event_time: (v) => (
            <Text fontSize="xs">{v ? new Date(v).toLocaleString() : '—'}</Text>
          ),
          remarks: (v, row) => (
            <Stack spacing={0}>
              <Text noOfLines={1}>{row?.reason || '—'}</Text>
              <Text noOfLines={1} color="gray.500" fontSize="xs">
                {row?.remarks || '—'}
              </Text>
            </Stack>
          ),
        }}
      />

      {timelineModal.isOpen && timeline && (
        <TimelineDrawer
          isOpen={timelineModal.isOpen}
          onClose={timelineModal.onClose}
          data={timeline}
        />
      )}

      {/* Reattempt modal */}
      <CustomModal
        isOpen={reattemptModal.isOpen}
        onClose={reattemptModal.onClose}
        title={`Reattempt - ${activeRow?.awb_number || ''}`}
        footer={
          <HStack>
            <Button onClick={reattemptModal.onClose} variant="outline">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!form.nextAttemptDate}
              onClick={() => {
                reattemptMutate({
                  awb: activeRow?.awb_number,
                  nextAttemptDate: form.nextAttemptDate,
                  comments: form.comments,
                })
                reattemptModal.onClose()
              }}
            >
              Submit
            </Button>
          </HStack>
        }
      >
        <Stack gap={3}>
          <FormControl>
            <FormLabel>Next Attempt Date</FormLabel>
            <CustomDatePicker
              selectedDate={form.nextAttemptDate ? new Date(form.nextAttemptDate) : undefined}
              onChange={(d) =>
                setForm((f) => ({ ...f, nextAttemptDate: d ? d.toISOString().slice(0, 10) : '' }))
              }
            />
          </FormControl>
          <FormControl>
            <FormLabel>Comments</FormLabel>
            <Textarea
              value={form.comments}
              onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
            />
          </FormControl>
        </Stack>
      </CustomModal>

      {/* Change phone modal */}
      <CustomModal
        isOpen={changePhoneModal.isOpen}
        onClose={changePhoneModal.onClose}
        title={`Change Phone - ${activeRow?.awb_number || ''}`}
        footer={
          <HStack>
            <Button onClick={changePhoneModal.onClose} variant="outline">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!/^\d{10,}$/.test(form.phone || '')}
              onClick={() => {
                changePhoneMutate({ awb: activeRow?.awb_number, phone: form.phone })
                changePhoneModal.onClose()
              }}
            >
              Submit
            </Button>
          </HStack>
        }
      >
        <FormControl>
          <FormLabel>Phone</FormLabel>
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="10+ digits"
          />
        </FormControl>
      </CustomModal>

      {/* Change address modal */}
      <CustomModal
        isOpen={changeAddressModal.isOpen}
        onClose={changeAddressModal.onClose}
        title={`Change Address - ${activeRow?.awb_number || ''}`}
        footer={
          <HStack>
            <Button onClick={changeAddressModal.onClose} variant="outline">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!form.address_1}
              onClick={() => {
                changeAddressMutate({
                  awb: activeRow?.awb_number,
                  name: form.name || undefined,
                  address_1: form.address_1,
                  address_2: form.address_2 || undefined,
                  pincode: form.pincode || undefined,
                })
                changeAddressModal.onClose()
              }}
            >
              Submit
            </Button>
          </HStack>
        }
      >
        <Stack gap={3}>
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Address line 1</FormLabel>
            <Input
              value={form.address_1}
              onChange={(e) => setForm((f) => ({ ...f, address_1: e.target.value }))}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Address line 2</FormLabel>
            <Input
              value={form.address_2}
              onChange={(e) => setForm((f) => ({ ...f, address_2: e.target.value }))}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Pincode</FormLabel>
            <Input
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              placeholder="Optional"
            />
          </FormControl>
        </Stack>
      </CustomModal>

      <CustomModal
        isOpen={attachmentModal.isOpen}
        onClose={attachmentModal.onClose}
        title={`Attach Recording - ${activeRow?.awb_number || ''}`}
        footer={
          <HStack>
            <Button onClick={attachmentModal.onClose} variant="outline">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isLoading={attachingArtifact}
              isDisabled={!form.admin_note && !uploadedAttachment?.key}
              onClick={() => {
                if (!activeRow?.id) {
                  toast({
                    title: 'Missing NDR event',
                    description: 'Could not identify the selected NDR event.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  })
                  return
                }

                attachArtifactMutate(
                  {
                    eventId: activeRow.id,
                    adminNote: form.admin_note || undefined,
                    attachmentKey: uploadedAttachment?.key,
                    attachmentName: uploadedAttachment?.originalName,
                    attachmentMime: uploadedAttachment?.mime,
                  },
                  {
                    onSuccess: async () => {
                      const resp = await getNdrTimeline({
                        awb: activeRow.awb_number,
                        orderId: activeRow.order_id,
                      })
                      setTimeline(resp?.data)
                      attachmentModal.onClose()
                    },
                  },
                )
              }}
            >
              Save Attachment
            </Button>
          </HStack>
        }
      >
        <Stack gap={4}>
          <FormControl>
            <FormLabel>Admin Note</FormLabel>
            <Textarea
              value={form.admin_note}
              onChange={(e) => setForm((f) => ({ ...f, admin_note: e.target.value }))}
              placeholder="Optional note for the merchant about the call outcome."
            />
          </FormControl>
          <FormControl>
            <FormLabel>Call Recording / Audio File</FormLabel>
            <FileUploader
              multiple={false}
              maxSizeMb={15}
              getUrl
              showUploadButton={false}
              folderKey="ndr-recordings"
              onUploaded={(files) => setUploadedAttachment(files?.[0] || null)}
            />
            <Text fontSize="xs" color="gray.500" mt={2}>
              Upload MP3, WAV, M4A, or a similar audio file. The merchant will see it in the NDR timeline.
            </Text>
          </FormControl>
        </Stack>
      </CustomModal>
    </Flex>
  )
}

function StatCard({ label, value, tooltip }) {
  return (
    <Stack border="1px solid" borderColor="gray.200" rounded="md" p={4} minW="200px" spacing={0}>
      <HStack spacing={1} align="center">
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
        {tooltip ? (
          <QuestionOutlineIcon title={tooltip} color="gray.400" style={{ cursor: 'help' }} />
        ) : null}
      </HStack>
      <Text fontSize="2xl" fontWeight="bold">
        {value ?? '—'}
      </Text>
    </Stack>
  )
}

function TimelineDrawer({ isOpen, onClose, data }) {
  const events = Array.isArray(data?.events) ? data.events : []
  const [attachmentUrls, setAttachmentUrls] = useState({})

  useEffect(() => {
    const loadUrls = async () => {
      const keys = events.map((event) => event?.attachment_key).filter(Boolean)
      if (!keys.length) {
        setAttachmentUrls({})
        return
      }

      try {
        const urls = await getPresignedDownloadUrls(keys)
        const next = {}
        keys.forEach((key, index) => {
          next[key] = urls?.[index] || null
        })
        setAttachmentUrls(next)
      } catch (error) {
        console.error('Failed to load NDR attachment URLs', error)
        setAttachmentUrls({})
      }
    }

    if (isOpen) loadUrls()
  }, [events, isOpen])

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>NDR Timeline</DrawerHeader>
        <DrawerBody>
          <Stack spacing={3}>
            {events.map((e, idx) => (
              <Stack key={idx} spacing={0} borderLeft="2px solid #E2E8F0" pl={3}>
                <Text fontSize="xs" color="gray.500">
                  {e?.at ? new Date(e.at).toLocaleString() : '—'}
                </Text>
                <Text fontWeight="600">{e?.status || '—'}</Text>
                {e?.remarks && (
                  <Text color="gray.700" fontSize="sm">
                    {e.remarks}
                  </Text>
                )}
                {e?.admin_note && (
                  <Text color="gray.700" fontSize="sm">
                    Admin note: {e.admin_note}
                  </Text>
                )}
                {e?.attachment_key && attachmentUrls[e.attachment_key] && (
                  <Stack spacing={2} pt={2}>
                    {String(e?.attachment_mime || '').startsWith('audio/') ? (
                      <audio controls preload="none" src={attachmentUrls[e.attachment_key]}>
                        Your browser does not support audio playback.
                      </audio>
                    ) : null}
                    {String(e?.attachment_mime || '').startsWith('image/') ? (
                      <img
                        src={attachmentUrls[e.attachment_key]}
                        alt={e?.attachment_name || 'NDR attachment'}
                        style={{
                          width: '100%',
                          maxWidth: '280px',
                          maxHeight: '220px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                        }}
                      />
                    ) : null}
                    <a
                      href={attachmentUrls[e.attachment_key]}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#3182ce', textDecoration: 'underline', fontSize: '14px' }}
                    >
                      {e?.attachment_name || 'Open attachment'}
                    </a>
                  </Stack>
                )}
                {e?.location && (
                  <Text color="gray.500" fontSize="xs">
                    {e.location}
                  </Text>
                )}
              </Stack>
            ))}
            {events.length === 0 && <Text color="gray.500">No events found.</Text>}
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
