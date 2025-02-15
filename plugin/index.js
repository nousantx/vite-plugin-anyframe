import { AnyFrame } from '@anyframe/core'
import fs from 'node:fs'
import path from 'node:path'

export default function ViteAnyFrame() {
  const virtualId = 'virtual:anyframe.css'
  const resolvedVirtualId = '\0' + virtualId
  const classSet = new Set()
  const configPath = path.resolve(process.cwd(), 'anyframe.config.js')

  let ui
  let config

  async function loadConfig() {
    if (fs.existsSync(configPath)) {
      try {
        const configUrl = `file://${configPath}?update=${Date.now()}`
        const configModule = await import(configUrl)
        config = configModule.default || configModule
        ui = new AnyFrame(config)
      } catch (e) {
        console.error(`Failed to load anyframe.config.js: ${e.message}`)
      }
    }
  }

  function scanClassNames(code) {
    const classRegex = /class(?:Name)?=["'`]([^"'`]+)["'`]/g
    const classList = new Set()
    let match

    while ((match = classRegex.exec(code)) !== null) {
      match[1]
        .split(/\s+/)
        .filter(Boolean)
        .forEach(className => {
          classList.add(className)
        })
    }
    return classList
  }

  return {
    name: 'anyframe-css',
    async buildStart() {
      await loadConfig()
    },

    resolveId(id) {
      if (id === virtualId) {
        return resolvedVirtualId
      }
    },

    transform(code, id) {
      if (id === resolvedVirtualId) return null

      const classList = scanClassNames(code)
      classList.forEach(className => classSet.add(className))
      return null
    },

    load(id) {
      const stylesheet = ui.create([...classSet])
      console.log(classSet, stylesheet)
      if (id === resolvedVirtualId) {
        return stylesheet
      }
      return undefined
    },

    configureServer({ watcher, ws, moduleGraph, restart }) {
      watcher.add(configPath)

      watcher.on('change', async file => {
        if (file === configPath) {
          console.log('anyframe.config.js changed. Reloading configuration...')
          await loadConfig()

          const virtualModule = moduleGraph.getModuleById(resolvedVirtualId)
          if (virtualModule) {
            moduleGraph.invalidateModule(virtualModule)
            ws.send({
              type: 'full-reload',
              path: '*'
            })
          }
        } else if (!file.endsWith('.css')) {
          const code = fs.readFileSync(file, 'utf-8')
          const classList = scanClassNames(code)
          let changed = false

          classList.forEach(className => {
            if (!classSet.has(className)) {
              classSet.add(className)
              changed = true
            }
          })

          if (changed) {
            const virtualModule = moduleGraph.getModuleById(resolvedVirtualId)
            if (virtualModule) {
              moduleGraph.invalidateModule(virtualModule)
              ws.send({
                type: 'update',
                updates: [
                  {
                    type: 'js-update',
                    timestamp: Date.now(),
                    path: virtualId
                  }
                ]
              })
            }
          }
        }
      })
    }
  }
}
