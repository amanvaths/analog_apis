async function getConfigExchange(data) {
    const config = {
        "supports_search": true,
        "supports_group_request": false,
        "supports_marks": true,
        "supports_timescale_marks": true,
        "supports_time": false,
        "compare_symbols":false,
        "exchanges": [
          {
            "value": "",
            "name": "All Exchanges",
            "desc": ""
          },
          {
            "value": "NasdaqNM",
            "name": "NasdaqNM",
            "desc": "NasdaqNM"
          },
        ],
        "symbols_types": [
          {
            "name": "All types",
            "value": ""
          },
          {
            "name": "Stock",
            "value": "stock"
          },
        ],
        "supported_resolutions": [
          "6H",
          "1H",
          "2H",
          "3H",
          "4H",
          "9H",
          "12H",
          "1D",
          "2D",
          "3D",
          "1W"

        ]
      };
    return config;
}
async function getMarkExchange(data) {
    const config = {
        "supports_search": true,
        "supports_group_request": false,
        "supports_marks": true,
        "supports_timescale_marks": true,
        "supports_time": true,
        "compare_symbols":false,
        "exchanges": [
          {
            "value": "",
            "name": "All Exchanges",
            "desc": ""
          },
          {
            "value": "NasdaqNM",
            "name": "NasdaqNM",
            "desc": "NasdaqNM"
          },
        ],
        "symbols_types": [
          {
            "name": "All types",
            "value": ""
          },
          {
            "name": "Stock",
            "value": "stock"
          },
        ],
        "supported_resolutions": [
          "6H",
          "1H",
          "2H",
          "3H",
          "4H",
          "9H",
          "12H",
          "1D",
          "2D",
          "3D",
          "1W"
        ]
      };
    return config;
}
async function getStudyTemplateExchange(data) {
    const config = {
        "supports_search": true,
        "supports_group_request": false,
        "supports_marks": true,
        "supports_timescale_marks": true,
        "supports_time": true,
        "compare_symbols":false,
        "exchanges": [
          {
            "value": "",
            "name": "All Exchanges",
            "desc": ""
          },
          {
            "value": "NasdaqNM",
            "name": "NasdaqNM",
            "desc": "NasdaqNM"
          },
        ],
        "symbols_types": [
          {
            "name": "All types",
            "value": ""
          },
          {
            "name": "Stock",
            "value": "stock"
          },
        ],
        "supported_resolutions": [
          "6H",
          "1H",
          "2H",
          "3H",
          "4H",
          "9H",
          "12H",
          "1D",
          "2D",
          "3D",
          "1W"
        ]
      };
    return config;
}
async function getTimeExchange(data) {
    const config = Date.now();
    return config;
}
async function getSymbolExchange(exName) {
    const config = {
        "name": "ANALOG",
        "exchange-traded": "analog/Inr",
        "exchange-listed": "Analog",
        "timezone": "IST",
        "minmov": 1,
        "minmov2": 0,
        "pointvalue": 1,
        "session": "0930-1630",
        "has_intraday": true,
        "has_no_volume": false,
        "compare_symbols":false,
        "description": exName,
        "supported_resolutions": [
          "6H",
          "1H",
          "2H",
          "3H",
          "4H",
          "9H",
          "12H",
          "1D",
          "2D",
          "3D",
          "1W"
        ],
        "pricescale": 10000,
        "ticker": exName,
        "styles" : 1
      };
      // config.mainSeriesProperties.style = 1
    return config;
}
async function getsymbolInfoExchange(exName) {
    const config = {
        "name": "ANALOG",
        "exchange-traded": "Analog/USDT",
        "exchange-listed": "ANALOG",
        "timezone": "IST",
        "minmov": 1,
        "minmov2": 4,
        "pointvalue": 1,
        "session": "0930-1630",
        "has_intraday": false,
        "has_no_volume": false,
        "has_weekly_and_monthly":false,
        "has_empty_bars":false,
        "description": exName,
        "compare_symbols":false,
        "supported_resolutions": [
          "6H",
          "1h",
          "2H",
          "3H",
          "4H",
          "12H",
          "1D",
          "2D",
          "3D",
        ],
        "pricescale": 10000,
        "ticker": exName
      };
    return config;
}
async function gettimeScaleExchange(symbol,resolution, from, to, countback) {
  try{  
    return {};
    }catch(error){
      console.log("error in function.chart.js > gettimeScaleExchange.js "+error.message)
    }
    // }else{
    //   return config2;
    // }
}

module.exports = {
    getConfigExchange,
    getMarkExchange, 
    getStudyTemplateExchange, 
    getTimeExchange, 
    getSymbolExchange, 
    getsymbolInfoExchange,
    gettimeScaleExchange,
}