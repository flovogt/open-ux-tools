export default {
    'com.sap.cds.vocabularies.Aggregation': {
        '$Alias': 'Aggregation',
        '@Org.OData.Core.V1.Description': 'CDS Terms for Aggregation (subset)',
        'default': {
            '$Kind': 'Term',
            '$AppliesTo': ['Property'],
            '$Type': 'Aggregation.AggregationDefaultType',
            '@Org.OData.Core.V1.Description': '(CDS annotation) Defines the default aggregation of a property'
        },
        'AggregationDefaultType': {
            '$Kind': 'EnumType',
            // from capire: applied in odata query (https://pages.github.tools.sap/cap/docs/advanced/odata#aggregation-methods)
            'sum': 0,
            'sum@Org.OData.Core.V1.Description': 'aggregation (odata query) sum (TODO)',
            'min': 1,
            'min@Org.OData.Core.V1.Description': 'aggregation (odata query) min (TODO)',
            'max': 2,
            'max@Org.OData.Core.V1.Description': 'aggregation (odata query) max (TODO)',
            'average': 3,
            'average@Org.OData.Core.V1.Description': 'aggregation (odata query) average (TODO)',
            'countdistinct': 4,
            'countdistinct@Org.OData.Core.V1.Description': 'aggregation (odata query)  countdistinct (TODO)',
            // from ABAP: consumed in Analytical Engine
            'NONE': 5,
            'NONE@Org.OData.Core.V1.Description': 'aggregation (analytical engine) NONE (TODO)',
            'SUM': 6,
            'SUM@Org.OData.Core.V1.Description': 'aggregation (analytical engine) SUM (TODO)',
            'MIN': 7,
            'MIN@Org.OData.Core.V1.Description': 'aggregation (analytical engine) MIN (TODO)',
            'MAX': 8,
            'MAX@Org.OData.Core.V1.Description': 'aggregation (analytical engine) MAX (TODO)',
            'AVG': 9,
            'AVG@Org.OData.Core.V1.Description': 'aggregation (analytical engine) AVG (TODO)',
            'COUNT_DISTINCT': 10,
            'COUNT_DISTINCT@Org.OData.Core.V1.Description': 'aggregation (analytical engine) COUNT_DISTINCT (TODO)',
            'NOP': 11,
            'NOP@Org.OData.Core.V1.Description': 'aggregation (analytical engine) NOP (TODO)',
            'FORMULA': 12,
            'FORMULA@Org.OData.Core.V1.Description': 'aggregation (analytical engine) FORMULA (TODO)'
        }
    }
};