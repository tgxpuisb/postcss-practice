/**
 * 测试postcss插件的顺序是否有影响
 */
const fs = require('fs')
const less = require('postcss-less-engine')
const postcss = require('postcss')
const sprites = require('postcss-sprites')


fs.readFile('./src.less', (err, css) => {
    postcss([
        less(),
        postcss.plugin('plugin1', function (options) {
            return function (css) {
                let bgs = []
                css.walkRules(rule => {
                    rule.walkDecls(/^background/, decl => {
                        if (/url\((.+?)\)/.test(decl.value)) {
                            let bgRule = rule.clone({
                                selector: '.yeb-webp ' + rule.selector
                            })
                            bgRule.removeAll()
                            bgRule.append(decl.clone({
                                value: decl.value.replace(/url\(\'?(.+?)\'?\)/, 'url($1!750.webp)')
                            }))
                            bgs.push(bgRule)
                        }
                    })
                })
                bgs.forEach(v => {
                    console.log(v)
                    css.append(v)
                })
                /*
                css.walkDecls(/^background/, (decl) => {
                    let webp = decl.clone({
                        selector: '.yeb-webp' + decl.selector
                    })
                    css.append(webp)
                })
                */
            }
        })({}),
        postcss.plugin('plugin2', function (options) {
            return function (css) {
                css.walkComments(rule => {
                    if (rule.text === 'Comment') {
                        rule.text = 'comment 3'
                    }
                })
            }
        })({}),
    ])
    .process(css, {
        parser: less.parser,
        from: './src.less',
        to: './dist.css'
    })
    .then(result => {
        fs.writeFile('./dist.css', result.css)
    })
    .catch(e => {
        console.log(e)
    })
})
/*
fs.readFile('./src.css', (err, content) => {
    postcss([
        // 插件写这里
        // myplugin()
    ])
    .process(content, {
        from: './src.css',
        to: './dist.css'
    })
    .then(result => {
        fs.writeFile('./dist.css', result.css)
    })
    .catch(e => {
        console.log(e)
    })
})
*/

module.exports = postcss.plugin('myplugin', (options/*插件在调用的时候传入的配置*/) => {
    return function (root) {
        // 提取规则中background的声明,等遍历结束后append进CSS中
        let bgRules = []
        root.walkRules(rule => {
            // 遍历所有的Rule
            rule.walkDecls(/^background/, decl => {
                // 遍历有background的声明
                if (/url\((.+?)\)/.test(decl.value)) {
                    // 找到有 background:url(...) 规则,并更改选择器名称
                    let bgRule = rule.clone({
                        selector: '.yeb-webp ' + rule.selector
                    }) // 克隆该条申明
                    // 移除该规则的子节点
                    bgRule.removeAll()
                    bgRule.append(decl.clone({
                        // 向改空的规则中加入一条关于背景图的声明
                        value: decl.value.replace(/url\((.+?)\)/, 'url($1!750.webp)')
                    }))
                    // 将生成的新规则添加至数组中
                    bgRules.push(bgRule)
                }
            })
        })
        // 循环之前存入数组的规则并写入CSS树中
        bgRules.forEach(v => {
            root.append(v)
        })
    }
})