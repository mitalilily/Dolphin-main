import {
  Badge,
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useCancelOrderMutation, useRegenerateOrderDocumentsMutation } from 'hooks/useOrders'
import { useMemo, useState } from 'react'
import { FiCopy, FiEye, FiMoreVertical, FiRefreshCw, FiTruck, FiXCircle } from 'react-icons/fi'
import { useHistory } from 'react-router-dom'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'
import OrderDetailsModal from './OrderDetailsModal'

const OrdersTable = ({
  orders,
  totalCount,
  page,
  setPage,
  perPage,
  setPerPage,
  loading = false,
  onRefresh,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const history = useHistory()
  const toast = useToast()
  const { mutateAsync: cancelOrderMutation, isPending: isCancelling } = useCancelOrderMutation()
  const {
    mutateAsync: regenerateDocuments,
    isPending: isRegenerating,
  } = useRegenerateOrderDocumentsMutation()

  const cancellableStatuses = useMemo(
    () => new Set(['pending', 'shipment_created', 'in_transit', 'pickup_initiated', 'booked']),
    [],
  )

  const supportedCancellationProviders = useMemo(
    () => new Set(['delhivery', 'shipmozo']),
    [],
  )

  const captions = [
    'Order ID',
    'AWB Number',
    'Docs',
    'Merchant',
    'Customer',
    'Status',
    'Order Type',
    'Amount',
    'Courier',
    'Order Date',
  ]
  const columnKeys = [
    'order_number',
    'awb_number',
    'documents',
    'merchantName',
    'buyer_name',
    'order_status',
    'order_type',
    'order_amount',
    'courier_partner',
    'order_date',
  ]
  const actionsColumnWidth = '180px'
  const docsColumnWidth = '240px'

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'orange',
      shipment_created: 'blue',
      in_transit: 'purple',
      out_for_delivery: 'cyan',
      delivered: 'green',
      cancelled: 'red',
      cancellation_requested: 'yellow',
      rto: 'pink',
      rto_in_transit: 'purple',
      rto_delivered: 'gray',
    }
    return statusColors[status] || 'gray'
  }

  const getOrderTypeColor = (type) => {
    return type === 'cod' ? 'green' : 'blue'
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    onOpen()
  }

  const handleOrderUpdated = (updatedOrder) => {
    setSelectedOrder(updatedOrder)
    if (onRefresh) onRefresh()
  }

  const handleCopyAWB = (awb) => {
    if (awb) {
      navigator.clipboard.writeText(awb)
      // You might want to show a toast notification here
    }
  }

  const handleTrackShipment = (order) => {
    if (!order?.awb_number) return
    history.push(`/admin/order-tracking?awb=${encodeURIComponent(order.awb_number)}`)
  }

  const canCancelShipment = (order) => {
    if (!order) return false
    const status = (order.order_status || '').toLowerCase()
    if (!cancellableStatuses.has(status)) return false
    const provider = (order.integration_type || '').toLowerCase()
    if (provider && !supportedCancellationProviders.has(provider)) return false
    return Boolean(order.id)
  }

  const handleCancelShipment = async (order) => {
    if (!order?.id) {
      toast({
        title: 'Unable to cancel order',
        description: 'Missing order identifier.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    try {
      await cancelOrderMutation(order.id)
      toast({
        title: 'Cancellation requested',
        description: `Order ${order.order_id || order.id} cancellation has been requested.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      if (onRefresh) onRefresh()
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to request cancellation.'
      toast({
        title: 'Cancellation failed',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleRegenerateDocuments = async (order) => {
    if (!order?.id) {
      toast({
        title: 'Unable to regenerate',
        description: 'Missing order identifier.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    try {
      await regenerateDocuments({
        orderId: order.id,
        regenerateLabel: true,
        regenerateInvoice: true,
      })
      toast({
        title: 'Regenerated successfully',
        description: `Label and invoice regenerated for order ${order.order_number || order.id}.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      if (onRefresh) onRefresh()
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to regenerate documents.'
      toast({
        title: 'Regeneration failed',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const renderers = {
    order_id: (value) => (
      <Tooltip label={value}>
        <span
          style={{
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            fontWeight: 'bold',
          }}
        >
          {value || 'N/A'}
        </span>
      </Tooltip>
    ),
    merchantName: (value, row) => (
      <Button
        variant="link"
        colorScheme="blue"
        size="sm"
        onClick={() => {
          if (row?.user_id) {
            history.push(`/admin/users-management/${row.user_id}/overview`)
          } else {
            toast({
              title: 'Merchant details unavailable',
              description: 'User identifier missing for this order.',
              status: 'warning',
              duration: 4000,
              isClosable: true,
            })
          }
        }}
      >
        {value || row?.merchantEmail || row?.merchantPhone || 'Unknown Merchant'}
      </Button>
    ),
    awb_number: (value) => (
      <Flex align="center" gap={2}>
        <span style={{ fontFamily: 'monospace' }}>{value || 'N/A'}</span>
        {value && (
          <Icon
            as={FiCopy}
            cursor="pointer"
            onClick={() => handleCopyAWB(value)}
            color="gray.500"
            _hover={{ color: 'blue.500' }}
          />
        )}
      </Flex>
    ),
    documents: (_value, row) => {
      const hasLabel = Boolean(String(row.label_url || row.label_key || row.label || '').trim())
      const hasInvoice = Boolean(
        String(row.invoice_url || row.invoice_key || row.invoice_link || '').trim(),
      )

      return (
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Badge colorScheme={hasLabel ? 'green' : 'orange'} borderRadius="md" px={2} py={1}>
            {hasLabel ? 'Label Generated' : 'Label Pending'}
          </Badge>
          <Badge colorScheme={hasInvoice ? 'green' : 'orange'} borderRadius="md" px={2} py={1}>
            {hasInvoice ? 'Invoice Generated' : 'Invoice Pending'}
          </Badge>
        </Stack>
      )
    },
    buyer_name: (value, row) => (
      <div>
        <div style={{ fontWeight: '500' }}>{value}</div>
        {row.buyer_phone && (
          <div style={{ fontSize: '0.85em', color: 'gray' }}>{row.buyer_phone}</div>
        )}
      </div>
    ),
    order_status: (value) => (
      <Badge colorScheme={getStatusColor(value)} fontSize="0.8em" px={2} py={1} borderRadius="md">
        {value?.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    ),
    order_type: (value) => (
      <Badge
        colorScheme={getOrderTypeColor(value)}
        fontSize="0.8em"
        px={2}
        py={1}
        borderRadius="md"
      >
        {value?.toUpperCase()}
      </Badge>
    ),
    order_amount: (value) => (
      <span style={{ fontWeight: '600' }}>₹{parseFloat(value || 0).toFixed(2)}</span>
    ),
    courier_partner: (value) => value || 'Not Assigned',
    order_date: (value) => {
      if (!value) return 'N/A'
      const date = new Date(value)
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    },
  }

  const renderActions = (order) => (
    <Menu placement="bottom-end">
      <MenuButton as={Button} size="sm" variant="ghost" rightIcon={<FiMoreVertical />}>
        Actions
      </MenuButton>
      <Portal>
        <MenuList zIndex={2000} boxShadow="xl">
          <MenuItem icon={<FiEye />} onClick={() => handleViewDetails(order)}>
            View Details
          </MenuItem>
          <MenuItem
            icon={<FiRefreshCw />}
            onClick={() => handleRegenerateDocuments(order)}
            isDisabled={isRegenerating}
          >
            Regenerate Label & Invoice
          </MenuItem>
          {order.awb_number && (
            <MenuItem icon={<FiTruck />} onClick={() => handleTrackShipment(order)}>
              Track Shipment
            </MenuItem>
          )}
          {canCancelShipment(order) && (
            <MenuItem
              icon={<FiXCircle />}
              onClick={() => handleCancelShipment(order)}
              isDisabled={isCancelling}
            >
              Cancel Shipment
            </MenuItem>
          )}
        </MenuList>
      </Portal>
    </Menu>
  )

  return (
    <>
      <GenericTable
        title="Orders Management"
        data={orders}
        captions={captions}
        columnKeys={columnKeys}
        renderers={renderers}
        renderActions={renderActions}
        loading={loading}
        paginated={true}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        perPageOptions={[10, 20, 50, 100]}
        actionsColumnWidth={actionsColumnWidth}
        columnWidths={{
          order_id: '140px',
          awb_number: '180px',
          documents: docsColumnWidth,
          buyer_name: '200px',
          order_status: '150px',
          order_type: '100px',
          order_amount: '120px',
          courier_partner: '150px',
          order_date: '120px',
        }}
        stickyRightColumnKeys={['documents']}
        stickyRightOffsets={{ documents: actionsColumnWidth }}
      />

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isOpen}
          onClose={onClose}
          order={selectedOrder}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </>
  )
}

export default OrdersTable
