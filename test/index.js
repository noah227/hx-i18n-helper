const i18nHelper = require("../dist/index.js")

const helper = i18nHelper()
// helper.initLocales(["ja", "fr"])
// helper.syncLocales()
helper.generateNls()
