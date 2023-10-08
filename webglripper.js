// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
function multiplyMatrixAndPoint(matrix, point) {
	let c0r0 = matrix[0], c1r0 = matrix[1], c2r0 = matrix[2], c3r0 = matrix[3];
	let c0r1 = matrix[4], c1r1 = matrix[5], c2r1 = matrix[6], c3r1 = matrix[7];
	let c0r2 = matrix[8], c1r2 = matrix[9], c2r2 = matrix[10], c3r2 = matrix[11];
	let c0r3 = matrix[12], c1r3 = matrix[13], c2r3 = matrix[14], c3r3 = matrix[15];
  
	let x = point[0];
	let y = point[1];
	let z = point[2];
	let w = 1;
  
	let resultX = x * c0r0 + y * c0r1 + z * c0r2 + w * c0r3;
	let resultY = x * c1r0 + y * c1r1 + z * c1r2 + w * c1r3;
	let resultZ = x * c2r0 + y * c2r1 + z * c2r2 + w * c2r3;
	return [resultX, resultY, resultZ];
  }
  

const OBJUtils = {
	DrawModes: {
		"POINTS": 0,
		"LINES": 1,
		"LINE_STRIP": 2,
		"LINE_LOOP": 3,
		"TRIANGLES": 4,
		"TRIANGLE_STRIP": 5,
		"TRIANGE_FAN": 6
	},

	/* Used to store a texture for use in OBJModel */
	OBJTexture: class {
		constructor(filename, url, type = "map_Kd") {
			this._URL = url;
			this._FILENAME = filename;
			this._TYPE = type;
		}

		getTexString() {
			return `${this._TYPE} ${this._FILENAME}.png`;
		}
	},

	OBJColor: class {
		r = 0;
		g = 0;
		b = 0;
		constructor(r, g, b, a) {
			this.r = r;
			this.g = g;
			this.b = b;
		}

		toString() {
			return `${this.r} ${this.g} ${this.b}`;
		}
	},

	/* Used to store color info about the primitive */
	OBJColTexture: class {
		constructor(filename, color) {
			this._COLOR = color;
			this._FILENAME = filename;
		}

		getTexString() {
			return `Kd ${this._COLOR.toString()}`;
		}
	},

	/* Used to store indices and how to draw them */
	OBJPrimitive: class {
		constructor(mode, indices) {
			this._MODE = mode;
			this._INDICES = indices;
		}
	},

	/* OBJ Creation */
	OBJModel: class {
		// Primitives = [] // Array of OBJPrimitive's
		// Vertices = [] // Array of Vertices
		// Normals = [] // Array of Normals
		// UVs = [] // Array of UVs
		// Textures = [] // Array of OBJTexture or OBJColTexture for the obj
		constructor(_Primitives, _Vertices, _Normals, _UVs, _Textures, _Name) {
			this.vertex = _Vertices;
			this.normal = _Normals;
			this.uv = _UVs;
			this.primitives = _Primitives;
			this.textures = _Textures;
			this.name = _Name || `rip${Math.random()}`;
		}

		transform(matrix) {
			LogToParent("Transforming vertices: ", this.vertex.length/3);
			for (let vI = 0; vI < this.vertex.length; vI += 3) {
				let v = [this.vertex[vI + 0], this.vertex[vI + 1], this.vertex[vI + 2]];
				let transformed = multiplyMatrixAndPoint(matrix, v);
				this.vertex[vI + 0] = transformed[0];
				this.vertex[vI + 1] = transformed[1];
				this.vertex[vI + 2] = transformed[2];
			}
		}

		BuildOBJ() {
			let obj = '';
			obj += `mtllib ${this.name}.mtl\n`; // Set model library to use
			obj += `o ${this.name}\n`; 			// Define model name

			for (let vI = 0; vI < this.vertex.length; vI += 3) {
				obj += 'v ';
				for (let vJ = 0; vJ < 3; ++vJ)
					obj += this.vertex[vI + vJ] + ' ';
				obj += '\n';
			} // Write all vertex positions into the obj file

			for (let nI = 0; nI < this.normal.length; nI += 3) {
				obj += 'vn ';
				for (let nJ = 0; nJ < 3; ++nJ)
					obj += this.normal[nI + nJ] + ' ';
				obj += '\n';
			} // Write all normal positions into the obj file

			for (let uI = 0; uI < this.uv.length; uI += 2) {
				obj += 'vt ';
				for (let uJ = 0; uJ < 2; ++uJ)
					obj += this.uv[uI + uJ] + ' ';
				obj += '\n';
			} // Write all Texture Coords into the obj file

			obj += `usemtl ${this.name}\n`; // Specify to start using the mtl lib for the indices below
			obj += 's on \n';                // Enable Smooth Shading

			let hasNormals = this.normal.length != 0;
			let hasUVs = this.uv.length != 0;

			let primitive = this.primitives;
			switch (primitive._MODE) {
				case OBJUtils.DrawModes["TRIANGLES"]:
				case OBJUtils.DrawModes["TRIANGLE_STRIP"]:
					let isStrip = (primitive._MODE == OBJUtils.DrawModes["TRIANGLE_STRIP"]);
					for (let j = 0; j + 2 < primitive._INDICES.length; !isStrip ? j += 3 : j++) {
						obj += 'f ';
						let order = [0, 1, 2];
						if (isStrip && (j % 2 == 1)) {
							order = [0, 2, 1];
						}
						for (let k = 0; k < 3; ++k) {
							let faceNumber = primitive._INDICES[j + order[k]] + 1;
							obj += faceNumber;
							if (hasNormals || hasUVs) {
								obj += '/';
								if (hasUVs)
									obj += faceNumber;
								if (hasNormals)
									obj += `/${faceNumber}`;
							}
							obj += ' ';
						}
						obj += '\n';
					}
					break;
			} // Write indices into obj file
			return obj;
		}

		BuildMTL() {
			let mtl = '';
			mtl += `newmtl ${this.name}\n`;
			this.textures.forEach(function (texture) {
				mtl += `${texture.getTexString()}\n`;
			});
			return mtl;
		}
	}
} // OBJ File Namespace

