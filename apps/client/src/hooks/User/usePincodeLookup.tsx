import { useEffect, useState } from 'react'
import type { UseFormClearErrors, UseFormSetError, UseFormSetValue } from 'react-hook-form'

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
    async function fetchLocation() {
      if (!pincode || pincode.length !== 6) {
        clearErrors(`${type}Pincode`)
        setValue(`${type}City`, '')
        setValue(`${type}State`, '')
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        const data = await res.json()
        const loc = data?.[0]?.PostOffice?.[0]
        const status = data?.[0]?.Status

        if (status !== 'Success' || !loc) {
          setError(`${type}Pincode`, {
            type: 'manual',
            message: `Invalid ${type} pincode`,
          })
          setValue(`${type}City`, '')
          setValue(`${type}State`, '')
        } else {
          clearErrors(`${type}Pincode`)
          setValue(`${type}City`, loc?.District || '')
          setValue(`${type}State`, loc?.State || '')
        }
      } catch {
        setError(`${type}Pincode`, {
          type: 'manual',
          message: `Failed to fetch ${type} location`,
        })
        setValue(`${type}City`, '')
        setValue(`${type}State`, '')
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [pincode])

  return loading
}
