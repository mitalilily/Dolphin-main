import nock from 'nock'
import { qaEnv } from '../config/env'
import { qaLog } from '../utils/logger'

jest.setTimeout(qaEnv.longTimeoutMs)

beforeAll(() => {
  qaLog.info('QA tests bootstrapped', {
    envFile: qaEnv.envPath,
    apiBaseUrl: qaEnv.apiBaseUrl,
    runLiveE2E: qaEnv.runLiveE2E,
    runLoad: qaEnv.runLoad,
  })
})

afterEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.restore()
})
