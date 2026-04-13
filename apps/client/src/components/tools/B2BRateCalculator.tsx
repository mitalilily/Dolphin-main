import { Grid } from '@mui/material'
import { useFormContext } from 'react-hook-form'
import CustomInput from '../UI/inputs/CustomInput'

export default function B2BRateCalculator() {
  const { register } = useFormContext()

  return (
    <Grid container spacing={2}>
      <Grid size={6}>
        <CustomInput label="Total Weight (kg)" {...register('totalWeight')} fullWidth />
      </Grid>
      <Grid size={6}>
        <CustomInput label="Number of Boxes" {...register('numberOfBoxes')} fullWidth />
      </Grid>
    </Grid>
  )
}
