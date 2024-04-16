const {nodeResolve} = require("@rollup/plugin-node-resolve")
const commonjs = require("@rollup/plugin-commonjs")
const terser = require("@rollup/plugin-terser")

const plugins = [
	nodeResolve(),
	commonjs()
]

// 打包后就可以舍弃node_modules了
module.exports = [
	{
		input: "./index.js",
		output: {
			file: "./dist/index.js",
			format: "cjs",
			exports: "auto",
			sourcemap: true
		},
		plugins: [
			...plugins
		]
	}
]
