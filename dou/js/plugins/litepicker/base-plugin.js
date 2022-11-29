/**
 * Skipped minification because the original files appears to be already minified.
 * Original file: /npm/@easepick/base-plugin@1.2.0/dist/index.umd.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
/**
* @license
* Package: @easepick/base-plugin
* Version: 1.2.0
* https://easepick.com/
* Copyright 2022 Rinat G.
* 
* Licensed under the terms of GNU General Public License Version 2 or later. (http://www.gnu.org/licenses/gpl.html)
*/
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).easepick=e.easepick||{})}(this,(function(e){"use strict";e.BasePlugin=class{picker;options;priority=0;dependencies=[];attach(e){const t=this.getName(),i={...this.options};this.options={...this.options,...e.options[t]||{}};for(const s of Object.keys(i))if(null!==i[s]&&"object"==typeof i[s]&&Object.keys(i[s]).length&&t in e.options&&s in e.options[t]){const n={...e.options[t][s]};null!==n&&"object"==typeof n&&Object.keys(n).length&&Object.keys(n).every((e=>Object.keys(i[s]).includes(e)))&&(this.options[s]={...i[s],...n})}if(this.picker=e,this.dependenciesNotFound()){const e=this.dependencies.filter((e=>!this.pluginsAsStringArray().includes(e)));return void console.warn(`${this.getName()}: required dependencies (${e.join(", ")}).`)}const s=this.camelCaseToKebab(this.getName());this.picker.ui.container.classList.add(s),this.onAttach()}detach(){const e=this.camelCaseToKebab(this.getName());this.picker.ui.container.classList.remove(e),"function"==typeof this.onDetach&&this.onDetach()}dependenciesNotFound(){return this.dependencies.length&&!this.dependencies.every((e=>this.pluginsAsStringArray().includes(e)))}pluginsAsStringArray(){return this.picker.options.plugins.map((e=>"function"==typeof e?(new e).getName():e))}camelCaseToKebab(e){return e.replace(/([a-zA-Z])(?=[A-Z])/g,"$1-").toLowerCase()}},Object.defineProperty(e,"__esModule",{value:!0})}));
