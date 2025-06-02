"use server"

interface UserConfig {
  openaiApiKey: string
  databaseUrl: string
  useServerDefaults: boolean
  model: string
  temperature: number
}

export async function saveUserConfig(config: UserConfig) {
  try {
    console.log("Saving user config:", {
      ...config,
      openaiApiKey: config.openaiApiKey ? "[REDACTED]" : "",
      databaseUrl: config.databaseUrl ? "[REDACTED]" : "",
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to save user config:", error)
    return { success: false, error: "Failed to save configuration" }
  }
}

export async function testConnections(openaiApiKey?: string, databaseUrl?: string) {
  try {
    let openaiValid = true
    let databaseValid = true

    if (openaiApiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
        })
        openaiValid = response.ok
      } catch (error) {
        openaiValid = false
      }
    }

    if (databaseUrl) {
      try {
        const url = new URL(databaseUrl)
        databaseValid = url.protocol === "postgresql:" || url.protocol === "postgres:"
      } catch (error) {
        databaseValid = false
      }
    }

    return {
      success: openaiValid && databaseValid,
      openai: openaiValid,
      database: databaseValid,
    }
  } catch (error) {
    console.error("Connection test failed:", error)
    return {
      success: false,
      openai: false,
      database: false,
      error: "Connection test failed",
    }
  }
}
