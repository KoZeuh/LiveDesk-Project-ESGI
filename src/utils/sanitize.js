function sanitizePseudo(value) {
    return String(value || "").trim().slice(0, 24);
}

function sanitizeText(value, maxLength = 300) {
    return String(value || "").trim().slice(0, maxLength);
}

module.exports = {
    sanitizePseudo,
    sanitizeText
};