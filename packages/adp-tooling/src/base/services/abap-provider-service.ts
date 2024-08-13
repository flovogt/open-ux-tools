import type { AbapTarget } from '@sap-ux/ui5-config';
import { isAppStudio } from '@sap-ux/btp-utils';
import type { Logger, ToolsLogger } from '@sap-ux/logger';
import { createAbapServiceProvider } from '@sap-ux/system-access';
import type { AbapServiceProvider, AxiosRequestConfig, ProviderConfiguration } from '@sap-ux/axios-extension';

import type { EndpointsService } from './endpoints-service';

export type RequestOptions = AxiosRequestConfig & Partial<ProviderConfiguration>;

/**
 * Service for managing and providing access to an ABAP service provider.
 */
export class ProviderService {
    private provider: AbapServiceProvider;

    /**
     * Constructs an instance of ProviderService.
     *
     * @param {EndpointsService} endpointsService - The endpoints service for retrieving system details.
     * @param {ToolsLogger} [logger] - The logger.
     */
    constructor(private endpointsService: EndpointsService, private logger?: ToolsLogger) {}

    /**
     * Retrieves the configured ABAP service provider if set, otherwise throws an error.
     *
     * @returns {AbapServiceProvider} - The configured ABAP service provider.
     */
    public getProvider(): AbapServiceProvider {
        if (!this.provider) {
            throw new Error('Provider was not set!');
        }
        return this.provider;
    }

    /**
     * Configures the ABAP service provider using the specified system details and credentials.
     *
     * @param {string} system - The system identifier.
     * @param {string} [client] - The client, if applicable.
     * @param {string} [username] - The username for authentication.
     * @param {string} [password] - The password for authentication.
     */
    public async setProvider(system: string, client?: string, username?: string, password?: string) {
        try {
            const requestOptions: RequestOptions = {
                ignoreCertErrors: false
            };

            const target = await this.determineTarget(requestOptions, system, client);

            if (username && password) {
                requestOptions.auth = { username, password };
            }

            this.provider = await createAbapServiceProvider(target, requestOptions, false, {} as Logger);
        } catch (e) {
            this.logger?.error(`Failed to instantiate provider for system: ${system}. Reason: ${e.message}`);
            throw new Error(e.message);
        }
    }

    /**
     * Determines the target configuration for the ABAP service provider based on whether the application
     * is running within SAP App Studio or outside of it.
     *
     * @param {RequestOptions} requestOptions - The request options to be configured during this setup.
     * @param {string} system - The system identifier, which could be a URL or a system name.
     * @param {string} [client] - Optional client number, used in systems where multiple clients exist.
     * @returns {Promise<AbapTarget>} - The configuration object for the ABAP service provider, tailored based on the running environment.
     */
    private async determineTarget(
        requestOptions: RequestOptions,
        system: string,
        client?: string
    ): Promise<AbapTarget> {
        let target: AbapTarget;

        if (isAppStudio()) {
            target = {
                destination: system
            };
        } else {
            const details = await this.endpointsService.getSystemDetails(system);

            target = {
                ...details,
                client: details?.client ?? client
            } as AbapTarget;

            if (details?.username && details?.password) {
                requestOptions.auth = { username: details?.username, password: details?.password };
            }
        }

        return target;
    }
}
