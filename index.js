const fs = require("fs")
const path = require("path");
import {flatten} from "flat";

/**
 * @typedef {"af" | "af_ZA" | "sq" | "sq_AL" | "ar" | "ar_DZ" | "ar_BH" | "ar_EG" | "ar_IQ" | "ar_JO" | "ar_KW" | "ar_LB" | "ar_LY" | "ar_MA" | "ar_OM" | "ar_QA" | "ar_SA" | "ar_SY" | "ar_TN" | "ar_AE" | "ar_YE" | "hy" | "hy_AM" | "az" | "az_AZ_Cyrl" | "az_AZ_Latn" | "eu" | "eu_ES" | "be" | "be_BY" | "bg" | "bg_BG" | "ca" | "ca_ES" | "zh_HK" | "zh_MO" | "zh_CN" | "zh_CHS" | "zh_SG" | "zh_TW" | "zh_CHT" | "hr" | "hr_HR" | "cs" | "cs_CZ" | "da" | "da_DK" | "div" | "div_MV" | "nl" | "nl_BE" | "nl_NL" | "en" | "en_AU" | "en_BZ" | "en_CA" | "en_CB" | "en_IE" | "en_JM" | "en_NZ" | "en_PH" | "en_ZA" | "en_TT" | "en_GB" | "en_US" | "en_ZW" | "et" | "et_EE" | "fo" | "fo_FO" | "fa" | "fa_IR" | "fi" | "fi_FI" | "fr" | "fr_BE" | "fr_CA" | "fr_FR" | "fr_LU" | "fr_MC" | "fr_CH" | "gl" | "gl_ES" | "ka" | "ka_GE" | "de" | "de_AT" | "de_DE" | "de_LI" | "de_LU" | "de_CH" | "el" | "el_GR" | "gu" | "gu_IN" | "he" | "he_IL" | "hi" | "hi_IN" | "hu" | "hu_HU" | "is" | "is_IS" | "id" | "id_ID" | "it" | "it_IT" | "it_CH" | "ja" | "ja_JP" | "kn" | "kn_IN" | "kk" | "kk_KZ" | "kok" | "kok_IN" | "ko" | "ko_KR" | "ky" | "ky_KZ" | "lv" | "lv_LV" | "lt" | "lt_LT" | "mk" | "mk_MK" | "ms" | "ms_BN" | "ms_MY" | "mr" | "mr_IN" | "mn" | "mn_MN" | "no" | "nb_NO" | "nn_NO" | "pl" | "pl_PL" | "pt" | "pt_BR" | "pt_PT" | "pa" | "pa_IN" | "ro" | "ro_RO" | "ru" | "ru_RU" | "sa" | "sa_IN" | "sr_SP_Cyrl" | "sr_SP_Latn" | "sk" | "sk_SK" | "sl" | "sl_SI" | "es" | "es_AR" | "es_BO" | "es_CL" | "es_CO" | "es_CR" | "es_DO" | "es_EC" | "es_SV" | "es_GT" | "es_HN" | "es_MX" | "es_NI" | "es_PA" | "es_PY" | "es_PE" | "es_PR" | "es_ES" | "es_UY" | "es_VE" | "sw" | "sw_KE" | "sv" | "sv_FI" | "sv_SE" | "syr" | "syr_SY" | "ta" | "ta_IN" | "tt" | "tt_RU" | "te" | "te_IN" | "th" | "th_TH" | "tr" | "tr_TR" | "uk" | "uk_UA" | "ur" | "ur_PK" | "uz" | "uz_UZ_Cyrl" | "uz_UZ_Latn" | "vi" | "vi_VN"} localeCode
 * @typedef {"name" | "description" | "displayName" | "publisher" | "contributes"} TCoveredKeys
 */

/**
 *
 * @param rootPath
 * @return {string[]}
 */
