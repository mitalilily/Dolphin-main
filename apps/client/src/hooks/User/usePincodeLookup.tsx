import { useEffect, useState } from 'react'
import type { UseFormClearErrors, UseFormSetError, UseFormSetValue } from 'react-hook-form'
import { fetchLocations } from '../../api/locations'

const getPostalApiLocation = async (pincode: string) => {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
  const data = await res.json()
  const loc = data?.[0]?.PostOffice?.[0]
  const status = data?.[0]?.Status

  if (status !== 'Success' || !loc) return null

  return {
    city: loc?.District || '',
    state: loc?.State || '',
  }
}

const getPlatformLocation = async (pincode: string) => {
  const response = await fetchLocations({ pincode, limit: 1 })
  const loc = Array.isArray(response?.data) ? response.data[0] : null

  if (!loc?.city || !loc?.state) return null

  return {
    city: loc.city,
    state: loc.state,
  }
}

export function usePincodeLookup(
  pincode: string,
  type: 'pickup' | 'delivery',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: UseFormSetError<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearErrors: UseFormClearErrors<any>,
) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchLocation() {
      if (!pincode || pincode.length !== 6) {
        clearErrors(`${type}Pincode`)
        setValue(`${type}City`, '')
        setValue(`${type}State`, '')
        return
      }

      setLoading(true)
      try {
        let loc: { city: string; state: string } | null = null

        try {
          loc = await getPlatformLocation(pincode)
        } catch {
          loc = null
        }

        if (!loc) {
          loc = await getPostalApiLocation(pincode)
        }

        if (cancelled) return

        if (!loc?.city || !loc?.state) {
          setError(`${type}Pincode`, {
            type: 'manual',
            message: `Invalid ${type} pincode`,
          })
          setValue(`${type}City`, '')
          setValue(`${type}State`, '')
        } else {
          clearErrors(`${type}Pincode`)
          setValue(`${type}City`, loc.city)
          setValue(`${type}State`, loc.state)
        }
      } catch {
        if (cancelled) return
        setError(`${type}Pincode`, {
          type: 'manual',
          message: `Failed to fetch ${type} location`,
        })
        setValue(`${type}City`, '')
        setValue(`${type}State`, '')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLocation()

    return () => {
      cancelled = true
    }
  }, [clearErrors, pincode, setError, setValue, type])

  return loading
}
