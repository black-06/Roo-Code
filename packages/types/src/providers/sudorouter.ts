import { ModelInfo } from "../model.js"

export const sudoRouterDefaultModelId = "deepseek-chat"

export const sudoRouterDefaultModelInfo: ModelInfo = {
	maxTokens: 8192,
	contextWindow: 131072,
	supportsImages: false,
	supportsPromptCache: false,
}

export const sudoRouterDefaultBaseUrl = "https://chat.sudorouter.ai/v1/"