const loadFileList = (rootPath) => {
	const fileList = fs.readdirSync(rootPath)
	const matchReg = /package\.nls(\.\w+)?\.json/
	return fileList.filter(f => matchReg.test(f) && fs.statSync(path.resolve(rootPath, f)).isFile())
}

const i18nHelper = () => {
	const rootPath = process.cwd()
	console.log(`当前操作路径：${rootPath}`)
	const defaultLocalePath = path.resolve(rootPath, "package.nls.json")
	if (!fs.existsSync(defaultLocalePath)) {
		fs.writeFileSync(defaultLocalePath, `{\n\t\n}`, {encoding: "utf8"})
		console.warn("未检测到package.nls.json，已自动创建")
	}
	const defaultLocaleContentStr = fs.readFileSync(defaultLocalePath, {encoding: "utf8"})

	return {
		/**
		 * 根据package.json对部分可能需要的键进行拍平，生成默认nls文件；
		 * 如果nls已存在，则只生成新增的键；
		 * @param {TCoveredKeys[]} coveredKeys 占位，未启用
		 * @param autoClean 是否自动剔除已经不存在于package.json的键
		 */
		generateNls(coveredKeys = [], autoClean = false) {
			/**@type TCoveredKeys[] */
			const defaultCoveredKeys = ["name", "description", "displayName", "publisher", "contributes"]
			const data = JSON.parse(fs.readFileSync(path.resolve(rootPath, "package.json"), {encoding: "utf8"}))
			const extractData = defaultCoveredKeys.reduce((_, k) => {
				_[k] = data[k]
				return _
			}, {})
			// 数据一级平铺
			// 拍平后key可能会有特殊的符号，如explorer/context，但是不影响，因为整体都是在引号内作为key使用的
			const flatData = flatten(extractData)
			for (let k in flatData) {
				// 只有string类型的才需要i18n
				if (typeof flatData[k] !== "string") delete flatData[k]
				// 配置的command自然也不需要i18n的
				else if (k.endsWith(".command")) delete flatData[k]
				// group也不需要
				else if (k.endsWith("group")) delete flatData[k]
				else if (k.endsWith(".type")) delete flatData[k]
				else if (k.endsWith(".default")) delete flatData[k]
			}
			const defaultLocaleContent = JSON.parse(defaultLocaleContentStr)
			const saveNewData = {}
			// auto merge
			for (let k in flatData) {
				saveNewData[k] = defaultLocaleContent[k] || flatData[k]
			}
			fs.writeFileSync(defaultLocalePath, JSON.stringify(flatData, null, 4), {encoding: "utf8"})
		},
		/**
		 * 初始化，不用一个个创建了
		 * @param {localeCode[]} localeList
		 */
		initLocales(localeList) {
			localeList.forEach(locale => {
				const filename = `package.nls.${locale}.json`
				const fsPath = path.resolve(rootPath, filename)
				if (!fs.existsSync(fsPath)) {
					fs.writeFileSync(fsPath, defaultLocaleContentStr, {encoding: "utf8"})
					console.log(`[init] ${filename}已创建`)
				}
			})
		},
		/**
		 * 从package.nls.json向其他locale同步更新
		 */
		syncLocales() {
			const defaultLocaleContent = JSON.parse(defaultLocaleContentStr)
			const fileList = loadFileList(rootPath)
			fileList.forEach(f => {
				const fsPath = path.resolve(rootPath, f)
				const fileData = JSON.parse(fs.readFileSync(fsPath, {encoding: "utf8"}))
				const fileNewData = {}
				for (let k in defaultLocaleContent) {
					fileNewData[k] = fileData[k] || defaultLocaleContent[k]
				}
				fs.writeFileSync(fsPath, JSON.stringify(fileNewData, null, 4), {encoding: "utf8"})
				console.log(`${f}已同步`)
			})
			console.log(`同步结束，共同步${fileList.length}个文件`)
		}
	}
}

export default i18nHelper
