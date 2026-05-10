// hooks/useTracking.ts
import { useQuery } from '@tanstack/react-query'
import { fetchTracking, normalizeTrackingParams } from '../../api/tracking.service'

export const useTracking = (
  awb?: string | null,
  order?: string | null,
  contact?: string | null,
) => {
  const params = normalizeTrackingParams({
    awb: awb || undefined,
    orderNumber: order || undefined,
    contact: contact || undefined,
  })

  return useQuery({
    queryKey: ['tracking', params],
    queryFn: () => fetchTracking(params),
    enabled: !!params.awb || (!!params.orderNumber && !!params.contact),
    staleTime: 60_000, // 1 minute
    retry: 1,
  })
}
