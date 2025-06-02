import { z } from "zod"

export const VersionSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  message: z.string(),
  author: z.string(),
  files: z.record(
    z.object({
      content: z.string(),
      language: z.string(),
    }),
  ),
  parentId: z.string().optional(),
})

export type Version = z.infer<typeof VersionSchema>

export interface VersionControlState {
  versions: Version[]
  currentVersion: string | null
  branches: Map<string, string[]> // branch name -> version ids
  currentBranch: string
}

export class VersionControl {
  private static instance: VersionControl
  private state: VersionControlState = {
    versions: [],
    currentVersion: null,
    branches: new Map([["main", []]]),
    currentBranch: "main",
  }
  private listeners: Set<(state: VersionControlState) => void> = new Set()

  static getInstance(): VersionControl {
    if (!VersionControl.instance) {
      VersionControl.instance = new VersionControl()
    }
    return VersionControl.instance
  }

  subscribe(listener: (state: VersionControlState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }))
  }

  commit(files: Record<string, { content: string; language: string }>, message: string, author = "Anonymous"): string {
    const id = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const version: Version = {
      id,
      timestamp: new Date(),
      message,
      author,
      files,
      parentId: this.state.currentVersion || undefined,
    }

    this.state.versions.push(version)
    this.state.currentVersion = id

    // Add to current branch
    const branchVersions = this.state.branches.get(this.state.currentBranch) || []
    branchVersions.push(id)
    this.state.branches.set(this.state.currentBranch, branchVersions)

    this.notify()
    return id
  }

  checkout(versionId: string): Version | null {
    const version = this.state.versions.find((v) => v.id === versionId)
    if (version) {
      this.state.currentVersion = versionId
      this.notify()
      return version
    }
    return null
  }

  createBranch(branchName: string, fromVersion?: string): boolean {
    if (this.state.branches.has(branchName)) {
      return false // Branch already exists
    }

    const startVersion = fromVersion || this.state.currentVersion
    this.state.branches.set(branchName, startVersion ? [startVersion] : [])
    this.notify()
    return true
  }

  switchBranch(branchName: string): boolean {
    if (!this.state.branches.has(branchName)) {
      return false
    }

    this.state.currentBranch = branchName
    const branchVersions = this.state.branches.get(branchName) || []
    this.state.currentVersion = branchVersions[branchVersions.length - 1] || null
    this.notify()
    return true
  }

  getVersionHistory(): Version[] {
    return this.state.versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getBranchHistory(branchName: string): Version[] {
    const branchVersions = this.state.branches.get(branchName) || []
    return branchVersions.map((id) => this.state.versions.find((v) => v.id === id)).filter(Boolean) as Version[]
  }

  diff(
    versionId1: string,
    versionId2: string,
  ): Record<
    string,
    {
      added: boolean
      removed: boolean
      modified: boolean
      content1?: string
      content2?: string
    }
  > {
    const v1 = this.state.versions.find((v) => v.id === versionId1)
    const v2 = this.state.versions.find((v) => v.id === versionId2)

    if (!v1 || !v2) return {}

    const result: Record<string, any> = {}
    const allFiles = new Set([...Object.keys(v1.files), ...Object.keys(v2.files)])

    for (const filename of allFiles) {
      const file1 = v1.files[filename]
      const file2 = v2.files[filename]

      result[filename] = {
        added: !file1 && !!file2,
        removed: !!file1 && !file2,
        modified: !!file1 && !!file2 && file1.content !== file2.content,
        content1: file1?.content,
        content2: file2?.content,
      }
    }

    return result
  }

  getState(): VersionControlState {
    return { ...this.state }
  }
}
