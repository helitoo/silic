import type {
  Entity,
  Connection,
  StorageRecord,
  EntityRepository,
} from "../types"

export class InMemoryEntityRepository implements EntityRepository {
  private entities: Entity[]
  private connections: Connection[]
  private entityMap: Map<string, Entity> = new Map()
  private connectionMap: Map<string, Connection> = new Map()
  private recordIndex: Map<string, Map<string, StorageRecord>> = new Map()
  private templateIndex: Map<string, Entity[]> = new Map()

  constructor(entities: Entity[] = [], connections: Connection[] = []) {
    this.entities = entities
    this.connections = connections
    this.rebuildIndex()
  }

  private rebuildIndex(): void {
    this.entityMap.clear()
    this.connectionMap.clear()
    this.recordIndex.clear()
    this.templateIndex.clear()

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
}