class Downloader {
	static async DownloadImage(filename, url) {
		const a = document.createElement("a");
		a.href = await this.toDataURL(url);
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	static async DownloadBlob(filename, blob) {
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	static DownloadString(filename, str) {
		var textblob = new Blob([str], { type: 'text/plain' });
		var link = document.createElement('a');
		link.download = filename;
		link.innerHTML = 'Download File';
		link.href = window.URL.createObjectURL(textblob);
		link.onclick = function (e) { document.body.removeChild(e.target); };
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
	}

	static toDataURL(url) {
		return fetch(url).then((response) => {
			return response.blob();
		}).then(blob => {
			return URL.createObjectURL(blob);
		});
	}
} // Downloader Class

let _window = window;

// Create config object
_window.WEBGLRipperSettings = {
	// Globals
	isCapturingScene: false, // Boolean if the scene is to be captured next frame
	// Settings
	CaptureSceneKeyCode: 45, // Insert Key
	CaptureTexturesKeyCode: 45, // Insert Key
	defaultTexWidth: 4096,
	defaultTexHeight: 4096, // As we can't always retrieve the width and height of a texture, we must have a default size in that case.
	shouldUnFlipTex: true, // If we should unflip the textures
	isDebug: true, // Debug Printing
	isDoShaderCalc: false, // Force the shader to do calculations, useful for grabbing specific frames of vertex animations.
	shouldDownloadZip: false // Download all the model assets into a zip file.
};

let LogToParent = function () {
	if (!_window.WEBGLRipperSettings.isDebug)
		return;
	_window.console.log('[WebGLRipper]', ...arguments);
};

document.addEventListener("DOMContentLoaded", function(event) {
	let hiddenSettings = document.getElementById("webgl_ripper_settings");
	let settings = JSON.parse(hiddenSettings.textContent);
	LogToParent("Loaded Settings: ", settings);

	_window.WEBGLRipperSettings.defaultTexWidth = parseInt(settings.default_texture_res.split("x")[0]) || 4096;
	_window.WEBGLRipperSettings.defaultTexHeight = parseInt(settings.default_texture_res.split("x")[1]) || 4096;
	_window.WEBGLRipperSettings.isDoShaderCalc = settings.do_shader_calc;
	_window.WEBGLRipperSettings.isDebug = settings.is_debug_mode;
	_window.WEBGLRipperSettings.shouldUnFlipTex = settings.unflip_textures;
	_window.WEBGLRipperSettings.shouldDownloadZip = settings.should_download_zip;
});

document.addEventListener('keydown', function (event) {
	if (event.keyCode == _window.WEBGLRipperSettings.CaptureSceneKeyCode && !event.shiftKey) {
		_window.WEBGLRipperSettings.isCapturingScene = true;
		LogToParent("Capturing scene!");
	}
});

function resizeArrayBuffer(originalBuffer, newByteSize) {
	if(originalBuffer.byteLength > newByteSize){
		throw new Error("Can't resize to a smaller array");
	}
	const resizedBuffer = new ArrayBuffer(newByteSize);
	const originalView = new Uint8Array(originalBuffer);
	const resizedView = new Uint8Array(resizedBuffer);
	resizedView.set(originalView);
	return resizedBuffer;
  }
  
  

_window.RIPPERS = [];

class WebGLRipperWrapper {
	_IsEnabled = true;
	_IsWebGL2 = false;
	_GLViewport = { x: 0, y: 0, width: 0, height: 0 };
	_GLContext = null;
	_GLState = new Map();
	_GLBuffers = new Map();
	_GLActiveTextureIndex = 0;
	_GLCurrentBoundTexture = null;
	_GLTextures = new Map();
	_GLAllTextures = [];

	_GLCurrentUVS = [];
	_GLCurrentUVIndex = -1;
	_GLCurrentNormals = [];
	_GLCurrentNormalIndex = -1;
	_GLCurrentVertices = [];
	_GLCurrentVertexIndex = -1;

	_GLCurrentAttribIndex = 0;
	_GLCurrentAttrib = [];
	_GLCurrentAttribEnabled = [];
	_CurrentModels = [];
	_TextureCache = new Map();
	_isCapturing = false;
	_needsToReset = false;

	_AttribTypeEnum = {
		VERTEX: 0,
		NORMAL: 1,
		UVS: 2
	};

	constructor(gl) {
		this._GLContext = gl;
	}

	GetDataURIFromWebGLTexture(gl, webglTexture, texWidth, texHeight, flip = true) {
		let fb = gl.createFramebuffer();

		// make this the current frame buffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

		// attach the texture to the framebuffer.
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D, webglTexture, 0);

		// check if you can read from this type of texture.
		let canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);

		if (!canRead) {
			// Unbind the framebuffer
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			return null;
		}

		var pixels = new Uint8Array(texWidth * texHeight * 4);
		// read the pixels
		gl.readPixels(0, 0, texWidth, texHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

		// Unbind the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		if (flip) {
			// Now do pixel manipulation to make it right side up -- https://stackoverflow.com/questions/41969562/how-can-i-flip-the-result-of-webglrenderingcontext-readpixels
			var halfHeight = texHeight / 2 | 0;  // the | 0 keeps the result an int
			var bytesPerRow = texWidth * 4;

			// make a temp buffer to hold one row
			var temp = new Uint8Array(texWidth * 4);
			for (var y = 0; y < halfHeight; ++y) {
				var topOffset = y * bytesPerRow;
				var bottomOffset = (texHeight - y - 1) * bytesPerRow;

				// make copy of a row on the top half
				temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow));

				// copy a row from the bottom half to the top
				pixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

				// copy the copy of the top half row to the bottom half 
				pixels.set(temp, bottomOffset);
			}
		}

		let canvas = document.createElement("canvas");
		canvas.width = texWidth;
		canvas.height = texHeight;

		let ctx = canvas.getContext('2d');

		let arr = new Uint8ClampedArray(pixels);

		let imgData = new ImageData(arr, texWidth, texHeight);
		ctx.putImageData(imgData, 0, 0);
		return canvas.toDataURL("image/png");
	}

	GetAttribValueType(attrib) {
		let vertexNames = [
			'position',
			'vertex',
			'avertexposition',
			's_attribute_0',
			'avertex',
			'vertex_position', // Playcanvas.js
			'aposition', // Playcanvas.js
			'vposition', // imvu.com
			'vertexposition', // Raylib
		];

		let normalNames = [
			'avertexnormal',
			'normal',
			's_attribute_1',
			'vertex_normal',   // Playcanvas.js
			'vnormal', // imvu.com
			'vertexnormal', // Raylib
		];

		let uvNames = [
			'uv',
			'texcoord',
			'texcoords',
			'texcoord0',
			'atexturecoord',
			'vertex_texcoord0', // Playcanvas.js
			'vtexcoord', // imvu.com
			'vertextexcoord', // Raylib
		];

		let attribName = attrib.name.toLowerCase();
		if (vertexNames.includes(attribName))
			return this._AttribTypeEnum.VERTEX;
		if (normalNames.includes(attribName))
			return this._AttribTypeEnum.NORMAL;
		if (uvNames.includes(attribName))
			return this._AttribTypeEnum.UVS;
		return -1;
	}

	IsPossibleTextureUniform(texname) {
		const textureMap = new Map();
	
		// Diffuse / Ambient
		textureMap.set('map',         'map_Kd');
		textureMap.set('usampler',    'map_Kd');
		textureMap.set('texture0',    'map_Kd');
		textureMap.set('texture',     'map_Kd');
		textureMap.set('bonesampler', 'map_Kd');
		textureMap.set('bonetexture', 'map_Kd');
		textureMap.set('source',      'map_Kd');
		for (let t = 1; t < 32; t++) 
			textureMap.set(`texture${t}`, 'map_Kd');
		
		// Normals
		textureMap.set('normalmap',   'norm' /* PBR rendering */);
		
		if(!textureMap.has(texname.toLowerCase())) {
			LogToParent("Not a known texture type: ", texname);
			return null;
		}
	
		return textureMap.get(texname.toLowerCase());
	}

	HelperFunc_GetCurrentProgram(self, gl) {
		return gl.getParameter(gl.CURRENT_PROGRAM);
	}

	/* Used for debugging */
	HelperFunc_DownloadTextureAtLoc(self, gl, loc) {
		/* See if a texture is bound to that slot */
		let tex = self._GLTextures.get(loc);

		if (tex == undefined || !tex) {
			LogToParent("No Texture found in slot: ", loc);
			return;
		}

		let texWidth = tex.width || _window.WEBGLRipperSettings.defaultTexWidth;
		let texHeight = tex.height || _window.WEBGLRipperSettings.defaultTexHeight;
		let uri = self.GetDataURIFromWebGLTexture(gl, tex, texWidth, texHeight, _window.WEBGLRipperSettings.shouldUnFlipTex);

		if (uri == null) {
			LogToParent("Recieved null texture!");
			return;
		}

		let objTexture = new OBJUtils.OBJTexture("tex_" + self._CurrentModels.length, uri);
		Downloader.DownloadImage(objTexture._FILENAME, objTexture._URL);
		LogToParent("Recieved texture, Sampler Location: ", loc, ", WebGL Texture Object: ", tex);
	}

	HelperFunc_GetModelMatrix(self, gl) {
		let uniformData = self.readUniformData(gl);
		LogToParent("Current Uniform Data: ", uniformData);

		let _CurrentProgram = self.HelperFunc_GetCurrentProgram(self, gl);
		let modelMatrix = null;
		uniformData.forEach(uniform => {
			if (["modelMatrix", "world"].includes(uniform.name) ) {
				var loc = gl.getUniformLocation(_CurrentProgram, uniform.name);
				modelMatrix = gl.getUniform(_CurrentProgram, loc);
				LogToParent("Recieved modelMatrix: ", modelMatrix);
			}
		});
		return modelMatrix;
	}

	HelperFunc_GetAllTextures(self, gl) {
		let textures = [];
		let uniformData = self.readUniformData(gl);
		LogToParent("Current Uniform Data: ", uniformData);

		let _CurrentProgram = self.HelperFunc_GetCurrentProgram(self, gl);

		uniformData.forEach(uniform => {
			if (uniform.type != gl.SAMPLER_2D)
				return;

			let texType = self.IsPossibleTextureUniform(uniform.name);
			if (texType === null)
				return;

			/* Get the sampler location of the texture */
			var loc = gl.getUniformLocation(_CurrentProgram, uniform.name);

			/* Read the location of the webgl texture slot from the sampler */
			let samplerLocation = gl.getUniform(_CurrentProgram, loc);

			/* Make sure it's a texture slot */
			if (samplerLocation < 0 || samplerLocation > 31) {
				LogToParent("Sampler location out of bounds: ", samplerLocation);
				return;
			}

			/* See if a texture is bound to that slot */
			let tex = self._GLTextures.get(samplerLocation);

			if (tex == undefined || !tex) {
				LogToParent("No Texture found in slot: ", samplerLocation);
				return;
			}

			if (self._TextureCache.get(tex)) {
				textures.push(self._TextureCache.get(tex));
				LogToParent("Texture already in cache");
				return;
			}

			let texWidth = tex.width || _window.WEBGLRipperSettings.defaultTexWidth;
			let texHeight = tex.height || _window.WEBGLRipperSettings.defaultTexHeight;
			let uri = self.GetDataURIFromWebGLTexture(gl, tex, texWidth, texHeight, _window.WEBGLRipperSettings.shouldUnFlipTex);

			if (uri == null) {
				LogToParent("Recieved null texture!");
				return;
			}
			
			// Will not work on http servers :(
			let texName = crypto.randomUUID();

			let objTexture = new OBJUtils.OBJTexture(texName, uri, texType);
			self._TextureCache.set(tex, objTexture);
			textures.push(objTexture);
			LogToParent("Recieved texture, Sampler Location: ", samplerLocation, ", WebGL Texture Object: ", tex, ", With texture type: ", texType);
		});

		return textures;
	}

	HelperFunc_SizeOfType(self, gl, glType) {

		switch (glType) {
			case gl.BYTE:
			case gl.UNSIGNED_BYTE:
				return 1;
			case gl.SHORT:
			case gl.UNSIGNED_SHORT:
				return 2;
			default:
			case gl.FLOAT:
				return 4;
		}

		return 1;
	}

	HelperFunc_UpdateAllAttributes(self, gl) { // Got help from: https://github.com/benvanik/WebGL-Inspector/blob/c5f961dba261cbd94d9b3ff3ddbaf8b7d3bf5ef9/core/ui/shared/BufferPreview.js#L191
		let attribData = self.readAttribData(gl);
		LogToParent("attribData: ", attribData);
		attribData.forEach(function (attr) {

			if (!self._GLCurrentAttribEnabled[attr.loc])
				return;
			
			let attribType = self.GetAttribValueType(attr);
			LogToParent("attribType: ", attribType);
			if(attribType < 0) {
				LogToParent("Unknown Attrib Type: ", attr);
				return;
			}

			let _bufferData = self.getBufferDataFromBuffer(self, gl.getVertexAttrib(attr.loc, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING));
			if (!_bufferData || _bufferData.byteLength <= 0){
				LogToParent("Empty bufferData! was ", _bufferData);
				return;
			}
			if (!(_bufferData instanceof ArrayBuffer)){
				_bufferData = _bufferData.buffer;
			}
			let bufferData = [];

			let vAttribData = self._GLCurrentAttrib[attr.loc];
			
			if(vAttribData == null) {
				LogToParent("Missing attrib data at location: ", attr.loc);
				return;
			}
			
			LogToParent("Got vAttribData: ", vAttribData, "Along with attr: ", attr);
			
			const SizeArrayMap = {	
				[gl.BYTE]:           1 * vAttribData.size,
				[gl.UNSIGNED_BYTE]:  1 * vAttribData.size,
				[gl.SHORT]:          2 * vAttribData.size,
				[gl.UNSIGNED_SHORT]: 2 * vAttribData.size,
				[gl.FLOAT]:          4 * vAttribData.size			
			};

			let byteAdvance = SizeArrayMap[vAttribData.type];
			let typeSize    = byteAdvance / vAttribData.size;

			let fStride = vAttribData.stride ? vAttribData.stride : byteAdvance;
			
			const TypedArrayMap = {
			  [gl.BYTE]:           Int8Array,
			  [gl.UNSIGNED_BYTE]:  Uint8Array,
			  [gl.SHORT]:          Int16Array,
			  [gl.UNSIGNED_SHORT]: Uint16Array,
			  [gl.FLOAT]:          Float32Array
			};

			const TypedArrayConstructor = TypedArrayMap[vAttribData.type];
			
			let byteOffset = vAttribData.offset;
			while (byteOffset <= _bufferData.byteLength) {
				var readView = new TypedArrayConstructor(_bufferData.slice(byteOffset, byteOffset + fStride));

				for (let i = 0; i < vAttribData.size; i++) {
					bufferData.push(readView[i]);
				}

				byteOffset += fStride;
			}

			if (!bufferData) {
				LogToParent("Couldn't get bufferData: ", attr);
				return;
			}

			bufferData = new TypedArrayConstructor(bufferData);

			LogToParent("Final Stride is: ", fStride, ", Buffer byte length: ", _bufferData.byteLength, "Original Buffer Data: ", _bufferData, "Got New Buffer Data: ", bufferData);

			switch (attribType) {
				case self._AttribTypeEnum.VERTEX:
					self._GLCurrentVertices = bufferData;
					self._GLCurrentVertexIndex = attr.loc;
					break;
				case self._AttribTypeEnum.NORMAL:
					self._GLCurrentNormals = bufferData;
					self._GLCurrentNormalIndex = attr.loc;
					break;
				case self._AttribTypeEnum.UVS:
					self._GLCurrentUVS = bufferData;
					self._GLCurrentUVIndex = attr.loc;
					break;
				default:
					LogToParent("Unknown Attrib Type: ", attr);
					break;
			}
		});
	}

	HelperFunc_PerformRIP(self, gl) {
		LogToParent(`Downloading ${self._CurrentModels.length}`);
		let models = self._CurrentModels.slice(); // Create a copy

		// Download each model
			
		if(_window.WEBGLRipperSettings.shouldDownloadZip && JSZip) {
			const zip = new JSZip();

			models.forEach(async function (obj) {
				zip.file(`${obj.name}.obj`, obj.BuildOBJ());
				if (obj.textures.length <= 0)
					return;
				zip.file(`${obj.name}.mtl`, obj.BuildMTL());
			});

			let textures = [];
			let texcache = [];
			models.forEach(function (obj) {
				obj.textures.forEach(function (texture) {
					if (!texture._URL)
						return;
					if (texcache[texture._URL])
						return;
					textures.push(texture);
					texcache[texture._URL] = true;
				});
			});
	
			textures.forEach(async function (texture) {
				zip.file(`${texture._FILENAME}.png`, texture._URL.replace("data:image/png;base64,", ""), {base64: true});
			});

			zip.generateAsync({type:"blob"}).then(function(content) {
				let dateString = new Date().toISOString();
				Downloader.DownloadBlob(`${dateString}-rip.zip`, content);
			});

		} else {
		    function pause(msec) {
		        return new Promise((resolve) => {
		            setTimeout(resolve, msec || 1000);
		        });
		    }

		    async function downloadModel(obj) {
		        await Downloader.DownloadString(`${obj.name}.obj`, obj.BuildOBJ());
		        if (obj.textures.length > 0) {
		            await Downloader.DownloadString(`${obj.name}.mtl`, obj.BuildMTL());
		        }
		    }

		    async function downloadTexture(texture) {
		        await Downloader.DownloadImage(texture._FILENAME, texture._URL);
		    }

		    async function downloadAll(elements, isModel = true) {
		        var count = 0;
		        for (const e of elements) {
		            if (isModel) {
		                await downloadModel(e);
		            } else {
		                await downloadTexture(e);
		            }

		            await pause(500); // Pause to not overload the browser in case of big scenes
		        }
		    }

		    downloadAll(models).catch((error) => {
		        console.error("An error occurred while downloading models:", error);
		    });

		    // Download each texture

		    let textures = [];
		    let texcache = [];
		    models.forEach(function (obj) {
		        obj.textures.forEach(function (texture) {
		            if (!texture._URL) return;
		            if (texcache[texture._URL]) return;
		            textures.push(texture);
		            texcache[texture._URL] = true;
		        });
		    });

		    downloadAll(textures, false).catch((error) => {
		        console.error("An error occurred while downloading textures:", error);
		    });
    	}

		// Reset vars

		self._isCapturing = false;
		self._needsToReset = true;
		self._CurrentModels = [];
	}
	
	HelperFunc_Flush(self, gl) {
		self._GLCurrentUVS = [];
		self._GLCurrentNormals = [];
		self._GLCurrentVertices = [];
	}	

	HelperFunc_ResetAll(self, gl) {
		self._TextureCache = new Map();
	}

	hooked_viewport(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
		let _x = args[0];
		let _y = args[1];
		let _width = args[2];
		let _height = args[3];
		self._GLViewport = { x: _x, y: _y, width: _width, height: _height };
	}

	hooked_activeTexture(self, gl, args, oFunc) {
		self._GLActiveTextureIndex = args[0] - gl.TEXTURE0;
	}

	hooked_texImage2D(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
		let target = args[0];
		if (target != gl.TEXTURE_2D)
			return;
		self._GLAllTextures.forEach(glTex => {
			if(glTex == self._GLCurrentBoundTexture) 
				glTex.is2DTexture = true;		
		});

		// Attempt to get width and height of texture
		let pixels = null;
		switch (args.length) {
			case 9:
				pixels = args[8];
				break;
			case 6:
				pixels = args[5];
				break;
		}
	
		if (pixels == null)
			return;

		let _ArrayBufferView = (new Uint16Array()).constructor.prototype.__proto__.constructor;
		if ((pixels instanceof _ArrayBufferView))
			return;

		if (pixels instanceof ImageData || 
			pixels instanceof HTMLImageElement || 
			pixels instanceof HTMLCanvasElement || 
			pixels instanceof HTMLVideoElement || 
			pixels instanceof ImageBitmap) {
			self._GLCurrentBoundTexture.width = pixels.width;
			self._GLCurrentBoundTexture.height = pixels.height;
		}
	}

	hooked_shaderSource(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource
		let shader = args[0];
		let source = args[1];
		if (!shader || !source)
			return;
		//LogToParent("Got shader source: ", source);
	}

	hooked_linkProgram(self, gl, args, oFunc) {
		let program = args[0];

		if (!_window.WEBGLRipperSettings.isDoShaderCalc) {
			return;
		}

		gl.transformFeedbackVaryings(program, ["gl_Position"], gl.SEPARATE_ATTRIBS);
		LogToParent("[ShaderCalc] Added Transform Feedback for gl_Position");
	}

	hooked_bindTexture(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
		let target = args[0];
		let texture = args[1];
		if (target != gl.TEXTURE_2D)
			return;
		if (texture == null)
			return;
		self._GLTextures.set(self._GLActiveTextureIndex, texture);
		self._GLCurrentBoundTexture = texture;
	}

	hooked_drawArrays(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
		if (!self._isCapturing)
			return;

		LogToParent("Captured 'drawArrays' call: ", args);

		let drawMode = args[0];
		let indFirst = args[1];
		let indCount = args[2];

		switch (drawMode) {
			case OBJUtils.DrawModes.TRIANGLES:
			case OBJUtils.DrawModes.TRIANGLE_STRIP:
				break;
			default:
				LogToParent("Unsupported draw mode: ", drawMode);
				return;
		}

		self.HelperFunc_UpdateAllAttributes(self, gl);

		if (self._GLCurrentVertices.length <= 0) {
			LogToParent("Got no vertices in drawArrays call");
			return;
		}
		
		if(_window.WEBGLRipperSettings.isDoShaderCalc) {
			/* Setup Area */
			const feedbackBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, feedbackBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, self._GLCurrentVertices.length * 4, gl.STATIC_DRAW);

			const tf = gl.createTransformFeedback();
			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, feedbackBuffer);
			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

			const feedbackVertex = gl.createVertexArray();
			gl.bindVertexArray(feedbackVertex);
			gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 4, 0);
			gl.enableVertexAttribArray(feedbackVertex);

			gl.enable(gl.RASTERIZER_DISCARD);

			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

			gl.beginTransformFeedback(drawMode);
			oFunc.apply(gl, args);
			gl.endTransformFeedback();

			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

			gl.disable(gl.RASTERIZER_DISCARD);

			const verticesRaw = new Float32Array(self._GLCurrentVertices.length * 4);
			gl.bindBuffer(gl.ARRAY_BUFFER, feedbackBuffer);
			gl.getBufferSubData(gl.ARRAY_BUFFER, 0, verticesRaw);

			LogToParent("Got transform feedback verts: ", verticesRaw, feedbackBuffer);

			gl.deleteBuffer(feedbackBuffer);

			self._GLCurrentVertices = new Float32Array(self._GLCurrentVertices.length);
			for (let i = 0; i < indCount; i++) {
				self._GLCurrentVertices[i * 3 + 0] = verticesRaw[i * 4 + 0];
				self._GLCurrentVertices[i * 3 + 1] = verticesRaw[i * 4 + 1];
				self._GLCurrentVertices[i * 3 + 2] = verticesRaw[i * 4 + 2];
			}

		}


		let textures = self.HelperFunc_GetAllTextures(self, gl);
		let modelMatrix = self.HelperFunc_GetModelMatrix(self, gl);

		let indices = [];

		// Go through each position, see if it exists or not and add an indice to it!
		let indice = 0;
		for (let i = 0; i < self._GLCurrentVertices.length; i += 3) {
			indices.push(indice++);
		}

		LogToParent("Using indices, size: ", indices.length, ", to cut out from ", indFirst, " to ", indFirst, " + ", indCount);
		indices = indices.slice(indFirst, indFirst + indCount);
		LogToParent("New indices size: ", indices.length);

		let objPrimitives = new OBJUtils.OBJPrimitive(drawMode, indices);
		let objID = self._CurrentModels.length;
		let builtOBJ = new OBJUtils.OBJModel(objPrimitives, self._GLCurrentVertices, self._GLCurrentNormals, self._GLCurrentUVS, textures, `RIP${objID}`);
		if (modelMatrix){
			builtOBJ.transform(modelMatrix);
		}
		self._CurrentModels.push(builtOBJ);
		LogToParent("Finished Building OBJ: ", builtOBJ);
		
		// Cleanup
		self.HelperFunc_Flush(self, gl);

		if(_window.WEBGLRipperSettings.isDoShaderCalc)
			return true;
	}

	hooked_drawElements(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
		if (!self._isCapturing)
			return;
		
		LogToParent("Captured 'drawElements' call: ", args);

		let drawMode  = args[0];
		let indCount  = args[1];
		let indType   = args[2];
		let indOffset = args[3];

		switch (drawMode) {
			case OBJUtils.DrawModes.TRIANGLES:
			case OBJUtils.DrawModes.TRIANGLE_STRIP:
				break;
			default:
				LogToParent("Unsupported draw mode: ", drawMode);
				return;
		}

		let oIndices = self.getBufferedIndices(self);
		if (!oIndices || oIndices == undefined) {
			LogToParent("No indices found in 'drawElements' call");
			return;
		}

		self.HelperFunc_UpdateAllAttributes(self, gl);
	
		if(self._GLCurrentVertices.length <= 0) {
			LogToParent("Got no vertices in drawElements call");
			return;
		}

		const indTypeMap = {
			[gl.UNSIGNED_BYTE]:  1,
			[gl.UNSIGNED_SHORT]: 2,
			[gl.UNSIGNED_INT]:   4
		};

		let indTypeSize = indTypeMap[indType] || 2; // Usually indices are unsigned shorts so it makes sense to just make it the default

		let _indOffset = indOffset / indTypeSize;
		
		const indTypedArrayMap = {
			[gl.UNSIGNED_BYTE]:  Uint8Array,
			[gl.UNSIGNED_SHORT]: Uint16Array,
			[gl.UNSIGNED_INT]:   Uint32Array
		};

		let IndTypedArray = indTypedArrayMap[indType];

		if (oIndices instanceof ArrayBuffer) {
			oIndices = new IndTypedArray(oIndices);
		}

		LogToParent("Using indices, size: ", oIndices.length, ", to cut out from ", _indOffset, " to ", _indOffset, " + ", indCount);
		let indices = new IndTypedArray(indCount);

		for (let ind = 0; ind < indCount; ind++)
			indices[ind] = oIndices[_indOffset + ind];
	
		LogToParent("New indices size: ", indices.length);

		if (_window.WEBGLRipperSettings.isDoShaderCalc) { 
			/*
				TODO: Fix
				- Convert drawElements call to drawArrays call
					- Must sort vertices inline with indices to pass through
			*/

			let drawArraysVertices = [];

			for(let ind = 0; ind < indCount; ind++) {
				drawArraysVertices[ind] = self._GLCurrentVertices[indices[ind]];		
			}

			const drawArraysBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, drawArraysBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(drawArraysVertices), gl.STATIC_DRAW);

			LogToParent("Converting drawElements to drawArray: ", drawArraysVertices);
			
			const numComponents = 1; // pull out 2 values per iteration
			const type = gl.FLOAT; // the data in the buffer is 32bit floats
			const normalize = false; // don't normalize
			const stride = 0; // how many bytes to get from one set of values to the next
			// 0 = use type and numComponents above
			const offset = 0; // how many bytes inside the buffer to start from			
			gl.vertexAttribPointer(self._GLCurrentVertexIndex, numComponents, type, normalize, stride, offset);
			gl.enableVertexAttribArray(self._GLCurrentVertexIndex);
			
			self.HelperFunc_Flush(self, gl);
			gl.drawArrays(drawMode, 0, indCount);
		
			return true;
		}

		let textures = self.HelperFunc_GetAllTextures(self, gl);
		let modelMatrix = self.HelperFunc_GetModelMatrix(self, gl);

		let objPrimitives = new OBJUtils.OBJPrimitive(drawMode, indices);
		let objID = self._CurrentModels.length;
		let builtOBJ = new OBJUtils.OBJModel(objPrimitives, self._GLCurrentVertices, self._GLCurrentNormals, self._GLCurrentUVS, textures, `RIP${objID}`);
		if (modelMatrix){
			builtOBJ.transform(modelMatrix);
		}
		self._CurrentModels.push(builtOBJ);
		LogToParent("Finished Building OBJ: ", builtOBJ);
		
		// Cleanup
		self.HelperFunc_Flush(self, gl);
	}

	hooked_drawRangeElements(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawRangeElements
		if (!self._isCapturing)
			return;

		let drawMode = args[0];
		let start = args[1];
		let end = args[2];
		let count = args[3];
		let type = args[4];
		let offset = args[5];

		LogToParent("Captured unsupported 'drawRangeElements' call: ", args);
	}

	hooked_drawBuffers(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawBuffers
		if (!self._isCapturing)
			return;

		let buffers = args[0];

		LogToParent("Captured unsupported 'drawBuffers' call: ", args);
	}

	hooked_drawElementsInstanced(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced
		if (!self._isCapturing)
			return;

		let drawMode = args[0];
		let count = args[1];
		let type = args[2];
		let offset = args[3];
		let instanceCount = args[4];

		LogToParent("Captured unsupported 'drawElementsInstanced' call: ", args);
		LogToParent("Forwarding to 'drawElements'...");
		self.hooked_drawElements(self, gl, args, oFunc);
	}

	hooked_createTexture(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createTexture
		let glTexture = oFunc.apply(gl);
		self._GLAllTextures.push(glTexture);
		return glTexture;
	}

	hooked_createBuffer(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createBuffer
		
		let buffer = oFunc.apply(gl, args ? args : []);
		self._GLBuffers.set(buffer, null);
		
		return buffer;
	}

	hooked_bindBuffer(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
		let target = args[0];
		let buffer = args[1];
		self._GLState.set(target, buffer);
	}

	hooked_bufferData(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
		let target = args[0];
		let data = null;
		switch (args.length) {
			case 2:
				data = null;
				break;
			default:
				let maybeData = args[1];
				// https://stackoverflow.com/questions/64650119/react-error-sharedarraybuffer-is-not-defined-in-firefox
				let _ArrayBufferView = (new Uint16Array()).constructor.prototype.__proto__.constructor; 
				if (maybeData instanceof ArrayBuffer || 
				   (crossOriginIsolated && maybeData instanceof SharedArrayBuffer) || 
					maybeData instanceof _ArrayBufferView) {
					data = maybeData;
				} else if (!isNaN(maybeData)) {
					let newBufSize = maybeData;
					data = new ArrayBuffer(newBufSize);
				}
				break;
		}

		let buffer = self._GLState.get(target);
		if (!buffer || !data) {
			LogToParent("Called buffer data without specifying data: ", args);
			return;
		}
		self._GLBuffers.set(buffer, data);
	}

	hooked_bufferSubData(self, gl, args, oFunc) {
		//LogToParent("bufferSubData: ", args);
		let target = args[0];
		let offset = args[1];
		let srcData = args[2];
		if (!srcData) {
			LogToParent("No data specified: ", args);
			return;
		}
		if (!(srcData instanceof ArrayBuffer)){
			srcData = srcData.buffer;
		}
		
		let newLen = offset+srcData.byteLength;

		let buffer = self._GLState.get(target);
		if (!buffer) {
			LogToParent("No such buffer: ", args);
			return;
		}
		let dstData = self._GLBuffers.get(buffer);
		if (dstData == null){
			LogToParent("Creating a new buffer of length ", newLen);
			dstData = new ArrayBuffer(newLen, true);
			self._GLBuffers.set(buffer, dstData);
		}
		if (!(dstData instanceof ArrayBuffer)){
			dstData = dstData.buffer;
		}
		if (dstData.byteLength < newLen){
			LogToParent("Resizing buffer to length ", newLen);
			dstData = resizeArrayBuffer(dstData, newLen);
			self._GLBuffers.set(buffer, dstData);
		}
		let dstView = new Uint8Array(dstData);
		let srcView = new Uint8Array(srcData);
		dstView.set(srcView, offset);
	
	}

	hooked_clear(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
		if (self._CurrentModels.length > 0 && self._isCapturing) {
			self.HelperFunc_PerformRIP(self, gl);
		}

		if (_window.WEBGLRipperSettings.isCapturingScene && self._IsEnabled) { // Fix Race conditions
			self._isCapturing = true;
			_window.WEBGLRipperSettings.isCapturingScene = false;
		}

		if (self._needsToReset) {
			self.HelperFunc_ResetAll(self, gl);
			self._needsToReset = false;
		}

		self.HelperFunc_Flush(self, gl);
	}

	hooked_enableVertexAttribArray(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
		let index = args[0];

		self._GLCurrentAttribEnabled[index] = true;
	}

	hooked_disableVertexAttribArray(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disableVertexAttribArray
		let index = args[0];

		self._GLCurrentAttribEnabled[index] = false;
	}

	hooked_vertexAttribIPointer(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer
		let index = args[0];
		let size = args[1];
		let type = args[2];
		let stride = args[3];
		let offset = args[4];

		self._GLCurrentAttrib[index] = { size: size, type: type, stride: stride, offset: offset, normalized: false };
		self._GLCurrentAttribEnabled[index] = true;
	}

	hooked_vertexAttribPointer(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
		let index = args[0];
		let size = args[1];
		let type = args[2];
		let normalized = args[3];
		let stride = args[4];
		let offset = args[5];

		self._GLCurrentAttrib[index] = { size: size, type: type, stride: stride, offset: offset, normalized: normalized };
		self._GLCurrentAttribEnabled[index] = true;
	}

	hooked_vertexAttribDivisor(self, gl, args, oFunc) { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
		
	}

	hooked_vertexAttribDivisorANGLE(self, gl, args, oFunc) {

	}

	readUniformData(gl, p) {
		let uniformData = [];
		let program = gl.getParameter(gl.CURRENT_PROGRAM);
		if(!program)
			return;
		
		let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for (let j = 0; j < uniformCount; j++) {
			let info = gl.getActiveUniform(program, j);
			if(!info) 
				continue;
			uniformData.push({
				index: j,
				name: info.name,
				size: info.size,
				type: info.type
			});
		}
		return uniformData;
	}

	readAttribData(gl, p) {
		let attribData = [];
		let program = gl.getParameter(gl.CURRENT_PROGRAM);
		if(!program)
			return;
		let attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		for (let j = 0; j < attribCount; j++) {
			let info = gl.getActiveAttrib(program, j);
			if(!info) 
				continue;
			let loc = gl.getAttribLocation(program, info.name);
			attribData.push({
				index: j,
				loc: loc,
				name: info.name,
				size: info.size,
				type: info.type
			});
		}
		return attribData;
	}

	getBufferedIndices(self) {
		let index = self._GLContext.getParameter(self._GLContext.ELEMENT_ARRAY_BUFFER_BINDING);
		return index == null ? null : self.getBufferDataFromBuffer(self, index);
	}

	getBufferDataFromBuffer(self, buffer) {
		return self._GLBuffers.get(buffer);
	}

}

