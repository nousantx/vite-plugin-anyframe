import { AnyFrame } from '@anyframe/core'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import type { Config as AnyConfig } from '@anyframe/core'

export type Config = AnyConfig & {
  include: string[]
}

export default ViteAnyFrame
