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

const getDefaultLocaleContentStr = (rootPath, defaultLocaleName = "package.nls.json") => {
	const defaultLocalePath = path.resolve(rootPath, defaultLocaleName)
	return fs.readFileSync(defaultLocalePath, {encoding: "utf8"})
}
/**
 * 获取默认nls文件（package.nls.json）内容
 * 调用此函数默认该文件存在
 * @param rootPath
 * @param defaultLocaleName
 * @return {Object}
 */
const getDefaultLocaleContent = (rootPath, defaultLocaleName = "package.nls.json") => {
	return JSON.parse(getDefaultLocaleContentStr(rootPath, defaultLocaleName))
}

/**
 * @param {string} key
 */
const simplifyKey = (key) => {
	const configurationStart = "contributes.configuration.properties."
	// 类似于contributes.commands.0.title这种的
	if (/\w+\.\d/.test(key)) {
		const match = /\w+\.\d/.exec(key)
		key = key.slice(match.index)
	}
	// 配置项的，类似于contributes.configuration.properties.hx-my-plugin.optionThis.description
	else if (key.startsWith(configurationStart)) {
		key = key.replace(configurationStart, "")
	}
	return key
}

/**
 * @param cwd 如果是在运行时使用（如i18nGet），请传入插件根路径
 */
