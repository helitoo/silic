import { strToU8, strFromU8, zipSync, unzipSync, type Zippable } from "fflate"

export interface ExportWorkerInput {
  action: "export"
  manifestJson: string
  entitiesJson: string
  connectionsJson: string
  templatesJson: string
  attachments: Array<{
    path: string // e.g. "attachments/anh1.jpg"
    buffer: ArrayBuffer
  }>
}

export interface ImportWorkerInput {
  action: "import"
  buffer: ArrayBuffer
}

export interface ExportWorkerSuccessResponse {
  success: true
  action: "export"
  zipBuffer: ArrayBuffer
}

export interface ImportWorkerSuccessResponse {
  success: true
  action: "import"
  manifestJson: string
  entitiesJson: string
  connectionsJson: string
  templatesJson: string
  attachments: Array<{
    path: string
    buffer: ArrayBuffer
  }>
}

export interface WorkerErrorResponse {
  success: false
  action: "export" | "import"
  error: string
}

const ctx = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void
  onmessage: ((e: MessageEvent<ExportWorkerInput | ImportWorkerInput>) => void) | null
}

ctx.onmessage = (
  e: MessageEvent<ExportWorkerInput | ImportWorkerInput>
) => {
  const data = e.data

  try {
    if (data.action === "export") {
      const zipEntries: Zippable = {}

      // JSON metadata files compressed with DEFLATE (level 6)
      zipEntries["manifest.json"] = [strToU8(data.manifestJson), { level: 6 }]
      zipEntries["entities.json"] = [strToU8(data.entitiesJson), { level: 6 }]
      zipEntries["connections.json"] = [
        strToU8(data.connectionsJson),
        { level: 6 },
      ]
      zipEntries["templates.json"] = [strToU8(data.templatesJson), { level: 6 }]

      // Attachments stored uncompressed (level 0) for maximum speed
      for (const att of data.attachments) {
        zipEntries[att.path] = [new Uint8Array(att.buffer), { level: 0 }]
      }

      const zipped = zipSync(zipEntries)
      const res: ExportWorkerSuccessResponse = {
        success: true,
        action: "export",
        zipBuffer: zipped.buffer as ArrayBuffer,
      }
      ctx.postMessage(res, [res.zipBuffer])
      return
    }

    if (data.action === "import") {
      const unzipped = unzipSync(new Uint8Array(data.buffer))

      let manifestJson = "{}"
      let entitiesJson = "[]"
      let connectionsJson = "[]"
      let templatesJson = "[]"
      const attachments: Array<{ path: string; buffer: ArrayBuffer }> = []

      const transferableBuffers: ArrayBuffer[] = []

      for (const [filename, fileBytes] of Object.entries(unzipped)) {
        if (filename === "manifest.json") {
          manifestJson = strFromU8(fileBytes)
        } else if (filename === "entities.json") {
          entitiesJson = strFromU8(fileBytes)
        } else if (filename === "connections.json") {
          connectionsJson = strFromU8(fileBytes)
        } else if (filename === "templates.json") {
          templatesJson = strFromU8(fileBytes)
        } else if (filename.startsWith("attachments/")) {
          // Copy buffer to make sure it's an independent ArrayBuffer for transfer
          const copiedBuffer = fileBytes.buffer.slice(
            fileBytes.byteOffset,
            fileBytes.byteOffset + fileBytes.byteLength
          )
          attachments.push({
            path: filename,
            buffer: copiedBuffer,
          })
          transferableBuffers.push(copiedBuffer)
        }
      }

      const res: ImportWorkerSuccessResponse = {
        success: true,
        action: "import",
        manifestJson,
        entitiesJson,
        connectionsJson,
        templatesJson,
        attachments,
      }
      ctx.postMessage(res, transferableBuffers)
      return
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown worker error"
    const errorRes: WorkerErrorResponse = {
      success: false,
      action: data.action,
      error: errorMsg,
    }
    ctx.postMessage(errorRes)
  }
}
