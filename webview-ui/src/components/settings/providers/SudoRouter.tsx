import { type OrganizationAllowList, ProviderSettings, sudoRouterDefaultModelId } from "@roo-code/types"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useCallback } from "react"
import { inputEventTransform } from "@/components/settings/transforms"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@/components/common/VSCodeButtonLink"
import { ModelPicker } from "@/components/settings/ModelPicker"
import type { RouterModels } from "@roo/api"

type SudoRouterProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
	routerModels?: RouterModels
	selectedModelId: string
	uriScheme: string | undefined
	fromWelcomeView?: boolean
	organizationAllowList: OrganizationAllowList
	modelValidationError?: string
}

export const SudoRouter = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	organizationAllowList,
	modelValidationError,
}: SudoRouterProps) => {
	const { t } = useAppTranslation()

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	return (
		<>
			<VSCodeTextField
				value={apiConfiguration?.sudoRouterApiKey || ""}
				type="password"
				onInput={handleInputChange("sudoRouterApiKey")}
				placeholder={t("settings:placeholders.apiKey")}
				className="w-full">
				<div className="flex justify-between items-center mb-1">
					<label className="block font-medium">{t("settings:providers.sudoRouterApiKey")}</label>
				</div>
			</VSCodeTextField>
			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.apiKeyStorageNotice")}
			</div>
			{!apiConfiguration?.sudoRouterApiKey && (
				<VSCodeButtonLink href="https://chat.sudorouter.ai/key" appearance="primary">
					{t("settings:providers.getSudoRouterApiKey")}
				</VSCodeButtonLink>
			)}
			<ModelPicker
				apiConfiguration={apiConfiguration}
				setApiConfigurationField={setApiConfigurationField}
				defaultModelId={sudoRouterDefaultModelId}
				models={routerModels?.sudorouter ?? {}}
				modelIdKey="sudoRouterModelId"
				serviceName="SudoRouter"
				serviceUrl="https://sudorouter.ai/#models"
				organizationAllowList={organizationAllowList}
				errorMessage={modelValidationError}
			/>
		</>
	)
}