const i18nHelper = (cwd = "") => {
	const rootPath = cwd || process.cwd()
	console.log(`当前操作路径：${rootPath}`)
	const defaultLocalePath = path.resolve(rootPath, "package.nls.json")

	// 获取i18n数据内容
	const getI18nData = () => {
		const hx = require("hbuilderx")
		const lang = hx.env.language
		const fileName = `package.nls.${lang}.json`
		const defaultFsPath = path.resolve(rootPath, "package.nls.json")
		let fsPath = path.resolve(rootPath, fileName)
		// 当前语言没有对应的文件时，尝试读取默认语言配置文件
		if (!fs.existsSync(fsPath)) {
			fsPath = defaultFsPath
			// 都是用i18n配置了，默认文件还是要有的
			if (!fs.existsSync(fsPath)) return console.warn(`${fsPath}不存在`)
		}
		const data = JSON.parse(fs.readFileSync(fsPath, {encoding: "utf8"}))
		const dataDefault = JSON.parse(fs.readFileSync(defaultFsPath, {encoding: "utf8"}))
		return {...dataDefault, ...data}
	}
	return {
		/**
		 * 根据package.json对部分可能需要的键进行拍平，生成默认nls文件；
		 * 如果nls已存在，则只更新新增的键
		 * 默认删除不存在与package.json中的键以避免nls文件无限堆积无用的内容
		 * @param {TCoveredKeys[]} coveredKeys 占位，未启用
		 * @param autoClean 是否自动剔除已经不存在于package.json的键
		 * @param {string[]} keepTheseKeys 在配置了autoClean后仍想保留的键（注意：这里的键指的是已经拍平的键，如contributes.commands.0.title）
		 */
		generateNls(coveredKeys = [], autoClean = true, keepTheseKeys = []) {
			/** @type TCoveredKeys[] */
			const defaultCoveredKeys = ["name", "description", "displayName", "publisher", "contributes"]
			// 读取package.json
			const data = JSON.parse(fs.readFileSync(path.resolve(rootPath, "package.json"), {encoding: "utf8"}))
			const extractData = defaultCoveredKeys.reduce((_, k) => {
				_[k] = data[k]
				return _
			}, {})
			// 数据一级平铺
			// 拍平后key可能会有特殊的符号，如explorer/context，但是不影响，因为整体都是在引号内作为key使用的
			const flatData = flatten(extractData)
			// 删除不需要的内容
			for (let k in flatData) {
				// 只有string类型的才需要i18n
				if (typeof flatData[k] !== "string") delete flatData[k]
				// 配置的command自然也不需要i18n的
				else if (k.endsWith(".command")) delete flatData[k]
				// group也不需要
				else if (k.endsWith(".group")) delete flatData[k]
				else if (k.endsWith(".type")) delete flatData[k]
			}
			// 加载现有nls文件（package.nls.json，即默认nls文件）
			const defaultLocaleContent = getDefaultLocaleContent(rootPath)
			const saveNewData = autoClean ? {} : {...defaultLocaleContent}
			// auto merge
			for (let k in flatData) {
				saveNewData[k] = flatData[k]?.startsWith("%") ? defaultLocaleContent[k] : defaultLocaleContent[k] || flatData[k]
			}
			if (autoClean) {
				keepTheseKeys.forEach(k => {
					saveNewData[k] = defaultLocaleContent[k] || ""
				})
			}
			fs.writeFileSync(defaultLocalePath, JSON.stringify(saveNewData, null, 4), {encoding: "utf8"})
			console.log(`已生成/更新默认nls文件内容（${defaultLocalePath}）`)
		},
		/**
		 * 生成键的映射文件，利用智能提示辅助代码构建，写代码时就不用去nls里面找key了
		 * 推荐配合{@link i18nGet}使用
		 * @param {string} fileName
		 * @param {boolean} useSimplifiedKey 是否使用简化的key；如果使用，请注意避免key冲突
		 */
		generateJsHelper(fileName = "helper.js", useSimplifiedKey = false) {
			/** @type Object */
			const data = getDefaultLocaleContent(rootPath)
			const keyList = Object.keys(data)
			if (!keyList.length) return console.warn("package.nls.json内容为空，请先初始化相关数据")
			const helperTpl = `module.exports = {\n@content\n}`
			const content = keyList.reduce((contentGroup, k) => {
				contentGroup.push(
					`\t/** ${data[k]} */`,
					`\t"${useSimplifiedKey ? simplifyKey(k) : k}": "${k}",`
				)
				return contentGroup
			}, []).join("\n")
			const fsPath = path.resolve(rootPath, fileName)
			fs.writeFileSync(fsPath, helperTpl.replace("@content", content), {encoding: "utf8"})
			console.log(`已生成辅助文件（${fsPath}）`)
		},
		/**
		 * 推荐配合{@link generateJsHelper}使用
		 * 关于hx的国际化语言代码，[参见](https://github.com/dcloudio/hbuilderx-language-packs/blob/main/docs/localizations.md)
		 * @param {string} key
		 * @param {string} defaultValue 没取到时的默认值，一般不用配；默认当前locale没取到值时，会去package.nls.json取
		 */
		i18nGet(key, defaultValue = "") {
			return getI18nData()[key] ?? defaultValue
		},
		/**
		 * 批量获取i18n内容
		 * @param {(string | [key, defaultValue])[]} keys
		 */
		i18nGets(keys) {
			const data = getI18nData()
			return keys.reduce((_data, item) => {
				let key = "", defaultValue = ""
				if (item instanceof Array) {
					key = item[0]
					if (item.length > 1) defaultValue = item[1]
				} else key = item
				_data[key] = data[key] ?? defaultValue
				return _data
			}, {})
		},
		/**
		 * 初始化，不用一个个创建了
		 * 在默认nls文件不存在时，会自动创建该文件
		 * @param {localeCode[]} localeList
		 */
		initLocales(localeList) {
			if (!fs.existsSync(defaultLocalePath)) {
				fs.writeFileSync(defaultLocalePath, `{\n\t\n}`, {encoding: "utf8"})
				console.warn("未检测到package.nls.json，已自动创建")
			}
			const defaultLocaleContent = getDefaultLocaleContentStr(rootPath)
			localeList.forEach(locale => {
				const filename = `package.nls.${locale}.json`
				const fsPath = path.resolve(rootPath, filename)
				if (!fs.existsSync(fsPath)) {
					fs.writeFileSync(fsPath, defaultLocaleContent, {encoding: "utf8"})
					console.log(`[init] ${filename}已创建`)
				}
			})
		},
		/**
		 * 从package.nls.json向其他locale同步更新
		 */
		syncLocales() {
			const defaultLocaleContent = getDefaultLocaleContent(rootPath)
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

export default {
	i18nHelper
}
