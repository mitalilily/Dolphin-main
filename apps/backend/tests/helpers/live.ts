import { qaEnv } from '../config/env'

export const describeLive = qaEnv.runLiveE2E ? describe : describe.skip
export const testLive = qaEnv.runLiveE2E ? it : it.skip
