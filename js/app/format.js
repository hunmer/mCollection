

var g_format = {
	list: ['mp4', 'ts', 'm3u8', 'flv', 'mp3', 'wav', 'ogg'],
	category: {
		audio: ['mp3', 'wav', 'ogg', 'm4a'],
		video: ['mp4', 'ts', 'm3u8', 'flv'],
		image: ['jpg', 'jpeg', 'png', 'webp'],
		// javascript: ['js'],
		other: [],
	},

	init(){

	},

	getCategory(name){
		return g_format.category[name] || []
	},

	getFormats(){
		let formats = []
		Object.values(this.category).forEach(list => formats.push(...list))
		return formats
	},

	getFileType(ext){
		ext = getExtName(ext).toLowerCase()
		for(let [type, list] of Object.entries(this.category)){
			if(list.includes(ext)) return type
		}
	},

}

g_format.init()


function getFileType(file) {
    return g_format.getFileType(file)
}