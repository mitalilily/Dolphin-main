import { Router } from 'express'
import {
  getUserWalletBalance,
  getWalletTransactionsController,
} from '../controllers/wallet.controller'
import { confirmFromClient, createTopup } from '../controllers/walletTopup.controller'
import { requireAuth } from '../middlewares/requireAuth'

const r = Router()

r.post('/wallet/topup', requireAuth, createTopup)
r.get('/wallet/transactions', requireAuth, getWalletTransactionsController)
r.post('/wallet/confirm', requireAuth, confirmFromClient)

r.get('/wallet/balance', requireAuth, getUserWalletBalance)

export default r
