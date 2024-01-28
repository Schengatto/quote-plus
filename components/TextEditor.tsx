import { useI18nStore } from "@/store/i18n";
import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useRef } from "react";

const TextEditor: React.FunctionComponent<any> = ({ initialValue, onChange }) => {

    const plugins = [
        "print",
        "preview",
        "paste",
        "searchreplace",
        "autolink",
        "directionality",
        "visualblocks",
        "visualchars",
        "fullscreen",
        "image",
        "link",
        "media",
        "template",
        "codesample",
        "table",
        "charmap",
        "hr",
        "pagebreak",
        "nonbreaking",
        "anchor",
        "toc",
        "insertdatetime",
        "advlist",
        "lists",
        "wordcount",
        "imagetools",
        "textpattern"
    ].join(" ");

    const { currentLanguage } = useI18nStore();

    const editorRef = useRef<any>(null);

    const propagateChanges = () => {
        onChange(editorRef.current.getContent());
    };

    const toolbar = [
        "formatselect",
        "bold italic underline strikethrough",
        "forecolor backcolor blockquote",
        "link image media",
        "alignleft aligncenter alignright alignjustify",
        "numlist bullist outdent indent",
        "removeformat"
    ].join(" | ");

    return <Editor
        id="editor-description"
        apiKey={process.env.tinymceApiKey}
        onInit={(evt, editor) => editorRef.current = editor}
        onFocusOut={propagateChanges}
        initialValue={initialValue}
        init={{
            language: currentLanguage,
            branding: false,
            height: 400,
            menubar: true,
            plugins: plugins,
            toolbar: toolbar,
            image_advtab: true,
            templates: [
                {
                    title: "Prodotto - Prezzo prodotto",
                    description: "Aggiunge le informazioni del prezzo del prodotto",
                    content: "<p>Prezzo listino: {{prezzo}} &euro; + IVA</p> <p><strong>Prezzo scontato a Voi riservato {{prezzo-scontato}} &euro; + IVA</strong></p>"
                },
            ],
        }}
    />;
};

export default TextEditor;