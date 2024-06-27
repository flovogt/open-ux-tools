import React from 'react';
import './QuestionGroup.scss';
import ReactMarkdown from 'react-markdown';

export interface QuestionGroupProps {
    title: string;
    description?: string[];
    showDescription?: boolean;
    children?: JSX.Element[];
}

export const QuestionGroup = (props: QuestionGroupProps) => {
    const { title, description, showDescription, children } = props;
    return (
        <div className="prompts-group">
            <ul className="prompts-group-title-list">
                <div className="prompts-group-title-container">
                    <li className="prompts-group-title">{title}</li>
                </div>
            </ul>
            {showDescription &&
                description &&
                description.map((descriptionParagraph, i) => (
                    <div className="prompts-group-description" key={i}>
                        <ReactMarkdown key={i}>{descriptionParagraph}</ReactMarkdown>
                    </div>
                ))}
            <div className="prompt-entries-group">{children}</div>
        </div>
    );
};