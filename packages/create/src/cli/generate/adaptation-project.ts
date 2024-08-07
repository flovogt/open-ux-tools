import type { Command } from 'commander';
import chalk from 'chalk';
import { getLogger, traceChanges } from '../../tracing';
import type { AdpWriterConfig, DeployConfigAnswers, FlpConfigAnswers, PromptDefaults } from '@sap-ux/adp-tooling';
import {
    generate,
    EndpointsService,
    ManifestService,
    ProviderService,
    FlexLayer,
    UI5VersionService,
    ConfigInfoPrompter,
    getBasicInfoPrompts,
    getFlpPrompts,
    getDeployPrompts,
    DescriptorContent,
    TemplateModel
} from '@sap-ux/adp-tooling';
import { promptYUIQuestions, runNpmInstallCommand } from '../../common';
import path, { join } from 'path';
import { filterLabelTypeQuestions } from '../../common/prompts';
import { create as createStorage } from 'mem-fs';
import { create } from 'mem-fs-editor';
/**
 * Add a new sub-command to generate SAP UI5 adaptation projects the given command.
 *
 * @param cmd main command that is to be enhanced
 */
export function addGenerateAdaptationProjectCommand(cmd: Command): void {
    cmd.command('adaptation-project [path]')
        .option('-n, --skip-install', 'skip npm install step')
        .option('-s, --simulate', 'simulate only do not write or install')
        .action(async (path, options) => {
            console.log(
                `\nThe generation of adaptation projects outside of SAP Business Application Studio is currently ${chalk.bold(
                    'experimental'
                )}.`
            );
            console.log(
                'Please report any issues or feedback at https://github.com/SAP/open-ux-tools/issues/new/choose.\n'
            );
            await generateAdaptationProject(path, !!options.simulate, !!options.skipInstall);
        });
}

/**
 * Generate an SAP UI5 adaptation project based on the given parameters.
 *
 * @param basePath target folder of the new project
 * @param defaults optional defaults
 * @param useDefaults if set to true, then default values are used for all prompts and the prompting is skipped
 * @param simulate if set to true, then no files will be written to the filesystem
 * @param skipInstall if set to true then `npm i` is not executed in the new project
 */
async function generateAdaptationProject(basePath: string, simulate: boolean, skipInstall: boolean): Promise<void> {
    const logger = getLogger();
    try {
        logger.debug(`Called generate adaptation-project for path '${basePath}', skip install is '${skipInstall}'`);

        const fs = create(createStorage());
        const endpointsService = new EndpointsService();
        const providerService = new ProviderService(endpointsService);
        const manifestService = new ManifestService(providerService);

        const layer = FlexLayer.CUSTOMER_BASE;

        const ui5Service = new UI5VersionService(layer);
        const configPrompter = new ConfigInfoPrompter(
            providerService,
            manifestService,
            endpointsService,
            ui5Service,
            layer
        );

        const descriptorContent = new DescriptorContent(manifestService, ui5Service, layer, basePath, fs);
        const templateModel = new TemplateModel(
            ui5Service,
            providerService,
            descriptorContent,
            endpointsService,
            layer
        );

        const basicAnswers = await promptYUIQuestions(getBasicInfoPrompts(basePath, layer), false);
        logger.debug(`Basic information: ${JSON.stringify(basicAnswers)}`);

        const configAnswers = await promptYUIQuestions(
            await filterLabelTypeQuestions(await configPrompter.getConfigurationPrompts(basicAnswers.projectName)),
            false
        );
        logger.debug(`System: ${configAnswers.system}`);
        logger.debug(`Application: ${JSON.stringify(configAnswers.application, null, 2)}`);

        const isCloudProject = configAnswers.projectType === 'cloudReady';

        let flpConfigAnswers: FlpConfigAnswers;
        let deployConfigAnswers: DeployConfigAnswers;
        if (isCloudProject) {
            flpConfigAnswers = await promptYUIQuestions(
                await filterLabelTypeQuestions(
                    await getFlpPrompts(manifestService, isCloudProject, configAnswers.application.id)
                ),
                false
            );
            logger.debug(`FLP Configuration: ${JSON.stringify(flpConfigAnswers, null, 2)}`);

            deployConfigAnswers = await promptYUIQuestions(await getDeployPrompts(providerService), false);
            logger.debug(`Deploy Configuration: ${JSON.stringify(deployConfigAnswers, null, 2)}`);
        }

        const systemAuthDetails = await endpointsService.getSystemDetails(configAnswers.system);

        if (!systemAuthDetails) {
            throw new Error(`No system details were found!`);
        }

        const config = await templateModel.getTemplateModel(
            systemAuthDetails,
            basicAnswers,
            configAnswers,
            flpConfigAnswers!,
            deployConfigAnswers!
        );
        logger.debug(`Config for generation: ${JSON.stringify(config, null, 2)}`);

        if (!basePath) {
            basePath = join(process.cwd(), config.app.id);
        }
        // addChangeForResourceModel(config);

        const projectPath = path.join(basePath, basicAnswers.projectName);
        await generate(projectPath, config, fs);

        if (!simulate) {
            await new Promise((resolve) => fs.commit(resolve));
            if (!skipInstall) {
                runNpmInstallCommand(projectPath);
                logger.info('Executed npm install');
            }
        } else {
            await traceChanges(fs);
        }
    } catch (error) {
        logger.error(error.message);
    }
}

/**
 * Add a change for a new resource model to the given configuration.
 *
 * @param config configuration to be enhanced
 */
function addChangeForResourceModel(config: AdpWriterConfig): void {
    config.app.content = [
        {
            changeType: 'appdescr_ui5_addNewModelEnhanceWith',
            content: {
                modelId: 'i18n',
                bundleUrl: 'i18n/i18n.properties',
                supportedLocales: [''],
                fallbackLocale: ''
            }
        }
    ];
}
