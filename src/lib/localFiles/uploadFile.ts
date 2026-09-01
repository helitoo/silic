export interface UploadFileOptions {
  accept?: string
  multiple?: boolean
}

/**
 * General browser file picker helper.
 * Allows specifying file extension(s) or mime types via the `accept` parameter.
 */
export function uploadFile(options?: UploadFileOptions): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    if (options?.accept) {
      input.accept = options.accept
    }
    input.multiple = Boolean(options?.multiple)
    input.style.display = "none"

    let settled = false

    const cleanup = () => {
      if (settled) return
      settled = true
      input.removeEventListener("change", handleChange)
      input.removeEventListener("cancel", handleCancel)
      window.removeEventListener("focus", handleWindowFocus)
      if (document.body.contains(input)) {
        document.body.removeChild(input)
      }
    }

    const handleChange = () => {
      const files = Array.from(input.files || [])
      cleanup()
      resolve(files)
    }

    const handleCancel = () => {
      cleanup()
      resolve([])
    }

    // Fallback cancel detection on window refocus
    const handleWindowFocus = () => {
      setTimeout(() => {
        if (!settled && (!input.files || input.files.length === 0)) {
          cleanup()
          resolve([])
        }
      }, 500)
    }

    input.addEventListener("change", handleChange)
    input.addEventListener("cancel", handleCancel)
    window.addEventListener("focus", handleWindowFocus, { once: true })

    document.body.appendChild(input)
    input.click()
  })
}

/**
 * Convenience helper to upload a single file.
 */
export async function uploadSingleFile(
  options?: Omit<UploadFileOptions, "multiple">
): Promise<File | null> {
  const files = await uploadFile({ ...options, multiple: false })
  return files.length > 0 ? files[0] : null
}
