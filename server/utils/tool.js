const format = ({resCode = 0, msg = 'success', data = {}}) => {
    return {
        resCode,
        msg,
        data
    }
}


module.exports = {
    format
}