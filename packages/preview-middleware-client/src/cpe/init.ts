import type { ExternalAction } from '@sap-ux-private/control-property-editor-common';
import {
    startPostMessageCommunication,
    iconsLoaded,
    enableTelemetry,
    appLoaded
} from '@sap-ux-private/control-property-editor-common';
import type RuntimeAuthoring from 'sap/ui/rta/RuntimeAuthoring';

import type { ActionHandler, Service } from './types';
import { initOutline } from './outline/index';
import { SelectionService } from './selection';
import { ChangeService } from './changes/service';
import { loadDefaultLibraries } from './documentation';
import Log from 'sap/base/Log';
import { logger } from './logger';
import { getIcons } from './ui5-utils';
import { WorkspaceConnectorService } from './connector-service';
import { RtaService } from './rta-service';
import { getError } from './error-utils';
import { QuickActionService } from './quick-actions/quick-action-service';

export default function init(rta: RuntimeAuthoring): Promise<void> {
    Log.info('Initializing Control Property Editor');

    // enable telemetry if requested
    const flexSettings = rta.getFlexSettings();
    if (flexSettings.telemetry === true) {
        enableTelemetry();
    }

    const actionHandlers: ActionHandler[] = [];
    /**
     *
     * @param handler action handler
     */
    function subscribe(handler: ActionHandler): void {
        actionHandlers.push(handler);
    }

    const selectionService = new SelectionService(rta);

    const changesService = new ChangeService({ rta }, selectionService);
    const connectorService = new WorkspaceConnectorService();
    const rtaService = new RtaService(rta);
    const quickActionService = new QuickActionService(rta);
    const services: Service[] = [selectionService, changesService, connectorService, rtaService, quickActionService];
    try {
        loadDefaultLibraries();
        const { sendAction } = startPostMessageCommunication<ExternalAction>(
            window.parent,
            async function onAction(action) {
                for (const handler of actionHandlers) {
                    try {
                        await handler(action);
                    } catch (error) {
                        Log.error('Handler Failed: ', getError(error));
                    }
                }
            },
            logger
        );

        for (const service of services) {
            service.init(sendAction, subscribe);
        }
        // For initOutline to complete the RTA needs to already running (to access RTA provided services).
        // That can only happen if the plugin initialization has completed.
        initOutline(rta, sendAction, quickActionService).catch((error) =>
            Log.error('Error during initialization of Control Property Editor', getError(error))
        );
        const icons = getIcons();

        sendAction(iconsLoaded(icons));
        sendAction(appLoaded());
    } catch (error) {
        Log.error('Error during initialization of Control Property Editor', getError(error));
    }
    return Promise.resolve();
}
