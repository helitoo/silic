import type { Entity } from "@/lib/types"
import { EntityDetailHeader } from "./Header"
import { LongTextSections } from "./LongTextSections"
import { ShortSections } from "./ShortSections"

export interface EntityDetailPageProps {
  entity: Entity
  onBack: () => void
  onEdit: () => void
  onDelete?: () => void
  onSelectEntity?: (entity: Entity) => void
}

export function EntityDetailPage({
  entity,
  onBack,
  onEdit,
  onDelete,
  onSelectEntity,
}: EntityDetailPageProps) {
  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-200">
      {/* Header with Name, ID, Back and Edit buttons */}
      <EntityDetailHeader
        entity={entity}
        onBack={onBack}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Main Content Layout:
          - Desktop (>= md): 2 columns (Left 3/5: LongTextSections, Right 2/5: ShortSections)
          - Mobile (< md): 1 column (Top: ShortSections, Bottom: LongTextSections)
      */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* Long Text Column (3/5 on >= md, second on < md) */}
        <div className="order-2 md:order-1 md:col-span-3 space-y-4">
          <LongTextSections entity={entity} />
        </div>

        {/* Short Text & Metadata Column (2/5 on >= md, first on < md) */}
        <div className="order-1 md:order-2 md:col-span-2 space-y-4">
          <ShortSections entity={entity} onSelectEntity={onSelectEntity} />
        </div>
      </div>
    </div>
  )
}

export default EntityDetailPage
