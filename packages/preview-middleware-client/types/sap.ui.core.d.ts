declare module 'sap/ui/core/util/reflection/JsControlTreeModifier' {
    import ChangeSelector from 'sap/ui/fl/ChangeSelector';
    import Control from 'sap/ui/core/Control';
    import Component from 'sap.ui.core.UIComponent';
    interface JsControlTreeModifier {
        bySelector(selector: ChangeSelector, oAppComponent: Component): Control;
    }

    const JsControlTreeModifier: JsControlTreeModifier;
    export default JsControlTreeModifier;
}