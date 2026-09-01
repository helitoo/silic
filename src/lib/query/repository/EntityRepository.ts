import type {
  Entity,
  Connection,
  Template,
  StorageRecord,
  EntityRepository,
} from "../types"

export class InMemoryEntityRepository implements EntityRepository {
  private entities: Entity[]
  private connections: Connection[]
  private templates: Template[]
  private entityMap: Map<string, Entity> = new Map()
  private connectionMap: Map<string, Connection> = new Map()
  private templateMap: Map<string, Template> = new Map()
  private templateNameMap: Map<string, Template> = new Map()
  private recordIndex: Map<string, Map<string, StorageRecord>> = new Map()
  private templateIndex: Map<string, Entity[]> = new Map()

  constructor(
    entities: Entity[] = [],
    connections: Connection[] = [],
    templates: Template[] = []
  ) {
    this.entities = entities
    this.connections = connections
    this.templates = templates
    this.rebuildIndex()
  }

  private rebuildIndex(): void {
    this.entityMap.clear()
    this.connectionMap.clear()
    this.templateMap.clear()
    this.templateNameMap.clear()
    this.recordIndex.clear()
    this.templateIndex.clear()

    for (const tpl of this.templates) {
      this.templateMap.set(tpl.id, tpl)
      this.templateNameMap.set(tpl.name.toLowerCase().trim(), tpl)
    }

    for (const entity of this.entities) {
      this.entityMap.set(entity.id, entity)

      const recMap = new Map<string, StorageRecord>()
      if (Array.isArray(entity.records)) {
        for (const record of entity.records) {
          recMap.set(record.name, record)
        }
      }
      this.recordIndex.set(entity.id, recMap)

      if (entity.template) {
        const list = this.templateIndex.get(entity.template) || []
        list.push(entity)
        this.templateIndex.set(entity.template, list)
      }
    }

    for (const conn of this.connections) {
      this.connectionMap.set(conn.id, conn)
    }
  }

  public getById(id: string): Entity | undefined {
    return this.entityMap.get(id)
  }

  public getAll(): Entity[] {
    return this.entities
  }

  public getConnections(): Connection[] {
    return this.connections
  }

  public getConnectionById(id: string): Connection | undefined {
    return this.connectionMap.get(id)
  }

  public getRecord(entityId: string, name: string): StorageRecord | undefined {
    const recMap = this.recordIndex.get(entityId)
    if (recMap) {
      return recMap.get(name)
    }
    const entity = this.getById(entityId)
    return entity?.records?.find((r) => r.name === name)
  }

  public getByTemplate(templateId: string): Entity[] {
    return this.templateIndex.get(templateId) || []
  }

  public getTemplates(): Template[] {
    return this.templates
  }

  public getTemplateById(id: string): Template | undefined {
    return this.templateMap.get(id)
  }

  public getTemplateByName(name: string): Template | undefined {
    return this.templateNameMap.get(name.toLowerCase().trim())
  }

  public getTemplateName(id?: string): string | undefined {
    if (!id) return undefined
    const tpl = this.templateMap.get(id)
    return tpl ? tpl.name : id
  }
}
