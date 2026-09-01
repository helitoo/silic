/**
 * Helper to trigger a browser file download from a Blob or ArrayBuffer.
 */
export function downloadBlob(
  data: Blob | ArrayBuffer | Uint8Array,
  fileName: string,
  mimeType = "application/octet-stream"
): void {
  const blob =
    data instanceof Blob ? data : new Blob([data as BlobPart], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 1000)
}

/**
 * Downloads project as a .silic file
 */
export function downloadSilicFile(
  zipBuffer: ArrayBuffer | Uint8Array,
  fileName: string
): void {
  const finalName = fileName.endsWith(".silic") ? fileName : `${fileName}.silic`
  downloadBlob(zipBuffer, finalName, "application/vnd.silic+zip")
}
