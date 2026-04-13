import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useLabelPreferences } from '../../../hooks/useLabelPreferences'
import { mapApiToForm, mapFormToApi } from '../../../utils/labelPreferencesMapper'
import { glassStyles } from '../../UI/accordion/FormSectionAccordion'
import PageHeading from '../../UI/heading/PageHeading'
import { LabelPreview } from './LabelPreview'

export type LabelSettingsForm = {
  orderInfo: Record<string, boolean>
  shipperInfo: Record<string, boolean>
  productInfo: Record<string, boolean>
  charLimit: number
  maxItems: number
  printer: 'thermal' | 'inkjet'
}

const defaultValues: LabelSettingsForm = {
  printer: 'thermal',
  charLimit: 25,
  maxItems: 3,
  orderInfo: {
    orderId: true,
    invoiceNumber: true,
    orderDate: false,
    invoiceDate: false,
    orderBarcode: true,
    invoiceBarcode: true,
    declaredValue: true,
    cod: true,
    awb: true,
    terms: true,
  },
  shipperInfo: {
    shipperPhone: true,
    gstin: true,
    shipperAddress: true,
    rtoAddress: false,
    sellerBrandName: true,
    brandLogo: true,
  },
  productInfo: {
    itemName: true,
    productCost: true,
    productQuantity: true,
    skuCode: false,
    dimension: false,
    deadWeight: false,
    otherCharges: true,
  },
}

const mockOrder = {
  name: 'Venkatesh Puri',
  address: '111/222, XYZ, Ram Nagar, Paharganj, South Delhi, Delhi, India. 110093.',
  phone: '+91 9560188888',
  orderId: '8052081712989',
  sortCode: 'JBN/JBN/PA',
  paymentType: 'cod',
  invoiceNumber: 'INV-98765',
  orderDate: '23 Mar, 2024',
  invoiceDate: '22 Mar, 2024',
  awb: '143263813003739',
  codValue: '₹1350',
  declaredValue: '₹1350',
  courier: 'Bluedart',
  shipper: {
    name: 'Seller Brand Name',
    phone: '011 4715 2407',
    gst: '9764713698798013',
    address:
      'XX/YY, ABC Apartments, Pitampura, Opp. Metro Pillar 36, New Delhi, Delhi, India. 110034',
    rtoAddress:
      'XX/YY, ABC Apartments, Pitampura, Opp. Metro Pillar 36, New Delhi, Delhi, India. 110034',
    logoUrl: 'https://via.placeholder.com/120x40?text=Seller+Logo',
  },
  products: [
    { name: 'Navy Blue T-shirt', sku: '695095207050', qty: 2, price: '₹450' },
    { name: 'Mechanical Keyboard', sku: 'KEY456', qty: 1, price: '₹2499' },
    { name: 'HD Webcam', sku: 'CAM789', qty: 1, price: '₹1999' },
  ],
  dimension: '35x34x11',
  deadWeight: '0.73 KG',
  otherCharges: '₹550',
  totalAmount: '₹1900',
}

export default function LabelSettingsPage() {
  const { preferences, isLoading, savePreferences, saving } = useLabelPreferences()

  const { control, watch, handleSubmit, reset } = useForm<LabelSettingsForm>({
    defaultValues,
  })

  React.useEffect(() => {
    if (preferences) reset(mapApiToForm(preferences))
  }, [preferences, reset])

  const values = watch()

  const onSubmit = (data: LabelSettingsForm) => {
    savePreferences(mapFormToApi(data))
  }

  if (isLoading) return <Typography>Loading label preferences...</Typography>

  return (
    <Stack gap={2}>
      <PageHeading title="Label Settings" />
      <Grid container spacing={3} sx={{ p: 3 }}>
        {/* Left: Settings */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ ...glassStyles }}>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                  {/* Order Info */}
                  <Box>
                    <Typography fontWeight="bold" gutterBottom>
                      Order Info
                    </Typography>
                    <Controller
                      name="orderInfo"
                      control={control}
                      render={({ field }) => (
                        <FormGroup>
                          {Object.entries(field.value).map(([key, checked]) => (
                            <FormControlLabel
                              key={key}
                              control={
                                <Checkbox
                                  checked={checked}
                                  onChange={(e) =>
                                    field.onChange({
                                      ...field.value,
                                      [key]: e.target.checked,
                                    })
                                  }
                                />
                              }
                              label={key.replace(/([A-Z])/g, ' $1')}
                            />
                          ))}
                        </FormGroup>
                      )}
                    />
                  </Box>

                  <Divider />

                  {/* Shipper Info */}
                  <Box>
                    <Typography fontWeight="bold" gutterBottom>
                      Shipper Info
                    </Typography>
                    <Controller
                      name="shipperInfo"
                      control={control}
                      render={({ field }) => (
                        <FormGroup>
                          {Object.entries(field.value).map(([key, checked]) => (
                            <FormControlLabel
                              key={key}
                              control={
                                <Checkbox
                                  checked={checked}
                                  onChange={(e) =>
                                    field.onChange({
                                      ...field.value,
                                      [key]: e.target.checked,
                                    })
                                  }
                                />
                              }
                              label={key.replace(/([A-Z])/g, ' $1')}
                            />
                          ))}
                        </FormGroup>
                      )}
                    />
                  </Box>

                  <Divider />

                  {/* Product Info */}
                  <Box>
                    <Typography fontWeight="bold" gutterBottom>
                      Products and Package Info
                    </Typography>
                    <Controller
                      name="productInfo"
                      control={control}
                      render={({ field }) => (
                        <FormGroup>
                          {Object.entries(field.value).map(([key, checked]) => (
                            <FormControlLabel
                              key={key}
                              control={
                                <Checkbox
                                  checked={checked}
                                  onChange={(e) =>
                                    field.onChange({
                                      ...field.value,
                                      [key]: e.target.checked,
                                    })
                                  }
                                />
                              }
                              label={key.replace(/([A-Z])/g, ' $1')}
                            />
                          ))}
                        </FormGroup>
                      )}
                    />

                    <Stack direction="row" spacing={2} mt={2}>
                      <Controller
                        name="charLimit"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            label="Limit Item Name Characters"
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                      <Controller
                        name="maxItems"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            label="Limit Line Items"
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Printer Options */}
                  <Box>
                    <Typography fontWeight="bold" gutterBottom>
                      Printer Type
                    </Typography>
                    <Controller
                      name="printer"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup {...field}>
                          <FormControlLabel
                            value="thermal"
                            control={<Radio />}
                            label="Thermal Printer (4x6 inch, bulk, no ink)"
                          />
                          <FormControlLabel
                            value="inkjet"
                            control={<Radio />}
                            label="InkJet Printer (A4 sheet, needs cutting)"
                          />
                        </RadioGroup>
                      )}
                    />
                  </Box>

                  <Divider />

                  {/* Actions */}
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined">Set as Default</Button>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </Stack>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Label Preview */}
        <Grid size={{ xs: 12, md: 4 }}>
          <LabelPreview values={values} order={mockOrder} preferences={preferences} />
        </Grid>
      </Grid>
    </Stack>
  )
}
