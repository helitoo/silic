import { useEffect, useRef, useState, useCallback } from "react"
import useInjectScript from "./useInjectScript"

export type CallbackDoc = {
  downloadUrl?: string
  uploadState?: string
  description?: string
  driveSuccess?: boolean
  embedUrl?: string
  iconUrl?: string
  id: string
  isShared?: boolean
  lastEditedUtc?: number
  mimeType: string
  name: string
  rotation?: number
  rotationDegree?: number
  serviceId?: string
  sizeBytes?: number
  type?: string
  url?: string
  resourceKey?: string
  [key: string]: unknown
}

export type PickerCallback = {
  action: "loaded" | "picked" | "cancel" | string
  docs?: CallbackDoc[]
  viewToken?: unknown[]
  [key: string]: unknown
}

export type authResult = {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  authuser?: string
  prompt?: string
  error?: string
  error_description?: string
}

export type ViewIdOptions =
  | "DOCS"
  | "DOCS_IMAGES"
  | "DOCS_IMAGES_AND_VIDEOS"
  | "DOCS_VIDEOS"
  | "DOCUMENTS"
  | "DRAWINGS"
  | "FOLDERS"
  | "FORMS"
  | "PDFS"
  | "SPREADSHEETS"
  | "PRESENTATIONS"

export interface PickerConfiguration {
  clientId: string
  developerKey: string
  viewId?: ViewIdOptions
  title?: string
  viewMimeTypes?: string
  setIncludeFolders?: boolean
  setSelectFolderEnabled?: boolean
  disableDefaultView?: boolean
  token?: string
  setOrigin?: string
  multiselect?: boolean
  disabled?: boolean
  appId?: string
  supportDrives?: boolean
  showUploadView?: boolean
  showUploadFolders?: boolean
  setParentFolder?: string
  customViews?: unknown[]
  locale?: string
  customScopes?: string[]
  prompt?: string
  trigger_onepick?: boolean | string
  callbackFunction: (data: PickerCallback) => unknown
}

export const defaultConfiguration: PickerConfiguration = {
  clientId: "",
  developerKey: "",
  viewId: "DOCS",
  callbackFunction: () => null,
}

// Drive scope strictly limited to drive.file as requested
const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file"
const DEFAULT_SCOPES = [DRIVE_FILE_SCOPE]

const GAPI_SCRIPT_URL = "https://apis.google.com/js/api.js"
const GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client"

interface GooglePickerDocsViewInstance {
  setIncludeFolders: (enable: boolean) => GooglePickerDocsViewInstance
  setSelectFolderEnabled: (enable: boolean) => GooglePickerDocsViewInstance
  setParent: (parentId: string) => GooglePickerDocsViewInstance
  setMimeTypes: (mimeTypes: string) => GooglePickerDocsViewInstance
  setMode: (mode: unknown) => GooglePickerDocsViewInstance
  [key: string]: unknown
}

interface GooglePickerDocsUploadViewInstance {
  setIncludeFolders: (enable: boolean) => GooglePickerDocsUploadViewInstance
  setParent: (parentId: string) => GooglePickerDocsUploadViewInstance
  setMimeTypes: (mimeTypes: string) => GooglePickerDocsUploadViewInstance
  [key: string]: unknown
}

interface GooglePickerInstance {
  setVisible: (visible: boolean) => void
  dispose?: () => void
  [key: string]: unknown
}

interface GooglePickerBuilderInstance {
  setAppId: (appId: string) => GooglePickerBuilderInstance
  setOAuthToken: (token: string) => GooglePickerBuilderInstance
  setDeveloperKey: (key: string) => GooglePickerBuilderInstance
  setTitle: (title: string) => GooglePickerBuilderInstance
  setLocale: (locale: string) => GooglePickerBuilderInstance
  setCallback: (
    callback: (data: PickerCallback) => unknown
  ) => GooglePickerBuilderInstance
  setOrigin: (origin: string) => GooglePickerBuilderInstance
  addView: (view: unknown) => GooglePickerBuilderInstance
  enableFeature: (feature: unknown) => GooglePickerBuilderInstance
  build: () => GooglePickerInstance
  [key: string]: unknown
}

