const format = ({resCode = 0, msg = 'success', resData = {}}) => {
    return {
        resCode,
        msg,
        resData
    }
}


module.exports = {
    format
}