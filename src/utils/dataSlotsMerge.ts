import { DataJSON, InstanceDataJSON } from "../types"

export const mergedDataSlots = (
  coreDataSlots: DataJSON["data"]["data_slots"],
  instanceDataSlots: InstanceDataJSON["instance"]["data_slots"]
) => {
  return instanceDataSlots.map(({ id, ...instanceInfo }) => {
    const coreSlot = coreDataSlots.find(({ id: coreId }) => coreId === id)
    if (!coreSlot) return { id, ...instanceInfo }
    return { ...coreSlot, ...instanceInfo }
  })
}