interface WindowGoogleGlobal {
  gapi?: {
    load: (
      apiName: string,
      callbackOrConfig: (() => void) | { callback?: () => void }
    ) => void
  }
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string
          scope: string
          hint?: string
          prompt?: string
          trigger_onepick?: string | boolean
          callback: (response: authResult) => void
          [key: string]: unknown
        }) => {
          requestAccessToken: (overrideConfig?: {
            prompt?: string
            hint?: string
            trigger_onepick?: string | boolean
            [key: string]: unknown
          }) => void
        }
      }
    }
    picker?: {
      DocsView: new (viewId?: unknown) => GooglePickerDocsViewInstance
      DocsUploadView: new () => GooglePickerDocsUploadViewInstance
      PickerBuilder: new () => GooglePickerBuilderInstance
      ViewId: Record<string, unknown>
      Feature: Record<string, unknown>
      Action: Record<string, unknown>
      DocsViewMode: Record<string, unknown>
    }
  }
}

/**
 * Custom hook to open Google Drive™ Picker with OAuth 2.0 flow restricted to drive.file.
 */
export function useDrivePicker(): [
  (config: PickerConfiguration) => boolean | undefined,
  authResult | undefined
] {
  const [loadedGapi, errorGapi] = useInjectScript(GAPI_SCRIPT_URL)
  const [loadedGsi, errorGsi] = useInjectScript(GSI_SCRIPT_URL)
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false)
  const [authRes, setAuthRes] = useState<authResult | undefined>()

  const pendingConfigRef = useRef<PickerConfiguration | null>(null)
  const pickerInstanceRef = useRef<GooglePickerInstance | null>(null)

  // Load the Google Picker API via gapi.load once api.js is loaded
  useEffect(() => {
    if (loadedGapi && !errorGapi && !pickerApiLoaded) {
      const win = window as unknown as WindowGoogleGlobal
      if (win.gapi) {
        win.gapi.load("picker", {
          callback: () => {
            setPickerApiLoaded(true)
          },
        })
      }
    }
  }, [loadedGapi, errorGapi, pickerApiLoaded])

  // Create and display the picker dialog
  const createPicker = useCallback((config: PickerConfiguration) => {
    if (config.disabled) return false
    const win = window as unknown as WindowGoogleGlobal
    const googlePicker = win.google?.picker

    if (!googlePicker) {
      console.warn("Google Picker API is not ready yet")
      return false
    }

    const {
      token,
      appId = "",
      supportDrives = false,
      developerKey,
      viewId = "DOCS",
      multiselect,
      setOrigin,
      showUploadView = false,
      showUploadFolders,
      setParentFolder = "",
      viewMimeTypes,
      customViews,
      locale = "en",
      setIncludeFolders,
      setSelectFolderEnabled,
      disableDefaultView = false,
      callbackFunction,
    } = config

    const viewIdKey = viewId || "DOCS"
    const viewIdEnum =
      googlePicker.ViewId[viewIdKey] ?? googlePicker.ViewId.DOCS
    const view = new googlePicker.DocsView(viewIdEnum)

    if (viewMimeTypes) view.setMimeTypes(viewMimeTypes)
    if (setIncludeFolders) view.setIncludeFolders(true)
    if (setSelectFolderEnabled) view.setSelectFolderEnabled(true)
    if (setParentFolder) view.setParent(setParentFolder)

    let uploadView: GooglePickerDocsUploadViewInstance | null = null
    if (showUploadView) {
      uploadView = new googlePicker.DocsUploadView()
      if (viewMimeTypes) uploadView.setMimeTypes(viewMimeTypes)
      if (showUploadFolders) uploadView.setIncludeFolders(true)
      if (setParentFolder) uploadView.setParent(setParentFolder)
    }

    const builder = new googlePicker.PickerBuilder()
      .setAppId(appId)
      .setDeveloperKey(developerKey)
      .setLocale(locale)
      .setCallback(callbackFunction)

    if (config.title) {
      builder.setTitle(config.title)
    }

    if (token) {
      builder.setOAuthToken(token)
    }

    if (setOrigin) {
      builder.setOrigin(setOrigin)
    }

    const hasCustomViews =
      Boolean(customViews && Array.isArray(customViews) && customViews.length > 0)
    const shouldDisableDefaultView = disableDefaultView || hasCustomViews

    if (!shouldDisableDefaultView) {
      builder.addView(view)
    }

    if (customViews && Array.isArray(customViews)) {
      customViews.forEach((customView) => {
        if (customView) builder.addView(customView)
      })
    }

    if (multiselect && googlePicker.Feature?.MULTISELECT_ENABLED) {
      builder.enableFeature(googlePicker.Feature.MULTISELECT_ENABLED)
    }

    if (uploadView) {
      builder.addView(uploadView)
    }

    if (supportDrives && googlePicker.Feature?.SUPPORT_DRIVES) {
      builder.enableFeature(googlePicker.Feature.SUPPORT_DRIVES)
    }

    const picker = builder.build()
    pickerInstanceRef.current = picker
    picker.setVisible(true)
    return true
  }, [])

  // Process pending configuration when picker API and scripts become ready
  useEffect(() => {
    if (
      pendingConfigRef.current &&
      pendingConfigRef.current.token &&
      pickerApiLoaded &&
      loadedGsi &&
      !errorGsi &&
      !errorGapi
    ) {
      const config = pendingConfigRef.current
      pendingConfigRef.current = null
      createPicker(config)
    }
  }, [pickerApiLoaded, loadedGsi, errorGsi, errorGapi, createPicker])

  // Open Picker function
  const openPicker = useCallback(
    (config: PickerConfiguration): boolean | undefined => {
      if (config.disabled) return false

      const effectiveToken = config.token || authRes?.access_token

      // If token is missing, request token via Google Identity Services (GSI)
      if (!effectiveToken) {
        const win = window as unknown as WindowGoogleGlobal
        if (!win.google?.accounts?.oauth2) {
          // If GSI is still loading, queue the config
          pendingConfigRef.current = config
          return false
        }

        // Always enforce drive.file scope
        const scopes =
          config.customScopes && config.customScopes.length > 0
            ? config.customScopes.filter(
                (s) => s === DRIVE_FILE_SCOPE || s.includes("drive.file")
              )
            : DEFAULT_SCOPES

        const finalScopes =
          scopes.length > 0 ? scopes.join(" ") : DRIVE_FILE_SCOPE

        const promptValue =
          config.prompt !== undefined ? config.prompt : "consent"
        const triggerOnepick =
          config.trigger_onepick !== undefined
            ? String(config.trigger_onepick)
            : "true"

        const client = win.google.accounts.oauth2.initTokenClient({
          client_id: config.clientId,
          scope: finalScopes,
          prompt: promptValue,
          trigger_onepick: triggerOnepick,
          callback: (tokenResponse: authResult) => {
            if (tokenResponse?.access_token) {
              setAuthRes(tokenResponse)
              const updatedConfig = {
                ...config,
                token: tokenResponse.access_token,
              }
              if (pickerApiLoaded) {
                createPicker(updatedConfig)
              } else {
                pendingConfigRef.current = updatedConfig
              }
            } else if (tokenResponse?.error) {
              console.error("Google Auth error:", tokenResponse.error)
              config.callbackFunction({
                action: "cancel",
              })
            }
          },
        })

        client.requestAccessToken({
          prompt: promptValue,
          trigger_onepick: triggerOnepick,
        })
        return true
      }

      // If token is present and picker API is ready
      const configWithToken = { ...config, token: effectiveToken }
      if (pickerApiLoaded) {
        return createPicker(configWithToken)
      } else {
        pendingConfigRef.current = configWithToken
        return true
      }
    },
    [authRes, pickerApiLoaded, createPicker]
  )

  return [openPicker, authRes]
}

export default useDrivePicker
