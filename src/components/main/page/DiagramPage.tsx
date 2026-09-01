import * as React from "react"
import ForceGraph from "force-graph"
import {
  RotateCcw,
  Sliders,
  ZoomIn,
  ZoomOut,
  Route,
  VectorSquare,
} from "lucide-react"

import type { Entity, Connection } from "@/lib/types"
import { getEntityName, getConnectionName } from "@/lib/utils"
import { useEntity } from "@/contexts/EntityContext"
import { useTemplate } from "@/contexts/TemplateContext"
import { useQuery } from "@/contexts/QueryContext"
import { useLang } from "@/contexts/LangContext"
import { TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/contexts/RouterContext"

interface GraphNode {
  id: string
  name: string
  entity: Entity
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  connectionId: string
  name: string
  isDirectional: boolean
  connection: Connection
}

export default function DiagramPage() {
  const { entities } = useEntity()
  const { templates } = useTemplate()
  const { currentEntities, currentConnections, currentPath, isPathFiltered } =
    useQuery()
  const { t } = useLang()
  const { navigate } = useRouter()

  const containerRef = React.useRef<HTMLDivElement>(null)
  const fgRef = React.useRef<any>(null)

  // Options state
  const [showEntityName, setShowEntityName] = React.useState<boolean>(true)
  const [showConnectionName, setShowConnectionName] =
    React.useState<boolean>(true)

  const showEntityNameRef = React.useRef(showEntityName)
  const showConnectionNameRef = React.useRef(showConnectionName)
  showEntityNameRef.current = showEntityName
  showConnectionNameRef.current = showConnectionName

  // Sets of highlighted path IDs
  const pathNodeIds = React.useMemo(() => {
    if (!currentPath || !currentPath.found || !currentPath.entities) {
      return new Set<string>()
    }
    return new Set(currentPath.entities.map((e) => e.id))
  }, [currentPath])

  const pathConnectionIds = React.useMemo(() => {
    if (!currentPath || !currentPath.found || !currentPath.connections) {
      return new Set<string>()
    }
    return new Set(currentPath.connections.map((c) => c.id))
  }, [currentPath])

  const pathNodeIdsRef = React.useRef(pathNodeIds)
  const pathConnectionIdsRef = React.useRef(pathConnectionIds)
  pathNodeIdsRef.current = pathNodeIds
  pathConnectionIdsRef.current = pathConnectionIds

  // Transform data for force-graph
  const graphData = React.useMemo(() => {
    const nodes: GraphNode[] = currentEntities.map((ent) => ({
      id: ent.id,
      name: getEntityName(ent),
      entity: ent,
    }))

    const validNodeIdSet = new Set(nodes.map((n) => n.id))
    const links: GraphLink[] = []

    for (const conn of currentConnections) {
      const connName = getConnectionName(conn, templates)
      for (const fromId of conn.from) {
        for (const toId of conn.to) {
          if (validNodeIdSet.has(fromId) && validNodeIdSet.has(toId)) {
            links.push({
              source: fromId,
              target: toId,
              connectionId: conn.id,
              name: connName,
              isDirectional: conn.isDirectional,
              connection: conn,
            })
          }
        }
      }
    }

    return { nodes, links }
  }, [currentEntities, currentConnections])

  const graphDataRef = React.useRef(graphData)
  graphDataRef.current = graphData

  // Function to initialize or re-initialize ForceGraph
  const initGraph = React.useCallback(
    (container: HTMLDivElement, width: number, height: number) => {
      if (fgRef.current) return

      container.innerHTML = ""
      const fg = new ForceGraph(container)
        .width(width)
        .height(height)
        .backgroundColor("rgba(0,0,0,0)")
        .nodeId("id")
        .nodeCanvasObjectMode(() => "replace")
        .nodeCanvasObject(
          (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const isHighlighted = pathNodeIdsRef.current.has(node.id)
            const isDark =
              typeof document !== "undefined" &&
              document.documentElement.classList.contains("dark")
            const r = isHighlighted ? 2.5 : 1.5

            ctx.beginPath()
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false)
            ctx.fillStyle = isHighlighted
              ? "#0267ab"
              : isDark
                ? "#737373"
                : "#64748b"
            ctx.fill()

            if (isHighlighted) {
              ctx.lineWidth = Math.max(1 / globalScale, 0.5)
              ctx.strokeStyle = "#38bdf8"
              ctx.stroke()
            }
          }
        )
        .nodePointerAreaPaint(
          (node: any, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false)
            ctx.fill()
          }
        )
        .linkColor((link: any) =>
          pathConnectionIdsRef.current.has(link.connectionId)
            ? "#0267ab"
            : typeof document !== "undefined" &&
                document.documentElement.classList.contains("dark")
              ? "#525252"
              : "#94a3b8"
        )
        .linkWidth((link: any) =>
          pathConnectionIdsRef.current.has(link.connectionId) ? 2 : 1
        )
        .linkDirectionalArrowLength((link: any) =>
          link.isDirectional
            ? pathConnectionIdsRef.current.has(link.connectionId)
              ? 5
              : 3.5
            : 0
        )
        .linkDirectionalArrowRelPos(1)
        .linkDirectionalArrowColor((link: any) =>
          pathConnectionIdsRef.current.has(link.connectionId)
            ? "#0267ab"
            : typeof document !== "undefined" &&
                document.documentElement.classList.contains("dark")
              ? "#525252"
              : "#94a3b8"
        )
        .linkDirectionalParticles((link: any) =>
          pathConnectionIdsRef.current.has(link.connectionId) ? 3 : 0
        )
        .linkDirectionalParticleSpeed(0.008)
        .linkDirectionalParticleColor(() => "#38bdf8")
        .linkHoverPrecision(6)
        // Draw all labels on top of everything after entire graph frame is rendered
        .onRenderFramePost(
          (ctx: CanvasRenderingContext2D, globalScale: number) => {
            const { nodes, links } = fg.graphData()
            const isDark =
              typeof document !== "undefined" &&
              document.documentElement.classList.contains("dark")

            const connectionLabelColor = isDark ? "#a3a3a3" : "#525252"
            const entityLabelColor = isDark ? "#d4d4d4" : "#404040"

            // 1. Draw connection labels on top of all edges
            if (showConnectionNameRef.current && links) {
              const fontSize = Math.max(6.5 / globalScale, 1.6)
              ctx.font = `${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillStyle = connectionLabelColor

              for (const link of links as any[]) {
                const label = link.name || ""
                if (!label) continue
                const start = link.source
                const end = link.target
                if (
                  !start ||
                  !end ||
                  typeof start.x !== "number" ||
                  typeof end.x !== "number"
                )
                  continue

                const midX = start.x + (end.x - start.x) / 2
                const midY = start.y + (end.y - start.y) / 2

                const relAngle = Math.atan2(end.y - start.y, end.x - start.x)
                // Keep text upright so it's always easily readable (not upside down)
                const angle =
                  relAngle > Math.PI / 2 || relAngle < -Math.PI / 2
                    ? relAngle + Math.PI
                    : relAngle

                ctx.save()
                ctx.translate(midX, midY)
                ctx.rotate(angle)
                ctx.fillText(label, 0, 0)
                ctx.restore()
              }
            }

            // 2. Draw entity labels on top of all nodes
            if (showEntityNameRef.current && nodes) {
              const fontSize = Math.max(7 / globalScale, 1.8)
              ctx.font = `${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`
              ctx.textAlign = "center"
              ctx.textBaseline = "top"
              ctx.fillStyle = entityLabelColor

              for (const node of nodes as any[]) {
                const label = node.name || node.id || ""
                if (!label) continue
                if (typeof node.x !== "number" || typeof node.y !== "number")
                  continue

                const isHighlighted = pathNodeIdsRef.current.has(node.id)
                const r = isHighlighted ? 2.5 : 1.5
                ctx.fillText(label, node.x, node.y + r + 1.5 / globalScale)
              }
            }
          }
        )
        // Tooltip khi rê chuột vào Node (Entity)
        .nodeLabel((node: any) => {
          return `<div>${node.name || node.id}</div>`
        })
        // Tooltip khi rê chuột vào Edge (Connection)
        .linkLabel((link: any) => {
          return `<div>${link.name || link.connectionId}</div>`
        })
        .onNodeClick((node: any) => {
          if (node?.id) {
            navigate(`/d/entity/${node.id}/detail`)
          }
        })
        .graphData(graphDataRef.current)

      fgRef.current = fg

      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 40)
        }
      }, 300)
    },
    [entities]
  )

  // IntersectionObserver & ResizeObserver to handle mount, tab switching, and window resizing
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // IntersectionObserver triggers when the tab becomes active/visible
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const w = container.clientWidth || window.innerWidth || 800
            const h = container.clientHeight || window.innerHeight - 65 || 600

            if (w > 0 && h > 0) {
              if (!fgRef.current) {
                initGraph(container, w, h)
              } else {
                fgRef.current.width(w)
                fgRef.current.height(h)
                fgRef.current.resumeAnimation()
                fgRef.current.d3ReheatSimulation()
              }
            }
          }
        }
      },
      { threshold: 0.01 }
    )

    intersectionObserver.observe(container)

    // ResizeObserver tracks container width/height changes while active
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (w > 50 && h > 50 && fgRef.current) {
          fgRef.current.width(w)
          fgRef.current.height(h)
          fgRef.current.resumeAnimation()
          fgRef.current.d3ReheatSimulation()
        }
      }
    })
    resizeObserver.observe(container)

    // If container is already visible on mount, initialize immediately
    const initialW = container.clientWidth
    const initialH = container.clientHeight
    if (initialW > 0 && initialH > 0 && !fgRef.current) {
      initGraph(container, initialW, initialH)
    }

    return () => {
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      if (fgRef.current && typeof fgRef.current._destructor === "function") {
        fgRef.current._destructor()
      }
      fgRef.current = null
    }
  }, [initGraph])

  // Sync graphData & options whenever graphData or path results change
  React.useEffect(() => {
    if (!fgRef.current) return
    fgRef.current.graphData(graphData)
    fgRef.current.resumeAnimation()
    fgRef.current.d3ReheatSimulation()
  }, [graphData])

  // Reheat simulation when toggling display names
  React.useEffect(() => {
    if (!fgRef.current) return
    fgRef.current.resumeAnimation()
    fgRef.current.d3ReheatSimulation()
  }, [showEntityName, showConnectionName])

  // Camera Controls
  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.3, 300)
    }
  }

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.3, 300)
    }
  }

  const handleFitView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 40)
    }
  }

  const handleReheat = () => {
    if (fgRef.current) {
      fgRef.current.resumeAnimation()
      fgRef.current.d3ReheatSimulation()
    }
  }

  return (
    <TabsContent
      value="diagram"
      className="relative m-0 h-[calc(100vh-65px)] min-h-[500px] w-full overflow-hidden p-0 focus-visible:outline-none"
    >
      {/* Background canvas container */}
      <div
        ref={containerRef}
        className="absolute inset-0 size-full bg-radial from-muted/20 via-background to-background"
      />

      {/* Top Left Floating Status Banner */}
      <div className="absolute top-4 left-4 z-20 flex max-w-sm flex-col gap-2">
        {isPathFiltered && currentPath.found && (
          <div className="flex items-center gap-2 rounded-lg border border-[#0267ab]/40 bg-[#0267ab]/10 px-3 py-1.5 text-xs text-[#0267ab] shadow-2xs backdrop-blur-md dark:text-sky-400">
            <Route className="size-3.5" />
            <span className="font-semibold">
              {t("diagramPage.pathHighlight")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({currentPath.connections.length}{" "}
              {t("diagramPage.connectionsCount")})
            </span>
          </div>
        )}
      </div>

      {/* Top Right Floating Options Panel */}
      <div className="absolute top-4 right-4 z-20 flex w-72 flex-col gap-2.5 rounded-xl border border-border/80 bg-card/85 p-3.5 shadow-xl backdrop-blur-md">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Sliders className="size-3.5 text-primary" />
            <span>{t("diagramPage.optionsTitle")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={handleZoomIn}
              title={t("diagramPage.zoomIn")}
            >
              <ZoomIn className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={handleZoomOut}
              title={t("diagramPage.zoomOut")}
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={handleFitView}
              title={t("diagramPage.fitView")}
            >
              <VectorSquare className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={handleReheat}
              title={t("diagramPage.reheat")}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Show Entity Name Option */}
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="show-entity-name"
              className="cursor-pointer text-xs font-medium text-foreground select-none"
            >
              {t("diagramPage.showEntityName")}
            </Label>
            <Checkbox
              id="show-entity-name"
              checked={showEntityName}
              onCheckedChange={(checked) => setShowEntityName(Boolean(checked))}
            />
          </div>

          {/* Show Connection Name Option */}
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="show-connection-name"
              className="cursor-pointer text-xs font-medium text-foreground select-none"
            >
              {t("diagramPage.showConnectionName")}
            </Label>
            <Checkbox
              id="show-connection-name"
              checked={showConnectionName}
              onCheckedChange={(checked) =>
                setShowConnectionName(Boolean(checked))
              }
            />
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
