// Google Drive™ API & OAuth Utilities for Silic
import { strToU8, zipSync, type Zippable } from "fflate"

export interface DriveTokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  error?: string
  error_description?: string
}

export class DriveApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "DriveApiError"
    this.status = status
    this.code = code
  }
}

interface GoogleIdentityGlobal {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string
          scope: string
          hint?: string
          callback: (response: DriveTokenResponse) => void
        }) => {
          requestAccessToken: (overrideConfig?: {
            prompt?: string
            hint?: string
          }) => void
        }
      }
    }
  }
}

let cachedAccessToken: string | null = null
let tokenExpiresAt = 0

/**
 * Load Google Identity Services (GIS) client script if not already present.
 */
export function loadGsiClientScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = (typeof window !== "undefined"
      ? window
      : undefined) as unknown as GoogleIdentityGlobal | undefined

    if (win?.google?.accounts?.oauth2) {
      resolve()
      return
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    )
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve())
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services"))
      )
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"))
    document.head.appendChild(script)
  })
}

/**
 * Get or request a Google OAuth 2.0 Access Token with Drive file scopes.
 */
export async function getGoogleAccessToken(options?: {
  prompt?: "" | "consent" | "select_account"
  forceRefresh?: boolean
  hint?: string
}): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID in environment variables")
  }

  // Return cached token if valid and not forcing refresh
  if (
    !options?.forceRefresh &&
    cachedAccessToken &&
    Date.now() < tokenExpiresAt
  ) {
    return cachedAccessToken
  }

  await loadGsiClientScript()

  return new Promise((resolve, reject) => {
    try {
      const win = window as unknown as GoogleIdentityGlobal
      const google = win.google
      if (!google?.accounts?.oauth2) {
        throw new Error("Google Identity Services not initialized")
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        hint: options?.hint,
        callback: (response: DriveTokenResponse) => {
          if (response.error) {
            reject(
              new DriveApiError(
                response.error_description ||
                  response.error ||
                  "Google authorization failed",
                401,
                response.error
              )
            )
            return
          }
          cachedAccessToken = response.access_token
          // Buffer of 60 seconds before expiration
          const expiresInSeconds = response.expires_in || 3599
          tokenExpiresAt = Date.now() + (expiresInSeconds - 60) * 1000
          resolve(response.access_token)
        },
      })

      client.requestAccessToken({
        prompt: options?.prompt !== undefined ? options.prompt : "",
        hint: options?.hint,
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Manually set the cached Google access token (e.g., from Picker auth).
 */
export function setCachedGoogleAccessToken(
  token: string,
  expiresIn: number = 3599
) {
  cachedAccessToken = token
  tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000
}

/**
 * Download a file binary from Google Drive™ via fileId, supporting Drive Resource Keys.
 */
export async function downloadDriveFile(
  fileId: string,
  accessToken: string,
  resourceKey?: string
): Promise<ArrayBuffer> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  }

  if (resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${fileId}/${resourceKey}`
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers }
  )

  if (!res.ok) {
    const errorMsg = await res.text().catch(() => "")
    throw new DriveApiError(
      errorMsg || `Drive fetch failed with status ${res.status}`,
      res.status
    )
  }

  return res.arrayBuffer()
}

export interface DriveFileMetadata {
  id: string
  name: string
  mimeType: string
  trashed?: boolean
  explicitlyTrashed?: boolean
}

/**
 * Fetch metadata for a file in Google Drive™ (including trash status and resource keys).
 */
export async function getDriveFileMetadata(
  fileId: string,
  accessToken: string,
  resourceKey?: string
): Promise<DriveFileMetadata> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  }

  if (resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${fileId}/${resourceKey}`
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,trashed,explicitlyTrashed`,
    { headers }
  )

  if (!res.ok) {
    const errorText = await res.text().catch(() => "")
    throw new DriveApiError(
      errorText || `Failed to get file metadata with status ${res.status}`,
      res.status
    )
  }

  return res.json()
}

/**
 * Save file to Google Drive™ (create new or update existing file), supporting folder resource keys.
 */
export async function saveToDrive(
  content: Blob,
  fileName: string,
  accessToken: string,
  existingFileId?: string,
  parentFolderId?: string,
  folderResourceKey?: string,
  fileResourceKey?: string
): Promise<{ id: string; name: string; [key: string]: unknown }> {
  const cleanName = fileName.endsWith(".silic") ? fileName : `${fileName}.silic`

  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: cleanName,
    mimeType: "application/octet-stream",
  }

  if (!existingFileId) {
    if (parentFolderId && parentFolderId !== "root") {
      metadata.parents = [parentFolderId]
    } else {
      metadata.parents = ["root"]
    }
  }

  const form = new FormData()
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  )
  form.append("file", content)

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  }

  if (folderResourceKey && parentFolderId && parentFolderId !== "root") {
    headers["X-Goog-Drive-Resource-Keys"] =
      `${parentFolderId}/${folderResourceKey}`
  } else if (fileResourceKey && existingFileId) {
    headers["X-Goog-Drive-Resource-Keys"] =
      `${existingFileId}/${fileResourceKey}`
  }

  const res = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers,
    body: form,
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => "")
    throw new DriveApiError(
      errorText || `Drive save failed with status ${res.status}`,
      res.status
    )
  }

  return res.json()
}

/**
 * Share a file on Google Drive™ as view-only (role: "reader").
 */
export async function shareViewOnly(
  fileId: string,
  accessToken: string,
  email?: string
): Promise<{ id?: string; [key: string]: unknown }> {
  const body = email
    ? { role: "reader", type: "user", emailAddress: email }
    : { role: "reader", type: "anyone" }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const errorText = await res.text().catch(() => "")
    throw new DriveApiError(
      errorText || `Drive share failed with status ${res.status}`,
      res.status
    )
  }

  return res.json()
}

/**
 * Generate an empty .silic project archive in memory.
 */
export function createEmptySilicBuffer(
  fileName: string = "Untitled"
): ArrayBuffer {
  const manifest = {
    version: 1,
    fileName,
    exportedAt: new Date().toISOString(),
    attachments: [],
  }

  const zipEntries: Zippable = {
    "manifest.json": [strToU8(JSON.stringify(manifest, null, 2)), { level: 6 }],
    "entities.json": [strToU8("[]"), { level: 6 }],
    "connections.json": [strToU8("[]"), { level: 6 }],
    "templates.json": [strToU8("[]"), { level: 6 }],
  }

  const zipped = zipSync(zipEntries)
  return zipped.buffer as ArrayBuffer
}

export type DriveStateAction =
  | {
      action: "open"
      fileId: string
      resourceKey?: string
      userId?: string
    }
  | {
      action: "create"
      folderId: string
      folderResourceKey?: string
      userId?: string
    }

/**
 * Check if the application was opened or created by Google Drive™ (via "Open with" or "New" action).
 */
export function handleDriveState(): DriveStateAction | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)
  const state = params.get("state")
  if (!state) return null

  try {
    const parsed = JSON.parse(state)
    if (
      parsed.action === "open" &&
      Array.isArray(parsed.ids) &&
      parsed.ids.length > 0
    ) {
      const fileId = parsed.ids[0]
      const resourceKey =
        parsed.resourceKeys && typeof parsed.resourceKeys === "object"
          ? parsed.resourceKeys[fileId]
          : undefined
      const userId =
        typeof parsed.userId === "string" ? parsed.userId : undefined
      return { action: "open", fileId, resourceKey, userId }
    }
    if (parsed.action === "create") {
      const folderId = parsed.folderId || "root"
      const folderResourceKey =
        typeof parsed.folderResourceKey === "string"
          ? parsed.folderResourceKey
          : undefined
      const userId =
        typeof parsed.userId === "string" ? parsed.userId : undefined
      return { action: "create", folderId, folderResourceKey, userId }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Backward-compatible helper for Google Drive™ open action.
 */
export function handleDriveOpenState(): string | null {
  const driveState = handleDriveState()
  return driveState?.action === "open" ? driveState.fileId : null
}
