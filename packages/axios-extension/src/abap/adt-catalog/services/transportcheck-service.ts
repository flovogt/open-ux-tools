import { AdtService } from './adt-service';
import { LocalPackageText } from '../../types';
import type { AdtCategory, AdtTransportStatus, TransportRequest, TransportCheck } from '../../types';
import { XMLValidator } from 'fast-xml-parser';
import * as xpath from 'xpath';
import { DOMParser } from '@xmldom/xmldom';

/**
 * TransportChecksService implements ADT requests for fetching a list of available transport requests
 * for a given package name and a given app name.
 */
export class TransportChecksService extends AdtService {
    /**
     * @see AdtService.getAdtCatagory()
     */
    private static adtCategory = {
        scheme: 'http://www.sap.com/adt/categories/cts',
        term: 'transportchecks'
    };

    /**
     * @see AdtService.getAdtCatagory()
     * @returns AdtCategory
     */
    public static getAdtCatagory(): AdtCategory {
        return TransportChecksService.adtCategory;
    }

    public static LocalPackageError = 'LocalPackageError';

    /**
     * TransportChecksService API function to fetch a list of available transport requests.
     *
     * @param packageName Package name for deployment
     * @param appName Fiori project name for deployment. A new project that has not been deployed before is also allowed
     * @returns A list of transport requests that can be used for deploy
     */
    public async getTransportRequests(packageName: string, appName: string): Promise<TransportRequest[]> {
        const acceptHeaders = {
            headers: {
                Accept: 'application/vnd.sap.as+xml; dataname=com.sap.adt.transport.service.checkData',
                'content-type':
                    'application/vnd.sap.as+xml; charset=UTF-8; dataname=com.sap.adt.transport.service.checkData'
            }
        };

        const data = `
                <?xml version="1.0" encoding="UTF-8"?>
                <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
                    <asx:values>
                        <DATA>
                        <PGMID/>
                        <OBJECT/>
                        <OBJECTNAME/>
                        <DEVCLASS>${packageName}</DEVCLASS>
                        <SUPER_PACKAGE/>
                        <OPERATION>I</OPERATION>
                        <URI>/sap/bc/adt/filestore/ui5-bsp/objects/${encodeURIComponent(appName)}/$create</URI>
                        </DATA>
                    </asx:values>
                </asx:abap>
            `;

        const response = await this.post('', data, acceptHeaders);
        return this.getTransportRequestList(response.data);
    }

    /**
     * TransportChecksService API function to fetch package and transport of deployed application.
     *
     * @param namespace The namespace for the deployed application
     * @returns Object that contains the package and the tansport used for the application deployment
     */
    public async getPackageAndTransportRequest(namespace: string): Promise<TransportCheck> {
        const acceptHeaders = {
            headers: {
                Accept: 'application/vnd.sap.as+xml; dataname=com.sap.adt.transport.service.checkData',
                'content-type':
                    'application/vnd.sap.as+xml; charset=UTF-8; dataname=com.sap.adt.transport.service.checkData'
            }
        };

        const data = `
			<?xml version="1.0" encoding="UTF-8" ?>
			<asx:abap version="1.0" xmlns:asx="http://www.sap.com/abapxml">
				<asx:values>
					<DATA>
						<OPERATION>I</OPERATION>
						<URI>/sap/bc/adt/ui_flex_dta_folder?name=${namespace}&amp;layer=CUSTOMER_BASE&amp;package=undefined</URI>
					</DATA>
				</asx:values>
			</asx:abap>`;
        const response = await this.post('', data, acceptHeaders);

        return this.getTransportCheck(response.data);
    }

    /**
     * Get the package and the transport
     * from ADT transportcheckes response response.
     *
     * @param xml Raw XML string from ADT transportcheckes reponse data
     * @returns Object that contains the package and the tansport used for the application deployment
     */
    private getTransportCheck(xml: string): TransportCheck {
        if (XMLValidator.validate(xml) !== true) {
            this.log.warn(`Invalid XML: ${xml}`);
            return null;
        }
        const doc = new DOMParser().parseFromString(xml);
        const status = xpath.select1('//RESULT/text()', doc)?.toString() as AdtTransportStatus;
        switch (status) {
            case 'S':
                return this.getTransportCheckObject(doc);
            case 'E':
                this.logErrorMsgs(doc);
                return null;
            default:
                this.log.warn(`Unknown response content: ${xml}`);
                return null;
        }
    }

