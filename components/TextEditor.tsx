import { useI18nStore } from "@/store/i18n";
import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useRef } from "react";

const TextEditor: React.FunctionComponent<any> = ({ initialValue, onChange }) => {

    const plugins = [
        "preview",
        "searchreplace",
        "autolink",
        "directionality",
        "visualblocks",
        "visualchars",
        "fullscreen",
        "image",
        "link",
        "media",
        "codesample",
        "table",
        "charmap",
        "pagebreak",
        "nonbreaking",
        "anchor",
        "insertdatetime",
        "advlist",
        "lists",
        "wordcount"
    ].join(" ");

    const { currentLanguage } = useI18nStore();

    const editorRef = useRef<any>(null);

    const propagateChanges = () => {
        onChange(editorRef.current.getContent());
    };

    const toolbar = [
        "blocks",
        "bold italic underline strikethrough",
        "forecolor backcolor blockquote",
        "link image media",
        "alignleft aligncenter alignright alignjustify",
        "numlist bullist outdent indent",
        "removeformat"
    ].join(" | ");

    return <Editor
        id="editor-description"
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        onInit={(_evt: any, editor: any) => editorRef.current = editor}
        onFocusOut={propagateChanges}
        initialValue={initialValue}
        init={{
            // Self-hosted GPL build: no API key and no domain registration needed.
            base_url: "/tinymce",
            // The store starts empty; falling back to "en" avoids requesting a
            // language pack at "/tinymce/langs/.js". TinyMCE has "en" built in.
            language: currentLanguage || "en",
            branding: false,
            height: 600,
            menubar: true,
            plugins: plugins,
            toolbar: toolbar,
            image_advtab: true,
        }}
    />;
};

export default TextEditor;