export const removeAllPlaceholders = (text: string) => {
    if (!text) return "";
    let result = text;
    text.match(/{{(.*?)}}/g)?.forEach((placeholder) => (result = text.replaceAll(placeholder, "")));
    return result;
};
