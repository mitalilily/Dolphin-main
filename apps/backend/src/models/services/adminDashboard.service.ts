import { db } from '../client'
import { b2b_orders } from '../schema/b2bOrders'
import { b2c_orders } from '../schema/b2cOrders'
import { codRemittances } from '../schema/codRemittance'
import { couriers } from '../schema/couriers'
import { kyc } from '../schema/kyc'
import { supportTickets } from '../schema/supportTickets'
import { users } from '../schema/users'

type B2COrder = typeof b2c_orders.$inferSelect
type B2BOrder = typeof b2b_orders.$inferSelect
type DashboardOrder = (B2COrder | B2BOrder) & { type: 'b2c' | 'b2b' }

const INTERNAL_ROLES = new Set(['admin', 'employee', 'manager'])
const PENDING_STATUSES = new Set(['pending', 'booked'])
const TRANSIT_STATUSES = new Set(['shipment_created', 'in_transit', 'out_for_delivery'])
const NDR_KEYWORDS = ['ndr', 'undelivered', 'delivery_attempt_failed', 'door_closed', 'address_issue']

const toNum = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseDate = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const raw = String(value).trim()
  if (!raw) return null

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed

  const localMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (localMatch) {
    const [, day, month, year] = localMatch
    const localDate = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(localDate.getTime()) ? null : localDate
  }

  return null
}

const firstValidDate = (...values: unknown[]): Date | null => {
  for (const value of values) {
    const date = parseDate(value)
    if (date) return date
  }
  return null
}

const isSameLocalDay = (date: Date, target: Date): boolean =>
  date.getFullYear() === target.getFullYear() &&
  date.getMonth() === target.getMonth() &&
  date.getDate() === target.getDate()

const formatLocalDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

const getStatus = (order: DashboardOrder): string =>
  String(order.order_status || '').trim().toLowerCase()

const getOrderDate = (order: DashboardOrder): Date | null =>
  firstValidDate(order.order_date, order.created_at)

const getDeliveredDate = (order: DashboardOrder): Date | null =>
  firstValidDate(order.updated_at, order.created_at)

const isNdrStatus = (status: string): boolean =>
  NDR_KEYWORDS.some((keyword) => status.includes(keyword))

const isRtoStatus = (status: string): boolean =>
  status.includes('rto') || status === 'returned_to_origin'

const orderRevenue = (order: DashboardOrder): number => {
  const freightCharge = toNum(order.freight_charges)
  const courierCost = toNum(order.courier_cost)
  return freightCharge > 0 && courierCost > 0 ? freightCharge - courierCost : 0
}

const getCourierName = (order: DashboardOrder): string =>
  String(order.courier_partner || (order as Record<string, unknown>).integration_type || 'Unknown').trim() ||
  'Unknown'

const getPickupCity = (order: DashboardOrder): string => {
  const pickupDetails =
    order.pickup_details && typeof order.pickup_details === 'object'
      ? (order.pickup_details as Record<string, unknown>)
      : {}

  return (
    String(pickupDetails.city || '').trim() ||
    String((order as Record<string, unknown>).pickup_city || '').trim() ||
    'Unknown'
  )
}

const countByCity = (orders: DashboardOrder[], getCity: (order: DashboardOrder) => string) => {
  const counts = orders.reduce<Record<string, number>>((acc, order) => {
    const city = getCity(order)
    acc[city] = (acc[city] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }))
}

