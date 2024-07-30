import { type IMessageSeverity } from '@sap-devx/yeoman-ui-types';
import type {
    Answers,
    ConfirmQuestion as BaseConfirmQuestion,
    InputQuestion as BaseInputQuestion,
    PasswordQuestion as BasePasswordQuestion,
    ListQuestion as BaseListQuestion,
    CheckboxQuestion as BaseCheckBoxQuestion,
    NumberQuestion as BaseNumberQuestion,
    ListChoiceOptions,
    PromptFunction,
    PromptModule,
    Question,
    Validator,
    AsyncDynamicQuestionProperty
} from 'inquirer';

export interface UI5VersionChoice extends ListChoiceOptions {
    /**
     * UI5 semantic version
     */
    value: string;
}

export interface InquirerAdapter {
    /**
     * The prompt function
     */
    prompt: PromptFunction;
    /**
     * Plugins will be registered on this prompt module if required
     */
    promptModule?: PromptModule;
}

export interface LinkGuiOption {
    text?: string;
    url?: string;
}

/**
 * To be replaced when YUI specific types are available from `"@sap-devx/yeoman-ui-types`.
 *
 */
export interface GuiOptions {
    /**
     * Provides a tooltip with a YUI prompt
     */
    hint?: string;
    /**
     * A valid prompt answer is mandatory to progress with prompting
     */
    mandatory?: boolean;
    /**
     * Defaults will be re-applied if a previous answer has changed
     */
    applyDefaultWhenDirty?: boolean;
    /**
     * Indicate state in the left hand navigation panel in YUI
     */
    breadcrumb?: boolean | string;
    /**
     * Indicates the type of the prompt
     */
    type?: string;

    link?: LinkGuiOption;
}

export type PromptSeverityMessage = (
    input?: unknown,
    previousAnswers?: Answers
) => IMessageSeverity | undefined | Promise<IMessageSeverity | undefined>;

export type YUIQuestion<A extends Answers = Answers> = Question<A> & {
    name: string;
    guiOptions?: GuiOptions;
    additionalMessages?: PromptSeverityMessage;
};

export interface FileBrowserQuestion<A extends Answers = Answers> extends BaseInputQuestion<A> {
    name: YUIQuestion['name'];
    guiType: 'file-browser' | 'folder-browser';
    guiOptions?: YUIQuestion['guiOptions'];
}

export interface ListQuestion<A extends Answers = Answers> extends BaseListQuestion<A> {
    name: YUIQuestion['name'];
    guiOptions?: YUIQuestion['guiOptions'];
    additionalMessages?: YUIQuestion['additionalMessages'];
}

export interface ConfirmQuestion<A extends Answers = Answers> extends BaseConfirmQuestion<A> {
    name: YUIQuestion['name'];
    guiOptions?: YUIQuestion['guiOptions'];
}

export interface InputQuestion<A extends Answers = Answers> extends BaseInputQuestion<A> {
    name: YUIQuestion['name'];
    guiOptions?: YUIQuestion['guiOptions'];
}

export interface PasswordQuestion<A extends Answers = Answers> extends BasePasswordQuestion<A> {
    name: YUIQuestion['name'];
    guiOptions?: YUIQuestion['guiOptions'];
}

export interface CheckBoxQuestion<A extends Answers = Answers> extends BaseCheckBoxQuestion<A> {
    name: YUIQuestion['name'];
    guiOptions?: YUIQuestion['guiOptions'];
    additionalMessages?: YUIQuestion['additionalMessages'];
}

export interface NumberQuestion<A extends Answers = Answers> extends BaseNumberQuestion<A> {
    name: YUIQuestion['name'];
    guiOptions?: YUIQuestion['guiOptions'];
}

export interface AutocompleteQuestion<A extends Answers = Answers> extends Question<A> {
    type: 'autocomplete' | any;
    source: (answers: A, input: string) => Promise<string[]>;
    suggestOnly?: boolean; // When false input cannot be used to provide an answer, which must be selected. This only applies to CLI use.
    /**
     * Additional messages can be shown based on auto-complete search results
     */
    additionalInfo: () => string;
    guiOptions?: YUIQuestion['guiOptions'];
}
/**
 * Defines prompt/question default values and/or whether or not they should be shown.
 */
export type CommonPromptOptions<T extends Answers = Answers> = {
    hide?: boolean;
    validate?: Validator<T>;
    additionalMessages?: PromptSeverityMessage;
};

// Default value type for input prompt options
export type PromptDefaultValue<T> = {
    default?: AsyncDynamicQuestionProperty<T>;
};
