import { Global } from "../global"
import { Log } from "../util/log"
import path from "path"
import { z } from "zod"

export namespace ModelsDev {
  const log = Log.create({ service: "models.dev" })
  const filepath = path.join(Global.Path.cache, "models.json")

  export const Model = z
    .object({
      name: z.string(),
      attachment: z.boolean(),
      reasoning: z.boolean(),
      temperature: z.boolean(),
      cost: z.object({
        input: z.number(),
        output: z.number(),
        cache_read: z.number().optional(),
        cache_write: z.number().optional(),
      }),
      limit: z.object({
        context: z.number(),
        output: z.number(),
      }),
      id: z.string(),
    })
    .openapi({
      ref: "Model.Info",
    })
  export type Model = z.infer<typeof Model>

  export const Provider = z
    .object({
      api: z.string().optional(),
      name: z.string(),
      env: z.array(z.string()),
      id: z.string(),
      npm: z.string().optional(),
      models: z.record(Model),
    })
    .openapi({
      ref: "Provider.Info",
    })

  export type Provider = z.infer<typeof Provider>

  export async function get() {
    const file = Bun.file(filepath)
    const result = await file.json().catch(() => {})
    if (result) {
      refresh()
      return result as Record<string, Provider>
    }
    await refresh()
    return get()
  }

  async function refresh() {
    const file = Bun.file(filepath)
    log.info("refreshing")
    const result = await fetch("https://models.dev/api.json")
    if (!result.ok)
      throw new Error(`Failed to fetch models.dev: ${result.statusText}`)
    await Bun.write(file, result)
  }
}
