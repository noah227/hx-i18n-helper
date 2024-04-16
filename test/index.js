const i18nHelper = require("../index")

const helper = i18nHelper()
helper.initLocales(["ja", "fr"])
helper.syncLocales()
