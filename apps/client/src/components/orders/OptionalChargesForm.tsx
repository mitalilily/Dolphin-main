import { Grid } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import CustomInput from '../UI/inputs/CustomInput'

const OptionalChargesForm = () => {
  const { control } = useFormContext()

  return (
    <Grid container spacing={2}>
      <Grid size={{ md: 4, xs: 12 }}>
        <Controller
          name="shippingCharges"
          control={control}
          render={({ field }) => (
            <CustomInput
              label="Shipping Charge (Customer ₹)"
              type="number"
              prefix={<BiRupee />}
              {...field}
              helperText="What the customer pays for shipping"
            />
          )}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Controller
          name="transactionFee"
          control={control}
          render={({ field }) => (
            <CustomInput
              label="Transaction Fee (Optional ₹)"
              type="number"
              prefix={<BiRupee />}
              {...field}
            />
          )}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Controller
          name="discount"
          control={control}
          render={({ field }) => (
            <CustomInput label="Discount (Optional ₹)" type="number" prefix="- ₹" {...field} />
          )}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Controller
          name="prepaidAmount"
          control={control}
          render={({ field }) => (
            <CustomInput
              label="Prepaid Amount (Optional ₹)"
              type="number"
              prefix="- ₹"
              {...field}
            />
          )}
        />
      </Grid>
    </Grid>
  )
}

export default OptionalChargesForm
