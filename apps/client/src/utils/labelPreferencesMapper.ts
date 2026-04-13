// utils/labelPreferencesMapper.ts

import type { LabelPreferences } from '../api/labelPreference.api'
import type { LabelSettingsForm } from '../components/settings/Label/LabelSettings'

export function mapApiToForm(prefs: LabelPreferences): LabelSettingsForm {
  return {
    orderInfo: prefs.order_info,
    shipperInfo: prefs.shipper_info,
    productInfo: prefs.product_info,
    charLimit: prefs.char_limit,
    maxItems: prefs.max_items,
    printer: prefs.printer_type,
  }
}

export function mapFormToApi(form: LabelSettingsForm): Partial<LabelPreferences> {
  return {
    order_info: form.orderInfo,
    shipper_info: form.shipperInfo,
    product_info: form.productInfo,
    char_limit: form.charLimit,
    max_items: form.maxItems,
    printer_type: form.printer,
  }
}
