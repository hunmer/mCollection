const { HashImage, PHash } = require('imgphash');
const fs = require('fs')
addEventListener('message', async e => {
    let {id, data} = e.data
    let [method, ...args] = data
    postMessage({ret: await this[method].apply(this, args), id});
})

function getHash(file) {
    return new Promise(reslvoe => {
      new HashImage(fs.readFileSync(file)).phash().then(phash => reslvoe(phash.hash))
    })
}

async function compare(img1, img2) {
    let hash1 = await this.getHash(img1)
    let hash2 = await this.getHash(img2)
    return hash1.compare(hash2)
}