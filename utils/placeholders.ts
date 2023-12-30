export const removeAllPlaceholders = (text: string) => {
    let result = text;
    text.match(/{{(.*?)}}/g)?.forEach((placeholder) => (result = text.replaceAll(placeholder, "")));
    return result;
};
