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
 * Generic timeout wrapper for asynchronous operations to prevent hanging promises.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage = "Operation timed out"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ])
}

/**
 * Load Google Identity Services (GIS) client script if not already present.
 */
export function loadGsiClientScript(): Promise<void> {
  const loadPromise = new Promise<void>((resolve, reject) => {
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

  return withTimeout(
    loadPromise,
    10000,
    "Timed out loading Google Identity Services client script"
  )
}

/**
 * Get or request a Google OAuth 2.0 Access Token with Drive file scopes.
 */
export async function getGoogleAccessToken(options?: {
  prompt?: "" | "consent" | "select_account"
  forceRefresh?: boolean
  hint?: string
  timeoutMs?: number
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

  const defaultTimeout = options?.prompt === "" ? 5000 : 60000
  const timeoutMs = options?.timeoutMs ?? defaultTimeout

  const tokenPromise = new Promise<string>((resolve, reject) => {
    try {
      const win = window as unknown as GoogleIdentityGlobal
      const google = win.google
      if (!google?.accounts?.oauth2) {
        reject(new Error("Google Identity Services not initialized"))
        return
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

  return withTimeout(
    tokenPromise,
    timeoutMs,
    options?.prompt === ""
      ? "Silent Google authorization timed out (User activation required or cookies blocked)"
      : "Google authorization popup timed out or was closed"
  )
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
 * Check if a valid Google access token is currently cached in memory.
 */
export function hasValidCachedGoogleAccessToken(): boolean {
  return !!(cachedAccessToken && Date.now() < tokenExpiresAt)
}

/**
 * Get the currently cached Google access token if valid.
 */
export function getCachedGoogleAccessToken(): string | null {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken
  }
  return null
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

  const fetchPromise = fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers }
  )

  const res = await withTimeout(
    fetchPromise,
    30000,
    "Google Drive file download timed out (30s limit)"
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

  const fetchPromise = fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,trashed,explicitlyTrashed`,
    { headers }
  )

  const res = await withTimeout(
    fetchPromise,
    15000,
    "Google Drive metadata request timed out (15s limit)"
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
    if (!parentFolderId || parentFolderId === "root") {
      throw new DriveApiError(
        "Cannot save file directly to the root folder. A target folder is required.",
        400,
        "ROOT_SAVE_DISALLOWED"
      )
    }
    metadata.parents = [parentFolderId]
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

  const fetchPromise = fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers,
    body: form,
  })

  const res = await withTimeout(
    fetchPromise,
    45000,
    "Google Drive save/upload timed out (45s limit)"
  )

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
 * Create a new folder on Google Drive™.
 */
export async function createDriveFolder(
  folderName: string,
  accessToken: string,
  parentFolderId?: string,
  folderResourceKey?: string
): Promise<{ id: string; name: string; [key: string]: unknown }> {
  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName.trim() || "Untitled Folder",
    mimeType: "application/vnd.google-apps.folder",
  }

  if (parentFolderId && parentFolderId !== "root") {
    metadata.parents = [parentFolderId]
  } else {
    metadata.parents = ["root"]
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }

  if (folderResourceKey && parentFolderId && parentFolderId !== "root") {
    headers["X-Goog-Drive-Resource-Keys"] =
      `${parentFolderId}/${folderResourceKey}`
  }

  const fetchPromise = fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers,
    body: JSON.stringify(metadata),
  })

  const res = await withTimeout(
    fetchPromise,
    20000,
    "Google Drive folder creation timed out (20s limit)"
  )

  if (!res.ok) {
    const errorText = await res.text().catch(() => "")
    throw new DriveApiError(
      errorText || `Failed to create folder with status ${res.status}`,
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

  const fetchPromise = fetch(
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

  const res = await withTimeout(
    fetchPromise,
    20000,
    "Google Drive permission share timed out (20s limit)"
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
 * Supports official Google Drive state parameter specification (ids as array or comma-separated string, exportIds, resourceKeys dictionary, folderId, folderResourceKey, userId).
 */
export function handleDriveState(): DriveStateAction | null {
  if (typeof window === "undefined") return null

  let stateStr = ""
  try {
    const params = new URLSearchParams(window.location.search)
    const queryState = params.get("state")
    if (queryState) {
      stateStr = queryState
    } else if (window.location.hash) {
      // Fallback: check query parameter inside location.hash if present
      const hashQueryIndex = window.location.hash.indexOf("?")
      if (hashQueryIndex !== -1) {
        const hashParams = new URLSearchParams(
          window.location.hash.slice(hashQueryIndex)
        )
        stateStr = hashParams.get("state") || ""
      }
    }
  } catch (urlErr) {
    console.error("Failed to read URL parameters for Google Drive state:", urlErr)
    return null
  }

  if (!stateStr) return null

  try {
    // Handle direct JSON string or double-encoded string
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(stateStr)
    } catch {
      parsed = JSON.parse(decodeURIComponent(stateStr))
    }

    if (!parsed || typeof parsed !== "object") {
      console.warn("Parsed Google Drive state is not an object:", parsed)
      return null
    }

    const action =
      typeof parsed.action === "string" ? parsed.action.toLowerCase() : ""
    const userId = parsed.userId ? String(parsed.userId) : undefined

    // Extract file IDs from ids or exportIds (support Array or comma-separated string)
    let rawIds: string[] = []
    if (Array.isArray(parsed.ids)) {
      rawIds = parsed.ids.map(String).filter(Boolean)
    } else if (typeof parsed.ids === "string" && parsed.ids.trim()) {
      rawIds = parsed.ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (Array.isArray(parsed.exportIds)) {
      rawIds = parsed.exportIds.map(String).filter(Boolean)
    } else if (typeof parsed.exportIds === "string" && parsed.exportIds.trim()) {
      rawIds = parsed.exportIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }

    // 1. Open URL action
    if (action === "open" || (rawIds.length > 0 && action !== "create")) {
      if (rawIds.length === 0) {
        console.warn("Drive state 'open' action missing valid file IDs:", parsed)
        return null
      }
      const fileId = rawIds[0]
      const resourceKeysDict =
        parsed.resourceKeys && typeof parsed.resourceKeys === "object"
          ? (parsed.resourceKeys as Record<string, unknown>)
          : undefined
      const resourceKey = resourceKeysDict?.[fileId]
        ? String(resourceKeysDict[fileId])
        : undefined

      return { action: "open", fileId, resourceKey, userId }
    }

    // 2. New URL (create) action
    if (action === "create" || parsed.folderId || parsed.folderResourceKey) {
      const folderId = parsed.folderId ? String(parsed.folderId) : "root"
      const folderResourceKey = parsed.folderResourceKey
        ? String(parsed.folderResourceKey)
        : undefined

      return { action: "create", folderId, folderResourceKey, userId }
    }

    console.warn("Google Drive state did not match 'open' or 'create' actions:", parsed)
    return null
  } catch (parseErr) {
    console.error("Failed to parse Google Drive state query parameter:", parseErr, "rawState:", stateStr)
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
