import { BaseProvider } from "./base-provider"
import type { ApiHandlerCreateMessageMetadata, SingleCompletionHandler } from "../index"
import { ApiHandlerOptions } from "../../shared/api"
import { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs"
import {
	ModelInfo,
	sudoRouterDefaultModelId,
	sudoRouterDefaultBaseUrl,
	sudoRouterDefaultModelInfo,
} from "@roo-code/types"
import { ApiStream } from "../transform/stream"
import OpenAI from "openai"
import { DEFAULT_HEADERS } from "./constants"
import { getApiRequestTimeout } from "./utils/timeout-config"
import { handleOpenAIError } from "./utils/openai-error-handler"
import { XmlMatcher } from "../../utils/xml-matcher"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { getModelsFromCache } from "./fetchers/modelCache"

export class SudoRouterHandler extends BaseProvider implements SingleCompletionHandler {
	protected options: ApiHandlerOptions
	private client: OpenAI
	private readonly providerName = "SudoRouter"

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options
		this.client = new OpenAI({
			baseURL: options.sudoRouterBaseUrl ?? sudoRouterDefaultBaseUrl,
			apiKey: options.sudoRouterApiKey ?? "not-provided",
			defaultHeaders: DEFAULT_HEADERS,
			timeout: getApiRequestTimeout(),
		})
	}

	override async *createMessage(
		systemPrompt: string,
		messages: MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): ApiStream {
		const params: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
			model: this.getModel().id,
			messages: [{ role: "system", content: systemPrompt }, ...convertToOpenAiMessages(messages)],
			temperature: this.options.modelTemperature ?? 0,
			stream: true,
			stream_options: { include_usage: true },
		}

		let response
		try {
			response = await this.client.chat.completions.create(params)
		} catch (error) {
			throw handleOpenAIError(error, this.providerName)
		}

		const matcher = new XmlMatcher(
			"think",
			(chunk) =>
				({
					type: chunk.matched ? "reasoning" : "text",
					text: chunk.data,
				}) as const,
		)

		let lastUsage

		for await (const chunk of response) {
			const delta = chunk.choices[0]?.delta ?? {}

			if ("reasoning" in delta && delta.reasoning && typeof delta.reasoning === "string") {
				yield { type: "reasoning", text: delta.reasoning }
			}

			if (delta.content) {
				for (const chunk of matcher.update(delta.content)) {
					yield chunk
				}
			}

			if (chunk.usage) {
				lastUsage = chunk.usage
			}
		}

		for (const chunk of matcher.final()) {
			yield chunk
		}

		if (lastUsage) {
			yield {
				type: "usage",
				inputTokens: lastUsage.prompt_tokens || 0,
				outputTokens: lastUsage.completion_tokens || 0,
			}
		}
	}

	override getModel(): { id: string; info: ModelInfo } {
		const id = this.options.sudoRouterModelId ?? sudoRouterDefaultModelId
		const info = getModelsFromCache("sudorouter")?.[id] ?? sudoRouterDefaultModelInfo
		return { id, info }
	}

	async completePrompt(prompt: string): Promise<string> {
		const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
			model: this.getModel().id,
			messages: [{ role: "user", content: prompt }],
			temperature: this.options.modelTemperature ?? 0,
			stream: false,
		}
		let response
		try {
			response = await this.client.chat.completions.create(params)
		} catch (error) {
			throw handleOpenAIError(error, this.providerName)
		}
		return response.choices[0]?.message.content || ""
	}
}
