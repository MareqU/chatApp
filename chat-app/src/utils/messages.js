const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime
    }
}

const generateLocationMessage = (username, coords) => {
    return {
        username: username,
        url: `https://google.com/maps?q=${coords}`,
        creteadAt: new Date().getTime
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}