import { ModelInfo } from "@roo-code/types"
import axios from "axios"
import { z } from "zod"
import { parseApiPrice } from "../../../shared/cost"

export async function getSudoRouterModels(): Promise<Record<string, ModelInfo>> {
	const models: Record<string, ModelInfo> = {}
	try {
		const url = "https://sudorouter.ai/api/v1/models"

		const response = await axios.get<SudoRouterGetModelsResponse>(url)
		const parsedResult = sudoRouterGetModelsResponseSchema.safeParse(response.data)
		if (parsedResult.success) {
			for (const model of parsedResult.data.data) {
				models[model.id] = {
					maxTokens: model.max_tokens,
					maxThinkingTokens: undefined,
					contextWindow: model.context_length,
					supportsImages: model.input_modalities?.includes("image"),
					supportsPromptCache: model.capabilities?.includes("caching") ?? false,
					supportsReasoningBudget: undefined,
					requiredReasoningBudget: undefined,
					supportsReasoningEffort: undefined,
					supportedParameters: undefined,
					inputPrice: parseApiPrice(model.price?.input),
					outputPrice: parseApiPrice(model.price?.output),
					cacheWritesPrice: parseApiPrice(model.price?.cache_write),
					cacheReadsPrice: parseApiPrice(model.price?.cache_read),
					description: model.description,
					reasoningEffort: undefined,
				}
			}
		} else {
			console.error("SudoRouter models response validation failed:", parsedResult.error.format())
		}
	} catch (error) {
		console.error("Error fetching SudoRouter models:", error)
	}

	return models
}

const sudoRouterPriceSchema = z.object({
	input: z.string().nullish(),
	output: z.string().nullish(),
	cache_write: z.string().nullish(),
	cache_read: z.string().nullish(),
})

const sudoRouterModelSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	context_length: z.number(),
	max_tokens: z.number(),
	input_modalities: z.array(z.string()).nullish(),
	output_modalities: z.array(z.string()).nullish(),
	price: sudoRouterPriceSchema,
	parameters: z.array(z.string()).nullish(),
	capabilities: z.array(z.string()).nullish(),
})

const sudoRouterGetModelsResponseSchema = z.object({
	data: z.array(sudoRouterModelSchema),
})

type SudoRouterGetModelsResponse = z.infer<typeof sudoRouterGetModelsResponseSchema>