export const getAdminDashboardStats = async () => {
  const [b2cRows, b2bRows, userRows, kycRows, ticketRows, courierRows, codRows] =
    await Promise.all([
      db.select().from(b2c_orders),
      db.select().from(b2b_orders),
      db.select().from(users),
      db.select().from(kyc),
      db.select().from(supportTickets),
      db.select().from(couriers),
      db.select().from(codRemittances),
    ])

  const orders: DashboardOrder[] = [
    ...b2cRows.map((order) => ({ ...order, type: 'b2c' as const })),
    ...b2bRows.map((order) => ({ ...order, type: 'b2b' as const })),
  ]

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const nonCancelledOrders = orders.filter((order) => getStatus(order) !== 'cancelled')
  const todayOrders = orders.filter((order) => {
    const date = getOrderDate(order)
    return date ? isSameLocalDay(date, today) : false
  })

  const todayPendingOrders = todayOrders.filter((order) => PENDING_STATUSES.has(getStatus(order)))
  const todayInTransitOrders = todayOrders.filter((order) => TRANSIT_STATUSES.has(getStatus(order)))
  const deliveredOrders = orders.filter((order) => getStatus(order) === 'delivered')
  const deliveredToday = deliveredOrders.filter((order) => {
    const date = getDeliveredDate(order)
    return date ? isSameLocalDay(date, today) : false
  })
  const activeNdrOrders = orders.filter((order) => isNdrStatus(getStatus(order)))
  const rtoOrders = orders.filter((order) => isRtoStatus(getStatus(order)))
  const outForDeliveryOrders = orders.filter((order) => getStatus(order) === 'out_for_delivery')
  const stuckOrders = orders.filter((order) => {
    const status = getStatus(order)
    const date = getOrderDate(order)
    if (!date) return false

    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return ['in_transit', 'out_for_delivery'].includes(status) && daysDiff > 5
  })

  const operationalBaseCount = nonCancelledOrders.length
  const deliverySuccessRate =
    operationalBaseCount > 0 ? Math.round((deliveredOrders.length / operationalBaseCount) * 100) : 0
  const ndrRate =
    operationalBaseCount > 0 ? Math.round((activeNdrOrders.length / operationalBaseCount) * 100) : 0
  const rtoRate =
    operationalBaseCount > 0 ? Math.round((rtoOrders.length / operationalBaseCount) * 100) : 0

  const deliveredOrdersWithDates = deliveredOrders.filter((order) => {
    const created = getOrderDate(order)
    const delivered = getDeliveredDate(order)
    return Boolean(created && delivered)
  })
  const avgDeliveryTime =
    deliveredOrdersWithDates.length > 0
      ? Math.round(
          deliveredOrdersWithDates.reduce((sum, order) => {
            const created = getOrderDate(order)
            const delivered = getDeliveredDate(order)
            if (!created || !delivered) return sum
            return sum + Math.max(0, Math.floor((delivered.getTime() - created.getTime()) / 86400000))
          }, 0) / deliveredOrdersWithDates.length,
        )
      : 0

  const todayShippingCharges = todayOrders.reduce(
    (sum, order) => sum + toNum(order.shipping_charges),
    0,
  )
  const todayRevenue = todayOrders.reduce((sum, order) => sum + orderRevenue(order), 0)
  const totalShippingCharges = orders.reduce((sum, order) => sum + toNum(order.shipping_charges), 0)
  const totalFreightCharges = orders.reduce((sum, order) => sum + toNum(order.freight_charges), 0)
  const totalCourierCosts = orders.reduce((sum, order) => sum + toNum(order.courier_cost), 0)
  const totalRevenue = orders.reduce((sum, order) => sum + orderRevenue(order), 0)

  const codOrders = orders.filter((order) => String(order.order_type || '').toLowerCase() === 'cod')
  const codAmount = codOrders.reduce((sum, order) => sum + toNum(order.order_amount), 0)
  const codPendingRows = codRows.filter((row) => row.status === 'pending')
  const codCreditedRows = codRows.filter((row) => row.status === 'credited')
  const codTodayCreditedRows = codCreditedRows.filter((row) =>
    row.creditedAt ? isSameLocalDay(row.creditedAt, today) : false,
  )
  const codRemittanceDue = codPendingRows.reduce(
    (sum, row) => sum + toNum(row.remittableAmount),
    0,
  )

  const customerUsers = userRows.filter((user) => {
    const role = String(user.role || 'customer').trim().toLowerCase()
    return !INTERNAL_ROLES.has(role) && Boolean(user.email)
  })

  const pendingKyc = kycRows.filter((row) =>
    ['pending', 'verification_in_progress'].includes(String(row.status || '').toLowerCase()),
  )

  const userIdsWithRecentOrders = new Set(
    nonCancelledOrders
      .filter((order) => {
        const date = getOrderDate(order)
        return date ? date >= lastMonth : false
      })
      .map((order) => order.user_id),
  )
  const userIdsWithWeekOrders = new Set(
    nonCancelledOrders
      .filter((order) => {
        const date = getOrderDate(order)
        return date ? date >= lastWeek : false
      })
      .map((order) => order.user_id),
  )

  const todayUsers = customerUsers.filter((user) =>
    user.createdAt ? isSameLocalDay(user.createdAt, today) : false,
  )
  const lastWeekUsers = customerUsers.filter((user) => user.createdAt && user.createdAt >= lastWeek)
  const activeUsers = customerUsers.filter((user) => userIdsWithRecentOrders.has(user.id))
  const veryActiveUsers = customerUsers.filter((user) => userIdsWithWeekOrders.has(user.id))

  const openTickets = ticketRows.filter((ticket) => ticket.status === 'open')
  const inProgressTickets = ticketRows.filter((ticket) => ticket.status === 'in_progress')
  const overdueTickets = ticketRows.filter(
    (ticket) =>
      ticket.dueDate &&
      ticket.dueDate < now &&
      ['open', 'in_progress'].includes(String(ticket.status || '')),
  )

  const ordersByCourier = orders.reduce<Record<string, any>>((acc, order) => {
    const courierName = getCourierName(order)
    if (!acc[courierName]) {
      acc[courierName] = {
        count: 0,
        delivered: 0,
        ndr: 0,
        rto: 0,
        revenue: 0,
        shippingCharges: 0,
        freightCharges: 0,
        courierCosts: 0,
        avgDeliveryTime: 0,
        deliveryTimes: [],
      }
    }

    const status = getStatus(order)
    if (status !== 'cancelled') acc[courierName].count += 1
    acc[courierName].shippingCharges += toNum(order.shipping_charges)
    acc[courierName].freightCharges += toNum(order.freight_charges)
    acc[courierName].courierCosts += toNum(order.courier_cost)
    acc[courierName].revenue += orderRevenue(order)

    if (status === 'delivered') {
      acc[courierName].delivered += 1
      const created = getOrderDate(order)
      const delivered = getDeliveredDate(order)
      if (created && delivered) {
        acc[courierName].deliveryTimes.push(
          Math.max(0, Math.floor((delivered.getTime() - created.getTime()) / 86400000)),
        )
      }
    }
    if (isNdrStatus(status)) acc[courierName].ndr += 1
    if (isRtoStatus(status)) acc[courierName].rto += 1

    return acc
  }, {})

  Object.values(ordersByCourier).forEach((courier: any) => {
    courier.deliveryRate =
      courier.count > 0 ? Math.round((courier.delivered / courier.count) * 100) : 0
    courier.ndrRate = courier.count > 0 ? Math.round((courier.ndr / courier.count) * 100) : 0
    courier.rtoRate = courier.count > 0 ? Math.round((courier.rto / courier.count) * 100) : 0
    courier.avgDeliveryTime =
      courier.deliveryTimes.length > 0
        ? Math.round(
            courier.deliveryTimes.reduce((sum: number, days: number) => sum + days, 0) /
              courier.deliveryTimes.length,
          )
        : 0
    delete courier.deliveryTimes
  })

  const ordersByDate: Record<string, number> = {}
  const ordersByDateByIntegration: Record<string, Record<string, number>> = {}
  const shippingChargesByDate: Record<string, number> = {}
  const revenueByDate: Record<string, number> = {}

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = formatLocalDateKey(date)
    const dayOrders = orders.filter((order) => {
      const orderDate = getOrderDate(order)
      return orderDate ? isSameLocalDay(orderDate, date) : false
    })

    ordersByDate[dateStr] = dayOrders.length
    ordersByDateByIntegration[dateStr] = dayOrders.reduce<Record<string, number>>((acc, order) => {
      const courierName = getCourierName(order)
      acc[courierName] = (acc[courierName] || 0) + 1
      return acc
    }, {})
    shippingChargesByDate[dateStr] = dayOrders.reduce(
      (sum, order) => sum + toNum(order.shipping_charges),
      0,
    )
    revenueByDate[dateStr] = dayOrders.reduce((sum, order) => sum + orderRevenue(order), 0)
  }

  const orderStatusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    const status = getStatus(order) || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const couriersByServiceProvider = courierRows.reduce<Record<string, number>>((acc, courier) => {
    const provider = String(courier.serviceProvider || 'unknown').trim() || 'unknown'
    acc[provider] = (acc[provider] || 0) + 1
    return acc
  }, {})

  const recentOrders = [...orders]
    .sort((a, b) => (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0))
    .slice(0, 10)
    .map((order) => ({
      id: order.id,
      type: order.type,
      order_number: order.order_number,
      awb_number: order.awb_number,
      order_status: order.order_status,
      order_type: order.order_type,
      order_amount: order.order_amount,
      courier_partner: order.courier_partner,
      created_at: order.created_at,
    }))

  const recentTickets = [...ticketRows]
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
    .slice(0, 10)

  return {
    success: true,
    data: {
      todayOperations: {
        orders: todayOrders.length,
        pending: todayPendingOrders.length,
        inTransit: todayInTransitOrders.length,
        delivered: deliveredToday.length,
        ndr: todayOrders.filter((order) => isNdrStatus(getStatus(order))).length,
        stuck: stuckOrders.length,
      },
      financial: {
        todayShippingCharges,
        todayRevenue,
        totalShippingCharges,
        totalFreightCharges,
        totalCourierCosts,
        totalRevenue,
        codAmount,
        codRemittanceDue,
        codStats: {
          totalCollected: codCreditedRows.reduce((sum, row) => sum + toNum(row.remittableAmount), 0),
          remitted: codTodayCreditedRows.reduce(
            (sum, row) => sum + toNum(row.remittableAmount),
            0,
          ),
          pendingRemittance: codRemittanceDue,
        },
      },
      operational: {
        deliverySuccessRate,
        ndrRate,
        rtoRate,
        avgDeliveryTime,
        totalOrders: orders.length,
        deliveredOrders: deliveredOrders.length,
        ndrOrders: activeNdrOrders.length,
        rtoOrders: rtoOrders.length,
        outForDeliveryOrders: outForDeliveryOrders.length,
        stuckOrders: stuckOrders.length,
      },
      alerts: {
        openTickets: openTickets.length,
        inProgressTickets: inProgressTickets.length,
        overdueTickets: overdueTickets.length,
        pendingKyc: pendingKyc.length,
        weightDiscrepancies: orders.filter((order) => order.weight_discrepancy === true).length,
      },
      couriers: {
        performance: ordersByCourier,
        total: courierRows.length,
        byServiceProvider: couriersByServiceProvider,
      },
      geographic: {
        topOriginCities: countByCity(orders, getPickupCity),
        topDestinationCities: countByCity(orders, (order) => order.city || 'Unknown'),
      },
      users: {
        total: customerUsers.length,
        today: todayUsers.length,
        lastWeek: lastWeekUsers.length,
        active: activeUsers.length,
        veryActive: veryActiveUsers.length,
        pendingKyc: pendingKyc.length,
      },
      charts: {
        ordersByDate: Object.entries(ordersByDate).map(([date, count]) => ({
          date,
          orders: count,
        })),
        ordersByIntegration: Object.entries(ordersByDateByIntegration).map(([date, types]) => ({
          date,
          ...types,
        })),
        shippingChargesByDate: Object.entries(shippingChargesByDate).map(([date, amount]) => ({
          date,
          shippingCharges: amount,
        })),
        revenueByDate: Object.entries(revenueByDate).map(([date, amount]) => ({
          date,
          revenue: amount,
        })),
      },
      orderStatusCounts,
      recentOrders,
      recentTickets,
    },
  }
}
