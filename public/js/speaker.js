var g_speaker = {
    synth: window.speechSynthesis,
    text: '',
    log: true,
    words: [],
    utterThis: 0,
    init() {
        const self = this
        g_style.addStyle('speaker', `
            .speaking_word {
                background-color: red;
                color: white;
            }
        `)
        self.config = getConfig('tts', {
            rate: 1,
            pitch: 1,
            volume: 1,
            voice: 'Microsoft Sayaka - Japanese (Japan)',
        })

        g_action.registerAction({
            modal_tts() {
                self.modal()
            }
        })
        self.synth.onvoiceschanged = () => {
            self.initVoice()
        }

    },

    initVoice() {
        const self = this
        let voices = self.voices = self.synth.getVoices()
        let voice = voices.find(voice => voice.name == self.config.voice)
        let utter = self.utterThis = new SpeechSynthesisUtterance();
        utter.onerror = function(event) {}
        utter.voice = voice
        utter.pitch = self.config.patch || 1
        utter.rate = self.config.rate || 1
        utter.volume = self.config.volume || 1
    },

    modal() {
        const self = this
        g_form.confirm1({
            title: 'TTS设置',
            elements: {
                voice: {
                    title: '语音人',
                    type: 'select',
                    list: self.voices.map(voice => voice.name),
                    required: true,
                    value: self.config.voice,
                },
                rate: {
                    title: 'rate',
                    type: 'range',
                    opts: {
                        step: 0.1,
                        max: 1,
                    },
                    value: self.config.rate,
                },
                pitch: {
                    title: 'pitch',
                    type: 'range',
                    opts: {
                        step: 0.1,
                        max: 1,
                    },
                    value: self.config.pitch,
                },
                volume: {
                    title: 'volume',
                    type: 'range',
                    opts: {
                        step: 0.1,
                        max: 2,
                    },
                    value: self.config.volume,
                },
            },
            callback({ vals }) {
                Object.assign(self.config, vals)
                self.saveConfig()
                self.initVoice()
            }
        })
    },

    setPatch(v) {
        this.setConfig('patch', v * 1)
    },

    setRate(v) {
        this.setConfig('rate', v * 1)
    },

    setVolume(v) {
        this.setConfig('volume', v * 1)
    },

    setConfig(k, v) {
        this.config[k] = v
        this.saveConfig()
    },

    saveConfig() {
        setConfig('tts', this.config)
    },

    read(text, opts) {
        console.log(opts)
        const clear = () => $('.speaking_word').removeClass('speaking_word');

        this.synth.speaking && this.synth.cancel()
        let utter = this.utterThis
        utter.text = text;
        this.synth.speak(utter);

        utter.onend = function(event) {
            clear()
        }

        utter.onboundary = function(event) {
            let { charIndex, charLength } = event
            let start = opts.start + charIndex
            clear()
            $(g_content.getRangeDoms(opts.key, start, start + charLength)).addClass('speaking_word')
        }
    },
}
g_speaker.init();