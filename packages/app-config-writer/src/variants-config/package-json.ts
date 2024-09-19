import { join } from 'path';
import { stringify } from 'querystring';
import { SAP_CLIENT_REGEX, FIORI_TOOLS_RTA_MODE_TRUE } from '../types';
import type { Editor } from 'mem-fs-editor';
import type { FioriToolsRtaMode } from '../types';
import type { Package } from '@sap-ux/project-access';

//TDo: check for endpoint and hash
const PREVIEW_PAGE = 'preview.html';
const PREVIEW_APP_NAME = 'preview-app';

/**
 * Extracts sap client string from existing scripts in package.json.
 *
 * @param packageJson - path to package.json
 */
function getSapClientFromPackageJson(packageJson: Package): any {
    const scripts = (packageJson.script ||= {});
    const scriptValues = Object.values(scripts);
    scriptValues.forEach((scriptValue) => {
        const match = scriptValue.match(SAP_CLIENT_REGEX);
        if (match) {
            return match;
        }
        return undefined;
    });
}

/**
 * Returns the UI5 url parameters.
 *
 * @param rtaMode - path to package.json
 * @param overwritingParams - parameters to be overwritten
 * @returns - UI5 url parameters
 */
function getUi5UrlParameters(
    rtaMode: FioriToolsRtaMode,
    overwritingParams: Record<string, string | string[]> = {}
): string {
    const parameters: Record<string, string | string[]> = {
        'fiori-tools-rta-mode': rtaMode,
        'sap-ui-rta-skip-flex-validation': 'true',
        'sap-ui-xx-condense-changes': 'true'
    };
    return stringify(Object.assign(parameters, overwritingParams));
}

/**
 * Returns the preview url parameters.
 *
 * @param query - query to create fragment
 * @returns - review url parameters
 */
function getPreviewUrl(query?: string): string {
    const queryFragment = query ? `?${query}` : '';
    return `/${PREVIEW_PAGE}${queryFragment}#${PREVIEW_APP_NAME}`;
}

/**
 * Add the start-variants-management script to the package.json.
 *
 * @param fs - mem-fs reference to be used for file access
 * @param basePath - path to application root, where package.json is
 */
export function addVariantsManagementScript(fs: Editor, basePath: string): void {
    const packageJsonPath = join(basePath, 'package.json');
    const packageJson = fs.readJSON(packageJsonPath) as Package;

    if (packageJson.scripts) {
        // check if sap-client is needed when starting the app
        const urlParameters: Record<string, string> = {};
        const sapClient = getSapClientFromPackageJson(packageJson);

        if (sapClient) {
            urlParameters['sap-client'] = sapClient;
        }

        const query = getUi5UrlParameters(FIORI_TOOLS_RTA_MODE_TRUE, urlParameters);
        const url = getPreviewUrl(query).slice(1);

        const startVariantsManagement = 'start-variants-management';
        const variantsScript = `fiori run --open "${url}"`;

        packageJson.scripts[startVariantsManagement] = variantsScript;

        fs.writeJSON(packageJsonPath, packageJson);
    }
}