    /**
     * Provide object that contains the package and the tansport used for the application deployment
     * in a ADT CTS request.
     *
     * @param doc document
     * @returns the package and the tansport used for the application deployment
     * @throws For errors or other unkonwn reasons no package and transport number found, an error is thrown.
     */
    private getTransportCheckObject(doc: Document): TransportCheck {
        const devClass = xpath.select1('//DEVCLASS/text()', doc)?.toString();
        const locks = xpath.select1('//LOCKS', doc) as Element;
        const ctsObjectLock = xpath.select1('//CTS_OBJECT_LOCK', locks) as Element;
        if (devClass && !ctsObjectLock) {
            return {
                package: devClass
            };
        } else if (devClass && ctsObjectLock) {
            const lockHolder = xpath.select1('//LOCK_HOLDER', ctsObjectLock) as Element;
            const reqHeader = xpath.select1('//REQ_HEADER', lockHolder) as Element;

            return {
                package: devClass,
                transportNumber: xpath.select1('//TRKORR/text()', reqHeader)?.toString()
            };
        } else {
            throw new Error('Unable to parse ADT response');
        }
    }

    /**
     * Get a list of valid transport requests
     * from ADT transportcheckes response response.
     *
     * @param xml Raw XML string from ADT transportcheckes reponse data
     * @returns a list of valid transport requests can be used for deploy config
     */
    private getTransportRequestList(xml: string): TransportRequest[] {
        if (XMLValidator.validate(xml) !== true) {
            this.log.warn(`Invalid XML: ${xml}`);
            return [];
        }
        const doc = new DOMParser().parseFromString(xml);

        const status = xpath.select1('//RESULT/text()', doc)?.toString() as AdtTransportStatus;
        switch (status) {
            case 'S':
                return this.getTransportList(doc);
            case 'E':
                this.logErrorMsgs(doc);
                return [];
            default:
                this.log.warn(`Unknown response content: ${xml}`);
                return [];
        }
    }

    /**
     * Parses the document to find and log the <CTS_MESSAGE> with severity 'E' in <MESSAGES>.
     *
     * @param doc document
     */
    private logErrorMsgs(doc: Document) {
        const messages = doc.getElementsByTagName('CTS_MESSAGE');

        for (const msg of Array.from(messages)) {
            if (msg.getElementsByTagName('SEVERITY')[0]?.textContent === 'E') {
                const text = msg.getElementsByTagName('TEXT')[0]?.textContent;
                this.log.error(text);
            }
        }
    }

    /**
     * Provide a list of transport requests available for the input package name and project name
     * in a ADT CTS request.
     *
     * @param doc document
     * @returns A list of transport requests
     * @throws For errors or other unkonwn reasons no transport number found, an error is thrown.
     * If error message equals TransportChecksService.LocalPackageError, it indicates the input
     * package is a local package and no transport request is required.
     * @see TransportChecksService.LocalPackageError
     */
    private getTransportList(doc: Document): TransportRequest[] {
        const recording = xpath.select1('//RECORDING/text()', doc)?.toString();
        const locked = (xpath.select1('//LOCKS', doc) as Element)?.textContent;
        const localPackage = xpath.select1('//DLVUNIT/text()', doc)?.toString();
        if (recording && !locked) {
            return this.getTransportListForNewProject(doc);
        } else if (locked) {
            return this.getLockedTransport(doc);
        } else if (LocalPackageText.includes(localPackage)) {
            throw new Error(TransportChecksService.LocalPackageError);
        } else {
            throw new Error('Unable to parse ADT response');
        }
    }

    /**
     * This function processes ADT response for new project name that have not been deployed before,
     * all the available transport requests are returned.
     *
     * @param doc document
     * @returns transport numbers
     */
    private getTransportListForNewProject(doc: Document): TransportRequest[] {
        const transportReqs = xpath.select('//REQ_HEADER', doc) as Element[];
        const list = [];
        if (transportReqs && transportReqs.length > 0) {
            for (const transportReqEle of transportReqs) {
                const transportReq = this.convertTransportRequest(transportReqEle);
                if (transportReq) {
                    list.push(transportReq);
                }
            }
        }
        return list;
    }

    /**
     * This function processes ADT response for existing project name that has been locked.
     * A single, previously provided transport requests is returned in the list.
     *
     * @param doc document
     * @returns transport numbers
     */
    private getLockedTransport(doc: Document): TransportRequest[] {
        const transportReqEle = xpath.select1('//LOCKS//REQ_HEADER', doc) as Element;

        const transportReq = this.convertTransportRequest(transportReqEle);
        if (transportReq) {
            return [transportReq];
        } else {
            return [];
        }
    }

    /**
     * Convert transport request in XML element of ADT response to typed object.
     *
     * @param transportReqEle XML element of transport request data in ADT response
     * @returns JSON object format of input XML element
     */
    private convertTransportRequest(transportReqEle: Element): TransportRequest | undefined {
        if (!transportReqEle) {
            return undefined;
        }
        const transportNumber = xpath.select1('TRKORR/text()', transportReqEle)?.toString();
        if (!transportNumber) {
            return undefined;
        }
        return {
            transportNumber: transportNumber,
            user: xpath.select1('AS4USER/text()', transportReqEle)?.toString(),
            description: xpath.select1('AS4TEXT/text()', transportReqEle)?.toString(),
            client: xpath.select1('CLIENT/text()', transportReqEle)?.toString(),
            targetSystem: xpath.select1('TARSYSTEM/text()', transportReqEle)?.toString()
        };
    }
}
