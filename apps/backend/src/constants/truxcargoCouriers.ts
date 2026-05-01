export type TruxcargoCourierSeed = {
  id: number
  name: string
  sourceCode: string
  businessType: Array<'b2c' | 'b2b'>
}

export const TRUXCARGO_COURIER_SEEDS: TruxcargoCourierSeed[] = [
  { id: 701, name: 'TRUXCARGO', sourceCode: '07AAJCT0667J1Z0', businessType: ['b2c', 'b2b'] },
  { id: 601, name: 'DELHIVERY', sourceCode: '06AAPCS9575E1ZR', businessType: ['b2c', 'b2b'] },
  { id: 3601, name: 'GATI', sourceCode: '36AADCG2096A1ZY', businessType: ['b2c', 'b2b'] },
  { id: 8801, name: 'OxyZEN', sourceCode: '88AADC05675P1ZU', businessType: ['b2c', 'b2b'] },
  { id: 8802, name: 'DTDC', sourceCode: '88AAACD8017H1ZX', businessType: ['b2c', 'b2b'] },
  {
    id: 8803,
    name: 'Smartr Logistics',
    sourceCode: '88ABBCS3441C1ZQ',
    businessType: ['b2c', 'b2b'],
  },
  { id: 2701, name: 'RIVIGO', sourceCode: '27AACCV3947L1ZU', businessType: ['b2c', 'b2b'] },
  { id: 702, name: 'ekart', sourceCode: '07AADCI8374D2ZH', businessType: ['b2c', 'b2b'] },
  { id: 703, name: 'Ecom Express', sourceCode: '07AADCE1344F1Z2', businessType: ['b2c', 'b2b'] },
  { id: 2702, name: 'BLUE DART', sourceCode: '27AAACB0446L1ZS', businessType: ['b2c', 'b2b'] },
  { id: 8804, name: 'Shree Maruti', sourceCode: '88AABCM9407D1ZS', businessType: ['b2c', 'b2b'] },
]
