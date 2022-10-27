function deepProxy(Obj, callback) {
    // 深度遍历
    if (typeof Obj === 'object') {
        const status = Array.isArray(Obj);
        if (status) {
            Obj.forEach((v, i) => {
                if (typeof v === 'object') {
                    Obj[i] = deepProxy(v)
                }
            })
        } else {
            Object.keys(Obj).forEach(v => {
                if (typeof Obj[v] === 'object') {
                    Obj[v] = deepProxy(Obj[v])
                }
            });
        }
        return new Proxy(Obj, {
            set(target, key, val) {
                if (target[key] !== val) { // 数据变动
                    Reflect.set(target, key, val)
                    console.log(key, val)
                }
            }
        }); // 数据代理
    }
    return new TypeError("Argument must be object or array");
}
let data = { name: 'steve', age: 18, attr: { sex: 'man' } }
var obj = deepProxy(data)

obj.age = 20
obj.attr.sex = 'male'
console.log(obj)