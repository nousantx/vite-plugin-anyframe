import { AnyFrame } from '@anyframe/core'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'

export default function ViteAnyFrame() {
  const virtualId = 'virtual:anyframe.css'
  const resolvedVirtualId = '\0' + virtualId
  const classSet = new Set()
  const configPath = path.resolve(process.cwd(), 'anyframe.config.js')
  let ui
  let config
  let includedFiles = new Set()

  async function loadConfig() {
    if (fs.existsSync(configPath)) {
      try {
        const configUrl = `file://${configPath}?update=${Date.now()}`
        const configModule = await import(configUrl)
        config = configModule.default || configModule
        ui = new AnyFrame(config)

        includedFiles.clear()
        if (config.include && Array.isArray(config.include)) {
          for (const pattern of config.include) {
            const matches = await glob(pattern, {
              cwd: process.cwd(),
              absolute: true
            })
            matches.forEach((file) => includedFiles.add(file))
          }
        }
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
        .forEach((className) => {
          classList.add(className)
        })
    }
    return classList
  }

  function shouldProcessFile(id) {
    if (id === resolvedVirtualId || id.includes('\0') || id.startsWith('vite/')) {
      return false
    }

    if (!config?.include || !Array.isArray(config.include) || config.include.length === 0) {
      return (
        id.endsWith('.js') ||
        id.endsWith('.jsx') ||
        id.endsWith('.ts') ||
        id.endsWith('.tsx') ||
        id.endsWith('.vue')
      )
    }

    return includedFiles.has(path.resolve(id))
  }

  return {
    name: 'anyframe-css',

    async buildStart() {
      await loadConfig()

      for (const file of includedFiles) {
        try {
          const code = fs.readFileSync(file, 'UTF-8')
          scanClassNames(code).forEach((className) => classSet.add(className))
        } catch (error) {
          console.warn(`Failed to read file ${file}: ${error.message}`)
        }
      }
    },

    resolveId(id) {
      if (id === virtualId) {
        return resolvedVirtualId
      }
    },

    transform(code, id) {
      if (!shouldProcessFile(id)) return null

      try {
        if (fs.existsSync(id)) {
          const _code = fs.readFileSync(id, 'UTF-8')
          const classList = scanClassNames(_code)
          classList.forEach((className) => classSet.add(className))
        }
      } catch (error) {
        console.warn(`Failed to read file ${id}: ${error.message}`)
      }

      return null
    },

    load(id) {
      if (id === resolvedVirtualId) {
        const stylesheet = ui.create([...classSet])
        console.log(classSet, stylesheet)
        return stylesheet
      }
      return undefined
    },

    configureServer({ watcher, ws, moduleGraph }) {
      watcher.add(configPath)

      watcher.on('change', async (file) => {
        const absolutePath = path.resolve(file)

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
        } else if (includedFiles.has(absolutePath)) {
          const code = fs.readFileSync(file, 'utf-8')
          const classList = scanClassNames(code)
          let changed = false

          classList.forEach((className) => {
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
