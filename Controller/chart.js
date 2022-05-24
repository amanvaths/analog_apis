const { getConfigExchange, getMarkExchange, getStudyTemplateExchange, getTimeExchange, getSymbolExchange, getsymbolInfoExchange, gettimeScaleExchange, getHistoryFROMCMC } = require("../utils/function.chart");

async function config(req, res) {
    try {
        const data = await getConfigExchange();
        return res.json(data)
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function marks(req, res) {
    try {
        const data = await getMarkExchange();
        return res.json(data)
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function study_templates(req, res) {
    console.log("hit")
    try {
        const data = await getStudyTemplateExchange();
        return res.json(data)
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function time(req, res) {
    try {
        const data = await getTimeExchange();
        return res.json(data)
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function symbols(req, res) {
    try {
        const { symbol} = req.query;
        const data = await getSymbolExchange(symbol);
        return res.json(data)
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function charthistory(req, res) {
    try {
        let rFile = fs.readFileSync('./src/json/ohlc_custom.json', 'utf8');
        if(rFile){
          let fl =  JSON.parse(rFile);
          return res.json(fl[sy])
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function symbol_info(req, res) {
    try {
        const data = await getsymbolInfoExchange();
        return res.json(data)
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function timescale_marks(req, res) {
    try {
        const data = await gettimeScaleExchange();
        return res.json(data)
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}


module.exports = {
    config,
    marks,
    study_templates,
    time, 
    symbols,
    charthistory,
    symbol_info,
    timescale_marks,
}