// Just in case the site checks for function modifications through a string check.
let hideHook = function (fn, oFn) { fn.toString = oFn.toString.bind(oFn); } 

function RegisterGLFunction(_GL, _RipperWrapper, _Method) {
	if (_GL[_Method] == undefined) return;
	let hookFunc = _RipperWrapper[`hooked_${_Method}`];
	if (!hookFunc) {
		_RipperWrapper[`hooked_${_Method}`] = function (self, gl, args) {
			// To prevent errors create a 'fake' method
			LogToParent(`${_Method}: `, args);
		};
		hookFunc = _RipperWrapper[`hooked_${_Method}`];
		if (!hookFunc) // If it's still null then idk what to do
			return;
	}
	let originalFunc = _GL[_Method];
	_GL[_Method] = function () {
		let rv = hookFunc(_RipperWrapper, this, arguments, originalFunc);
		if (rv)
			return rv;
		return originalFunc.apply(this, arguments);
	};
	hideHook(_GL[_Method], originalFunc);
}

/* Hook into context getter */
LogToParent("Attempting to hook into canvas");
let oGetContext = window.HTMLCanvasElement.prototype.getContext;
window.HTMLCanvasElement.prototype.getContext = function () {
	let contextNames = ["webgl", "webgl2", "experimental-webgl"];
	let isRequestingWebGL = contextNames.indexOf(arguments[0].toLowerCase()) != -1;

	if (!isRequestingWebGL) {
		LogToParent("Got unsupported context: ", arguments[0]);
		return oGetContext.apply(this, arguments);
	}


	if (_window.WEBGLRipperSettings.isDoShaderCalc) {
		arguments[0] = "webgl2"; // Force it so we can use transform feedback, should be safe to do since you can use all webgl functions with webgl2
	}

	let gl = oGetContext.apply(this, arguments);

	if (!gl)
		return gl;

	if (!gl._hooked) {
		let glRipper = new WebGLRipperWrapper(gl);
		glRipper._IsWebGL2 = (arguments[0] == 'webgl2');
		RegisterGLFunction(gl, glRipper, "clear");
		RegisterGLFunction(gl, glRipper, "bindBuffer");
		RegisterGLFunction(gl, glRipper, "bufferData");
		RegisterGLFunction(gl, glRipper, "bufferSubData"); // omg
		RegisterGLFunction(gl, glRipper, "createBuffer");
		RegisterGLFunction(gl, glRipper, "drawArrays");
		RegisterGLFunction(gl, glRipper, "drawElements");
		RegisterGLFunction(gl, glRipper, "drawElementsInstanced");
		RegisterGLFunction(gl, glRipper, "drawBuffers");
		RegisterGLFunction(gl, glRipper, "linkProgram");
		RegisterGLFunction(gl, glRipper, "vertexAttribPointer");
		RegisterGLFunction(gl, glRipper, "vertexAttribIPointer");
		RegisterGLFunction(gl, glRipper, "enableVertexAttribArray");
		RegisterGLFunction(gl, glRipper, "disableVertexAttribArray");
		RegisterGLFunction(gl, glRipper, "vertexAttribDivisor");
		RegisterGLFunction(gl, glRipper, "vertexAttribDivisorANGLE");
		RegisterGLFunction(gl, glRipper, "shaderSource");
		RegisterGLFunction(gl, glRipper, "activeTexture");
		RegisterGLFunction(gl, glRipper, "bindTexture");
		RegisterGLFunction(gl, glRipper, "texImage2D");
		RegisterGLFunction(gl, glRipper, "createTexture");
		_window.RIPPERS.push(glRipper);
		LogToParent(`Injected into '${arguments[0]}' context!`);
	}

	return gl;
}; /* Got from 'WebGL-Inspector' https://github.com/benvanik/WebGL-Inspector/blob/master/core/extensions/chrome/contentscript.js#L178 */

hideHook(window.HTMLCanvasElement.prototype.getContext, oGetContext);