import fs from 'fs/promises'
import path from 'path'
import axios from 'axios'
import fileType from 'file-type'
import { presignDownload } from './upload.service'

const DEFAULT_PLATFORM_LOGO_KEY = 'dolphin-logo-transparent.png'

const localPlatformLogoCandidates = [
  path.resolve(__dirname, '../../../../client/public/logo/dolphin-logo-transparent.png'),
  path.resolve(__dirname, '../../../../client/public/logo/dolphin-logo.png'),
  path.resolve(__dirname, '../../../../admin/public/logo/dolphin-logo-transparent.png'),
  path.resolve(__dirname, '../../../../admin/public/logo/dolphin-logo.png'),
  path.resolve(__dirname, '../../../../client/public/logo/logo-white.png'),
]

const toImageDataUrl = async (buffer: Buffer): Promise<string | null> => {
  if (!buffer?.length) return null
  const detected = await fileType.fromBuffer(buffer)
  const mime = detected?.mime?.startsWith('image/') ? detected.mime : 'image/png'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

const resolveSignedUrl = async (key: string): Promise<string | null> => {
  const signed = await presignDownload(key)
  if (Array.isArray(signed)) return signed[0] || null
  return signed || null
}

export const loadPlatformLogoDataUrl = async (logoKey?: string | null): Promise<string | null> => {
  const key = String(logoKey || DEFAULT_PLATFORM_LOGO_KEY).trim()

  if (key) {
    try {
      const signedUrl = await resolveSignedUrl(key)
      if (signedUrl && /^https?:\/\//i.test(signedUrl)) {
        const response = await axios.get(signedUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
        })
        return toImageDataUrl(Buffer.from(response.data))
      }
    } catch (error: any) {
      console.warn('[Platform Logo] R2 logo unavailable, using local fallback', {
        key,
        message: error?.message || error,
      })
    }
  }

  for (const candidate of localPlatformLogoCandidates) {
    try {
      const buffer = await fs.readFile(candidate)
      return toImageDataUrl(buffer)
    } catch {
      // Try the next committed logo candidate.
    }
  }

  return null
}
